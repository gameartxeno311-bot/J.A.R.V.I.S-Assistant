"use client";

import { useRef, useState } from "react";
import type { JarvisSettingsDTO, VaultStatus, VoiceProfile } from "@/lib/jarvis/types";

type Props = {
  open: boolean;
  onClose: () => void;
  settings: JarvisSettingsDTO | null;
  vaultStatus: VaultStatus | null;
  voices: SpeechSynthesisVoice[];
  profiles: VoiceProfile[];
  onSave: (patch: Partial<JarvisSettingsDTO>) => Promise<void>;
  onUploadVoice: (file: File, name: string) => Promise<void>;
  onDeleteVoice: (id: number) => Promise<void>;
  onTestVoice: () => void;
};

export function SettingsDrawer({
  open,
  onClose,
  settings,
  vaultStatus,
  voices,
  profiles,
  onSave,
  onUploadVoice,
  onDeleteVoice,
  onTestVoice,
}: Props) {
  const [vaultPath, setVaultPath] = useState(settings?.obsidianVaultPath ?? "");
  const [customTtsUrl, setCustomTtsUrl] = useState(settings?.customTtsUrl ?? "");
  const [ollamaUrl, setOllamaUrl] = useState(settings?.ollamaUrl ?? "http://127.0.0.1:11434");
  const [ollamaModel, setOllamaModel] = useState(settings?.ollamaModel ?? "llama3.1");
  const [voiceName, setVoiceName] = useState("");
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  if (!open || !settings) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
      <div className="h-full w-full max-w-md overflow-y-auto border-l border-cyan-500/30 bg-slate-950 p-6 text-slate-100 shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-wide text-cyan-300">Jarvis Settings</h2>
          <button onClick={onClose} className="rounded-full bg-slate-800 px-3 py-1 text-sm text-slate-300 hover:bg-slate-700">Close</button>
        </div>

        <section className="mb-8">
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-cyan-400">Obsidian Memory</h3>
          <p className="mb-2 text-xs text-slate-400">Point Jarvis at your Obsidian vault folder. Every conversation is automatically appended as markdown notes under a “Jarvis” folder inside it.</p>
          <input value={vaultPath} onChange={(e) => setVaultPath(e.target.value)} placeholder="e.g. C:\Users\you\Documents\MyVault" className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-cyan-500" />
          <div className="mt-2 flex items-center justify-between">
            <span className={`text-xs ${vaultStatus?.ok ? "text-emerald-400" : "text-amber-400"}`}>{vaultStatus?.ok ? "● Connected" : `● ${vaultStatus?.error ?? "Not connected"}`}</span>
            <button disabled={saving} onClick={async () => { setSaving(true); await onSave({ obsidianVaultPath: vaultPath }); setSaving(false); }} className="rounded-lg bg-cyan-600 px-3 py-1 text-xs font-medium text-white hover:bg-cyan-500 disabled:opacity-50">Save</button>
          </div>
        </section>

        <section className="mb-8">
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-cyan-400">Brain (free &amp; unlimited)</h3>
          <p className="mb-2 text-xs text-slate-400">Uses Ollama (100% free, local, unlimited) by default. Falls back automatically to OPENAI_API_KEY / ANTHROPIC_API_KEY / GEMINI_API_KEY if set as server env vars.</p>
          <label className="mb-1 block text-xs text-slate-400">Ollama URL</label>
          <input value={ollamaUrl} onChange={(e) => setOllamaUrl(e.target.value)} className="mb-2 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-cyan-500" />
          <label className="mb-1 block text-xs text-slate-400">Ollama model</label>
          <input value={ollamaModel} onChange={(e) => setOllamaModel(e.target.value)} className="mb-2 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-cyan-500" />
          <button disabled={saving} onClick={async () => { setSaving(true); await onSave({ ollamaUrl, ollamaModel }); setSaving(false); }} className="rounded-lg bg-cyan-600 px-3 py-1 text-xs font-medium text-white hover:bg-cyan-500 disabled:opacity-50">Save</button>
        </section>

        <section className="mb-8">
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-cyan-400">Voice</h3>
          <label className="mb-1 block text-xs text-slate-400">System voice</label>
          <select defaultValue={settings.voiceURI ?? ""} onChange={(e) => onSave({ voiceURI: e.target.value })} className="mb-3 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-cyan-500">
            <option value="">Browser default</option>
            {voices.map((v) => <option key={v.voiceURI} value={v.voiceURI}>{v.name} ({v.lang})</option>)}
          </select>
          <div className="mb-3 grid grid-cols-3 gap-2 text-xs">
            <label className="flex flex-col gap-1">Rate<input type="range" min={0.5} max={2} step={0.1} defaultValue={settings.rate} onChange={(e) => onSave({ rate: Number(e.target.value) })}/></label>
            <label className="flex flex-col gap-1">Pitch<input type="range" min={0} max={2} step={0.1} defaultValue={settings.pitch} onChange={(e) => onSave({ pitch: Number(e.target.value) })}/></label>
            <label className="flex flex-col gap-1">Volume<input type="range" min={0} max={1} step={0.1} defaultValue={settings.volume} onChange={(e) => onSave({ volume: Number(e.target.value) })}/></label>
          </div>
          <button onClick={onTestVoice} className="mb-4 w-full rounded-lg bg-slate-800 px-3 py-2 text-xs font-medium text-cyan-300 hover:bg-slate-700">🔊 Test voice</button>
          <label className="flex items-center gap-2 text-xs text-slate-300"><input type="checkbox" defaultChecked={settings.autoSpeak} onChange={(e) => onSave({ autoSpeak: e.target.checked })}/>Auto-speak Jarvis&apos;s replies</label>
        </section>

        <section className="mb-8">
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-cyan-400">Import Custom Voice</h3>
          <p className="mb-2 text-xs text-slate-400">Two free, unlimited ways to get a custom voice:</p>
          <ol className="mb-3 list-decimal space-y-1 pl-4 text-xs text-slate-400">
            <li>Install any free SAPI5/OS voice pack — it shows up automatically in the “System voice” list above.</li>
            <li>Run a local open-source voice-cloning server (Piper / Coqui TTS / RVC — see <code className="rounded bg-slate-800 px-1">tools/custom-voice-server</code>) and point “Custom TTS Server URL” at it.</li>
          </ol>
          <label className="mb-1 block text-xs text-slate-400">Custom TTS Server URL</label>
          <input value={customTtsUrl} onChange={(e) => setCustomTtsUrl(e.target.value)} placeholder="http://127.0.0.1:5002/speak" className="mb-2 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-cyan-500" />
          <button disabled={saving} onClick={async () => { setSaving(true); await onSave({ customTtsUrl }); setSaving(false); }} className="mb-4 rounded-lg bg-cyan-600 px-3 py-1 text-xs font-medium text-white hover:bg-cyan-500 disabled:opacity-50">Save server URL</button>
          <div className="mb-3 space-y-2">
            <input value={voiceName} onChange={(e) => setVoiceName(e.target.value)} placeholder="Voice sample name (e.g. My Voice)" className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-cyan-500" />
            <input ref={fileRef} type="file" accept="audio/*" className="w-full text-xs" />
            <button onClick={async () => { const file=fileRef.current?.files?.[0]; if (!file) return; await onUploadVoice(file, voiceName || file.name); if (fileRef.current) fileRef.current.value=""; setVoiceName(""); }} className="w-full rounded-lg bg-slate-800 px-3 py-2 text-xs font-medium text-cyan-300 hover:bg-slate-700">Upload sample</button>
          </div>
          <ul className="space-y-2">
            {profiles.map((p) => <li key={p.id} className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs"><div><p className="font-medium text-slate-200">{p.name}</p><audio controls src={p.filePath} className="mt-1 h-7 w-40"/></div><button onClick={() => onDeleteVoice(p.id)} className="text-rose-400 hover:text-rose-300">Delete</button></li>)}
            {profiles.length === 0 && <li className="text-xs text-slate-500">No custom voice samples yet.</li>}
          </ul>
        </section>
      </div>
    </div>
  );
}