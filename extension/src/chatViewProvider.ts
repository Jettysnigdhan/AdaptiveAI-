import * as vscode from "vscode";
import * as http from "http";
import * as https from "https";
import { URL } from "url";

export class AdaptiveRouteChatViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = "adaptiveroute.chatView";
  private _view?: vscode.WebviewView;
  public onDidObserveModels?: (summary: any) => void;

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
        case "fetchDashboard":
          await this._fetchDashboardData();
          break;
        case "checkHealth":
          await this._checkGatewayHealth();
          await this._observeModels();
          break;
        case "refreshModels":
          await this._observeModels();
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

    // Check health and observe models on extension launch
    setTimeout(() => {
      this._checkGatewayHealth();
      this._observeModels();
    }, 500);
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

  private async _observeModels() {
    const config = vscode.workspace.getConfiguration("adaptiveroute");
    const gatewayUrl = config.get<string>("gatewayUrl") || "http://localhost:8000";

    try {
      const url = new URL(`${gatewayUrl.replace(/\/+$/, "")}/api/v1/models/summary`);
      const isHttps = url.protocol === "https:";
      const lib = isHttps ? https : http;

      const req = lib.request(
        url,
        { method: "GET", timeout: 3500 },
        (res) => {
          let body = "";
          res.on("data", (chunk) => (body += chunk));
          res.on("end", () => {
            if (res.statusCode && res.statusCode < 400) {
              try {
                const summary = JSON.parse(body);
                this._view?.webview.postMessage({
                  type: "observedSpectrum",
                  summary: summary,
                });
                if (this.onDidObserveModels) {
                  this.onDidObserveModels(summary);
                }
              } catch (e) {
                console.error("Failed to parse models summary:", e);
              }
            }
          });
        }
      );

      req.on("error", (err) => {
        console.warn("Could not observe models from gateway:", err.message);
      });
      req.end();
    } catch (e) {
      console.warn("Error requesting models summary:", e);
    }
  }

  private async _fetchDashboardData() {
    const config = vscode.workspace.getConfiguration("adaptiveroute");
    const gatewayUrl = config.get<string>("gatewayUrl") || "http://localhost:8000";

    const fetchEndpoint = (endpoint: string): Promise<any> => {
      return new Promise((resolve) => {
        try {
          const url = new URL(`${gatewayUrl.replace(/\/+$/, "")}${endpoint}`);
          const isHttps = url.protocol === "https:";
          const lib = isHttps ? https : http;
          const req = lib.request(url, { method: "GET", timeout: 4000 }, (res) => {
            let body = "";
            res.on("data", (chunk) => (body += chunk));
            res.on("end", () => {
              try {
                resolve(JSON.parse(body));
              } catch {
                resolve(null);
              }
            });
          });
          req.on("error", () => resolve(null));
          req.end();
        } catch {
          resolve(null);
        }
      });
    };

    const [stats, cacheStats, requests] = await Promise.all([
      fetchEndpoint("/stats"),
      fetchEndpoint("/cache/stats"),
      fetchEndpoint("/requests?limit=25"),
    ]);

    this._view?.webview.postMessage({
      type: "dashboardData",
      stats,
      cacheStats,
      requests: requests || [],
    });
  }

  private async _handleSendMessage(prompt: string, selectedModel: string) {
    const config = vscode.workspace.getConfiguration("adaptiveroute");
    const gatewayUrl = config.get<string>("gatewayUrl") || "http://localhost:8000";
    const baseModel = selectedModel || config.get<string>("defaultModel") || "adaptive-auto";

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
        <button id="refreshModelsBtn" class="icon-btn" title="Re-observe Models &amp; Health">🔄</button>
        <button id="settingsBtn" class="icon-btn" title="Open Settings">⚙️</button>
      </div>
    </header>

    <!-- View Switcher Tabs -->
    <div class="view-tabs">
      <button id="tabChatBtn" class="view-tab active">
        <span>💬 Chat Assistant</span>
      </button>
      <button id="tabDashboardBtn" class="view-tab">
        <span>📊 Telemetry Dashboard</span>
      </button>
    </div>

    <!-- ── 1. CHAT VIEW ── -->
    <div id="chatSection" class="view-section">
      <!-- Observed Model Spectrum (Auto-detected on Launch) -->
      <div id="spectrumCard" class="spectrum-card">
        <div class="spectrum-card-header">
          <div class="spectrum-title">
            <span class="radar-dot"></span>
            <span>Observed Model Spectrum</span>
          </div>
          <span id="spectrumCountBadge" class="spectrum-badge">Observing...</span>
        </div>
        <div class="spectrum-grid">
          <div class="spectrum-box lowest-box" title="Auto-selected for simple queries, arithmetic, or quick explanations">
            <div class="spectrum-box-tag">
              <span class="dot-indicator dot-green"></span>
              <span>LOWEST / SMALLEST</span>
            </div>
            <div class="spectrum-box-model" id="spectrumLowestModel">Observing...</div>
            <div class="spectrum-box-sub" id="spectrumLowestSub">Small Tier • Sub-second</div>
          </div>
          <div class="spectrum-arrow" title="Dynamically switches based on prompt complexity">
            <span>⚡</span>
          </div>
          <div class="spectrum-box highest-box" title="Auto-selected for complex code, architecture, or deep reasoning">
            <div class="spectrum-box-tag">
              <span class="dot-indicator dot-pink"></span>
              <span>HIGHEST / LARGEST</span>
            </div>
            <div class="spectrum-box-model" id="spectrumHighestModel">Observing...</div>
            <div class="spectrum-box-sub" id="spectrumHighestSub">Large Tier • Maximum Quality</div>
          </div>
        </div>
      </div>

      <!-- Model Control Bar -->
      <div class="model-control-bar">
        <div class="model-selector-wrapper">
          <div class="selector-header">
            <label for="modelSelect" class="selector-label">Adaptive Mode:</label>
            <span class="auto-agent-tag">⚡ Prompt-Observing Agent</span>
          </div>
          <select id="modelSelect" class="model-select">
            <option value="adaptive-auto" selected>⚡ Adaptive Auto (Auto-Switches Available Models)</option>
            <option value="direct:openai/gpt-oss-20b">🟢 Lowest: openai/gpt-oss-20b (Small Tier • Free Fast)</option>
            <option value="direct:qwen/qwen3.8-27b">🟡 Medium: qwen/qwen3.8-27b (Medium Tier • Free Code)</option>
            <option value="direct:openai/gpt-oss-120b">🟣 Highest: openai/gpt-oss-120b (Large Tier • Free Reasoning)</option>
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
            <span class="detail-label">Client Mode:</span>
            <span class="detail-val" id="requestedModelText">adaptive-auto</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Routed To:</span>
            <span class="detail-val highlight" id="routedModelText">openai/gpt-oss-20b</span>
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
          <p>AdaptiveRoute operates strictly using models available in your codebase and gateway (Lowest: <b>openai/gpt-oss-20b</b> ↔ Highest: <b>openai/gpt-oss-120b</b>). Simple prompts run on ultra-fast zero-cost models, while complex tasks automatically scale up.</p>
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
          <textarea id="promptInput" rows="1" placeholder="Ask AdaptiveRoute (e.g. 3*4 or architecture questions)..."></textarea>
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

    <!-- ── 2. TELEMETRY DASHBOARD VIEW ── -->
    <div id="dashboardSection" class="view-section hidden">
      <div class="dash-top-bar">
        <div>
          <div class="dash-title">Inference Telemetry</div>
          <div class="dash-sub">Live SQLite Metrics &amp; Qdrant Cache</div>
        </div>
        <button id="dashRefreshBtn" class="dash-btn" title="Refresh Live Metrics">🔄 Refresh</button>
      </div>

      <!-- Top 6 KPI Cards Grid -->
      <div class="dash-kpi-grid">
        <div class="dash-kpi">
          <div class="dash-kpi-val" id="kpiTotalReqs">0</div>
          <div class="dash-kpi-lbl">Total Requests</div>
        </div>
        <div class="dash-kpi cyan">
          <div class="dash-kpi-val" id="kpiHitRate">0.0%</div>
          <div class="dash-kpi-lbl">Cache Hit Rate</div>
        </div>
        <div class="dash-kpi green">
          <div class="dash-kpi-val" id="kpiTotalCost">$0.000</div>
          <div class="dash-kpi-lbl">Total API Cost</div>
        </div>
        <div class="dash-kpi purple">
          <div class="dash-kpi-val" id="kpiAvgCost">$0.000000</div>
          <div class="dash-kpi-lbl">Avg Cost / Req</div>
        </div>
        <div class="dash-kpi yellow">
          <div class="dash-kpi-val" id="kpiP50">0 ms</div>
          <div class="dash-kpi-lbl">p50 Latency</div>
        </div>
        <div class="dash-kpi red">
          <div class="dash-kpi-val" id="kpiP95">0 ms</div>
          <div class="dash-kpi-lbl">p95 Latency</div>
        </div>
      </div>

      <!-- Cost Per Request Timeline -->
      <div class="dash-card">
        <div class="dash-card-header">
          <span>Cost Per Request Timeline ($ / Req)</span>
          <span class="legend-text">● Cache $0.00 &bull; ● Small &bull; ● Large</span>
        </div>
        <div class="cost-bars-box" id="costBarsBox">
          <div class="dash-empty">Send queries to visualize cost timeline.</div>
        </div>
      </div>

      <!-- Route Split & Quality Score Over Time -->
      <div class="dash-card">
        <div class="dash-card-header">
          <span>Route Split Distribution</span>
          <span id="routeSplitPct" class="legend-text">0% Cache • 0% Small • 0% Large</span>
        </div>
        <div class="split-bar-track">
          <div id="splitBarCache" class="split-bar-fill fill-cyan" style="width: 25%"></div>
          <div id="splitBarSmall" class="split-bar-fill fill-green" style="width: 50%"></div>
          <div id="splitBarLarge" class="split-bar-fill fill-yellow" style="width: 25%"></div>
          <div id="splitBarEscalated" class="split-bar-fill fill-red" style="width: 0%"></div>
        </div>

        <div class="qual-cards-grid">
          <div class="qual-card">
            <span class="qual-tag cyan">CACHE</span>
            <span class="qual-score" id="qualCache">0.98</span>
            <span class="qual-sub">Verified</span>
          </div>
          <div class="qual-card">
            <span class="qual-tag green">SMALL</span>
            <span class="qual-score" id="qualSmall">0.89</span>
            <span class="qual-sub">Fast</span>
          </div>
          <div class="qual-card">
            <span class="qual-tag yellow">LARGE</span>
            <span class="qual-score" id="qualLarge">0.97</span>
            <span class="qual-sub">Reasoning</span>
          </div>
          <div class="qual-card">
            <span class="qual-tag red">ESCALATED</span>
            <span class="qual-score" id="qualEscalated">0.95</span>
            <span class="qual-sub">Recovery</span>
          </div>
        </div>
      </div>

      <!-- Live Recent Inferences Audit Log -->
      <div class="dash-card">
        <div class="dash-card-header">
          <span>Recent Inferences Audit Log</span>
          <span class="legend-text" id="auditCountText">0 logged</span>
        </div>
        <div class="audit-log-list" id="auditLogList">
          <div class="dash-empty">No recent request logs recorded yet.</div>
        </div>
      </div>
    </div>
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
