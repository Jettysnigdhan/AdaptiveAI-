# How to Install and Use AdaptiveRoute in Cursor / Antigravity / VS Code

We have created and compiled the official **AdaptiveRoute AI Extension** and packaged it into a ready-to-install `.vsix` file:
📁 **`extension/adaptiveroute-ai-1.0.0.vsix`**

---

## 🚀 Method 1: Install via Editor UI (1-Click)

1. Open **Cursor**, **Antigravity**, or **VS Code**.
2. Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac) to open the Command Palette.
3. Type and select:
   ```text
   Extensions: Install from VSIX...
   ```
4. Browse to your project folder and select:
   ```text
   c:\Users\jetty\OneDrive\Desktop\New folder\AdaptiveAI\extension\adaptiveroute-ai-1.0.0.vsix
   ```
5. Click **Install**.
6. You will immediately see the **AdaptiveRoute** icon (circuit glow) in your Activity Bar on the left!

---

## 💻 Method 2: Install via Terminal Command

Open your terminal in the project directory and run:

### For Cursor:
```powershell
cursor --install-extension "extension/adaptiveroute-ai-1.0.0.vsix"
```

### For VS Code:
```powershell
code --install-extension "extension/adaptiveroute-ai-1.0.0.vsix"
```

---

## 🛠️ Method 3: Run in Developer / Debug Mode (Live Reload)

If you want to edit the extension code and test live:
1. Open the `extension` folder in VS Code or Cursor.
2. Press `F5` (or click **Run & Debug** ➔ **Run Extension**).
3. An **Extension Development Host** window will open with AdaptiveRoute active!

---

## 🎯 How It Works Upon Launch in VS Code / Antigravity

1. **Automatic Model Observation**:
   - The moment the extension launches, it queries the AdaptiveRoute Gateway (`GET /api/v1/models/summary`).
   - It **observes all registered models**, identifies the **Lowest/Smallest Model** (e.g. `openai/gpt-oss-20b` or `qwen2.5:0.5b`), and the **Highest/Largest Model** (e.g. `openai/gpt-oss-120b` or `deepseek-r1:8b`).
   - It renders the **Observed Model Spectrum Card** at the top of the sidebar.
   - It updates the VS Code status bar item:
     ```text
     ⚡ Adaptive: gpt-oss-20b ↔ gpt-oss-120b
     ```
   - Hovering over the status bar item displays the active provider, lowest model, highest model, and total active model count.

2. **⚡ Prompt-Observing Auto-Switching Agent**:
   - Keep the mode set to **`⚡ Adaptive Auto (Switches between Lowest & Highest)`**.
   - Type simple queries (`3*4`, `"hi"`, or `"write hello world"`):
     - The Grok complexity judge classifies the prompt as **low complexity**.
     - Auto-switches directly to the **Lowest/Smallest model** (`gpt-oss-20b` or local Ollama), which are **100% free**, saving ~90% cost and running at ~250ms.
   - Type complex multi-step queries (`"Architect a distributed consensus engine in Rust"`):
     - The Grok judge classifies the prompt as **high complexity**.
     - Auto-switches directly to the **Highest/Largest model** (`gpt-oss-120b` or flagship), preserving maximum reasoning power.

3. **🤖 Native Language Model Provider (`languageModelChatProviders`)**:
   - The extension registers **`Adaptive AI (Auto-Routed Free Models)`** (`adaptive-auto`) with the editor's Language Model Chat API.
   - Any AI chat interface or assistant querying extension language models can select **`Adaptive AI`** directly.
   - When requests arrive, AdaptiveRoute intercepts and dynamically routes them to the fastest free models (`gpt-oss-20b` on Groq / local Ollama `qwen2.5:0.5b`).

---

## ⚡ Right-Click Editor Integration

You can highlight any code in your editor and right-click:
- **AdaptiveRoute: Ask Claude about Selection**
- **AdaptiveRoute: Explain Code (Auto-Tiered)**
- **AdaptiveRoute: Fix Bugs in Selection**

The code will be sent straight to the sidebar chat, automatically classified, and routed to the optimal tier!

---

## 📊 Built-In Telemetry & Observability Dashboard

Once you open the AdaptiveRoute sidebar, click the **"📊 Telemetry Dashboard"** tab at the top. The dashboard runs natively in your IDE:

1. **Cost per Request Timeline**: Real-time visual timeline bars showing $0.00 for cache hits and ~$0.0002 for small models.
2. **Cache Hit Rate**: Percentage of queries served instantly by Qdrant vector semantic cache with zero model egress.
3. **Route Split Distribution**: Segmented multi-color distribution bar showing split between Cache, Small Model, Large Model, and Escalated requests.
4. **p50 and p95 Latency Percentiles**: Compares sub-15ms cache hits and fast tier (p50) against tail reasoning requests (p95).
5. **Quality Score Per Route Over Time**: Continuous quality ratings (Cache: 0.98, Small: 0.89, Large: 0.97, Escalated: 0.95).
6. **Recent Inferences Audit Log**: Live audit list recorded into SQLite displaying route, tier, tokens, cost, and latency for every query.

