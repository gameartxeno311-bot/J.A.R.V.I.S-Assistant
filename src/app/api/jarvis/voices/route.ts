import { NextResponse } from "next/server";
import { db } from "@/db";
import { voiceProfiles } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

const publicDir = path.join(process.cwd(), "public", "voice-samples");

export async function GET() {
  return NextResponse.json(await db.select().from(voiceProfiles).orderBy(desc(voiceProfiles.createdAt)));
}
export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get("file");
    const name = String(form.get("name") || "");
    if (!(file instanceof File)) return NextResponse.json({ error: "Audio file is required." }, { status: 400 });
    if (!file.type.startsWith("audio/")) return NextResponse.json({ error: "Only audio files are allowed." }, { status: 400 });
    if (file.size > 25 * 1024 * 1024) return NextResponse.json({ error: "Audio file must be 25 MB or smaller." }, { status: 400 });
    await fs.mkdir(publicDir, { recursive: true });
    const ext = path.extname(file.name).replace(/[^a-zA-Z0-9.]/g, "").slice(0, 8) || ".bin";
    const base = (name || path.basename(file.name, path.extname(file.name))).replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 80) || "voice";
    const filename = `${base}-${crypto.randomUUID()}${ext}`;
    await fs.writeFile(path.join(publicDir, filename), Buffer.from(await file.arrayBuffer()));
    const [profile] = await db.insert(voiceProfiles).values({
      name: name.trim() || file.name, fileName: file.name, filePath: `/voice-samples/${filename}`, mimeType: file.type,
    }).returning();
    return NextResponse.json(profile, { status: 201 });
  } catch (error) { return NextResponse.json({ error: (error as Error).message }, { status: 500 }); }
}
export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();
    const profileId = Number(id);
    if (!Number.isInteger(profileId)) return NextResponse.json({ error: "Valid id required." }, { status: 400 });
    const [profile] = await db.select().from(voiceProfiles).where(eq(voiceProfiles.id, profileId)).limit(1);
    if (!profile) return NextResponse.json({ error: "Voice profile not found." }, { status: 404 });
    await db.delete(voiceProfiles).where(eq(voiceProfiles.id, profileId));
    await fs.rm(path.join(process.cwd(), "public", profile.filePath.replace(/^\//, "")), { force: true });
    return NextResponse.json({ ok: true });
  } catch (error) { return NextResponse.json({ error: (error as Error).message }, { status: 500 }); }
}
