/**
 * Semantic Cost-Aware LLM Router - API Client Service
 * Communicates with FastAPI inference layer & vector cache
 */

const API_BASE = import.meta.env.VITE_API_URL || '';

/**
 * Health check & gateway connectivity status
 */
export async function fetchHealth() {
  try {
    const res = await fetch(`${API_BASE}/health`);
    if (res.ok) return await res.json();
  } catch (e) {
    // fallback to legacy /api/v1/health if needed
    try {
      const resLegacy = await fetch(`${API_BASE}/api/v1/health`);
      if (resLegacy.ok) return await resLegacy.json();
    } catch (_) {}
  }
  throw new Error('Inference Gateway is unreachable');
}

/**
 * Main inference execution:
 * 1. Checks Qdrant vector semantic cache
 * 2. Deterministic small vs large routing
 * 3. Quality evaluation & automatic escalation
 * 4. Persists telemetry in SQLite
 */
export async function sendAnswerQuery({ query, force_route = null }) {
  try {
    const res = await fetch(`${API_BASE}/answer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: query.trim(),
        force_route: force_route || null,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      return {
        response: data.answer,
        query: data.query,
        model: data.model,
        route: data.route,
        cache_hit: data.cache_hit,
        latency_ms: data.latency_ms,
        cost: data.cost,
        quality_score: data.quality_score,
        escalated: data.escalated,
        escalation_reason: data.escalation_reason,
        corpus_version: data.corpus_version,
        input_tokens: data.input_tokens || 0,
        output_tokens: data.output_tokens || 0,
        total_tokens: data.total_tokens || 0,
        raw: data,
      };
    }
  } catch (e) {
    console.warn('/answer endpoint not reachable, attempting legacy fallback:', e);
  }

  // Fallback to legacy chat endpoint if running legacy server
  const fallbackRes = await fetch(`${API_BASE}/api/v1/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: query,
      force_tier: force_route,
    }),
  });
  if (!fallbackRes.ok) {
    throw new Error('Inference request failed');
  }
  const fData = await fallbackRes.json();
  return {
    response: fData.response || fData.choices?.[0]?.message?.content || '',
    query,
    model: fData.selected_model || 'default',
    route: fData.selected_tier || 'standard',
    cache_hit: false,
    latency_ms: fData.latency_ms || 350,
    cost: fData.cost || 0.0001,
    quality_score: fData.quality_score || 0.9,
    escalated: fData.downscaled === false && fData.selected_tier === 'large',
    escalation_reason: fData.explanation || null,
    raw: fData,
  };
}

/**
 * Retrieves aggregate inference metrics, cost savings, and latency percentiles
 */
export async function fetchStats() {
  const res = await fetch(`${API_BASE}/stats`);
  if (!res.ok) throw new Error('Failed to fetch aggregate inference stats');
  return res.json();
}

/**
 * Retrieves Qdrant vector cache statistics, total entries, and hit rates
 */
export async function fetchCacheStats() {
  const res = await fetch(`${API_BASE}/cache/stats`);
  if (!res.ok) throw new Error('Failed to fetch cache stats');
  return res.json();
}

/**
 * Invalidates and flushes the Qdrant semantic vector collection
 */
export async function clearCache() {
  const res = await fetch(`${API_BASE}/cache`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to clear semantic cache');
  return res.json();
}

/**
 * Retrieves audit log of recent user inferences from SQLite
 */
export async function fetchRequests(limit = 50) {
  const res = await fetch(`${API_BASE}/requests?limit=${limit}`);
  if (!res.ok) throw new Error('Failed to fetch inference request logs');
  return res.json();
}

/**
 * Fetches empirical cosine similarity threshold evaluation results (0.85 - 0.97)
 */
export async function fetchEvaluation() {
  const res = await fetch(`${API_BASE}/evaluation`);
  if (!res.ok) throw new Error('Failed to fetch threshold evaluation data');
  return res.json();
}

/**
 * Executes live empirical benchmark comparing Baseline (100% Large Model) vs Optimized
 */
export async function runBenchmark(sampleSize = 25) {
  const res = await fetch(`${API_BASE}/benchmark/run?sample_size=${sampleSize}`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to execute empirical benchmark');
  return res.json();
}

// Aliases for backward compatibility
export const sendOpenAIChat = ({ prompt, forceTier }) => sendAnswerQuery({ query: prompt, force_route: forceTier });
export const fetchMetrics = fetchStats;
export const fetchRecentInferences = fetchRequests;
export const runBenchmarkComparison = () => runBenchmark(25);
export const fetchBaselineComparison = () => runBenchmark(25);
