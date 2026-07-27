@AGENTS.md

# Claude Code - Ek Notlar

## Gelistirici
- **Mammetbay** — projenin sahibi ve tek gelistiricisi.

## Proje Durumu (2026-07-27)
Phase 1-4 tamamlandi. Mevcut durumda calisan ozellikler:
- Onboarding (3 slide)
- Home Dashboard (streak, total notes, weekly goal, recent notes)
- Notes listesi + olusturma (ses kaydi + fotograf/OCR)
- Not detay (transcript, summary, Generate Quiz/Flashcards CTA)
- Quiz player (A-D siklar, progress, dogru/yanlis gosterimi)
- Flashcard modu (flip, segment progress, known/missed)
- Settings (dil, tema, API key, about)
- i18n (TR/EN) tamamen entegre
- Groq entegrasyonu (Whisper, Qwen Vision OCR, Llama)

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
| `app/create-note.tsx` | Not olusturma (ses + fotograf) |
| `app/note/[id].tsx` | Not detay sayfasi |
| `app/quiz/[id].tsx` | Quiz player |
| `app/flashcard/[id].tsx` | Flashcard player |
| `lib/groq.ts` | Groq API islemleri (transcribe, OCR, summarize, quiz, flashcard) |
| `lib/db.ts` | SQLite veritabani islemleri |
| `lib/theme.ts` | Tema degerleri (DESIGN.md'den turetilmis) |
| `lib/AppContext.tsx` | Global state (dil, tema, API key) |
| `config/languages.ts` | Desteklenen diller (tek kaynak) |
| `locales/tr.json`, `locales/en.json` | Ceviri dosyalari |
| `components/ui/` | Ortak UI bilesenleri |
| `types/index.ts` | Veri modelleri |
