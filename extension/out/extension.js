"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/extension.ts
var extension_exports = {};
__export(extension_exports, {
  activate: () => activate,
  deactivate: () => deactivate
});
module.exports = __toCommonJS(extension_exports);
var vscode2 = __toESM(require("vscode"));

// src/chatViewProvider.ts
var vscode = __toESM(require("vscode"));
var http = __toESM(require("http"));
var https = __toESM(require("https"));
var import_url = require("url");
var AdaptiveRouteChatViewProvider = class {
  constructor(_extensionUri) {
    this._extensionUri = _extensionUri;
  }
  static viewType = "adaptiveroute.chatView";
  _view;
  resolveWebviewView(webviewView, _context, _token) {
    this._view = webviewView;
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri]
    };
    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
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
    setTimeout(() => this._checkGatewayHealth(), 500);
  }
  sendUserPrompt(prompt) {
    if (this._view) {
      this._view.show?.(true);
      this._view.webview.postMessage({
        type: "setUserPrompt",
        prompt
      });
    }
  }
  async _checkGatewayHealth() {
    const config = vscode.workspace.getConfiguration("adaptiveroute");
    const gatewayUrl = config.get("gatewayUrl") || "http://localhost:8000";
    try {
      const url = new import_url.URL(`${gatewayUrl.replace(/\/+$/, "")}/api/v1/health`);
      const isHttps = url.protocol === "https:";
      const lib = isHttps ? https : http;
      const req = lib.request(
        url,
        { method: "GET", timeout: 2500 },
        (res) => {
          let body = "";
          res.on("data", (chunk) => body += chunk);
          res.on("end", () => {
            const isOk = res.statusCode && res.statusCode < 400;
            let provider = "Online";
            try {
              const data = JSON.parse(body);
              provider = data.active_provider || "Connected";
            } catch {
            }
            this._view?.webview.postMessage({
              type: "healthStatus",
              online: isOk,
              provider,
              url: gatewayUrl
            });
          });
        }
      );
      req.on("error", () => {
        this._view?.webview.postMessage({
          type: "healthStatus",
          online: false,
          url: gatewayUrl
        });
      });
      req.end();
    } catch (e) {
      this._view?.webview.postMessage({
        type: "healthStatus",
        online: false,
        url: gatewayUrl
      });
    }
  }
  async _handleSendMessage(prompt, selectedModel) {
    const config = vscode.workspace.getConfiguration("adaptiveroute");
    const gatewayUrl = config.get("gatewayUrl") || "http://localhost:8000";
    const baseModel = selectedModel || config.get("defaultModel") || "claude-3-5-sonnet";
    const apiUrl = new import_url.URL(`${gatewayUrl.replace(/\/+$/, "")}/v1/messages`);
    const isHttps = apiUrl.protocol === "https:";
    const lib = isHttps ? https : http;
    const payload = JSON.stringify({
      model: baseModel,
      stream: true,
      max_tokens: 1500,
      messages: [
        {
          role: "user",
          content: prompt
        }
      ]
    });
    const options = {
      method: "POST",
      hostname: apiUrl.hostname,
      port: apiUrl.port || (isHttps ? 443 : 80),
      path: apiUrl.pathname,
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(payload),
        "anthropic-version": "2023-06-01"
      },
      timeout: 6e4
    };
    const req = lib.request(options, (res) => {
      const routedModel = res.headers["x-adaptive-model"] || "unknown";
      const routedTier = res.headers["x-adaptive-tier"] || "small";
      const requestedModel = res.headers["x-adaptive-requested-model"] || baseModel;
      const isDownscaled = res.headers["x-adaptive-downscaled"] === "true";
      const reason = res.headers["x-adaptive-reason"] || "";
      const quality = res.headers["x-adaptive-quality"] || "0.90";
      this._view?.webview.postMessage({
        type: "routingDecision",
        requestedModel,
        routedModel,
        routedTier,
        isDownscaled,
        reason,
        quality
      });
      let buffer = "";
      res.on("data", (chunk) => {
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
                text: data.delta.text
              });
            } else if (data.choices?.[0]?.delta?.content) {
              this._view?.webview.postMessage({
                type: "streamChunk",
                text: data.choices[0].delta.content
              });
            }
          } catch {
          }
        }
      });
      res.on("end", () => {
        this._view?.webview.postMessage({
          type: "streamDone"
        });
      });
    });
    req.on("error", (err) => {
      this._view?.webview.postMessage({
        type: "streamError",
        error: `Could not connect to AdaptiveRoute Gateway at ${gatewayUrl} (${err.message}). Is the server running?`
      });
    });
    req.write(payload);
    req.end();
  }
  _insertIntoEditor(code) {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showInformationMessage("Open a file to insert code.");
      return;
    }
    editor.edit((editBuilder) => {
      editBuilder.insert(editor.selection.active, code);
    });
  }
  _getHtmlForWebview(webview) {
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
        <button id="settingsBtn" class="icon-btn" title="Open Settings">\u2699\uFE0F</button>
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
        <span class="downscaled-chip" id="downscaledChip">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="url(#boltGradSmall)" stroke="#4ade80" stroke-width="1.2" style="display:inline-block;vertical-align:middle;margin-right:4px;filter:drop-shadow(0 0 4px rgba(74,222,128,0.6));">
            <defs>
              <linearGradient id="boltGradSmall" x1="4" y1="2" x2="20" y2="22">
                <stop stop-color="#4ade80"/>
                <stop offset="1" stop-color="#10b981"/>
              </linearGradient>
            </defs>
            <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z"/>
          </svg>
          Downscaled (-90% cost)
        </span>
      </div>
      <div class="routing-banner-details">
        <div class="detail-row">
          <span class="detail-label">Client Requested:</span>
          <span class="detail-val" id="requestedModelText">claude-3-5-sonnet</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Routed To:</span>
          <span class="detail-val highlight" id="routedModelText">gpt-oss-20b</span>
        </div>
        <div class="detail-row reason" id="routingReasonText">
          Simple arithmetic / low complexity query operates with high accuracy on Small tier.
        </div>
      </div>
    </div>

    <!-- Chat Messages Scroll Area -->
    <div id="chatMessages" class="chat-messages">
      <div class="welcome-card">
        <div class="welcome-icon">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="url(#boltGradLarge)" stroke="#00F0FF" stroke-width="1.2" style="filter:drop-shadow(0 0 8px rgba(0,240,255,0.7));">
            <defs>
              <linearGradient id="boltGradLarge" x1="4" y1="2" x2="20" y2="22">
                <stop stop-color="#00F0FF"/>
                <stop offset="0.5" stop-color="#818cf8"/>
                <stop offset="1" stop-color="#c084fc"/>
              </linearGradient>
            </defs>
            <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z"/>
          </svg>
        </div>
        <h3>Adaptive LLM Routing</h3>
        <p>Your client requests higher models by default (e.g. <b>Claude 3.5 Sonnet</b>). AdaptiveRoute inspects prompt semantics and automatically downscales low-complexity queries to fast, lightweight models.</p>
        <div class="quick-chips">
          <button class="chip-btn" data-prompt="3*4">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="#4ade80" stroke="#4ade80" stroke-width="1" style="display:inline-block;vertical-align:middle;margin-right:4px;">
              <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z"/>
            </svg>
            Test Downscale: 3*4
          </button>
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
      <div class="input-hint">Enter to send \u2022 Shift+Enter for new line \u2022 Powered by AdaptiveRoute ML</div>
    </footer>
  </div>

  <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
  }
};
function getNonce() {
  let text = "";
  const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

// src/extension.ts
function activate(context) {
  console.log("AdaptiveRoute extension activated.");
  const chatProvider = new AdaptiveRouteChatViewProvider(context.extensionUri);
  context.subscriptions.push(
    vscode2.window.registerWebviewViewProvider(
      AdaptiveRouteChatViewProvider.viewType,
      chatProvider,
      {
        webviewOptions: {
          retainContextWhenHidden: true
        }
      }
    )
  );
  context.subscriptions.push(
    vscode2.commands.registerCommand("adaptiveroute.openChat", () => {
      vscode2.commands.executeCommand("workbench.view.extension.adaptiveroute-sidebar");
    })
  );
  context.subscriptions.push(
    vscode2.commands.registerCommand("adaptiveroute.askSelection", () => {
      const editor = vscode2.window.activeTextEditor;
      if (!editor) {
        vscode2.window.showInformationMessage("Open a file and select some code first.");
        return;
      }
      const selection = editor.document.getText(editor.selection);
      if (!selection.trim()) {
        vscode2.window.showInformationMessage("Select some code in your editor first.");
        return;
      }
      vscode2.commands.executeCommand("workbench.view.extension.adaptiveroute-sidebar");
      chatProvider.sendUserPrompt(`Question about this code:
\`\`\`${editor.document.languageId}
${selection}
\`\`\``);
    })
  );
  context.subscriptions.push(
    vscode2.commands.registerCommand("adaptiveroute.explainCode", () => {
      const editor = vscode2.window.activeTextEditor;
      if (!editor) {
        return;
      }
      const selection = editor.document.getText(editor.selection);
      if (!selection.trim()) {
        vscode2.window.showInformationMessage("Select some code to explain.");
        return;
      }
      vscode2.commands.executeCommand("workbench.view.extension.adaptiveroute-sidebar");
      chatProvider.sendUserPrompt(`Explain what this code does, step by step:
\`\`\`${editor.document.languageId}
${selection}
\`\`\``);
    })
  );
  context.subscriptions.push(
    vscode2.commands.registerCommand("adaptiveroute.fixCode", () => {
      const editor = vscode2.window.activeTextEditor;
      if (!editor) {
        return;
      }
      const selection = editor.document.getText(editor.selection);
      if (!selection.trim()) {
        vscode2.window.showInformationMessage("Select some code to inspect for bugs.");
        return;
      }
      vscode2.commands.executeCommand("workbench.view.extension.adaptiveroute-sidebar");
      chatProvider.sendUserPrompt(`Inspect this code for bugs, logic errors, or performance issues, and provide the fixed version:
\`\`\`${editor.document.languageId}
${selection}
\`\`\``);
    })
  );
  const statusBarItem = vscode2.window.createStatusBarItem(
    vscode2.StatusBarAlignment.Right,
    100
  );
  statusBarItem.command = "adaptiveroute.openChat";
  statusBarItem.text = "$(zap) AdaptiveRoute";
  statusBarItem.tooltip = "AdaptiveRoute Gateway: Dynamic ML Model Router & Auto-Downscaler";
  statusBarItem.show();
  context.subscriptions.push(statusBarItem);
}
function deactivate() {
  console.log("AdaptiveRoute extension deactivated.");
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  activate,
  deactivate
});
//# sourceMappingURL=extension.js.map
