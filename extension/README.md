# AdaptiveRoute AI — VS Code & Cursor Extension

AdaptiveRoute is an intelligent ML-based dynamic LLM router and gateway for Cursor, Antigravity, and VS Code.

## Features
- **Automatic Semantic Model Downscaling**: Select a high model by default (e.g. **Claude 3.5 Sonnet**). When you ask a simple question like `3*4`, AdaptiveRoute intercepts it and routes to the **Small tier** model (e.g. Grok-2 Mini, Claude 3.5 Haiku, or local Qwen), cutting latency to ~200ms and saving over 90% of token costs.
- **Flagship Protection**: Deep coding, system design, and multi-file architecture questions stay on the **Large tier** flagship models.
- **Sidebar Chat & Editor Integration**: Direct chat in your editor, right-click code explanation, and bug fixing.
- **Live Routing Telemetry**: Visual display showing client requested model, routed model, tier, and cost savings.

## Usage
1. Start your local AdaptiveRoute server (`http://localhost:8000`).
2. Open the AdaptiveRoute sidebar panel in VS Code / Cursor.
3. Select your desired default model and start chatting!
