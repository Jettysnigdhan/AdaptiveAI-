(function () {
  const vscode = acquireVsCodeApi();

  const promptInput = document.getElementById("promptInput");
  const sendBtn = document.getElementById("sendBtn");
  const chatMessages = document.getElementById("chatMessages");
  const modelSelect = document.getElementById("modelSelect");
  const healthBadge = document.getElementById("healthBadge");
  const healthText = document.getElementById("healthText");
  const settingsBtn = document.getElementById("settingsBtn");

  // Routing Telemetry Elements
  const routingBanner = document.getElementById("routingBanner");
  const tierChip = document.getElementById("tierChip");
  const downscaledChip = document.getElementById("downscaledChip");
  const requestedModelText = document.getElementById("requestedModelText");
  const routedModelText = document.getElementById("routedModelText");
  const routingReasonText = document.getElementById("routingReasonText");

  let currentAssistantBubble = null;
  let currentAssistantText = "";
  let isGenerating = false;

  // Initial Health Check
  vscode.postMessage({ type: "checkHealth" });

  // Quick Chips
  document.querySelectorAll(".chip-btn").forEach((chip) => {
    chip.addEventListener("click", () => {
      const prompt = chip.getAttribute("data-prompt");
      if (prompt) {
        promptInput.value = prompt;
        sendMessage();
      }
    });
  });

  // Settings Button
  settingsBtn.addEventListener("click", () => {
    vscode.postMessage({ type: "openSettings" });
  });

  // Health Badge Click (re-check)
  healthBadge.addEventListener("click", () => {
    healthText.textContent = "Checking...";
    vscode.postMessage({ type: "checkHealth" });
  });

  // Auto-resize input
  promptInput.addEventListener("input", () => {
    promptInput.style.height = "auto";
    promptInput.style.height = Math.min(promptInput.scrollHeight, 120) + "px";
  });

  // Enter to send
  promptInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  sendBtn.addEventListener("click", () => {
    sendMessage();
  });

  function sendMessage() {
    const text = promptInput.value.trim();
    if (!text || isGenerating) {
      return;
    }

    isGenerating = true;
    sendBtn.disabled = true;
    promptInput.value = "";
    promptInput.style.height = "auto";

    // Remove welcome card if present
    const welcome = document.querySelector(".welcome-card");
    if (welcome) {
      welcome.remove();
    }

    // Append User Message
    appendMessage("user", text);

    // Prepare Assistant Message Bubble
    currentAssistantText = "";
    currentAssistantBubble = appendMessage("assistant", "Thinking...");

    // Send to Extension Host
    const selectedModel = modelSelect.value;
    vscode.postMessage({
      type: "sendMessage",
      prompt: text,
      model: selectedModel,
    });
  }

  function appendMessage(role, initialText) {
    const msgEl = document.createElement("div");
    msgEl.className = `message ${role}`;

    const bubble = document.createElement("div");
    bubble.className = "msg-bubble";
    bubble.textContent = initialText;

    msgEl.appendChild(bubble);
    chatMessages.appendChild(msgEl);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    return bubble;
  }

  function formatMarkdown(text) {
    // Basic Markdown with Code Block Support
    const codeBlockRegex = /```([a-zA-Z0-9_\-\.]*)\n([\s\S]*?)```/g;
    let html = "";
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(text)) !== null) {
      const preceding = text.substring(lastIndex, match.index);
      html += renderInlineMarkdown(preceding);

      const lang = match[1] || "code";
      const code = escapeHtml(match[2].trim());
      const rawCode = encodeURIComponent(match[2].trim());

      html += `
        <div class="code-block">
          <div class="code-header">
            <span>${lang}</span>
            <div class="code-actions">
              <button class="code-btn copy-btn" data-code="${rawCode}">Copy</button>
              <button class="code-btn insert-btn" data-code="${rawCode}">Insert</button>
            </div>
          </div>
          <pre><code>${code}</code></pre>
        </div>
      `;
      lastIndex = match.index + match[0].length;
    }

    html += renderInlineMarkdown(text.substring(lastIndex));
    return html;
  }

  function renderInlineMarkdown(str) {
    let s = escapeHtml(str);
    // Bold
    s = s.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    // Inline code
    s = s.replace(/`([^`]+)`/g, "<code style='background:rgba(255,255,255,0.08);padding:1px 4px;border-radius:3px;'>$1</code>");
    // Line breaks
    s = s.replace(/\n/g, "<br>");
    return s;
  }

  function escapeHtml(str) {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // Handle Delegated Code Action Buttons
  chatMessages.addEventListener("click", (e) => {
    const target = e.target;
    if (target.classList.contains("copy-btn")) {
      const code = decodeURIComponent(target.getAttribute("data-code") || "");
      vscode.postMessage({ type: "copyCode", code });
      target.textContent = "Copied!";
      setTimeout(() => (target.textContent = "Copy"), 1500);
    } else if (target.classList.contains("insert-btn")) {
      const code = decodeURIComponent(target.getAttribute("data-code") || "");
      vscode.postMessage({ type: "insertCode", code });
      target.textContent = "Inserted!";
      setTimeout(() => (target.textContent = "Insert"), 1500);
    }
  });

  // Window Messages from Extension Host (Backend)
  window.addEventListener("message", (event) => {
    const message = event.data;

    switch (message.type) {
      case "healthStatus":
        if (message.online) {
          healthBadge.className = "health-badge online";
          healthText.textContent = message.provider || "Online";
          healthBadge.title = `Connected to ${message.url}`;
        } else {
          healthBadge.className = "health-badge offline";
          healthText.textContent = "Offline";
          healthBadge.title = `Gateway at ${message.url} unreachable. Click to retry.`;
        }
        break;

      case "routingDecision":
        // Display Live Telemetry Banner
        routingBanner.classList.remove("hidden");
        const tier = (message.routedTier || "small").toLowerCase();

        tierChip.textContent = tier.toUpperCase();
        tierChip.className = `routing-chip tier-${tier}`;

        requestedModelText.textContent = message.requestedModel;
        routedModelText.textContent = message.routedModel;
        routingReasonText.textContent = message.reason || "Auto-routed by prompt complexity.";

        if (message.isDownscaled) {
          downscaledChip.style.display = "inline-flex";
          downscaledChip.innerHTML = "⚡ Downscaled <span>(-90% cost)</span>";
        } else {
          downscaledChip.style.display = "inline-flex";
          downscaledChip.style.color = "#FF007A";
          downscaledChip.innerHTML = "🛡️ Flagship Tier <span>(Preserved)</span>";
        }
        break;

      case "streamChunk":
        if (currentAssistantBubble) {
          currentAssistantText += message.text;
          currentAssistantBubble.innerHTML = formatMarkdown(currentAssistantText);
          chatMessages.scrollTop = chatMessages.scrollHeight;
        }
        break;

      case "streamDone":
        isGenerating = false;
        sendBtn.disabled = false;
        promptInput.focus();
        break;

      case "streamError":
        isGenerating = false;
        sendBtn.disabled = false;
        if (currentAssistantBubble) {
          currentAssistantBubble.innerHTML = `<span style="color:#FF5A5A;">⚠️ ${escapeHtml(message.error)}</span>`;
        }
        break;

      case "setUserPrompt":
        promptInput.value = message.prompt;
        promptInput.style.height = "auto";
        promptInput.style.height = Math.min(promptInput.scrollHeight, 120) + "px";
        sendMessage();
        break;
    }
  });
})();
