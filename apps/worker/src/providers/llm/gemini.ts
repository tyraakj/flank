import { LlmProvider } from "../interfaces";
import { LlmRequest, LlmResult } from "@flank/shared";
import { generateObject } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { providerMetrics } from "../metrics";

export class GeminiLlmProvider implements LlmProvider {
  readonly name = "gemini-provider";
  private modelName: string;
  private googleAi: ReturnType<typeof createGoogleGenerativeAI>;

  constructor(modelName: string = "gemini-1.5-flash") {
    this.modelName = modelName;
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      throw new Error("GOOGLE_API_KEY is missing");
    }
    this.googleAi = createGoogleGenerativeAI({
      apiKey,
    });
  }

  async generateStructured<T>(request: LlmRequest<T>): Promise<LlmResult> {
    const startTime = Date.now();
    try {
      const {
        object,
        usage,
        warnings: aiWarnings,
      } = await generateObject({
        model: this.googleAi(this.modelName),
        schema: request.schema,
        schemaName: request.schemaName,
        schemaDescription: request.schemaDescription,
        prompt: request.prompt,
        system: request.system,
        temperature: request.temperature,
        maxTokens: request.maxTokens,
      });

      const latencyMs = Date.now() - startTime;

      const warnings = aiWarnings?.map((w) => {
        if (typeof w === "object" && w !== null) {
          const rec = w as Record<string, unknown>;
          if ("message" in rec) return String(rec.message);
          if ("details" in rec) return String(rec.details);
          if ("type" in rec) return String(rec.type);
        }
        return String(w);
      });

      const u = usage as Record<string, unknown> | undefined;
      providerMetrics.recordLlmGeneration(
        this.name,
        this.modelName,
        latencyMs,
        Number(u?.promptTokens || 0),
        Number(u?.completionTokens || 0),
      );

      return {
        data: object,
        providerName: this.name,
        model: this.modelName,
        tokens: u
          ? {
              prompt: Number(u.promptTokens || 0),
              completion: Number(u.completionTokens || 0),
              total: Number(u.totalTokens || 0),
            }
          : undefined,
        latencyMs,
        warnings,
      };
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error(String(err));
      providerMetrics.recordError(this.name, `generateStructured(${request.schemaName})`, error);

      // Attempt repair or fallback if defined
      if (request.fallback !== undefined) {
        return {
          data: request.fallback,
          providerName: this.name,
          model: this.modelName,
          latencyMs: Date.now() - startTime,
          warnings: ["Generation failed, using deterministic fallback. Error: " + error.message],
        };
      }

      throw error;
    }
  }
}
