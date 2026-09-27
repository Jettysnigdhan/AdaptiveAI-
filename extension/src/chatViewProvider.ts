import * as vscode from "vscode";
import * as http from "http";
import * as https from "https";
import { URL } from "url";

export class AdaptiveRouteChatViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = "adaptiveroute.chatView";
  private _view?: vscode.WebviewView;

  constructor(private readonly _extensionUri: vscode.Uri) {}

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri],
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    // Handle messages sent from the Webview (Frontend)
    webviewView.webview.onDidReceiveMessage(async (message) => {
      switch (message.type) {
        case "sendMessage":
          await this._handleSendMessage(message.prompt, message.model);
          break;
        case "checkHealth":
          await this._checkGatewayHealth();
          break;
        case "insertCode":
          this._insertIntoEditor(message.code);
          break;
        case "copyCode":
          await vscode.env.clipboard.writeText(message.code);
          vscode.window.showInformationMessage("Code copied to clipboard!");
          break;
        case "openSettings":
          vscode.commands.executeCommand(
            "workbench.action.openSettings",
            "adaptiveroute"
          );
          break;
      }
    });

    // Check health once view resolves
    setTimeout(() => this._checkGatewayHealth(), 500);
  }

  public sendUserPrompt(prompt: string) {
    if (this._view) {
      this._view.show?.(true);
      this._view.webview.postMessage({
        type: "setUserPrompt",
        prompt: prompt,
      });
    }
  }

  private async _checkGatewayHealth() {
    const config = vscode.workspace.getConfiguration("adaptiveroute");
    const gatewayUrl = config.get<string>("gatewayUrl") || "http://localhost:8000";

    try {
      const url = new URL(`${gatewayUrl.replace(/\/+$/, "")}/api/v1/health`);
      const isHttps = url.protocol === "https:";
      const lib = isHttps ? https : http;

      const req = lib.request(
        url,
        { method: "GET", timeout: 2500 },
        (res) => {
          let body = "";
          res.on("data", (chunk) => (body += chunk));
          res.on("end", () => {
            const isOk = res.statusCode && res.statusCode < 400;
            let provider = "Online";
            try {
              const data = JSON.parse(body);
              provider = data.active_provider || "Connected";
            } catch {}
            this._view?.webview.postMessage({
              type: "healthStatus",
              online: isOk,
              provider: provider,
              url: gatewayUrl,
            });
          });
        }
      );

      req.on("error", () => {
        this._view?.webview.postMessage({
          type: "healthStatus",
          online: false,
          url: gatewayUrl,
        });
      });
      req.end();
    } catch (e) {
      this._view?.webview.postMessage({
        type: "healthStatus",
        online: false,
        url: gatewayUrl,
      });
    }
  }

  private async _handleSendMessage(prompt: string, selectedModel: string) {
    const config = vscode.workspace.getConfiguration("adaptiveroute");
    const gatewayUrl = config.get<string>("gatewayUrl") || "http://localhost:8000";
    const baseModel = selectedModel || config.get<string>("defaultModel") || "claude-3-5-sonnet";

    const apiUrl = new URL(`${gatewayUrl.replace(/\/+$/, "")}/v1/messages`);
    const isHttps = apiUrl.protocol === "https:";
    const lib = isHttps ? https : http;

    const payload = JSON.stringify({
      model: baseModel,
      stream: true,
      max_tokens: 1500,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const options = {
      method: "POST",
      hostname: apiUrl.hostname,
      port: apiUrl.port || (isHttps ? 443 : 80),
      path: apiUrl.pathname,
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(payload),
        "anthropic-version": "2023-06-01",
      },
      timeout: 60000,
    };

    const req = lib.request(options, (res) => {
      // Capture AdaptiveRoute Telemetry Headers
      const routedModel = (res.headers["x-adaptive-model"] as string) || "unknown";
      const routedTier = (res.headers["x-adaptive-tier"] as string) || "small";
      const requestedModel = (res.headers["x-adaptive-requested-model"] as string) || baseModel;
      const isDownscaled = (res.headers["x-adaptive-downscaled"] as string) === "true";
      const reason = (res.headers["x-adaptive-reason"] as string) || "";
      const quality = (res.headers["x-adaptive-quality"] as string) || "0.90";

      // Inform webview of the routing decision immediately!
      this._view?.webview.postMessage({
        type: "routingDecision",
        requestedModel,
        routedModel,
        routedTier,
        isDownscaled,
        reason,
        quality,
      });

      let buffer = "";

      res.on("data", (chunk: Buffer) => {
        buffer += chunk.toString("utf8");
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data:")) {
            continue;
          }
          const jsonStr = trimmed.slice(5).trim();
          if (!jsonStr) {
            continue;
          }

          try {
            const data = JSON.parse(jsonStr);
            if (data.type === "content_block_delta" && data.delta?.text) {
              this._view?.webview.postMessage({
                type: "streamChunk",
                text: data.delta.text,
              });
            } else if (data.choices?.[0]?.delta?.content) {
              // OpenAI format fallback
              this._view?.webview.postMessage({
                type: "streamChunk",
                text: data.choices[0].delta.content,
              });
            }
          } catch {}
        }
      });

      res.on("end", () => {
        this._view?.webview.postMessage({
          type: "streamDone",
        });
      });
    });

    req.on("error", (err) => {
      this._view?.webview.postMessage({
        type: "streamError",
        error: `Could not connect to AdaptiveRoute Gateway at ${gatewayUrl} (${err.message}). Is the server running?`,
      });
    });

    req.write(payload);
    req.end();
  }

  private _insertIntoEditor(code: string) {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showInformationMessage("Open a file to insert code.");
      return;
    }
    editor.edit((editBuilder) => {
      editBuilder.insert(editor.selection.active, code);
    });
  }

  private _getHtmlForWebview(webview: vscode.Webview): string {
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "src", "media", "main.js")
    );
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "src", "media", "style.css")
    );

    const nonce = getNonce();

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
  <link rel="stylesheet" href="${styleUri}">
  <title>AdaptiveRoute Chat</title>
