export interface ModelInfo {
  id: string;
  tier: "fast" | "balanced" | "powerful";
  displayName: string;
  provider: string;
  modelIdentifier: string;
  latencyAvgMs: number;
  costPer1MTokens: number;
  reasoningLevel: "Basic" | "Strong" | "Advanced";
  contextWindow: string;
  qualityScore: number; // percentage
  efficiencyScore: number; // percentage
  bestFor: string[];
  status: "healthy" | "degraded" | "standby";
  uptime: string;
  p95LatencyMs: number;
  requestsShare: number; // percentage
}

export interface RouteLogEntry {
  id: string;
  timestamp: string;
  timeFormatted: string;
  promptPreview: string;
  complexity: "Low" | "Medium" | "High";
  complexityScore: number; // 0-100
  reasoningScore: number;
  contextScore: number;
  costSensitivity: number;
  selectedModel: string;
  modelTier: "fast" | "balanced" | "powerful";
  latencyMs: number;
  costUsd: number;
  cacheStatus: "HIT" | "MISS";
  reason: string;
  confidence: number;
  tokens: {
    prompt: number;
    completion: number;
    total: number;
  };
}

export interface CacheEntry {
  id: string;
  query: string;
  matchedQuery: string;
  similarity: number;
  action: "CACHE HIT" | "CACHE MISS";
  latencySavedMs: number;
  actualLatencyMs: number;
  costSavedUsd: number;
  timestamp: string;
}

export interface TimeSeriesPoint {
  time: string;
  requests: number;
  costWithRoute: number;
  costWithoutRoute: number;
  avgLatency: number;
  cacheHitRate: number;
}

// System-wide KPI summary
export const SYSTEM_METRICS = {
  totalRequests: 24892,
  costSavedUsd: 18.42,
  costSavingsPercent: 42.8,
  avgLatencyMs: 284,
  latencyReductionPercent: 31.4,
  cacheHitRatePercent: 68.2,
  modelsActive: 7,
  systemStatus: "Healthy",
  uptimePercent: 99.98,
  tokensProcessed: "48.2M",
  cacheTokensSaved: "14.6M",
};

// Available Model Tiers
export const MODEL_TIERS: ModelInfo[] = [
  {
    id: "model-fast",
    tier: "fast",
    displayName: "Fast Model",
    provider: "Groq / Meta",
    modelIdentifier: "llama-3.1-8b-instant",
    latencyAvgMs: 120,
    costPer1MTokens: 0.08,
    reasoningLevel: "Basic",
    contextWindow: "8K Tokens",
    qualityScore: 92,
    efficiencyScore: 98,
    bestFor: ["Simple questions", "Summarization", "Classification", "Text formatting"],
    status: "healthy",
    uptime: "99.99%",
    p95LatencyMs: 145,
    requestsShare: 52,
  },
  {
    id: "model-balanced",
    tier: "balanced",
    displayName: "Balanced Model",
    provider: "Anthropic / OpenAI",
    modelIdentifier: "claude-3-5-haiku / gpt-4o-mini",
    latencyAvgMs: 340,
    costPer1MTokens: 0.42,
    reasoningLevel: "Strong",
    contextWindow: "128K Tokens",
    qualityScore: 96,
    efficiencyScore: 91,
    bestFor: ["Coding", "Moderate reasoning", "General tasks", "API generation"],
    status: "healthy",
    uptime: "99.98%",
    p95LatencyMs: 410,
    requestsShare: 31,
  },
  {
    id: "model-powerful",
    tier: "powerful",
    displayName: "Powerful Model",
    provider: "Anthropic / OpenAI",
    modelIdentifier: "claude-3-7-sonnet / gpt-4o",
    latencyAvgMs: 820,
    costPer1MTokens: 2.10,
    reasoningLevel: "Advanced",
    contextWindow: "200K Tokens",
    qualityScore: 99,
    efficiencyScore: 78,
    bestFor: ["Complex reasoning", "Advanced system architecture", "Multi-file refactoring", "Math & logic proofs"],
    status: "healthy",
    uptime: "99.95%",
    p95LatencyMs: 1150,
    requestsShare: 17,
  },
];

