import fs from "node:fs/promises";
import path from "node:path";

export async function checkVault(vaultPath: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const stat = await fs.stat(vaultPath);
    if (!stat.isDirectory()) return { ok: false, error: "Path exists but is not a folder." };
    return { ok: true };
  } catch {
    return { ok: false, error: "Folder not found." };
  }
}

export async function appendMemory(vaultPath: string, userMessage: string, assistantMessage: string) {
  const folder = path.join(vaultPath, "Jarvis");
  await fs.mkdir(folder, { recursive: true });
  const d = new Date();
  const file = path.join(folder, d.toISOString().slice(0, 10) + ".md");
  const entry = `\n## ${d.toLocaleTimeString()}\n**You:** ${userMessage}\n\n**Jarvis:** ${assistantMessage}\n`;
  await fs.appendFile(file, entry, "utf8");
}

export async function searchMemory(vaultPath: string, query: string, limit = 5): Promise<string> {
  try {
    const folder = path.join(vaultPath, "Jarvis");
    const files = (await fs.readdir(folder)).filter((f) => f.endsWith(".md")).sort().reverse().slice(0, 10);
    const terms = query.toLowerCase().split(/\W+/).filter((x) => x.length > 3);
    const matches: string[] = [];
    for (const file of files) {
      const text = await fs.readFile(path.join(folder, file), "utf8");
      if (terms.some((term) => text.toLowerCase().includes(term))) matches.push(text.slice(-4000));
      if (matches.length >= limit) break;
    }
    return matches.join("\n\n");
  } catch {
    return "";
  }
}