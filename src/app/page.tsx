"use client";

import { useEffect, useState } from "react";
import { SettingsDrawer } from "@/components/jarvis/SettingsDrawer";
import type { JarvisSettingsDTO, VaultStatus, VoiceProfile } from "@/lib/jarvis/types";

export default function JarvisPage() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<JarvisSettingsDTO | null>(null);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [status, setStatus] = useState<VaultStatus | null>(null);

  useEffect(() => {
    fetch("/api/jarvis/settings")
      .then((r) => r.json())
      .then(setSettings)
      .catch(() => setSettings(null));

    const loadVoices = () => setVoices(window.speechSynthesis?.getVoices() ?? []);
    loadVoices();
    window.speechSynthesis?.addEventListener("voiceschanged", loadVoices);
    return () => window.speechSynthesis?.removeEventListener("voiceschanged", loadVoices);
  }, []);

  useEffect(() => {
    if (!settings?.obsidianVaultPath) {
      setStatus({ ok: false, error: "Not connected" });
      return;
    }
    fetch("/api/jarvis/vault")
      .then((r) => r.json())
      .then(setStatus)
      .catch(() => setStatus({ ok: false, error: "Unable to check vault" }));
  }, [settings?.obsidianVaultPath]);

  async function save(patch: Partial<JarvisSettingsDTO>) {
    const res = await fetch("/api/jarvis/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (!res.ok) throw new Error("Could not save settings");
    setSettings(await res.json());
  }

  function testVoice() {
    const text = "Settings are working, sir. I am ready.";
    const utterance = new SpeechSynthesisUtterance(text);
    const voice = voices.find((v) => v.voiceURI === settings?.voiceURI);
    if (voice) utterance.voice = voice;
    utterance.rate = settings?.rate ?? 1;
    utterance.pitch = settings?.pitch ?? 1;
    utterance.volume = settings?.volume ?? 1;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }

  return (
    <main className="min-h-screen bg-slate-950 p-6">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-6xl flex-col overflow-hidden rounded-2xl border border-cyan-500/20 bg-slate-950 shadow-2xl">
        <header className="flex items-center justify-between border-b border-cyan-500/20 px-5 py-4">
          <div>
            <div className="text-xs uppercase tracking-[0.3em] text-cyan-500">J.A.R.V.I.S</div>
            <h1 className="text-xl font-semibold text-slate-100">Personal AI Assistant</h1>
          </div>
          <button
            type="button"
            aria-label="Open J.A.R.V.I.S settings"
            onClick={() => setSettingsOpen(true)}
            className="rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-300 transition hover:bg-cyan-500/20 focus:outline-none focus:ring-2 focus:ring-cyan-400"
          >
            ⚙ Settings
          </button>
        </header>
        <section className="flex flex-1 items-center justify-center p-10 text-center">
          <div>
            <div className="mx-auto mb-5 flex h-24 w-24 items-center justify-center rounded-full border border-cyan-400/50 bg-cyan-400/5 text-3xl text-cyan-300 shadow-[0_0_60px_rgba(34,211,238,0.12)]">J</div>
            <h2 className="text-2xl font-semibold">Systems online</h2>
            <p className="mt-2 text-sm text-slate-400">Use Settings to configure memory, Ollama, browser voice, and custom TTS.</p>
          </div>
        </section>
      </div>

      {settings && (
        <SettingsDrawer
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          settings={settings}
          vaultStatus={status}
          voices={voices}
          profiles={[] as VoiceProfile[]}
          onSave={save}
          onUploadVoice={async () => {}}
          onDeleteVoice={async () => {}}
          onTestVoice={testVoice}
        />
      )}
    </main>
  );
}