/**
 * AdaptiveRoute API Service Layer
 * Interfaces exclusively with the FastAPI Gateway
 */

const API_BASE = import.meta.env.VITE_API_URL || '';

export async function fetchHealth() {
  const res = await fetch(`${API_BASE}/api/v1/health`);
  if (!res.ok) throw new Error('Failed to fetch gateway health');
  return res.json();
}

export async function fetchModels(onlyEnabled = false) {
  const url = `${API_BASE}/api/v1/models${onlyEnabled ? '?only_enabled=true' : ''}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch model catalog');
  return res.json();
}

export async function toggleModel(modelName, enabled) {
  const res = await fetch(`${API_BASE}/api/v1/models/${encodeURIComponent(modelName)}/toggle?enabled=${enabled}`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to toggle model state');
  return res.json();
}

export async function sendChatPrompt({ prompt, temperature = 0.7, maxTokens = 1024, forceTier = null, forcePolicy = null }) {
  const res = await fetch(`${API_BASE}/api/v1/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt,
      temperature,
      max_tokens: maxTokens,
      force_tier: forceTier,
      force_policy: forcePolicy,
    }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Server error ${res.status}`);
  }
  return res.json();
}

export async function fetchMetrics() {
  const res = await fetch(`${API_BASE}/api/v1/metrics`);
  if (!res.ok) throw new Error('Failed to fetch system metrics');
  return res.json();
}

export async function fetchRecentInferences(limit = 50) {
  const res = await fetch(`${API_BASE}/api/v1/metrics/inferences?limit=${limit}`);
  if (!res.ok) throw new Error('Failed to fetch recent inferences');
  return res.json();
}

export async function runBenchmarkComparison() {
  const res = await fetch(`${API_BASE}/api/v1/benchmark/run`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to run benchmark experiment');
  return res.json();
}

export async function fetchBaselineComparison() {
  const res = await fetch(`${API_BASE}/api/v1/metrics/baselines`);
  if (!res.ok) throw new Error('Failed to fetch baseline comparisons');
  return res.json();
}

