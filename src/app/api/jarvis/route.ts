import { NextResponse } from "next/server";
import { db } from "@/db";
import { jarvisMessages } from "@/db/schema";
import { desc } from "drizzle-orm";
import { getSettings } from "@/lib/jarvis/settings";
import { generateReply } from "@/lib/jarvis/llm";
import { buildSystemPrompt } from "@/lib/jarvis/persona";
import { appendMemory, searchMemory } from "@/lib/jarvis/obsidian";

export async function GET() {
  try {
    const messages = await db.select().from(jarvisMessages).orderBy(desc(jarvisMessages.createdAt)).limit(100);
    return NextResponse.json(messages.reverse());
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const content = typeof body?.content === "string" ? body.content.trim() : "";
    if (!content) return NextResponse.json({ error: "Message is required." }, { status: 400 });
    if (content.length > 12000) return NextResponse.json({ error: "Message is too long." }, { status: 400 });

    const settings = await getSettings();
    const memory = settings.obsidianVaultPath ? await searchMemory(settings.obsidianVaultPath, content) : "";
    const history = await db.select().from(jarvisMessages).orderBy(desc(jarvisMessages.createdAt)).limit(30);
    const messages = [
      { role: "system" as const, content: buildSystemPrompt(memory) },
      ...history.reverse().map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
      { role: "user" as const, content },
    ];

    await db.insert(jarvisMessages).values({ role: "user", content });
    const result = await generateReply(messages, {
      ollamaUrl: settings.ollamaUrl ?? "",
      ollamaModel: settings.ollamaModel ?? "",
    });
    await db.insert(jarvisMessages).values({ role: "assistant", content: result.reply });
    if (settings.obsidianVaultPath) await appendMemory(settings.obsidianVaultPath, content, result.reply);

    return NextResponse.json({ reply: result.reply, provider: result.provider });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
