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

## 🎯 How to Use the Extension in Chat

1. Click the **AdaptiveRoute** icon in the sidebar.
2. Ensure your backend is running (`http://localhost:8000`). The green status pill will display **`ONLINE`**.
3. In the model dropdown, select your default high model:
   ```text
   Claude 3.5 Sonnet (Default High)
   ```
4. **Test Downscaling**:
   - Type `3*4` and press Enter.
   - **Watch the Live Telemetry Banner**:
     - Client Requested: `claude-3-5-sonnet`
     - Routed To: `[SMALL] allam-2-7b` (or `grok-2-mini` / `claude-3-5-haiku`)
     - Badge: `⚡ Downscaled (-90% cost, 206ms)`
     - Result: `12`
5. **Test Flagship Retention**:
   - Ask a complex architecture or multi-file coding task:
     `"Architect a high-throughput event streaming cluster with Raft consensus and failover in Rust"`
   - **Watch the Live Telemetry Banner**:
     - Client Requested: `claude-3-5-sonnet`
     - Routed To: `[LARGE] Flagship Tier (Preserved)`
     - Quality: `0.98`

---

## ⚡ Right-Click Editor Integration

You can highlight any code in your editor and right-click:
- **AdaptiveRoute: Ask Claude about Selection**
- **AdaptiveRoute: Explain Code (Auto-Tiered)**
- **AdaptiveRoute: Fix Bugs in Selection**

The code will be sent straight to the sidebar chat, automatically classified, and routed to the optimal tier!
