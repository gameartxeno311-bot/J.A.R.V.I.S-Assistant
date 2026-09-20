import { NextResponse } from "next/server";
import { getSettings } from "@/lib/jarvis/settings";
import { checkVault } from "@/lib/jarvis/obsidian";

export async function GET() {
  const settings = await getSettings();
  if (!settings.obsidianVaultPath) return NextResponse.json({ ok: false, error: "Not connected" });
  return NextResponse.json(await checkVault(settings.obsidianVaultPath));
}