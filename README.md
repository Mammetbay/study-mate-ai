# StudyMate AI 📚

An AI-powered study companion built with **React Native + Expo**. Record a
lecture or snap a photo of your notes, and StudyMate AI automatically produces a
**transcript, summary, multiple-choice quiz, and flashcards** — all stored
locally on the device.

This is a **client-only, sellable code template** (no backend, no accounts, no
billing). The buyer plugs in their own AI provider key, rebrands it, and ships.

---

## ✨ Features

- 🎙️ **Audio lectures** — record with `expo-audio`, auto-transcribe (STT model)
- 📷 **Photo notes** — capture/upload a photo, extract text via OCR (vision model)
- 📝 **Auto summary** — concise summary of each note (chat model)
- ❓ **Auto quiz** — generated multiple-choice questions with scoring
- 🃏 **Flashcards** — flip cards with **spaced repetition** (SM-2-lite)
- 🏷️ **Smart tags** — AI labels each note with 1–5 keywords for filtering
- 🔎 **Search & filter** — notes by title, quizzes by name, notes by tag
- 📊 **Home dashboard** — streak, total notes, editable weekly goal, recent notes
- 🌐 **i18n** — Turkish & English, fully translated (`config/languages.ts`)
- 🌗 **Light / dark theme**
- 🔌 **Multi-provider AI** — Groq, OpenAI, Google Gemini, OpenRouter (adapter based)

## 🧱 Tech Stack

| Layer | Choice |
|---|---|
| Framework | React Native + Expo + Expo Router |
| Language | TypeScript (strict) |
| State | Context API (no Redux/Zustand) |
| Local data | `expo-sqlite` (versioned migrations) |
| Styling | `StyleSheet` + `lib/theme.ts` (no Tailwind/NativeWind) |
| i18n | `react-i18next` |
| Audio | `expo-audio` (not the legacy `expo-av`) |
| AI | Adapter architecture — `lib/ai/` + `config/providers.ts` |

## 🚀 Get Started

```bash
npm install
npx expo start        # then press i (iOS), a (Android), or scan the QR in Expo Go
```

```bash
npx expo start --ios
npx expo start --android
npx tsc --noEmit      # typecheck
```

> First launch shows a 3-slide onboarding. To use AI features, open
> **Settings → AI Provider**, pick a provider, paste your API key, and choose a
> model per capability (STT / Vision / Chat).

## 🔑 API Keys

No `.env` key is required. Each user enters their own provider key inside the app
(**Settings**) and it is stored on-device via `AsyncStorage` — **never hardcoded**.

Get a key from your chosen provider:

- **Groq** — https://console.groq.com/keys (free tier, no card)
- **OpenAI** — https://platform.openai.com/api-keys
- **Google Gemini** — https://aistudio.google.com/app/apikey
- **OpenRouter** — https://openrouter.ai/keys (model list is public)

Model lists are fetched **live** from each provider's API at runtime — nothing is
hardcoded. See [`docs/SETUP.md`](docs/SETUP.md) for the full setup & rebrand guide.

## 📁 Project Structure

```
app/            # Expo Router screens (tabs, create-note, note, quiz, flashcard, weekly-goal)
components/     # ui/ (Button, Input, Card…) + study/ (AudioPlayerCard)
lib/            # ai/ (service, providers, prompts), db.ts, spacedRepetition.ts, theme.ts, AppContext.tsx
config/         # languages.ts, providers.ts, about.ts (single sources of truth)
locales/        # tr.json, en.json
types/          # index.ts (Note, QuizQuestion, Flashcard), ai.ts
docs/           # studymate-ai-scope.md (source of truth), SETUP.md
```

## 📖 Documentation

- [`docs/SETUP.md`](docs/SETUP.md) — install, configure & rebrand guide
- [`docs/studymate-ai-scope.md`](docs/studymate-ai-scope.md) — full scope & architecture (source of truth)
- [`AGENTS.md`](AGENTS.md) — conventions for AI coding agents

## 📄 License

Sold as a code template. See your marketplace purchase terms for usage rights.
