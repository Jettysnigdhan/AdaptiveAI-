import * as vscode from "vscode";
import * as http from "http";
import * as https from "https";
import { URL } from "url";

export class AdaptiveLanguageModelProvider {
  constructor(private readonly extensionUri: vscode.Uri) {}

  /**
   * Only presents and surfaces models that are strictly available in this codebase or gateway.
   */
  public async provideLanguageModelChatInformation(): Promise<any[]> {
    const config = vscode.workspace.getConfiguration("adaptiveroute");
    const gatewayUrl = (config.get<string>("gatewayUrl") || "http://localhost:8000").replace(/\/+$/, "");

    try {
      const summary = await this._fetchModelsSummary(gatewayUrl);
      const models: any[] = [];

      // Primary Adaptive Auto Router (switches strictly between available smallest and largest)
      const smallest = summary.smallest_model?.model_name || "openai/gpt-oss-20b";
      const largest = summary.largest_model?.model_name || "openai/gpt-oss-120b";
      const smallestShort = smallest.split("/").pop();
      const largestShort = largest.split("/").pop();

      models.push({
        id: "adaptive-auto",
        name: `Adaptive AI (Auto: ${smallestShort} ↔ ${largestShort})`,
        vendor: "adaptiveroute",
        family: "adaptive",
        version: "1.0.0",
        maxInputTokens: 32768,
      });

      // Surface ONLY available models returned from the active gateway
      if (summary.available_models && Array.isArray(summary.available_models)) {
        for (const m of summary.available_models) {
          const tierUpper = (m.tier || "small").toUpperCase();
          const latencyStr = m.latency_ms ? `~${Math.round(m.latency_ms)}ms` : "Fast";
          models.push({
            id: `direct:${m.model_name}`,
            name: `${m.model_name} [${tierUpper} • ${latencyStr}]`,
            vendor: "adaptiveroute",
            family: "adaptive",
            version: "1.0.0",
            maxInputTokens: m.context_length || 32768,
          });
        }
      }

      return models;
    } catch {
      // Offline fallback: Strictly the codebase models configured in backend/.env
      return [
        {
          id: "adaptive-auto",
          name: "Adaptive AI (Auto: gpt-oss-20b ↔ gpt-oss-120b)",
          vendor: "adaptiveroute",
          family: "adaptive",
          version: "1.0.0",
          maxInputTokens: 32768,
        },
        {
          id: "direct:openai/gpt-oss-20b",
          name: "openai/gpt-oss-20b [SMALL • ~270ms]",
          vendor: "adaptiveroute",
          family: "adaptive",
          version: "1.0.0",
          maxInputTokens: 8192,
        },
        {
          id: "direct:qwen/qwen3.8-27b",
          name: "qwen/qwen3.8-27b [MEDIUM • ~170ms]",
          vendor: "adaptiveroute",
          family: "adaptive",
          version: "1.0.0",
          maxInputTokens: 32768,
        },
        {
          id: "direct:openai/gpt-oss-120b",
          name: "openai/gpt-oss-120b [LARGE • ~860ms]",
          vendor: "adaptiveroute",
          family: "adaptive",
          version: "1.0.0",
          maxInputTokens: 32768,
        },
      ];
    }
  }

  public async provideTokenCount(
    text: string | vscode.LanguageModelChatMessage,
    token?: vscode.CancellationToken
  ): Promise<number> {
    const raw = typeof text === "string" ? text : (text as any)?.content || "";
    return Math.ceil(raw.length / 4);
  }

  public async provideLanguageModelChatResponse(
    messages: any[],
    options: any,
    progress: any,
    token: vscode.CancellationToken
  ): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const config = vscode.workspace.getConfiguration("adaptiveroute");
      const gatewayUrl = (config.get<string>("gatewayUrl") || "http://localhost:8000").replace(/\/+$/, "");

      // Convert messages to standard OpenAI format
      const formattedMessages = messages.map((m) => {
        let contentStr = "";
        if (typeof m.content === "string") {
          contentStr = m.content;
        } else if (Array.isArray(m.content)) {
          contentStr = m.content
            .map((c: any) => (typeof c === "string" ? c : c.value || c.text || ""))
            .join("\n");
        } else if (m.content && typeof m.content === "object") {
          contentStr = m.content.value || m.content.text || JSON.stringify(m.content);
        }

        let roleStr = "user";
        if (m.role === 1 || m.role === "user") roleStr = "user";
        else if (m.role === 2 || m.role === "assistant") roleStr = "assistant";
        else if (m.role === 3 || m.role === "system") roleStr = "system";

        return {
          role: roleStr,
          content: contentStr,
        };
      });

      const modelId = options?.modelId || "adaptive-auto";
      const payload = JSON.stringify({
        model: modelId,
        messages: formattedMessages,
        stream: true,
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? 2048,
      });

      const apiUrl = new URL(`${gatewayUrl}/v1/chat/completions`);
      const isHttps = apiUrl.protocol === "https:";
      const lib = isHttps ? https : http;

      const req = lib.request(
        {
          method: "POST",
          hostname: apiUrl.hostname,
          port: apiUrl.port || (isHttps ? 443 : 80),
          path: apiUrl.pathname,
          headers: {
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(payload),
          },
          timeout: 60000,
        },
        (res) => {
          if (res.statusCode && res.statusCode >= 400) {
            let errBody = "";
            res.on("data", (chunk) => (errBody += chunk));
            res.on("end", () => {
              const msg = `AdaptiveRoute Gateway returned ${res.statusCode}: ${errBody}`;
              reject(new Error(msg));
            });
            return;
          }

          let buffer = "";

          res.on("data", (chunk: Buffer) => {
            buffer += chunk.toString("utf8");
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed.startsWith("data:")) continue;
              const jsonStr = trimmed.slice(5).trim();
              if (!jsonStr || jsonStr === "[DONE]") continue;

              try {
                const data = JSON.parse(jsonStr);
                const delta = data.choices?.[0]?.delta?.content;
                if (delta) {
                  this._emitChunk(delta, progress);
                }
              } catch {}
            }
          });

          res.on("end", () => {
            resolve();
          });
        }
      );

      req.on("error", (err) => {
        reject(
          new Error(
            `AdaptiveRoute Gateway connection failed at ${gatewayUrl}: ${err.message}. Is 'python -m uvicorn backend.app.main:app --port 8000' running?`
          )
        );
      });

      token?.onCancellationRequested(() => {
        req.destroy();
        resolve();
      });

      req.write(payload);
      req.end();
    });
  }

  private _fetchModelsSummary(gatewayUrl: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const url = new URL(`${gatewayUrl}/api/v1/models/summary`);
      const lib = url.protocol === "https:" ? https : http;
      const req = lib.request(url, { method: "GET", timeout: 2500 }, (res) => {
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => {
          if (res.statusCode && res.statusCode < 400) {
            try {
              resolve(JSON.parse(body));
            } catch (e) {
              reject(e);
            }
          } else {
            reject(new Error(`Failed with status ${res.statusCode}`));
          }
        });
      });
      req.on("error", reject);
      req.end();
    });
  }

  private _emitChunk(text: string, progress: any) {
    const part = (vscode as any).LanguageModelTextPart
      ? new (vscode as any).LanguageModelTextPart(text)
      : { value: text, content: text };

    if (typeof progress === "function") {
      progress(part);
    } else if (progress && typeof progress.report === "function") {
      progress.report(part);
    }
  }
}
