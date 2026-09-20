import {
  boolean,
  pgTable,
  real,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

export const jarvisMessages = pgTable("jarvis_messages", {
  id: serial("id").primaryKey(),
  role: varchar("role", { length: 20 }).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const jarvisSettings = pgTable("jarvis_settings", {
  id: serial("id").primaryKey(),
  obsidianVaultPath: text("obsidian_vault_path").default(""),
  autoSpeak: boolean("auto_speak").notNull().default(true),
  voiceURI: text("voice_uri").default(""),
  rate: real("rate").notNull().default(1),
  pitch: real("pitch").notNull().default(1),
  volume: real("volume").notNull().default(1),
  customTtsUrl: text("custom_tts_url").default(""),
  activeVoiceProfileId: text("active_voice_profile_id").default(""),
  ollamaUrl: text("ollama_url").default("http://127.0.0.1:11434"),
  ollamaModel: text("ollama_model").default("llama3.1"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const voiceProfiles = pgTable("voice_profiles", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  fileName: text("file_name").notNull(),
  filePath: text("file_path").notNull(),
  mimeType: text("mime_type").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});