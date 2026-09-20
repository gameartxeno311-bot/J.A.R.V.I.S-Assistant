import { NextResponse } from "next/server";
import { getSettings, updateSettings } from "@/lib/jarvis/settings";

export async function GET() {
  try {
    return NextResponse.json(await getSettings());
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const allowed = [
      "obsidianVaultPath", "autoSpeak", "voiceURI", "rate", "pitch", "volume",
      "customTtsUrl", "activeVoiceProfileId", "ollamaUrl", "ollamaModel",
    ] as const;
    const patch = Object.fromEntries(
      Object.entries(body).filter(([key]) => (allowed as readonly string[]).includes(key)),
    );
    return NextResponse.json(await updateSettings(patch));
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}