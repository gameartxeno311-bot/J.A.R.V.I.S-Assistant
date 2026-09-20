import os, tempfile
from flask import Flask, jsonify, request, send_file
from TTS.api import TTS

app = Flask(__name__)
MODEL = os.getenv("TTS_MODEL", "tts_models/multilingual/multi-dataset/xtts_v2")
REFERENCE_VOICE = os.getenv("REFERENCE_VOICE", os.path.join(os.path.dirname(__file__), "reference_voice.wav"))
LANGUAGE = os.getenv("TTS_LANGUAGE", "en")
tts = None

def get_tts():
    global tts
    if tts is None: tts = TTS(MODEL)
    return tts

@app.get("/health")
def health():
    return jsonify({"ok": True, "referenceVoice": os.path.isfile(REFERENCE_VOICE)})

@app.post("/speak")
def speak():
    data = request.get_json(silent=True) or {}
    text = str(data.get("text", "")).strip()
    if not text: return jsonify({"error": "text is required"}), 400
    if not os.path.isfile(REFERENCE_VOICE): return jsonify({"error": "Reference voice not found"}), 400
    fd, output = tempfile.mkstemp(suffix=".wav"); os.close(fd)
    try:
        get_tts().tts_to_file(text=text, speaker_wav=REFERENCE_VOICE, language=LANGUAGE, file_path=output)
        return send_file(output, mimetype="audio/wav")
    finally:
        try: os.unlink(output)
        except OSError: pass

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=int(os.getenv("PORT", "5002")), debug=False)
