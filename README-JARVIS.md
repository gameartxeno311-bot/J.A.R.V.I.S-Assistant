# J.A.R.V.I.S — Personal AI Assistant

A Jarvis-style assistant focused on **making money effectively** and **writing
great code**, with a voice module, custom voice import, and automatic memory
sync to **Obsidian** — built entirely on free, unlimited tools.

## Run it

Double-click **`start-jarvis.bat`** (Windows). It will:

1. Check for Node.js
2. Create a default `.env` if missing
3. `npm install` if `node_modules` is missing
4. `npx drizzle-kit push` to sync the database schema
5. `npm run build` then `npm run start`
6. Open your browser at http://localhost:3000

For fast iteration during development use `start-jarvis-dev.bat` instead
(hot-reload, no production build).

> Requires a local PostgreSQL instance reachable at the `DATABASE_URL` in
> `.env` (defaults to `postgresql://postgres:postgres@127.0.0.1:5432/app_db`).

## The "brain" (LLM) — free & unlimited

Jarvis tries providers in this order:

1. `OPENAI_API_KEY` (if set as an environment variable)
2. `ANTHROPIC_API_KEY`
3. `GEMINI_API_KEY`
4. **Ollama** — free, open-source, unlimited, runs 100% locally.

For the fully free/unlimited path, install [Ollama](https://ollama.com), then:

```bash
ollama pull llama3.1        # or qwen2.5-coder for an extra coding boost
ollama serve
```

Jarvis auto-detects Ollama at `http://127.0.0.1:11434` (editable in the
Settings drawer inside the app).

## Voice module — free & unlimited

- **Speaking replies**: uses the browser's built-in **Web Speech API**
  (`speechSynthesis`) — no API key, no character limits, works offline.
- **Voice dictation** (🎙 button): uses `SpeechRecognition`, same deal.
- **Custom voice import**, two free options:
  1. Install any free SAPI5/OS voice pack on your computer — it shows up
     automatically in Settings → System voice.
  2. Run the included local voice-cloning server
     (`tools/custom-voice-server`) built on **Coqui TTS (XTTS-v2)**, which
     clones a voice from a short reference clip you upload. Start it with
     `tools/custom-voice-server/start-voice-server.bat`, then set
     **Custom TTS Server URL** to `http://127.0.0.1:5002/speak` in Jarvis
     Settings. Upload your sample under Settings → Import Custom Voice; also
     copy the saved file from `public/voice-samples/` to
     `tools/custom-voice-server/reference_voice.wav` (or set the
     `REFERENCE_VOICE` env var when launching the server).

## Obsidian memory — automatic, free & unlimited

Obsidian vaults are just folders of markdown files, so no plugin or paid API
is needed:

1. Open Jarvis → Settings → paste the full path to your Obsidian vault
   folder (e.g. `C:\Users\you\Documents\MyVault`).
2. Jarvis creates a `Jarvis/` folder inside it and appends every exchange to
   a daily note (`Jarvis/2026-01-01.md`) plus a `Jarvis/Memory Index.md`.
3. On every new message, Jarvis searches those notes for relevant context
   and feeds it back into the conversation automatically — real long-term
   memory, fully under your control, viewable/editable in Obsidian itself.

## Tech stack

- Next.js App Router + Tailwind
- PostgreSQL via Drizzle ORM (chat history, settings, voice profile metadata)
- Web Speech API for TTS/STT (browser-native, free, unlimited)
- Optional local Coqui XTTS-v2 server for real custom voice cloning
- Node `fs` for direct, automatic Obsidian vault read/write
