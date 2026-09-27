import * as vscode from "vscode";
import { AdaptiveRouteChatViewProvider } from "./chatViewProvider";

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
  statusBarItem.text = "$(zap) AdaptiveRoute";
  statusBarItem.tooltip = "AdaptiveRoute Gateway: Dynamic ML Model Router & Auto-Downscaler";
  statusBarItem.show();
  context.subscriptions.push(statusBarItem);
}

export function deactivate() {
  console.log("AdaptiveRoute extension deactivated.");
}
