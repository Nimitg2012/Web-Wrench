# Web Wrench

A website monitoring interface for people who do not want to read server logs.

The tutorial and demo store are simulated and labeled. Real websites are saved in `data/monitoring.json` and checked by a scheduler inside the Web Wrench server. Checks continue while the browser is closed and stop when the server stops. Form tests, checkout automation, and email, SMS, and WhatsApp alerts are not connected.

## Run

```bash
npm install
npm run dev
```

Open http://localhost:5173

## AI explanations

Live views call `POST /api/ai/explain` and `POST /api/ai/chat`. The tutorial uses scripted explanations and does not call a model.

Copy `.env.example` to `.env`. The AI provider is Groq at `https://api.groq.com/openai/v1`. Set `GROQ_API_KEY` or `AI_API_KEY` on the server. `AI_BASE_URL` and `AI_MODEL` stay on the server. Do not prefix them with `VITE_`. The default model is `openai/gpt-oss-120b`.

If the key is missing, the panel shows the error and a retry button.

## Safety

The setup check allows public http and https URLs only. It rejects local, private, and metadata addresses, rechecks redirects, and does not return the page body.
