# Contributing to StudyMate AI 🎓✨

Thank you for your interest in contributing to **StudyMate AI**! As an open-source, student-focused project, we welcome contributions of all shapes and sizes: bug fixes, new features, translations, documentation improvements, and UI polish.

---

## 🛠️ Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- [Expo Go](https://expo.dev/go) on your iOS/Android physical device, or an iOS Simulator / Android Emulator.

### Setup Repository
1. **Fork** the repository on GitHub.
2. **Clone** your fork locally:
   ```bash
   git clone https://github.com/<your-username>/studymate-ai.git
   cd studymate-ai
   ```
3. **Install dependencies**:
   ```bash
   npm install
   ```
4. **Start the development server**:
   ```bash
   npx expo start
   ```

---

## 🏗️ Architecture & Conventions

- **Framework**: React Native with Expo and Expo Router (SDK 54).
- **Type Safety**: TypeScript in strict mode. All PRs must pass `npx tsc --noEmit` without errors.
- **State Management**: React Context API (`lib/AppContext.tsx`). Please do **not** introduce external state libraries (Redux, MobX, Zustand).
- **Styling**: Standard React Native `StyleSheet` + design tokens from `lib/theme.ts`. We adhere to the rules in `DESIGN.md`.
- **Database**: `expo-sqlite` with versioned migrations in `lib/db.ts`. Keep migrations idempotent.
- **Localization (i18n)**: All UI strings must use `react-i18next`. Supported languages are centralized in `config/languages.ts`.

---

## 💡 Ways to Contribute

### 1. Adding a New Language
1. Add your language code to `config/languages.ts`:
   ```typescript
   export const SUPPORTED_LANGUAGES = ['tr', 'en', 'es'] as const;
   ```
2. Create `locales/<lang-code>.json` by duplicating `locales/en.json` and translating the keys.
3. Test language switching in the Settings tab.

### 2. Adding a New AI Provider
1. Define the provider metadata in `config/providers.ts`.
2. Implement the `AIProvider` interface (`types/ai.ts`) under `lib/ai/providers/`.
3. Wire the provider in `lib/ai/providers/index.ts`.

### 3. Improving Study Tools
- Suggest or build new spaced repetition algorithms (e.g. FSRS, Anki SM-2 enhancements).
- Improve quiz question generation prompt engineering in `lib/ai/prompts.ts`.
- Enhance lecture audio recording waveforms or note tagging.

---

## 🧪 Testing Your Changes

Before submitting your Pull Request, verify:
```bash
# Verify TypeScript strict typechecking
npx tsc --noEmit

# Run linting
npm run lint
```

---

## 🚀 Submitting a Pull Request (PR)

1. Create a feature branch from `main`:
   ```bash
   git checkout -b feature/my-awesome-improvement
   ```
2. Commit with concise, descriptive commit messages:
   ```bash
   git commit -m "Add Spanish translation for flashcard screen"
   ```
3. Push to your fork:
   ```bash
   git push origin feature/my-awesome-improvement
   ```
4. Open a Pull Request against `Mammetbay/study-mate-ai` `master` branch.
5. Fill out the PR template with clear context and screenshots if UI changes are involved.

---

## 💬 Community & Questions

Feel free to open an Issue or start a Discussion on GitHub if you have any questions or ideas. Thank you for helping students learn better with AI! 🌟
