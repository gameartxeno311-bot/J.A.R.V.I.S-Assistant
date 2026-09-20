"use client";

import { FormEvent, useEffect, useState } from "react";
import { SettingsDrawer } from "@/components/jarvis/SettingsDrawer";
import type { JarvisMessage, JarvisSettingsDTO, VaultStatus, VoiceProfile } from "@/lib/jarvis/types";

export default function JarvisPage() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<JarvisSettingsDTO | null>(null);
  const [messages, setMessages] = useState<JarvisMessage[]>([]);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [profiles, setProfiles] = useState<VoiceProfile[]>([]);
  const [status, setStatus] = useState<VaultStatus | null>(null);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/jarvis/settings").then(r => r.json()),
      fetch("/api/jarvis").then(r => r.json()),
      fetch("/api/jarvis/voices").then(r => r.json()),
    ]).then(([s, m, p]) => {
      setSettings(s);
      setMessages(Array.isArray(m) ? m : []);
      setProfiles(Array.isArray(p) ? p : []);
    }).catch(() => setError("Unable to load J.A.R.V.I.S. Check PostgreSQL and the server logs."));

    const loadVoices = () => setVoices(window.speechSynthesis?.getVoices() ?? []);
    window.speechSynthesis?.addEventListener("voiceschanged", loadVoices);
    return () => window.speechSynthesis?.removeEventListener("voiceschanged", loadVoices);
  }, []);

  useEffect(() => {
    if (!settings?.obsidianVaultPath) return;

    let cancelled = false;

    fetch("/api/jarvis/vault")
      .then(r => r.json())
      .then(result => {
        if (!cancelled) setStatus(result);
      })
      .catch(() => {
        if (!cancelled) setStatus({ ok: false, error: "Unable to check vault" });
      });

    return () => {
      cancelled = true;
    };
  }, [settings?.obsidianVaultPath]);

  async function save(patch: Partial<JarvisSettingsDTO>) {
    const res = await fetch("/api/jarvis/settings", {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch),
    });
    if (!res.ok) throw new Error((await res.json()).error || "Could not save settings");
    setSettings(await res.json());
  }

  async function send(event: FormEvent) {
    event.preventDefault();
    const content = input.trim();
    if (!content || busy) return;
    setInput(""); setError(""); setMessages(m => [...m, { role: "user", content }]); setBusy(true);
    try {
      const res = await fetch("/api/jarvis", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "J.A.R.V.I.S request failed");
      setMessages(m => [...m, { role: "assistant", content: data.reply }]);
      if (settings?.autoSpeak) speak(data.reply);
    } catch (e) {
      setError((e as Error).message);
    } finally { setBusy(false); }
  }

  function browserSpeak(text: string) {
    if (!("speechSynthesis" in window)) return;
    const utterance = new SpeechSynthesisUtterance(text);
    const voice = voices.find(v => v.voiceURI === settings?.voiceURI);
    if (voice) utterance.voice = voice;
    utterance.rate = settings?.rate ?? 1;
    utterance.pitch = settings?.pitch ?? 1;
    utterance.volume = settings?.volume ?? 1;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }

  function speak(text: string) {
    if (!settings?.customTtsUrl) return browserSpeak(text);
    fetch("/api/jarvis/tts", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text }),
    }).then(async r => { if (!r.ok) throw new Error("Custom TTS failed"); return r.blob(); })
      .then(blob => { const audio = new Audio(URL.createObjectURL(blob)); void audio.play(); })
      .catch(() => browserSpeak(text));
  }

  async function uploadVoice(file: File, name: string) {
    const form = new FormData(); form.set("file", file); form.set("name", name);
    const res = await fetch("/api/jarvis/voices", { method: "POST", body: form });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Upload failed");
    setProfiles(p => [data, ...p]);
  }

  async function deleteVoice(id: number) {
    const res = await fetch("/api/jarvis/voices", {
      method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Delete failed");
    setProfiles(p => p.filter(profile => profile.id !== id));
  }

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-slate-100">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-6xl flex-col overflow-hidden rounded-2xl border border-cyan-500/20 bg-slate-950 shadow-2xl">
        <header className="flex items-center justify-between border-b border-cyan-500/20 px-5 py-4">
          <div><div className="text-xs uppercase tracking-[0.3em] text-cyan-500">J.A.R.V.I.S</div><h1 className="text-xl font-semibold">Personal AI Assistant</h1></div>
          <button type="button" onClick={() => setSettingsOpen(true)} className="rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-300 hover:bg-cyan-500/20">⚙ Settings</button>
        </header>
        <section className="flex flex-1 flex-col gap-4 p-5">
          <div className="flex-1 space-y-3 overflow-y-auto rounded-xl border border-slate-800 bg-slate-900/40 p-4">
            {messages.length === 0 && <div className="flex h-full items-center justify-center text-center text-slate-500"><div><div className="mb-3 text-4xl">J</div><p>Systems online. How may I assist?</p></div></div>}
            {messages.map((m, i) => <div key={m.id ?? i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}><div className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm ${m.role === "user" ? "bg-cyan-700/40 text-cyan-50" : "bg-slate-800 text-slate-200"}`}>{m.content}</div></div>)}
            {busy && <div className="text-sm text-cyan-400">J.A.R.V.I.S is thinking…</div>}
          </div>
          {error && <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-300">{error}</div>}
          <form onSubmit={send} className="flex gap-2">
            <input value={input} onChange={e => setInput(e.target.value)} disabled={busy} placeholder="Ask J.A.R.V.I.S anything…" className="flex-1 rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 outline-none focus:border-cyan-500" />
            <button disabled={busy || !input.trim()} className="rounded-xl bg-cyan-600 px-5 py-3 font-medium text-white hover:bg-cyan-500 disabled:opacity-50">Send</button>
          </form>
        </section>
      </div>
      {settings && <SettingsDrawer open={settingsOpen} onClose={() => setSettingsOpen(false)} settings={settings} vaultStatus={status ?? (settings?.obsidianVaultPath ? null : { ok: false, error: "Not connected" })} voices={voices} profiles={profiles} onSave={save} onUploadVoice={uploadVoice} onDeleteVoice={deleteVoice} onTestVoice={() => speak("Settings are working, sir. I am ready.")} />}
    </main>
  );
}
