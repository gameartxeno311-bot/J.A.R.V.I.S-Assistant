import { NextResponse } from "next/server";
import { getSettings } from "@/lib/jarvis/settings";
import { db } from "@/db";
import { voiceProfiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import path from "node:path";

export async function POST(request: Request) {
  try {
    const { text } = await request.json();
    if (typeof text !== "string" || !text.trim()) {
      return NextResponse.json({ error: "Text is required." }, { status: 400 });
    }

    const settings = await getSettings();
    const target = settings.customTtsUrl?.trim();
    if (!target) {
      return NextResponse.json({ error: "Custom TTS server URL is not configured." }, { status: 400 });
    }

    let referenceVoicePath: string | undefined;
    if (settings.activeVoiceProfileId) {
      const profileId = Number(settings.activeVoiceProfileId);
      if (Number.isInteger(profileId)) {
        const [profile] = await db.select().from(voiceProfiles).where(eq(voiceProfiles.id, profileId)).limit(1);
        if (profile?.filePath?.startsWith("/voice-samples/")) {
          referenceVoicePath = path.join(process.cwd(), "public", profile.filePath.replace(/^\/+/, ""));
        }
      }
    }

    const response = await fetch(target, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "audio/wav,audio/mpeg,audio/*,application/json" },
      body: JSON.stringify({
        text: text.slice(0, 10000),
        ...(referenceVoicePath ? { referenceVoicePath } : {}),
      }),
      signal: AbortSignal.timeout(120000),
    });

    if (!response.ok) {
      return NextResponse.json({ error: `TTS server returned ${response.status}: ${await response.text()}` }, { status: 502 });
    }

    return new NextResponse(await response.arrayBuffer(), {
      headers: { "Content-Type": response.headers.get("content-type") || "audio/wav", "Cache-Control": "no-store" },
    });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 502 });
  }
}
