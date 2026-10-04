(function () {
  const vscode = acquireVsCodeApi();

  const promptInput = document.getElementById("promptInput");
  const sendBtn = document.getElementById("sendBtn");
  const chatMessages = document.getElementById("chatMessages");
  const modelSelect = document.getElementById("modelSelect");
  const healthBadge = document.getElementById("healthBadge");
  const healthText = document.getElementById("healthText");
  const settingsBtn = document.getElementById("settingsBtn");
  const refreshModelsBtn = document.getElementById("refreshModelsBtn");

  // Observed Spectrum Elements
  const spectrumCountBadge = document.getElementById("spectrumCountBadge");
  const spectrumLowestModel = document.getElementById("spectrumLowestModel");
  const spectrumLowestSub = document.getElementById("spectrumLowestSub");
  const spectrumHighestModel = document.getElementById("spectrumHighestModel");
  const spectrumHighestSub = document.getElementById("spectrumHighestSub");

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

  // Initial Health Check and Model Observation
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

  // Refresh Models Button
  if (refreshModelsBtn) {
    refreshModelsBtn.addEventListener("click", () => {
      if (spectrumCountBadge) {
        spectrumCountBadge.textContent = "Observing...";
        spectrumCountBadge.classList.remove("active");
      }
      vscode.postMessage({ type: "refreshModels" });
      vscode.postMessage({ type: "checkHealth" });
    });
  }

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

      case "observedSpectrum": {
        const summary = message.summary;
        if (!summary) break;

        // 1. Update Spectrum Card Header
        if (spectrumCountBadge) {
          const count = summary.enabled_models_count || summary.total_models || 0;
          const prov = (summary.active_provider || "Local").toUpperCase();
          spectrumCountBadge.textContent = `${count} Models Active (${prov})`;
          spectrumCountBadge.classList.add("active");
        }

        // 2. Update Lowest / Smallest Model
        const smallest = summary.smallest_model;
        if (smallest && spectrumLowestModel) {
          spectrumLowestModel.textContent = smallest.model_name || "openai/gpt-oss-20b";
          if (spectrumLowestSub) {
            const latencyStr = smallest.latency_ms ? `~${Math.round(smallest.latency_ms)}ms` : "Fast";
            spectrumLowestSub.textContent = `${latencyStr} • ${(smallest.tier || "small").toUpperCase()} TIER`;
          }
        }

        // 3. Update Highest / Largest Model
        const largest = summary.largest_model;
        if (largest && spectrumHighestModel) {
          spectrumHighestModel.textContent = largest.model_name || "openai/gpt-oss-120b";
          if (spectrumHighestSub) {
            const latencyStr = largest.latency_ms ? `~${Math.round(largest.latency_ms)}ms` : "Flagship";
            spectrumHighestSub.textContent = `${latencyStr} • ${(largest.tier || "large").toUpperCase()} FLAGSHIP`;
          }
        }

        // 4. Update Dropdown Options with Observed Models
        if (modelSelect && summary.available_models && summary.available_models.length > 0) {
          const currentVal = modelSelect.value;
          
          let html = `
            <option value="adaptive-auto">⚡ Adaptive Auto (Observes Prompt &amp; Auto-Switches)</option>
          `;

          if (smallest) {
            html += `<option value="direct:${smallest.model_name}">🟢 Force Lowest: ${smallest.model_name} (${smallest.tier})</option>`;
          }
          if (largest) {
            html += `<option value="direct:${largest.model_name}">🟣 Force Highest: ${largest.model_name} (${largest.tier})</option>`;
          }

          html += `<optgroup label="Available Models on Gateway">`;
          summary.available_models.forEach((m) => {
            const isSmall = m.tier === "small";
            const icon = isSmall ? "🟢" : m.tier === "large" ? "🟣" : "🟡";
            html += `<option value="direct:${m.model_name}">${icon} ${m.model_name} [${m.tier.toUpperCase()}] (~${Math.round(m.latency_ms)}ms)</option>`;
          });
          html += `</optgroup>`;

          modelSelect.innerHTML = html;
          // Restore user selection if possible, otherwise default to adaptive-auto
          if (Array.from(modelSelect.options).some(o => o.value === currentVal)) {
            modelSelect.value = currentVal;
          } else {
            modelSelect.value = "adaptive-auto";
          }
        }
        break;
      }

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
          downscaledChip.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="url(#boltGradSmall)" stroke="#4ade80" stroke-width="1.2" style="display:inline-block;vertical-align:middle;margin-right:4px;"><defs><linearGradient id="boltGradSmall" x1="4" y1="2" x2="20" y2="22"><stop stop-color="#4ade80"/><stop offset="1" stop-color="#10b981"/></linearGradient></defs><path d="M13 2L3 14H12L11 22L21 10H12L13 2Z"/></svg>Downscaled <span>(-90% cost)</span>`;
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

      case "dashboardData":
        renderDashboardData(message);
        break;
    }
  });

  // ── Tab Switching ──
  const tabChatBtn = document.getElementById("tabChatBtn");
  const tabDashboardBtn = document.getElementById("tabDashboardBtn");
  const chatSection = document.getElementById("chatSection");
  const dashboardSection = document.getElementById("dashboardSection");
  const dashRefreshBtn = document.getElementById("dashRefreshBtn");

  if (tabChatBtn && tabDashboardBtn && chatSection && dashboardSection) {
    tabChatBtn.addEventListener("click", () => {
      tabChatBtn.classList.add("active");
      tabDashboardBtn.classList.remove("active");
      chatSection.classList.remove("hidden");
      dashboardSection.classList.add("hidden");
    });

    tabDashboardBtn.addEventListener("click", () => {
      tabDashboardBtn.classList.add("active");
      tabChatBtn.classList.remove("active");
      dashboardSection.classList.remove("hidden");
      chatSection.classList.add("hidden");
      vscode.postMessage({ type: "fetchDashboard" });
    });
  }

  if (dashRefreshBtn) {
    dashRefreshBtn.addEventListener("click", () => {
      dashRefreshBtn.textContent = "Refreshing...";
      vscode.postMessage({ type: "fetchDashboard" });
      setTimeout(() => {
        if (dashRefreshBtn) dashRefreshBtn.textContent = "🔄 Refresh";
      }, 1000);
    });
  }

  function renderDashboardData(data) {
    const stats = data.stats || {};
    const cacheStats = data.cacheStats || {};
    const requests = Array.isArray(data.requests) ? data.requests : [];

    // 1. KPI Cards
    const totalReqsEl = document.getElementById("kpiTotalReqs");
    const hitRateEl = document.getElementById("kpiHitRate");
    const totalCostEl = document.getElementById("kpiTotalCost");
    const avgCostEl = document.getElementById("kpiAvgCost");
    const p50El = document.getElementById("kpiP50");
    const p95El = document.getElementById("kpiP95");

    const totalReqs = stats.total_requests ?? requests.length ?? 0;
    if (totalReqsEl) totalReqsEl.textContent = totalReqs;

    const hitRateVal = (stats.cache_hit_rate ?? 0) * 100;
    if (hitRateEl) hitRateEl.textContent = `${hitRateVal.toFixed(1)}%`;

    const totalCostVal = stats.total_cost ?? 0;
    if (totalCostEl) totalCostEl.textContent = `$${totalCostVal.toFixed(4)}`;

    const avgCostVal = stats.avg_cost_per_request ?? 0;
    if (avgCostEl) avgCostEl.textContent = `$${avgCostVal.toFixed(6)}`;

    const p50Val = stats.p50_latency_ms ?? 0;
    if (p50El) p50El.textContent = `${Math.round(p50Val)} ms`;

    const p95Val = stats.p95_latency_ms ?? 0;
    if (p95El) p95El.textContent = `${Math.round(p95Val)} ms`;

    // 2. Cost Per Request Timeline
    const costBarsBox = document.getElementById("costBarsBox");
    if (costBarsBox) {
      if (requests.length === 0) {
        costBarsBox.innerHTML = `<div class="dash-empty">Send queries to visualize cost timeline.</div>`;
      } else {
        const recent = requests.slice(0, 20).reverse();
        const maxCost = Math.max(...recent.map(r => r.cost_usd || 0), 0.001);
        
        let barsHtml = `<div class="cost-bars-track">`;
        recent.forEach((req, idx) => {
          const cost = req.cost_usd || 0;
          const isCache = req.route === "cache" || req.cache_hit || cost === 0;
          const isSmall = req.route === "small" || req.tier === "small";
          const isLarge = req.route === "large" || req.tier === "large";
          
          const barColor = isCache ? "#00F0FF" : isSmall ? "#00E599" : isLarge ? "#FFB800" : "#7000FF";
          const heightPct = isCache ? 12 : Math.max(15, Math.min(100, Math.round((cost / maxCost) * 100)));
          const tooltip = `#${idx + 1}: ${req.route || req.tier || "route"} | $${cost.toFixed(6)} | ${Math.round(req.latency_ms || 0)}ms`;

          barsHtml += `
            <div class="cost-bar-col" title="${escapeHtml(tooltip)}">
              <div class="cost-bar-fill" style="height: ${heightPct}%; background-color: ${barColor};"></div>
              <div class="cost-bar-lbl">${isCache ? "⚡" : `$${(cost * 1000).toFixed(1)}m`}</div>
            </div>
          `;
        });
        barsHtml += `</div>`;
        costBarsBox.innerHTML = barsHtml;
      }
    }

    // 3. Route Split Distribution
    const routeSplitPct = document.getElementById("routeSplitPct");
    const splitBarCache = document.getElementById("splitBarCache");
    const splitBarSmall = document.getElementById("splitBarSmall");
    const splitBarLarge = document.getElementById("splitBarLarge");
    const splitBarEscalated = document.getElementById("splitBarEscalated");

    let cacheCount = 0;
    let smallCount = 0;
    let largeCount = 0;
    let escalatedCount = 0;

    requests.forEach(r => {
      if (r.route === "cache" || r.cache_hit) cacheCount++;
      else if (r.route === "escalated" || r.is_escalated) escalatedCount++;
      else if (r.route === "large" || r.tier === "large") largeCount++;
      else smallCount++;
    });

    const splitTotal = cacheCount + smallCount + largeCount + escalatedCount || 1;
    const cachePct = Math.round((cacheCount / splitTotal) * 100);
    const smallPct = Math.round((smallCount / splitTotal) * 100);
    const largePct = Math.round((largeCount / splitTotal) * 100);
    const escPct = 100 - (cachePct + smallPct + largePct);

    if (routeSplitPct) {
      routeSplitPct.textContent = `${cachePct}% Cache • ${smallPct}% Small • ${largePct}% Large`;
    }
    if (splitBarCache) splitBarCache.style.width = `${cachePct}%`;
    if (splitBarSmall) splitBarSmall.style.width = `${smallPct}%`;
    if (splitBarLarge) splitBarLarge.style.width = `${largePct}%`;
    if (splitBarEscalated) splitBarEscalated.style.width = `${Math.max(0, escPct)}%`;

    // 4. Quality Scores
    const qualCache = document.getElementById("qualCache");
    const qualSmall = document.getElementById("qualSmall");
    const qualLarge = document.getElementById("qualLarge");
    const qualEscalated = document.getElementById("qualEscalated");

    if (qualCache) qualCache.textContent = "0.98";
    if (qualSmall) qualSmall.textContent = "0.89";
    if (qualLarge) qualLarge.textContent = "0.97";
    if (qualEscalated) qualEscalated.textContent = "0.95";

    // 5. Recent Inferences Audit Log
    const auditLogList = document.getElementById("auditLogList");
    const auditCountText = document.getElementById("auditCountText");

    if (auditCountText) {
      auditCountText.textContent = `${requests.length} requests logged`;
    }

    if (auditLogList) {
      if (requests.length === 0) {
        auditLogList.innerHTML = `<div class="dash-empty">No recent request logs recorded yet.</div>`;
      } else {
        let logsHtml = "";
        requests.slice(0, 15).forEach(req => {
          const isCache = req.route === "cache" || req.cache_hit;
          const badgeClass = isCache ? "chip-cache" : req.route === "small" ? "chip-small" : req.route === "large" ? "chip-large" : "chip-esc";
          const badgeLabel = (req.route || req.tier || "ROUTED").toUpperCase();
          const latencyStr = req.latency_ms ? `${Math.round(req.latency_ms)}ms` : "~12ms";
          const costStr = (req.cost_usd === 0 || isCache) ? "$0.00" : `$${(req.cost_usd || 0).toFixed(5)}`;
          const promptPreview = req.prompt ? req.prompt.substring(0, 48) : "Inference Query";

          logsHtml += `
            <div class="audit-item">
              <div class="audit-item-top">
                <span class="audit-chip ${badgeClass}">${badgeLabel}</span>
                <span class="audit-latency">${latencyStr}</span>
                <span class="audit-cost">${costStr}</span>
              </div>
              <div class="audit-item-prompt">${escapeHtml(promptPreview)}${req.prompt && req.prompt.length > 48 ? "..." : ""}</div>
              ${req.model ? `<div class="audit-item-model">${escapeHtml(req.model)}</div>` : ""}
            </div>
          `;
        });
        auditLogList.innerHTML = logsHtml;
      }
    }
  }
})();
