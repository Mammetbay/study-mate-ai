# StudyMate AI — Setup & Rebrand Guide

This guide covers installing the app, configuring an AI provider, and rebranding
it as your own product. No backend or account system is required — StudyMate AI
runs entirely on the device.

---

## 1. Prerequisites

- **Node.js** 18+ and npm
- **Expo** — no global install needed; the project uses `npx expo`
- A device or emulator:
  - iOS: Xcode Simulator (macOS) or the **Expo Go** app
  - Android: Android Studio emulator or the **Expo Go** app

## 2. Install & Run

```bash
npm install
npx expo start
```

Then in the Expo CLI output:

- press **i** — open iOS simulator
- press **a** — open Android emulator
- or scan the QR code with **Expo Go** on a physical device

Type-check after any change:

```bash
npx tsc --noEmit
```

## 3. Configure an AI Provider

There is **no `.env` key to set**. Keys are entered at runtime, per user:

1. Launch the app and complete the 3-slide onboarding.
2. Go to **Settings → AI Provider**.
3. Choose a provider: **Groq**, **OpenAI**, **Google Gemini**, or **OpenRouter**.
4. Paste your **API key** (stored on-device only, never uploaded or committed).
5. Pick a model for each capability:
   - **STT** — audio transcription
   - **Vision** — photo OCR
   - **Chat** — summary, quiz, flashcards, note tags/title

Model lists are fetched **live** from the provider's API — nothing is hardcoded.

### Where to get a key

| Provider | Get a key | Notes |
|---|---|---|
| Groq | https://console.groq.com/keys | Free tier, no credit card |
| OpenAI | https://platform.openai.com/api-keys | Paid |
| Google Gemini | https://aistudio.google.com/app/apikey | Free tier available |
| OpenRouter | https://openrouter.ai/keys | Public model list |

> **Tip:** A single provider that supports all three capabilities (e.g. one that
> offers STT + vision + chat models) gives the smoothest experience. If your
> provider lacks a capability, that feature is disabled until a suitable model
> is selected.

## 4. Customization & Configuration

Everything a developer or contributor typically customizes lives in a few places:

| What | Where |
|---|---|
| App name / slug / version | `app.json` |
| Theme colors, spacing, radius | `lib/theme.ts` (values from `DESIGN.md`) |
| App icon / splash | `assets/` (see `app.json` references) |
| UI text (all strings) | `locales/tr.json`, `locales/en.json` — never hardcode text |
| Supported languages | `config/languages.ts` (single source of truth) |
| About links (privacy, terms, support email) | `config/about.ts` |
| AI providers shown | `config/providers.ts` |

### Update the About links

Open `config/about.ts` and replace the placeholder values:

```ts
export const ABOUT_LINKS = {
  privacyPolicyUrl: 'https://your-domain.com/privacy',
  termsOfServiceUrl: 'https://your-domain.com/terms',
  supportEmail: 'support@your-domain.com',
};
```

### Add or change a language

1. Add the code to `SUPPORTED_LANGUAGES` and a label in `LANGUAGE_LABELS`
   (`config/languages.ts`).
2. Create the matching `locales/<code>.json` with all keys translated.

## 5. Data & Storage

- All notes, quizzes, and flashcards are stored locally in **SQLite**
  (`lib/db.ts`) with versioned migrations (`PRAGMA user_version`, currently v4).
- Settings (language, theme, provider keys, weekly goal) persist via
  `AsyncStorage` (`lib/AppContext.tsx`).
- **Settings → Clear All Notes** wipes notes, quizzes, and flashcards.
- No data leaves the device except the AI API calls you configure.

## 6. Build for Release

Use EAS Build (recommended by Expo):

```bash
npm install -g eas-cli
eas build --platform ios
eas build --platform android
```

See the [Expo build docs](https://docs.expo.dev/build/introduction/) for signing
and store submission.

## 7. Troubleshooting

| Symptom | Fix |
|---|---|
| AI actions do nothing | Check Settings — provider key + a model per capability must be set |
| Recording is silent (iOS) | Grant microphone permission; the app sets the audio mode before recording |
| Model list is empty | Verify the API key is valid; for OpenRouter the list is public |
| Type errors | Run `npx tsc --noEmit` and resolve reported issues |

---

For the full feature scope and architecture, see
[`studymate-ai-scope.md`](./studymate-ai-scope.md) (the project's source of truth).