// Historical Time-Series Analytics (7 Days, 24 Hours, 30 Days)
export const TIME_SERIES_24H: TimeSeriesPoint[] = [
  { time: "00:00", requests: 420, costWithRoute: 0.38, costWithoutRoute: 0.72, avgLatency: 260, cacheHitRate: 64 },
  { time: "02:00", requests: 280, costWithRoute: 0.24, costWithoutRoute: 0.49, avgLatency: 245, cacheHitRate: 70 },
  { time: "04:00", requests: 190, costWithRoute: 0.16, costWithoutRoute: 0.32, avgLatency: 230, cacheHitRate: 72 },
  { time: "06:00", requests: 310, costWithRoute: 0.28, costWithoutRoute: 0.55, avgLatency: 250, cacheHitRate: 67 },
  { time: "08:00", requests: 840, costWithRoute: 0.78, costWithoutRoute: 1.48, avgLatency: 285, cacheHitRate: 65 },
  { time: "10:00", requests: 1420, costWithRoute: 1.34, costWithoutRoute: 2.52, avgLatency: 310, cacheHitRate: 69 },
  { time: "12:00", requests: 1890, costWithRoute: 1.72, costWithoutRoute: 3.32, avgLatency: 320, cacheHitRate: 71 },
  { time: "14:00", requests: 2100, costWithRoute: 1.94, costWithoutRoute: 3.75, avgLatency: 305, cacheHitRate: 68 },
  { time: "16:00", requests: 1980, costWithRoute: 1.82, costWithoutRoute: 3.51, avgLatency: 295, cacheHitRate: 66 },
  { time: "18:00", requests: 1650, costWithRoute: 1.48, costWithoutRoute: 2.89, avgLatency: 280, cacheHitRate: 68 },
  { time: "20:00", requests: 1120, costWithRoute: 1.02, costWithoutRoute: 1.95, avgLatency: 270, cacheHitRate: 70 },
  { time: "22:00", requests: 740, costWithRoute: 0.65, costWithoutRoute: 1.28, avgLatency: 260, cacheHitRate: 69 },
];

export const TIME_SERIES_7D: TimeSeriesPoint[] = [
  { time: "Mon", requests: 3240, costWithRoute: 2.85, costWithoutRoute: 5.24, avgLatency: 275, cacheHitRate: 67.4 },
  { time: "Tue", requests: 3890, costWithRoute: 3.35, costWithoutRoute: 6.18, avgLatency: 282, cacheHitRate: 69.1 },
  { time: "Wed", requests: 4120, costWithRoute: 3.62, costWithoutRoute: 6.74, avgLatency: 290, cacheHitRate: 70.3 },
  { time: "Thu", requests: 3980, costWithRoute: 3.48, costWithoutRoute: 6.32, avgLatency: 284, cacheHitRate: 68.8 },
  { time: "Fri", requests: 4450, costWithRoute: 3.91, costWithoutRoute: 7.21, avgLatency: 296, cacheHitRate: 66.5 },
  { time: "Sat", requests: 2650, costWithRoute: 2.24, costWithoutRoute: 4.12, avgLatency: 254, cacheHitRate: 71.2 },
  { time: "Sun", requests: 2562, costWithRoute: 2.11, costWithoutRoute: 3.95, avgLatency: 248, cacheHitRate: 72.0 },
];

export const TIME_SERIES_30D: TimeSeriesPoint[] = [
  { time: "Week 1", requests: 21400, costWithRoute: 18.2, costWithoutRoute: 33.6, avgLatency: 292, cacheHitRate: 66.2 },
  { time: "Week 2", requests: 24800, costWithRoute: 20.8, costWithoutRoute: 38.9, avgLatency: 286, cacheHitRate: 67.5 },
  { time: "Week 3", requests: 28100, costWithRoute: 23.4, costWithoutRoute: 44.1, avgLatency: 281, cacheHitRate: 68.9 },
  { time: "Week 4", requests: 29500, costWithRoute: 24.1, costWithoutRoute: 46.2, avgLatency: 279, cacheHitRate: 70.1 },
];

