import { NextResponse } from "next/server";
import { getSettings } from "@/lib/jarvis/settings";
import { appendMemory, checkVault } from "@/lib/jarvis/obsidian";

export async function GET() {
  try {
    const settings = await getSettings();
    if (!settings.obsidianVaultPath) {
      return NextResponse.json({ ok: false, error: "No Obsidian vault is linked." });
    }
    return NextResponse.json(await checkVault(settings.obsidianVaultPath));
  } catch (error) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 500 });
  }
}

export async function POST() {
  try {
    const settings = await getSettings();
    if (!settings.obsidianVaultPath) {
      return NextResponse.json({ ok: false, error: "Set your Obsidian vault path first." }, { status: 400 });
    }

    const status = await checkVault(settings.obsidianVaultPath);
    if (!status.ok) return NextResponse.json(status, { status: 400 });

    await appendMemory(
      settings.obsidianVaultPath,
      "J.A.R.V.I.S connection test",
      "Obsidian memory is connected and writable.",
    );

    return NextResponse.json({
      ok: true,
      message: "Obsidian is connected and writable.",
      memoryFolder: "Jarvis",
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: (error as Error).message },
      { status: 500 },
    );
  }
}
