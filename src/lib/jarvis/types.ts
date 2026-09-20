export type Role = "user" | "assistant" | "system";

export type JarvisMessage = {
  id?: number;
  role: Role;
  content: string;
  createdAt?: string;
};

export type VaultStatus = { ok: boolean; error?: string };

export type JarvisSettingsDTO = {
  id: number;
  obsidianVaultPath: string | null;
  autoSpeak: boolean;
  voiceURI: string | null;
  rate: number;
  pitch: number;
  volume: number;
  customTtsUrl: string | null;
  activeVoiceProfileId: string | null;
  ollamaUrl: string | null;
  ollamaModel: string | null;
};

export type VoiceProfile = {
  id: number;
  name: string;
  fileName: string;
  filePath: string;
  mimeType: string;
  createdAt: string;
};