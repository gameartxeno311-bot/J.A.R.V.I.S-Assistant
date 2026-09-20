"use client";

import { useRef, useState } from "react";
import { createPortal } from "react-dom";
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
  const [ollamaStatus, setOllamaStatus] = useState<{ok:boolean;model?:string;models?:string[];error?:string}>({ok:false});
  const fileRef = useRef<HTMLInputElement>(null);

  if (!open || !settings) return null;
  const checkOllama = async () => { const r = await fetch("/api/jarvis/ollama"); const data = await r.json(); setOllamaStatus(data); if (data.ok && data.models?.length && !data.models.includes(ollamaModel)) setOllamaModel(data.models[0]); };

  return (
    <div className="settings-overlay">
      <div className="settings-drawer">
        <div className="settings-header">
          <div><div className="settings-kicker">J.A.R.V.I.S.</div><h2>Settings</h2><p>Configure memory, brain, voice, and local services.</p></div>
          <button onClick={onClose} className="settings-close">×</button>
        </div>

        <section className="settings-section">
          <h3>Obsidian Memory</h3>
          <p className="settings-help">Point Jarvis at your Obsidian vault folder. Every conversation is automatically appended as markdown notes under a “Jarvis” folder inside it.</p>
          <input value={vaultPath} onChange={(e) => setVaultPath(e.target.value)} placeholder="e.g. C:\Users\you\Documents\MyVault" className="settings-input" />
          <div className="settings-row">
            <span className={`text-xs ${vaultStatus?.ok ? "text-emerald-400" : "text-amber-400"}`}>{vaultStatus?.ok ? "● Connected" : `● ${vaultStatus?.error ?? "Not connected"}`}</span>
            <div className="settings-actions">
              <button
                disabled={saving || !vaultPath.trim()}
                onClick={async () => {
                  setSaving(true);
                  try {
                    await onSave({ obsidianVaultPath: vaultPath.trim() });
                    const response = await fetch("/api/jarvis/vault", { method: "POST" });
                    const result = await response.json();
                    if (!response.ok || !result.ok) throw new Error(result.error || "Could not connect to vault");
                  } finally {
                    setSaving(false);
                  }
                }}
                className="settings-button primary"
              >
                Connect &amp; Test
              </button>
              <button
                disabled={saving || !vaultPath.trim()}
                onClick={async () => {
                  setSaving(true);
                  try {
                    await onSave({ obsidianVaultPath: vaultPath.trim() });
                  } finally {
                    setSaving(false);
                  }
                }}
                className="settings-button secondary"
              >
                Save
              </button>
            </div>
          </div>
          <p className="settings-note">
            Example: <code>C:\Users\YourName\Documents\MyVault</code>. J.A.R.V.I.S. will create
            <code className="mx-1 rounded bg-slate-800 px-1">Jarvis/</code> inside the vault and store memory as Markdown.
          </p>
        </section>

        <section className="settings-section">
          <h3>Brain (free &amp; unlimited)</h3>
          <p className="settings-help">Uses Ollama (100% free, local, unlimited) by default. Falls back automatically to OPENAI_API_KEY / ANTHROPIC_API_KEY / GEMINI_API_KEY if set as server env vars.</p>
          <label className="settings-label">Ollama URL</label>
          <input value={ollamaUrl} onChange={(e) => setOllamaUrl(e.target.value)} className="settings-input" />
          <label className="settings-label">Ollama model</label>
          <input value={ollamaModel} onChange={(e) => setOllamaModel(e.target.value)} className="settings-input" />
          <div className="settings-row"><span className={`text-xs ${ollamaStatus.ok ? "text-emerald-400" : "text-amber-400"}`}>{ollamaStatus.ok ? `● Connected • ${ollamaStatus.model || ollamaModel}` : `● ${ollamaStatus.error || "Not tested"}`}</span><div className="settings-actions"><button disabled={saving} onClick={checkOllama} className="settings-button secondary">Test Ollama</button><button disabled={saving} onClick={async () => { setSaving(true); try { await onSave({ ollamaUrl, ollamaModel }); await checkOllama(); } finally { setSaving(false); } }} className="settings-button primary">Save</button></div></div>
        </section>

        <section className="settings-section">
          <h3>Voice</h3>
          <label className="settings-label">System voice</label>
          <select defaultValue={settings.voiceURI ?? ""} onChange={(e) => onSave({ voiceURI: e.target.value })} className="settings-input">
            <option value="">Browser default</option>
            {voices.map((v) => <option key={v.voiceURI} value={v.voiceURI}>{v.name} ({v.lang})</option>)}
          </select>
          <div className="settings-sliders">
            <label className="settings-slider">Rate<input type="range" min={0.5} max={2} step={0.1} defaultValue={settings.rate} onChange={(e) => onSave({ rate: Number(e.target.value) })}/></label>
            <label className="settings-slider">Pitch<input type="range" min={0} max={2} step={0.1} defaultValue={settings.pitch} onChange={(e) => onSave({ pitch: Number(e.target.value) })}/></label>
            <label className="settings-slider">Volume<input type="range" min={0} max={1} step={0.1} defaultValue={settings.volume} onChange={(e) => onSave({ volume: Number(e.target.value) })}/></label>
          </div>
          <button onClick={onTestVoice} className="settings-button secondary wide">🔊 Test voice</button>
          <label className="settings-checkbox"><input type="checkbox" defaultChecked={settings.autoSpeak} onChange={(e) => onSave({ autoSpeak: e.target.checked })}/>Auto-speak Jarvis&apos;s replies</label>
        </section>

        <section className="settings-section">
          <h3>Import Custom Voice</h3>
          <p className="settings-help">Two free, unlimited ways to get a custom voice:</p>
          <ol className="settings-list">
            <li>Install any free SAPI5/OS voice pack — it shows up automatically in the “System voice” list above.</li>
            <li>Run a local open-source voice-cloning server (Piper / Coqui TTS / RVC — see <code className="rounded bg-slate-800 px-1">tools/custom-voice-server</code>) and point “Custom TTS Server URL” at it.</li>
          </ol>
          <label className="settings-label">Custom TTS Server URL</label>
          <input value={customTtsUrl} onChange={(e) => setCustomTtsUrl(e.target.value)} placeholder="http://127.0.0.1:5002/speak" className="settings-input" />
          <button disabled={saving} onClick={async () => { setSaving(true); await onSave({ customTtsUrl }); setSaving(false); }} className="settings-button primary">Save server URL</button>
          <div className="settings-stack">
            <input value={voiceName} onChange={(e) => setVoiceName(e.target.value)} placeholder="Voice sample name (e.g. My Voice)" className="settings-input" />
            <input ref={fileRef} type="file" accept="audio/*" className="settings-file" />
            <button onClick={async () => { const file=fileRef.current?.files?.[0]; if (!file) return; await onUploadVoice(file, voiceName || file.name); if (fileRef.current) fileRef.current.value=""; setVoiceName(""); }} className="settings-button secondary wide">Upload sample</button>
          </div>
          <select value={settings.activeVoiceProfileId ?? ""} onChange={(e) => onSave({ activeVoiceProfileId: e.target.value })} className="settings-input">
            <option value="">Use server default reference voice</option>
            {profiles.map((p) => <option key={p.id} value={p.id}>XTTS: {p.name}</option>)}
          </select>
          <p className="settings-note">When a profile is selected, the Coqui XTTS-v2 server uses that uploaded sample for voice cloning.</p>
          <ul className="voice-list">
            {profiles.map((p) => <li key={p.id} className="voice-profile"><div><p className="voice-name">{p.name}</p><audio controls src={p.filePath} className="voice-audio"/></div><button onClick={() => onDeleteVoice(p.id)} className="delete-voice">Delete</button></li>)}
            {profiles.length === 0 && <li className="settings-empty">No custom voice samples yet.</li>}
          </ul>
        </section>
      </div>
    </div>
  );
}