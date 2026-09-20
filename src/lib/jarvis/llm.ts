export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

export type LlmSettings = {
  ollamaUrl: string;
  ollamaModel: string;
};

export class LlmSetupError extends Error {}

async function callOpenAI(messages: ChatMessage[]): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new LlmSetupError("no-openai-key");
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages,
      temperature: 0.6,
    }),
  });
  if (!res.ok) throw new Error(`OpenAI error ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

async function callAnthropic(messages: ChatMessage[]): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new LlmSetupError("no-anthropic-key");
  const system = messages.find((m) => m.role === "system")?.content ?? "";
  const rest = messages.filter((m) => m.role !== "system");
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-20241022",
      system,
      messages: rest.map((m) => ({ role: m.role, content: m.content })),
      max_tokens: 1024,
    }),
  });
  if (!res.ok) throw new Error(`Anthropic error ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.content?.[0]?.text ?? "";
}

async function callGemini(messages: ChatMessage[]): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) throw new LlmSetupError("no-gemini-key");
  const model = process.env.GEMINI_MODEL || "gemini-1.5-flash";
  const system = messages.find((m) => m.role === "system")?.content ?? "";
  const rest = messages.filter((m) => m.role !== "system");
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: rest.map((m) => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }],
        })),
      }),
    },
  );
  if (!res.ok) throw new Error(`Gemini error ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text).join("") ?? "";
}

async function callOllama(messages: ChatMessage[], settings: LlmSettings): Promise<string> {
  const base = settings.ollamaUrl || "http://127.0.0.1:11434";
  const model = settings.ollamaModel || "llama3.1";
  let res: Response;
  try {
    res = await fetch(`${base.replace(/\/$/, "")}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model, messages, stream: false }),
      signal: AbortSignal.timeout(20000),
    });
  } catch {
    throw new LlmSetupError("ollama-unreachable");
  }
  if (!res.ok) {
    const text = await res.text();
    if (res.status === 404) throw new LlmSetupError("ollama-model-missing");
    throw new Error(`Ollama error ${res.status}: ${text}`);
  }
  const data = await res.json();
  return data.message?.content ?? "";
}

const SETUP_HELP = `I don't have a brain wired up yet, sir. To get me talking, pick ONE free option:

1. Local & unlimited (recommended): install Ollama (https://ollama.com), run
   \`ollama pull llama3.1\`, then \`ollama serve\`. I'll auto-detect it at
   http://127.0.0.1:11434 (configurable in Settings).
2. Or add one API key as an environment variable and restart: OPENAI_API_KEY,
   ANTHROPIC_API_KEY, or GEMINI_API_KEY.

Once either is available, ask me anything about making money or writing code.`;

export async function generateReply(
  messages: ChatMessage[],
  settings: LlmSettings,
): Promise<{ reply: string; provider: string }> {
  const providers: Array<{ name: string; run: () => Promise<string> }> = [
    { name: "ollama", run: () => callOllama(messages, settings) },
    { name: "openai", run: () => callOpenAI(messages) },
    { name: "anthropic", run: () => callAnthropic(messages) },
    { name: "gemini", run: () => callGemini(messages) },
  ];

  for (const provider of providers) {
    try {
      const reply = await provider.run();
      if (reply && reply.trim()) return { reply: reply.trim(), provider: provider.name };
    } catch (err) {
      if (err instanceof LlmSetupError) continue;
      return { reply: `I hit a snag talking to ${provider.name}: ${(err as Error).message}`, provider: `${provider.name}-error` };
    }
  }

  return { reply: SETUP_HELP, provider: "none" };
}