import * as vscode from "vscode";
import { AdaptiveRouteChatViewProvider } from "./chatViewProvider";
import { AdaptiveLanguageModelProvider } from "./languageModelProvider";

export function activate(context: vscode.ExtensionContext) {
  console.log("AdaptiveRoute extension activated.");

  // 1. Initialize and register the Sidebar Webview View Provider
  const chatProvider = new AdaptiveRouteChatViewProvider(context.extensionUri);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      AdaptiveRouteChatViewProvider.viewType,
      chatProvider,
      {
        webviewOptions: {
          retainContextWhenHidden: true,
        },
      }
    )
  );

  // 2. Register Command: Open Chat
  context.subscriptions.push(
    vscode.commands.registerCommand("adaptiveroute.openChat", () => {
      vscode.commands.executeCommand("workbench.view.extension.adaptiveroute-sidebar");
    })
  );

  // 3. Register Command: Ask Claude about Selection
  context.subscriptions.push(
    vscode.commands.registerCommand("adaptiveroute.askSelection", () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showInformationMessage("Open a file and select some code first.");
        return;
      }
      const selection = editor.document.getText(editor.selection);
      if (!selection.trim()) {
        vscode.window.showInformationMessage("Select some code in your editor first.");
        return;
      }
      vscode.commands.executeCommand("workbench.view.extension.adaptiveroute-sidebar");
      chatProvider.sendUserPrompt(`Question about this code:\n\`\`\`${editor.document.languageId}\n${selection}\n\`\`\``);
    })
  );

  // 4. Register Command: Explain Code (Auto-Tiered)
  context.subscriptions.push(
    vscode.commands.registerCommand("adaptiveroute.explainCode", () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        return;
      }
      const selection = editor.document.getText(editor.selection);
      if (!selection.trim()) {
        vscode.window.showInformationMessage("Select some code to explain.");
        return;
      }
      vscode.commands.executeCommand("workbench.view.extension.adaptiveroute-sidebar");
      chatProvider.sendUserPrompt(`Explain what this code does, step by step:\n\`\`\`${editor.document.languageId}\n${selection}\n\`\`\``);
    })
  );

  // 5. Register Command: Fix Code Bugs
  context.subscriptions.push(
    vscode.commands.registerCommand("adaptiveroute.fixCode", () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        return;
      }
      const selection = editor.document.getText(editor.selection);
      if (!selection.trim()) {
        vscode.window.showInformationMessage("Select some code to inspect for bugs.");
        return;
      }
      vscode.commands.executeCommand("workbench.view.extension.adaptiveroute-sidebar");
      chatProvider.sendUserPrompt(`Inspect this code for bugs, logic errors, or performance issues, and provide the fixed version:\n\`\`\`${editor.document.languageId}\n${selection}\n\`\`\``);
    })
  );

  // 6. Create Status Bar Item
  const statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100
  );
  statusBarItem.command = "adaptiveroute.openChat";
  statusBarItem.text = "$(zap) AdaptiveRoute: Observing...";
  statusBarItem.tooltip = "AdaptiveRoute Gateway: Connecting to observe models spectrum...";
  statusBarItem.show();
  context.subscriptions.push(statusBarItem);

  let hasAnnounced = false;
  chatProvider.onDidObserveModels = (summary: any) => {
    const smallest = summary.smallest_model?.model_name || "small";
    const largest = summary.largest_model?.model_name || "large";
    const smallestShort = smallest.split("/").pop();
    const largestShort = largest.split("/").pop();
    const count = summary.enabled_models_count || summary.total_models || 0;
    const provider = (summary.active_provider || "gateway").toUpperCase();

    statusBarItem.text = `$(zap) Adaptive: ${smallestShort} ↔ ${largestShort}`;
    const md = new vscode.MarkdownString();
    md.isTrusted = true;
    md.appendMarkdown(`**AdaptiveRoute AI Gateway Active [${provider}]**\n\n`);
    md.appendMarkdown(`• **Lowest / Smallest:** \`${smallest}\` (Small Tier • Sub-second)\n\n`);
    md.appendMarkdown(`• **Highest / Largest:** \`${largest}\` (Flagship Tier • Max Reasoning)\n\n`);
    md.appendMarkdown(`• **Observed Models Active:** ${count} registered models\n\n`);
    md.appendMarkdown(`*Click to open AdaptiveRoute Prompt-Observing Chat View.*`);
    statusBarItem.tooltip = md;

    if (!hasAnnounced) {
      hasAnnounced = true;
      vscode.window.showInformationMessage(
        `AdaptiveRoute: Observed ${count} models on ${provider}. Auto-switching between Lowest (${smallestShort}) and Highest (${largestShort}).`
      );
    }
  };

  // 7. Register Native Language Model Chat Provider
  // Surfaces "Adaptive AI (Auto-Routed Free Models)" into the editor's native model selector
  const lm = (vscode as any).lm;
  if (lm && typeof lm.registerLanguageModelChatProvider === "function") {
    try {
      const lmProvider = new AdaptiveLanguageModelProvider(context.extensionUri);
      const disposable = lm.registerLanguageModelChatProvider("adaptiveroute", lmProvider);
      context.subscriptions.push(disposable);
      console.log("AdaptiveRoute registered as native Language Model Chat Provider ('adaptiveroute').");
    } catch (err: any) {
      console.warn("Could not register LanguageModelChatProvider:", err.message);
    }
  }
}

export function deactivate() {
  console.log("AdaptiveRoute extension deactivated.");
}
