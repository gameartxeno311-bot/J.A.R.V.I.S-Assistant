import { db } from "@/db";
import { jarvisSettings } from "@/db/schema";
import { eq } from "drizzle-orm";

export type JarvisSettings = typeof jarvisSettings.$inferSelect;

const DEFAULTS = {
  obsidianVaultPath: "",
  autoSpeak: true,
  voiceURI: "",
  rate: 1,
  pitch: 1,
  volume: 1,
  customTtsUrl: "",
  activeVoiceProfileId: "",
  ollamaUrl: "http://127.0.0.1:11434",
  ollamaModel: "llama3.1",
};

export async function getSettings(): Promise<JarvisSettings> {
  const rows = await db.select().from(jarvisSettings).where(eq(jarvisSettings.id, 1)).limit(1);
  if (rows[0]) return rows[0];

  const inserted = await db
    .insert(jarvisSettings)
    .values({ id: 1, ...DEFAULTS })
    .onConflictDoNothing()
    .returning();

  if (inserted[0]) return inserted[0];

  const fallback = await db.select().from(jarvisSettings).where(eq(jarvisSettings.id, 1)).limit(1);
  return fallback[0];
}

export async function updateSettings(patch: Partial<typeof DEFAULTS>): Promise<JarvisSettings> {
  await getSettings();
  const updated = await db
    .update(jarvisSettings)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(jarvisSettings.id, 1))
    .returning();
  return updated[0];
}