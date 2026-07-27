@AGENTS.md

# Claude Code - Ek Notlar

## Gelistirici
- **Mammetbay** — projenin sahibi ve tek gelistiricisi.

## Proje Durumu (2026-07-27)
Phase 1-4 tamamlandi. Mevcut durumda calisan ozellikler:
- Onboarding (3 slide)
- Home Dashboard (streak, total notes, weekly goal, recent notes) — gercek DB verisine bagli (mock degil); haftalik hedef karti dokunulabilir → `app/weekly-goal.tsx` (kalici, AppContext)
- Notes listesi + arama (sadece baslik) + AI etiket filtresi (cip) + olusturma (ses kaydi + fotograf/OCR + dosya); kartta ozet varsa ozet, yoksa transkript onizlemesi
- Not olusturma: baslik opsiyonel (bos ise AI oto-isim verir, basarisizsa tarih bazli fallback); AI notu 1-5 etiket ile isaretler; Files butonu expo-document-picker ile
- Not detay (kaynak medya: fotoğraf önizleme / ses oynatma; transcript, summary, Generate Quiz/Flashcards CTA)
- Quiz listesi + quiz adina gore arama; Quiz player (A-D siklar, progress, dogru/yanlis gosterimi)
- Flashcard modu (flip, known/missed) + Spaced Repetition (SM-2-lite, `lib/spacedRepetition.ts`, dueDate ile siralama, kalici)
- Settings (dil, tema, API key, about linkleri Linking ile calisir — `config/about.ts`, Clear All Notes calisir)
- i18n (TR/EN) tamamen entegre
- Coklu AI saglayici mimarisi (Groq, OpenAI, Gemini, OpenRouter) — adapter tabanli, model listesi runtime'da API'den cekilir

## Calisma Kurallari
- Yeni gelistirmelerin yaninda **refactoring** da yapilacak — Mammetbay onay verecek
- Her degisiklikten once ilgili dosyalari oku, anla, sonra degistir
- Tasarim referanslari: `assets/design-reference/*.png` — UI kodlarken bunlari kontrol et
- `memory.md` dosyasini onemli degisikliklerden sonra guncelle

## Onemli Dosya Yollari
| Dosya | Aciklama |
|---|---|
| `app/(tabs)/` | Ana tab ekranlari (index, notes, quiz, settings) |
| `app/(onboarding)/` | Onboarding akisi |
| `app/create-note.tsx` | Not olusturma (ses + fotograf); AI oto-baslik + etiket (`generateNoteMetadata`) |
| `app/weekly-goal.tsx` | Haftalik hedef duzenleme ekrani (stepper, AppContext.weeklyGoal) |
| `app/note/[id].tsx` | Not detay sayfasi (foto onizleme + ses oynatma) |
| `components/study/AudioPlayerCard.tsx` | Not detay ses oynatma karti (expo-audio) |
| `app/quiz/[id].tsx` | Quiz player |
| `app/flashcard/[id].tsx` | Flashcard player (spaced repetition ile) |
| `lib/spacedRepetition.ts` | SM-2-lite spaced repetition zamanlayici (schedule, initialSRState, isDue) |
| `lib/ai/service.ts` | Saglayicidan bagimsiz AI islemleri (transcribe, OCR, summarize, quiz, flashcard) |
| `lib/ai/providers/` | Saglayici adaptorleri (`openai-compatible.ts`, `gemini.ts`) + `getProviderAdapter` |
| `config/providers.ts` | Saglayici meta verisi (id, ad, baseUrl) — tek kaynak |
| `types/ai.ts` | AI tip tanimlari (ProviderId, AICapability, AISettings, AIProvider) |
| `lib/db.ts` | SQLite veritabani islemleri |
| `lib/theme.ts` | Tema degerleri (DESIGN.md'den turetilmis) |
| `lib/AppContext.tsx` | Global state (dil, tema, API key) |
| `config/languages.ts` | Desteklenen diller (tek kaynak) |
| `locales/tr.json`, `locales/en.json` | Ceviri dosyalari |
| `components/ui/` | Ortak UI bilesenleri |
| `types/index.ts` | Veri modelleri |
