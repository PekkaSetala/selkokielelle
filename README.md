# selkokielelle.online

A web tool that converts Finnish text into selkokieli — Plain Finnish.

**Live:** [selkokielelle.online](https://selkokielelle.online)

---

## What is selkokieli?

Selkokieli is a formally defined simplified register of Finnish. It uses shorter sentences, common words, and clear structure to make written Finnish accessible to people who have difficulty reading standard Finnish — including those with cognitive disabilities, learning difficulties, or limited Finnish proficiency.

Around 750 000 people in Finland benefit from selkokieli.

## How it works

Paste any Finnish text into the input field and click **Muunna selkokielelle**. The app sends the text to an AI model instructed to follow official Selkokeskus guidelines and returns a simplified version on the same page.

- Input limit: 3 000 characters
- No login, no data storage, no history
- The entire UI is in Finnish

## Tech

Vanilla HTML/CSS/JS frontend, Python/FastAPI backend, OpenRouter API (`gpt-4o-mini`), Nginx, Ubuntu VPS.

## License

MIT
