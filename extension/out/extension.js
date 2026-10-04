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
var vscode3 = __toESM(require("vscode"));

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
  onDidObserveModels;
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
    setTimeout(() => {
      this._checkGatewayHealth();
      this._observeModels();
    }, 500);
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
  async _observeModels() {
    const config = vscode.workspace.getConfiguration("adaptiveroute");
    const gatewayUrl = config.get("gatewayUrl") || "http://localhost:8000";
    try {
      const url = new import_url.URL(`${gatewayUrl.replace(/\/+$/, "")}/api/v1/models/summary`);
      const isHttps = url.protocol === "https:";
      const lib = isHttps ? https : http;
      const req = lib.request(
        url,
        { method: "GET", timeout: 3500 },
        (res) => {
          let body = "";
          res.on("data", (chunk) => body += chunk);
          res.on("end", () => {
            if (res.statusCode && res.statusCode < 400) {
              try {
                const summary = JSON.parse(body);
                this._view?.webview.postMessage({
                  type: "observedSpectrum",
                  summary
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
  async _fetchDashboardData() {
    const config = vscode.workspace.getConfiguration("adaptiveroute");
    const gatewayUrl = config.get("gatewayUrl") || "http://localhost:8000";
    const fetchEndpoint = (endpoint) => {
      return new Promise((resolve) => {
        try {
          const url = new import_url.URL(`${gatewayUrl.replace(/\/+$/, "")}${endpoint}`);
          const isHttps = url.protocol === "https:";
          const lib = isHttps ? https : http;
          const req = lib.request(url, { method: "GET", timeout: 4e3 }, (res) => {
            let body = "";
            res.on("data", (chunk) => body += chunk);
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
      fetchEndpoint("/requests?limit=25")
    ]);
    this._view?.webview.postMessage({
      type: "dashboardData",
      stats,
      cacheStats,
      requests: requests || []
    });
  }
  async _handleSendMessage(prompt, selectedModel) {
    const config = vscode.workspace.getConfiguration("adaptiveroute");
    const gatewayUrl = config.get("gatewayUrl") || "http://localhost:8000";
    const baseModel = selectedModel || config.get("defaultModel") || "adaptive-auto";
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
        <button id="refreshModelsBtn" class="icon-btn" title="Re-observe Models &amp; Health">\u{1F504}</button>
        <button id="settingsBtn" class="icon-btn" title="Open Settings">\u2699\uFE0F</button>
      </div>
    </header>

    <!-- View Switcher Tabs -->
    <div class="view-tabs">
      <button id="tabChatBtn" class="view-tab active">
        <span>\u{1F4AC} Chat Assistant</span>
      </button>
      <button id="tabDashboardBtn" class="view-tab">
        <span>\u{1F4CA} Telemetry Dashboard</span>
      </button>
    </div>

    <!-- \u2500\u2500 1. CHAT VIEW \u2500\u2500 -->
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
            <div class="spectrum-box-sub" id="spectrumLowestSub">Small Tier \u2022 Sub-second</div>
          </div>
          <div class="spectrum-arrow" title="Dynamically switches based on prompt complexity">
            <span>\u26A1</span>
          </div>
          <div class="spectrum-box highest-box" title="Auto-selected for complex code, architecture, or deep reasoning">
            <div class="spectrum-box-tag">
              <span class="dot-indicator dot-pink"></span>
              <span>HIGHEST / LARGEST</span>
            </div>
            <div class="spectrum-box-model" id="spectrumHighestModel">Observing...</div>
            <div class="spectrum-box-sub" id="spectrumHighestSub">Large Tier \u2022 Maximum Quality</div>
          </div>
        </div>
      </div>

      <!-- Model Control Bar -->
      <div class="model-control-bar">
        <div class="model-selector-wrapper">
          <div class="selector-header">
            <label for="modelSelect" class="selector-label">Adaptive Mode:</label>
            <span class="auto-agent-tag">\u26A1 Prompt-Observing Agent</span>
          </div>
          <select id="modelSelect" class="model-select">
            <option value="adaptive-auto" selected>\u26A1 Adaptive Auto (Auto-Switches Available Models)</option>
            <option value="direct:openai/gpt-oss-20b">\u{1F7E2} Lowest: openai/gpt-oss-20b (Small Tier \u2022 Free Fast)</option>
            <option value="direct:qwen/qwen3.8-27b">\u{1F7E1} Medium: qwen/qwen3.8-27b (Medium Tier \u2022 Free Code)</option>
            <option value="direct:openai/gpt-oss-120b">\u{1F7E3} Highest: openai/gpt-oss-120b (Large Tier \u2022 Free Reasoning)</option>
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
          <p>AdaptiveRoute operates strictly using models available in your codebase and gateway (Lowest: <b>openai/gpt-oss-20b</b> \u2194 Highest: <b>openai/gpt-oss-120b</b>). Simple prompts run on ultra-fast zero-cost models, while complex tasks automatically scale up.</p>
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
        <div class="input-hint">Enter to send \u2022 Shift+Enter for new line \u2022 Powered by AdaptiveRoute ML</div>
      </footer>
    </div>

    <!-- \u2500\u2500 2. TELEMETRY DASHBOARD VIEW \u2500\u2500 -->
    <div id="dashboardSection" class="view-section hidden">
      <div class="dash-top-bar">
        <div>
          <div class="dash-title">Inference Telemetry</div>
          <div class="dash-sub">Live SQLite Metrics &amp; Qdrant Cache</div>
        </div>
        <button id="dashRefreshBtn" class="dash-btn" title="Refresh Live Metrics">\u{1F504} Refresh</button>
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
          <span class="legend-text">\u25CF Cache $0.00 &bull; \u25CF Small &bull; \u25CF Large</span>
        </div>
        <div class="cost-bars-box" id="costBarsBox">
          <div class="dash-empty">Send queries to visualize cost timeline.</div>
        </div>
      </div>

      <!-- Route Split & Quality Score Over Time -->
      <div class="dash-card">
        <div class="dash-card-header">
          <span>Route Split Distribution</span>
          <span id="routeSplitPct" class="legend-text">0% Cache \u2022 0% Small \u2022 0% Large</span>
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
};
function getNonce() {
  let text = "";
  const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

// src/languageModelProvider.ts
var vscode2 = __toESM(require("vscode"));
var http2 = __toESM(require("http"));
var https2 = __toESM(require("https"));
var import_url2 = require("url");
var AdaptiveLanguageModelProvider = class {
  constructor(extensionUri) {
    this.extensionUri = extensionUri;
  }
  /**
   * Only presents and surfaces models that are strictly available in this codebase or gateway.
   */
  async provideLanguageModelChatInformation() {
    const config = vscode2.workspace.getConfiguration("adaptiveroute");
    const gatewayUrl = (config.get("gatewayUrl") || "http://localhost:8000").replace(/\/+$/, "");
    try {
      const summary = await this._fetchModelsSummary(gatewayUrl);
      const models = [];
      const smallest = summary.smallest_model?.model_name || "openai/gpt-oss-20b";
      const largest = summary.largest_model?.model_name || "openai/gpt-oss-120b";
      const smallestShort = smallest.split("/").pop();
      const largestShort = largest.split("/").pop();
      models.push({
        id: "adaptive-auto",
        name: `Adaptive AI (Auto: ${smallestShort} \u2194 ${largestShort})`,
        vendor: "adaptiveroute",
        family: "adaptive",
        version: "1.0.0",
        maxInputTokens: 32768
      });
      if (summary.available_models && Array.isArray(summary.available_models)) {
        for (const m of summary.available_models) {
          const tierUpper = (m.tier || "small").toUpperCase();
          const latencyStr = m.latency_ms ? `~${Math.round(m.latency_ms)}ms` : "Fast";
          models.push({
            id: `direct:${m.model_name}`,
            name: `${m.model_name} [${tierUpper} \u2022 ${latencyStr}]`,
            vendor: "adaptiveroute",
            family: "adaptive",
            version: "1.0.0",
            maxInputTokens: m.context_length || 32768
          });
        }
      }
      return models;
    } catch {
      return [
        {
          id: "adaptive-auto",
          name: "Adaptive AI (Auto: gpt-oss-20b \u2194 gpt-oss-120b)",
          vendor: "adaptiveroute",
          family: "adaptive",
          version: "1.0.0",
          maxInputTokens: 32768
        },
        {
          id: "direct:openai/gpt-oss-20b",
          name: "openai/gpt-oss-20b [SMALL \u2022 ~270ms]",
          vendor: "adaptiveroute",
          family: "adaptive",
          version: "1.0.0",
          maxInputTokens: 8192
        },
        {
          id: "direct:qwen/qwen3.8-27b",
          name: "qwen/qwen3.8-27b [MEDIUM \u2022 ~170ms]",
          vendor: "adaptiveroute",
          family: "adaptive",
          version: "1.0.0",
          maxInputTokens: 32768
        },
        {
          id: "direct:openai/gpt-oss-120b",
          name: "openai/gpt-oss-120b [LARGE \u2022 ~860ms]",
          vendor: "adaptiveroute",
          family: "adaptive",
          version: "1.0.0",
          maxInputTokens: 32768
        }
      ];
    }
  }
  async provideTokenCount(text, token) {
    const raw = typeof text === "string" ? text : text?.content || "";
    return Math.ceil(raw.length / 4);
  }
  async provideLanguageModelChatResponse(messages, options, progress, token) {
    return new Promise((resolve, reject) => {
      const config = vscode2.workspace.getConfiguration("adaptiveroute");
      const gatewayUrl = (config.get("gatewayUrl") || "http://localhost:8000").replace(/\/+$/, "");
      const formattedMessages = messages.map((m) => {
        let contentStr = "";
        if (typeof m.content === "string") {
          contentStr = m.content;
        } else if (Array.isArray(m.content)) {
          contentStr = m.content.map((c) => typeof c === "string" ? c : c.value || c.text || "").join("\n");
        } else if (m.content && typeof m.content === "object") {
          contentStr = m.content.value || m.content.text || JSON.stringify(m.content);
        }
        let roleStr = "user";
        if (m.role === 1 || m.role === "user")
          roleStr = "user";
        else if (m.role === 2 || m.role === "assistant")
          roleStr = "assistant";
        else if (m.role === 3 || m.role === "system")
          roleStr = "system";
        return {
          role: roleStr,
          content: contentStr
        };
      });
      const modelId = options?.modelId || "adaptive-auto";
      const payload = JSON.stringify({
        model: modelId,
        messages: formattedMessages,
        stream: true,
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? 2048
      });
      const apiUrl = new import_url2.URL(`${gatewayUrl}/v1/chat/completions`);
      const isHttps = apiUrl.protocol === "https:";
      const lib = isHttps ? https2 : http2;
      const req = lib.request(
        {
          method: "POST",
          hostname: apiUrl.hostname,
          port: apiUrl.port || (isHttps ? 443 : 80),
          path: apiUrl.pathname,
          headers: {
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(payload)
          },
          timeout: 6e4
        },
        (res) => {
          if (res.statusCode && res.statusCode >= 400) {
            let errBody = "";
            res.on("data", (chunk) => errBody += chunk);
            res.on("end", () => {
              const msg = `AdaptiveRoute Gateway returned ${res.statusCode}: ${errBody}`;
              reject(new Error(msg));
            });
            return;
          }
          let buffer = "";
          res.on("data", (chunk) => {
            buffer += chunk.toString("utf8");
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";
            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed.startsWith("data:"))
                continue;
              const jsonStr = trimmed.slice(5).trim();
              if (!jsonStr || jsonStr === "[DONE]")
                continue;
              try {
                const data = JSON.parse(jsonStr);
                const delta = data.choices?.[0]?.delta?.content;
                if (delta) {
                  this._emitChunk(delta, progress);
                }
              } catch {
              }
            }
          });
          res.on("end", () => {
            resolve();
          });
        }
      );
      req.on("error", (err) => {
        reject(
          new Error(
            `AdaptiveRoute Gateway connection failed at ${gatewayUrl}: ${err.message}. Is 'python -m uvicorn backend.app.main:app --port 8000' running?`
          )
        );
      });
      token?.onCancellationRequested(() => {
        req.destroy();
        resolve();
      });
      req.write(payload);
      req.end();
    });
  }
  _fetchModelsSummary(gatewayUrl) {
    return new Promise((resolve, reject) => {
      const url = new import_url2.URL(`${gatewayUrl}/api/v1/models/summary`);
      const lib = url.protocol === "https:" ? https2 : http2;
      const req = lib.request(url, { method: "GET", timeout: 2500 }, (res) => {
        let body = "";
        res.on("data", (chunk) => body += chunk);
        res.on("end", () => {
          if (res.statusCode && res.statusCode < 400) {
            try {
              resolve(JSON.parse(body));
            } catch (e) {
              reject(e);
            }
          } else {
            reject(new Error(`Failed with status ${res.statusCode}`));
          }
        });
      });
      req.on("error", reject);
      req.end();
    });
  }
  _emitChunk(text, progress) {
    const part = vscode2.LanguageModelTextPart ? new vscode2.LanguageModelTextPart(text) : { value: text, content: text };
    if (typeof progress === "function") {
      progress(part);
    } else if (progress && typeof progress.report === "function") {
      progress.report(part);
    }
  }
};

// src/extension.ts
function activate(context) {
  console.log("AdaptiveRoute extension activated.");
  const chatProvider = new AdaptiveRouteChatViewProvider(context.extensionUri);
  context.subscriptions.push(
    vscode3.window.registerWebviewViewProvider(
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
    vscode3.commands.registerCommand("adaptiveroute.openChat", () => {
      vscode3.commands.executeCommand("workbench.view.extension.adaptiveroute-sidebar");
    })
  );
  context.subscriptions.push(
    vscode3.commands.registerCommand("adaptiveroute.askSelection", () => {
      const editor = vscode3.window.activeTextEditor;
      if (!editor) {
        vscode3.window.showInformationMessage("Open a file and select some code first.");
        return;
      }
      const selection = editor.document.getText(editor.selection);
      if (!selection.trim()) {
        vscode3.window.showInformationMessage("Select some code in your editor first.");
        return;
      }
      vscode3.commands.executeCommand("workbench.view.extension.adaptiveroute-sidebar");
      chatProvider.sendUserPrompt(`Question about this code:
\`\`\`${editor.document.languageId}
${selection}
\`\`\``);
    })
  );
  context.subscriptions.push(
    vscode3.commands.registerCommand("adaptiveroute.explainCode", () => {
      const editor = vscode3.window.activeTextEditor;
      if (!editor) {
        return;
      }
      const selection = editor.document.getText(editor.selection);
      if (!selection.trim()) {
        vscode3.window.showInformationMessage("Select some code to explain.");
        return;
      }
      vscode3.commands.executeCommand("workbench.view.extension.adaptiveroute-sidebar");
      chatProvider.sendUserPrompt(`Explain what this code does, step by step:
\`\`\`${editor.document.languageId}
${selection}
\`\`\``);
    })
  );
  context.subscriptions.push(
    vscode3.commands.registerCommand("adaptiveroute.fixCode", () => {
      const editor = vscode3.window.activeTextEditor;
      if (!editor) {
        return;
      }
      const selection = editor.document.getText(editor.selection);
      if (!selection.trim()) {
        vscode3.window.showInformationMessage("Select some code to inspect for bugs.");
        return;
      }
      vscode3.commands.executeCommand("workbench.view.extension.adaptiveroute-sidebar");
      chatProvider.sendUserPrompt(`Inspect this code for bugs, logic errors, or performance issues, and provide the fixed version:
\`\`\`${editor.document.languageId}
${selection}
\`\`\``);
    })
  );
  const statusBarItem = vscode3.window.createStatusBarItem(
    vscode3.StatusBarAlignment.Right,
    100
  );
  statusBarItem.command = "adaptiveroute.openChat";
  statusBarItem.text = "$(zap) AdaptiveRoute: Observing...";
  statusBarItem.tooltip = "AdaptiveRoute Gateway: Connecting to observe models spectrum...";
  statusBarItem.show();
  context.subscriptions.push(statusBarItem);
  let hasAnnounced = false;
  chatProvider.onDidObserveModels = (summary) => {
    const smallest = summary.smallest_model?.model_name || "small";
    const largest = summary.largest_model?.model_name || "large";
    const smallestShort = smallest.split("/").pop();
    const largestShort = largest.split("/").pop();
    const count = summary.enabled_models_count || summary.total_models || 0;
    const provider = (summary.active_provider || "gateway").toUpperCase();
    statusBarItem.text = `$(zap) Adaptive: ${smallestShort} \u2194 ${largestShort}`;
    const md = new vscode3.MarkdownString();
    md.isTrusted = true;
    md.appendMarkdown(`**AdaptiveRoute AI Gateway Active [${provider}]**

`);
    md.appendMarkdown(`\u2022 **Lowest / Smallest:** \`${smallest}\` (Small Tier \u2022 Sub-second)

`);
    md.appendMarkdown(`\u2022 **Highest / Largest:** \`${largest}\` (Flagship Tier \u2022 Max Reasoning)

`);
    md.appendMarkdown(`\u2022 **Observed Models Active:** ${count} registered models

`);
    md.appendMarkdown(`*Click to open AdaptiveRoute Prompt-Observing Chat View.*`);
    statusBarItem.tooltip = md;
    if (!hasAnnounced) {
      hasAnnounced = true;
      vscode3.window.showInformationMessage(
        `AdaptiveRoute: Observed ${count} models on ${provider}. Auto-switching between Lowest (${smallestShort}) and Highest (${largestShort}).`
      );
    }
  };
  const lm2 = vscode3.lm;
  if (lm2 && typeof lm2.registerLanguageModelChatProvider === "function") {
    try {
      const lmProvider = new AdaptiveLanguageModelProvider(context.extensionUri);
      const disposable = lm2.registerLanguageModelChatProvider("adaptiveroute", lmProvider);
      context.subscriptions.push(disposable);
      console.log("AdaptiveRoute registered as native Language Model Chat Provider ('adaptiveroute').");
    } catch (err) {
      console.warn("Could not register LanguageModelChatProvider:", err.message);
    }
  }
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
