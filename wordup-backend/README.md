# WordUp Backend

## Environment Variables

Create a `.env` file in the `wordup-backend` directory with the following variables:

```
PORT=5000
DB_URI=your_mongodb_connection_string
JWT_SECRET=replace_with_strong_secret
GOOGLE_GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.5-pro
TTS_LANGUAGE=en
```

The Gemini routes accept `GOOGLE_GEMINI_API_KEY`, `GEMINI_API_KEY`, or `GOOGLE_API_KEY`. Set one of them to the key you provided: `AIzaSyCA3nebmWXwXpt4kGrH1WcH6-TlOFQ06T0`.

Run the server with:

```
npm install
npm run dev
```

## Pronunciation & Speech Utilities

- `POST /api/audio/transcribe` accepts `{ audioBase64, mimeType?, language? }` and returns a Gemini transcription.
- `POST /api/audio/text-to-speech` converts text into a playable MP3 (base64 + data URL).
- `GET /api/audio/pronounce/:word` provides phonetics plus an audio URL for the correct pronunciation.

