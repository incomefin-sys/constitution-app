# Konstitucija — LR Constitution Quiz App

Mobile-first React app for studying the Lithuanian Constitution and legal terms.

## Features

- **Тесты / Testai** — Quiz mode with 20 / 50 / 100 random questions
- **Термины / Terminai** — Vocabulary flashcards (LT→RU and RU→LT)
- **Статистика / Statistika** — Progress tracking, bar chart, weak-spot analysis
- Language toggle (RU ↔ LT) for all UI labels
- Full offline support — no backend required
- Stats persist in localStorage

## Local development

```bash
npm install
npm run dev
```

## Deploy to Vercel

1. Push this folder to a GitHub repo
2. Go to [vercel.com](https://vercel.com) → **Add New Project**
3. Import the repo — Vercel auto-detects Vite
4. Click **Deploy** — done!

The `vercel.json` handles SPA client-side routing automatically.

## Data

- `src/data/questions.json` — 214 Lithuanian constitution questions
- `src/data/glossary.json` — 400+ legal terms (LT term + RU definition)

Questions are in Lithuanian only. The language toggle applies to UI text.
For terms: Mode A = Lithuanian prompt → choose Russian; Mode B = Russian prompt → choose Lithuanian.
