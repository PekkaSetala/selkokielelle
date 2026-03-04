# selkokielelle.online

A web tool that converts Finnish text into selkokieli — Plain Finnish.

**Live:** [selkokielelle.online](https://selkokielelle.online)

---

## What is selkokieli?

Selkokieli is a formally defined simplified register of Finnish. It uses shorter sentences, common words, and clear structure to make written Finnish accessible to people who have difficulty reading standard Finnish — including those with cognitive disabilities, learning difficulties, or limited Finnish proficiency.

Around 750 000 people in Finland benefit from selkokieli.

## How it works

Paste any Finnish text into the input field and click **Muunna selkokielelle**. The app sends the text to an AI model instructed to follow official Selkokeskus guidelines and returns a simplified version on the same page.

- Input limit: 5 000 characters
- No login, no data storage, no history
- The entire UI is in Finnish

## Tech

Vanilla HTML/CSS/JS frontend, Python/FastAPI backend, OpenRouter API (`gpt-4o-mini`), Nginx, Ubuntu VPS.

## Running locally

```bash
cd backend
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # add your OPENROUTER_API_KEY
uvicorn main:app --reload
```

Serve `frontend/` with any static file server (e.g. `python3 -m http.server 3000`) and set `API_URL` in `index.html` to `http://localhost:8000/api/translate`.

## Changelog

### v1.2 — 2026-03-04
- Increased input limit from 3 000 to 5 000 characters with live counter
- Redesigned UI (v2 visual design)
- Added Tyhjennä (clear) button
- Added tietosuoja (privacy) page
- Improved system prompt for better slang handling and Plain Finnish output quality

### v1.0
- Initial release

## License

MIT