// Initial Routing Activity Table Rows
export const INITIAL_ROUTE_LOGS: RouteLogEntry[] = [
  {
    id: "req-9841",
    timestamp: "2026-10-04T12:04:21Z",
    timeFormatted: "12:04:21",
    promptPreview: "Explain distributed systems consensus algorithms and Paxos",
    complexity: "Medium",
    complexityScore: 68,
    reasoningScore: 74,
    contextScore: 52,
    costSensitivity: 45,
    selectedModel: "Balanced Model (Claude 3.5 Haiku)",
    modelTier: "balanced",
    latencyMs: 342,
    costUsd: 0.004,
    cacheStatus: "MISS",
    reason: "Good reasoning requirement with moderate complexity.",
    confidence: 91,
    tokens: { prompt: 142, completion: 480, total: 622 },
  },
  {
    id: "req-9842",
    timestamp: "2026-10-04T12:04:25Z",
    timeFormatted: "12:04:25",
    promptPreview: "Summarize article on microfrontends architecture",
    complexity: "Low",
    complexityScore: 24,
    reasoningScore: 28,
    contextScore: 41,
    costSensitivity: 80,
    selectedModel: "Fast Model (Llama 3.1 8B)",
    modelTier: "fast",
    latencyMs: 121,
    costUsd: 0.001,
    cacheStatus: "HIT",
    reason: "Semantic match found in cache with 95.8% similarity.",
    confidence: 96,
    tokens: { prompt: 520, completion: 180, total: 700 },
  },
  {
    id: "req-9843",
    timestamp: "2026-10-04T12:04:32Z",
    timeFormatted: "12:04:32",
    promptPreview: "Prove convergence of stochastic gradient descent with momentum under non-convex Lipschitz conditions",
    complexity: "High",
    complexityScore: 94,
    reasoningScore: 98,
    contextScore: 65,
    costSensitivity: 20,
    selectedModel: "Powerful Model (Claude 3.7 Sonnet)",
    modelTier: "powerful",
    latencyMs: 840,
    costUsd: 0.021,
    cacheStatus: "MISS",
    reason: "Deep formal mathematical derivation requiring state-of-the-art reasoning.",
    confidence: 99,
    tokens: { prompt: 210, completion: 940, total: 1150 },
  },
  {
    id: "req-9844",
    timestamp: "2026-10-04T12:04:39Z",
    timeFormatted: "12:04:39",
    promptPreview: "Format this JSON payload into TypeScript interfaces",
    complexity: "Low",
    complexityScore: 18,
    reasoningScore: 22,
    contextScore: 35,
    costSensitivity: 85,
    selectedModel: "Fast Model (Llama 3.1 8B)",
    modelTier: "fast",
    latencyMs: 114,
    costUsd: 0.0008,
    cacheStatus: "MISS",
    reason: "Syntactic transformation task, fast tier achieves 99% accuracy.",
    confidence: 95,
    tokens: { prompt: 290, completion: 150, total: 440 },
  },
  {
    id: "req-9845",
    timestamp: "2026-10-04T12:04:47Z",
    timeFormatted: "12:04:47",
    promptPreview: "Design a REST API schema for an e-commerce order management system",
    complexity: "Medium",
    complexityScore: 62,
    reasoningScore: 65,
    contextScore: 58,
    costSensitivity: 50,
    selectedModel: "Balanced Model (Claude 3.5 Haiku)",
    modelTier: "balanced",
    latencyMs: 338,
    costUsd: 0.0038,
    cacheStatus: "MISS",
    reason: "Domain modeling requires clean architectural intuition.",
    confidence: 92,
    tokens: { prompt: 180, completion: 420, total: 600 },
  },
  {
    id: "req-9846",
    timestamp: "2026-10-04T12:04:54Z",
    timeFormatted: "12:04:54",
    promptPreview: "What is TCP protocol 3-way handshake?",
    complexity: "Low",
    complexityScore: 15,
    reasoningScore: 18,
    contextScore: 20,
    costSensitivity: 90,
    selectedModel: "Fast Model (Llama 3.1 8B)",
    modelTier: "fast",
    latencyMs: 18,
    costUsd: 0.0001,
    cacheStatus: "HIT",
    reason: "Instant semantic cache retrieval (97.4% similarity). Zero model latency.",
    confidence: 98,
    tokens: { prompt: 45, completion: 190, total: 235 },
  },
  {
    id: "req-9847",
    timestamp: "2026-10-04T12:05:03Z",
    timeFormatted: "12:05:03",
    promptPreview: "Multi-file refactoring: migrate Redux state management to Zustand with optimistic UI updates",
    complexity: "High",
    complexityScore: 89,
    reasoningScore: 91,
    contextScore: 84,
    costSensitivity: 30,
    selectedModel: "Powerful Model (Claude 3.7 Sonnet)",
    modelTier: "powerful",
    latencyMs: 812,
    costUsd: 0.0185,
    cacheStatus: "MISS",
    reason: "High context and inter-module dependency resolution.",
    confidence: 97,
    tokens: { prompt: 680, completion: 720, total: 1400 },
  },
  {
    id: "req-9848",
    timestamp: "2026-10-04T12:05:10Z",
    timeFormatted: "12:05:10",
    promptPreview: "Translate error response to Spanish locale",
    complexity: "Low",
    complexityScore: 12,
    reasoningScore: 15,
    contextScore: 15,
    costSensitivity: 95,
    selectedModel: "Fast Model (Llama 3.1 8B)",
    modelTier: "fast",
    latencyMs: 108,
    costUsd: 0.0005,
    cacheStatus: "MISS",
    reason: "Direct linguistic translation well within 8B parameter capacity.",
    confidence: 96,
    tokens: { prompt: 60, completion: 45, total: 105 },
  },
];

