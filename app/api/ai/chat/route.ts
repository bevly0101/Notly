import { NextRequest } from "next/server";
import { PROVIDERS, type Message } from "@/lib/ai/providers";

export async function POST(request: NextRequest) {
  const apiKey = request.headers.get("X-User-AI-Key");
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "Chave de API ausente" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  let body: { messages?: unknown; provider?: string; model?: string; temperature?: number };
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "JSON inválido" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { messages, provider: providerId, model, temperature } = body;

  if (!messages || !providerId) {
    return new Response(JSON.stringify({ error: "messages e provider são obrigatórios" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!Array.isArray(messages)) {
    return new Response(JSON.stringify({ error: "messages deve ser um array" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const providerConfig = PROVIDERS[providerId as string];
  if (!providerConfig) {
    return new Response(JSON.stringify({ error: `Provider "${providerId}" não suportado` }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { url, headers, body: requestBody } = providerConfig.formatRequest({
    messages: messages as Message[],
    model: (model as string) ?? providerConfig.defaultModel,
    temperature: (temperature as number) ?? providerConfig.defaultTemperature,
    apiKey,
  });

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: headers as Record<string, string>,
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return new Response(
        JSON.stringify({ error: `API error ${response.status}: ${errorText}` }),
        {
          status: response.status,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (contentType.includes("text/event-stream") || contentType.includes("text/plain")) {
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          const reader = response.body?.getReader();
          if (!reader) {
            controller.close();
            return;
          }
          const decoder = new TextDecoder();
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              const chunk = decoder.decode(value, { stream: true });
              controller.enqueue(encoder.encode(chunk));
            }
          } finally {
            reader.releaseLock();
            controller.close();
          }
        },
      });
      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    }

    const data = await response.json();
    return new Response(JSON.stringify(data), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: `Erro de rede: ${msg}` }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
  }
}