</head>
<body>
  <div class="chat-container">
    <!-- Header Bar -->
    <header class="chat-header">
      <div class="header-left">
        <div class="brand">
          <span class="brand-dot"></span>
          <span class="brand-title">AdaptiveRoute</span>
        </div>
        <div id="healthBadge" class="health-badge offline" title="Checking gateway...">
          <span class="pulse-dot"></span>
          <span id="healthText">Offline</span>
        </div>
      </div>
      <div class="header-right">
        <button id="settingsBtn" class="icon-btn" title="Open Settings">⚙️</button>
      </div>
    </header>

    <!-- Model Control Bar -->
    <div class="model-control-bar">
      <div class="model-selector-wrapper">
        <label for="modelSelect" class="selector-label">Default Client Model:</label>
        <select id="modelSelect" class="model-select">
          <option value="claude-3-5-sonnet" selected>Claude 3.5 Sonnet (Default High)</option>
          <option value="claude-3-5-haiku">Claude 3.5 Haiku</option>
          <option value="gpt-4o">OpenAI GPT-4o</option>
          <option value="gpt-4o-mini">OpenAI GPT-4o-mini</option>
          <option value="grok-2">xAI Grok-2</option>
          <option value="grok-2-mini">xAI Grok-2-mini</option>
          <option value="deepseek-r1:8b">DeepSeek R1 (8B)</option>
          <option value="adaptive-auto">Adaptive Auto Router</option>
        </select>
      </div>
    </div>

    <!-- Live Telemetry Card (Displays when prompt is routed) -->
    <div id="routingBanner" class="routing-banner hidden">
      <div class="routing-banner-header">
        <span class="routing-chip" id="tierChip">SMALL</span>
        <span class="downscaled-chip" id="downscaledChip">⚡ Downscaled (-90% cost)</span>
      </div>
      <div class="routing-banner-details">
        <div class="detail-row">
          <span class="detail-label">Client Requested:</span>
          <span class="detail-val" id="requestedModelText">claude-3-5-sonnet</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Routed To:</span>
          <span class="detail-val highlight" id="routedModelText">allam-2-7b</span>
        </div>
        <div class="detail-row reason" id="routingReasonText">
          Simple arithmetic / low complexity query operates with high accuracy on Small tier.
        </div>
      </div>
    </div>

    <!-- Chat Messages Scroll Area -->
    <div id="chatMessages" class="chat-messages">
      <div class="welcome-card">
        <div class="welcome-icon">⚡</div>
        <h3>Adaptive LLM Routing</h3>
        <p>Your client requests higher models by default (e.g. <b>Claude 3.5 Sonnet</b>). AdaptiveRoute inspects prompt semantics and automatically downscales low-complexity queries to fast, lightweight models.</p>
        <div class="quick-chips">
          <button class="chip-btn" data-prompt="3*4">⚡ Test Downscale: 3*4</button>
          <button class="chip-btn" data-prompt="Explain quicksort in Python with code">Medium Tier: Quicksort</button>
          <button class="chip-btn" data-prompt="Architect a multi-region Kafka streaming cluster with Raft consensus and failover in Rust">Large Tier: Kafka Raft</button>
        </div>
      </div>
    </div>

    <!-- Input Footer -->
    <footer class="chat-footer">
      <div class="input-wrapper">
        <textarea id="promptInput" rows="1" placeholder="Ask Claude (e.g. 3*4 or architecture questions)..."></textarea>
        <button id="sendBtn" class="send-btn" title="Send message (Enter)">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
        </button>
      </div>
      <div class="input-hint">Enter to send • Shift+Enter for new line • Powered by AdaptiveRoute ML</div>
    </footer>
  </div>

  <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
  }
}

function getNonce(): string {
  let text = "";
  const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
