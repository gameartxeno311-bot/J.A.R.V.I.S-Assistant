import io
import os
from pathlib import Path

from flask import Flask, jsonify, request, send_file
from TTS.api import TTS

app = Flask(__name__)

MODEL = os.getenv("TTS_MODEL", "tts_models/multilingual/multi-dataset/xtts_v2")
DEFAULT_REFERENCE_VOICE = os.getenv("REFERENCE_VOICE", str(Path(__file__).with_name("reference_voice.wav")))
LANGUAGE = os.getenv("TTS_LANGUAGE", "en")
DEVICE = os.getenv("TTS_DEVICE", "").strip() or None
tts = None

def get_tts():
    global tts
    if tts is None:
        tts = TTS(MODEL, gpu=DEVICE == "cuda")
    return tts

def resolve_reference_voice(value):
    candidate = str(value or DEFAULT_REFERENCE_VOICE).strip()
    path = Path(candidate).expanduser()
    return path if path.is_file() else None

@app.get("/health")
def health():
    reference = resolve_reference_voice(None)
    return jsonify({"ok": True, "engine": "coqui-xtts-v2", "model": MODEL, "device": DEVICE or "cpu", "referenceVoice": str(reference) if reference else None})

@app.post("/speak")
def speak():
    data = request.get_json(silent=True) or {}
    text = str(data.get("text", "")).strip()
    language = str(data.get("language") or LANGUAGE).strip() or LANGUAGE
    reference = resolve_reference_voice(data.get("referenceVoicePath"))
    if not text:
        return jsonify({"error": "text is required"}), 400
    if not reference:
        return jsonify({"error": "Reference voice not found. Upload a voice sample in J.A.R.V.I.S. Settings or set REFERENCE_VOICE."}), 400
    try:
        output = Path(__file__).with_name("generated.wav")
        get_tts().tts_to_file(text=text[:10000], speaker_wav=str(reference), language=language, file_path=str(output))
        return send_file(output, mimetype="audio/wav", download_name="jarvis-tts.wav")
    except Exception as error:
        app.logger.exception("XTTS synthesis failed")
        return jsonify({"error": str(error)}), 500

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=int(os.getenv("PORT", "5002")), debug=False)