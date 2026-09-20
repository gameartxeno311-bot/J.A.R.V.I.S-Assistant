import { NextResponse } from "next/server";
import { getSettings } from "@/lib/jarvis/settings";

export async function POST(request: Request) {
  try {
    const { text } = await request.json();
    if (typeof text !== "string" || !text.trim()) return NextResponse.json({ error: "Text is required." }, { status: 400 });
    const url = getSettings().then(s => s.customTtsUrl?.trim());
    const target = await url;
    if (!target) return NextResponse.json({ error: "Custom TTS server URL is not configured." }, { status: 400 });
    const response = await fetch(target, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "audio/wav,audio/mpeg,audio/*,application/json" },
      body: JSON.stringify({ text: text.slice(0, 10000) }),
      signal: AbortSignal.timeout(60000),
    });
    if (!response.ok) return NextResponse.json({ error: `TTS server returned ${response.status}: ${await response.text()}` }, { status: 502 });
    return new NextResponse(await response.arrayBuffer(), {
      headers: { "Content-Type": response.headers.get("content-type") || "audio/wav", "Cache-Control": "no-store" },
    });
  } catch (error) { return NextResponse.json({ error: (error as Error).message }, { status: 502 }); }
}
