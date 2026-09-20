import { NextResponse } from "next/server";
import { getSettings } from "@/lib/jarvis/settings";

export async function GET() {
  const settings = await getSettings();
  const base = (settings.ollamaUrl || "http://127.0.0.1:11434").replace(/\/$/, "");
  try {
    const response = await fetch(base + "/api/tags", { signal: AbortSignal.timeout(5000), cache: "no-store" });
    if (!response.ok) return NextResponse.json({ ok: false, error: `Ollama returned HTTP ${response.status}` });
    const data = await response.json();
    const models = Array.isArray(data.models) ? data.models.map((m: {name?: string}) => m.name).filter(Boolean) : [];
    return NextResponse.json({ ok: true, model: settings.ollamaModel || models[0] || "", models });
  } catch {
    return NextResponse.json({ ok: false, error: "Ollama is offline. Start Ollama and make sure port 11434 is available." });
  }
}