// Semantic Cache Matches Demo Data
export const CACHE_MATCHES: CacheEntry[] = [
  {
    id: "c-1",
    query: "Explain TCP protocol 3-way handshake",
    matchedQuery: "What is the TCP 3-way handshake?",
    similarity: 97.4,
    action: "CACHE HIT",
    latencySavedMs: 320,
    actualLatencyMs: 14,
    costSavedUsd: 0.0035,
    timestamp: "2 min ago",
  },
  {
    id: "c-2",
    query: "How do I invert a binary tree in Python?",
    matchedQuery: "Python code to invert a binary tree recursively",
    similarity: 95.8,
    action: "CACHE HIT",
    latencySavedMs: 290,
    actualLatencyMs: 16,
    costSavedUsd: 0.0028,
    timestamp: "5 min ago",
  },
  {
    id: "c-3",
    query: "Explain distributed consensus with Raft vs Paxos",
    matchedQuery: "Differences between Raft consensus and Paxos consensus",
    similarity: 94.2,
    action: "CACHE HIT",
    latencySavedMs: 410,
    actualLatencyMs: 18,
    costSavedUsd: 0.0042,
    timestamp: "12 min ago",
  },
  {
    id: "c-4",
    query: "Configure Next.js 15 route handlers with edge runtime",
    matchedQuery: "Next.js App Router edge config for api routes",
    similarity: 92.1,
    action: "CACHE HIT",
    latencySavedMs: 345,
    actualLatencyMs: 22,
    costSavedUsd: 0.0032,
    timestamp: "18 min ago",
  },
  {
    id: "c-5",
    query: "What is quantum entanglement in teleportation protocols?",
    matchedQuery: "Quantum teleportation principles",
    similarity: 78.4,
    action: "CACHE MISS",
    latencySavedMs: 0,
    actualLatencyMs: 820,
    costSavedUsd: 0.0,
    timestamp: "24 min ago",
  },
];

// Dynamic Routing Simulator for Playground & Demos
export function simulateAdaptiveRouting(prompt: string): {
  complexityScore: number;
  reasoningScore: number;
  contextScore: number;
  costSensitivity: number;
  complexityLevel: "Low" | "Medium" | "High";
  selectedTier: "fast" | "balanced" | "powerful";
  modelName: string;
  provider: string;
  reason: string;
  cost: number;
  latencyMs: number;
  confidence: number;
  cacheHit: boolean;
  tokens: { prompt: number; completion: number; total: number };
} {
  const p = prompt.toLowerCase();
  const wordCount = prompt.trim().split(/\s+/).length;

  // Cache hit heuristics
  const isCacheHit =
    p.includes("tcp") ||
    p.includes("invert binary tree") ||
    p.includes("what is an api") ||
    p.includes("hello") ||
    p.includes("fibonacci");

  // Heavy reasoning cues
  const hasHighReasoning =
    p.includes("prove") ||
    p.includes("proof") ||
    p.includes("distributed system") ||
    p.includes("architecture") ||
    p.includes("refactor") ||
    p.includes("concurrency") ||
    p.includes("paxos") ||
    p.includes("algorithm") ||
    p.includes("optimize") ||
    p.includes("quantum") ||
    p.includes("calculus") ||
    p.includes("derivation");

  // Moderate cues
  const hasModerateReasoning =
    p.includes("explain") ||
    p.includes("how to") ||
    p.includes("design") ||
    p.includes("compare") ||
    p.includes("implement") ||
    p.includes("debug") ||
    p.includes("write a function") ||
    wordCount > 30;

  const charSum = prompt.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const offset = charSum % 7;

  let complexityScore = 20;
  let reasoningScore = 25;
  let contextScore = Math.min(Math.round(wordCount * 1.5) + 15, 95);
  let costSensitivity = 80;

  if (hasHighReasoning || wordCount > 80) {
    complexityScore = Math.min(88 + offset, 99);
    reasoningScore = Math.min(90 + offset, 99);
    costSensitivity = 35;
  } else if (hasModerateReasoning || wordCount > 15) {
    complexityScore = 60 + offset * 2;
    reasoningScore = 65 + offset;
    costSensitivity = 60;
  } else {
    complexityScore = 18 + offset;
    reasoningScore = 20 + offset;
    costSensitivity = 88;
  }

  let selectedTier: "fast" | "balanced" | "powerful" = "fast";
  let complexityLevel: "Low" | "Medium" | "High" = "Low";
  let modelName = "Fast Model (Llama 3.1 8B)";
  let provider = "Groq / Meta";
  let reason = "Syntactic or direct factual lookup. High efficiency model selected.";
  let cost = 0.0008;
  let latencyMs = 118;
  let confidence = 94;

  if (isCacheHit) {
    return {
      complexityScore,
      reasoningScore,
      contextScore,
      costSensitivity,
      complexityLevel: "Low",
      selectedTier: "fast",
      modelName: "Semantic Cache (Instant)",
      provider: "Local Embeddings",
      reason: "Semantic match found with >95% similarity in vector cache. Instant return without model invocation.",
      cost: 0.00005,
      latencyMs: 16,
      confidence: 98,
      cacheHit: true,
      tokens: { prompt: Math.round(wordCount * 1.3), completion: 120, total: Math.round(wordCount * 1.3) + 120 },
    };
  }

  if (complexityScore >= 80) {
    selectedTier = "powerful";
    complexityLevel = "High";
    modelName = "Powerful Model (Claude 3.7 Sonnet)";
    provider = "Anthropic";
    reason = "High reasoning and structural depth detected. Advanced model needed for zero-shot correctness.";
    cost = 0.0165;
    latencyMs = 820 + offset * 5;
    confidence = 98;
  } else if (complexityScore >= 45) {
    selectedTier = "balanced";
    complexityLevel = "Medium";
    modelName = "Balanced Model (Claude 3.5 Haiku)";
    provider = "Anthropic / OpenAI";
    reason = "Moderate complexity with clear domain boundaries. Balanced tier saves 74% cost with near-identical quality.";
    cost = 0.0036;
    latencyMs = 335 + offset * 3;
    confidence = 93;
  } else {
    selectedTier = "fast";
    complexityLevel = "Low";
    modelName = "Fast Model (Llama 3.1 8B)";
    provider = "Groq / Meta";
    reason = "Low computational requirement. Fast sub-150ms model delivers full answer with minimal carbon & cost.";
    cost = 0.0009;
    latencyMs = 112 + offset * 2;
    confidence = 96;
  }

  const promptTokens = Math.max(15, Math.round(wordCount * 1.4));
  const completionTokens = selectedTier === "powerful" ? 640 : selectedTier === "balanced" ? 340 : 140;

  return {
    complexityScore,
    reasoningScore,
    contextScore,
    costSensitivity,
    complexityLevel,
    selectedTier,
    modelName,
    provider,
    reason,
    cost,
    latencyMs,
    confidence,
    cacheHit: false,
    tokens: {
      prompt: promptTokens,
      completion: completionTokens,
      total: promptTokens + completionTokens,
    },
  };
}
