# StudyMate AI — Proje Kapsamı ve Teknik Dokümantasyon

## 1. Proje Özeti

**Ne:** Ders notlarını sesli kayıttan otomatik transkripte, özete, quiz'e ve flashcard'a çeviren React Native + Expo mobil uygulama şablonu (Codester'da satılacak kaynak kod ürünü).

**Kimin için (Codester alıcısı):** Kendi eğitim/öğrenci odaklı mobil uygulamasını hızlıca kurmak isteyen indie geliştiriciler, ed-tech ajansları, özel ders/kurs işletmeleri.

**Bu bir SaaS DEĞİL:** Alıcı ürünü satın alır, kullanıcı seçtiği AI sağlayıcının (Groq/OpenAI/Gemini/OpenRouter) API key'ini uygulama içi ayarlardan girer, kendi markasıyla yayınlar. Backend, kullanıcı yönetimi, billing sistemi bu üründe yok — bilinçli olarak yok.

---

## 2. Özellik Kapsamı

### Dahil (MVP)
- Sesli ders kaydı (expo-audio)
- **Fotoğraf çekerek veya galeriden yükleyerek not oluşturma** (defter/slayt fotoğrafından metin çıkarma — vision modeli/OCR)
- Otomatik transkript (stt modeli — ses için) / OCR (vision modeli — fotoğraf için)
- Otomatik özet (chat modeli)
- Otomatik çoktan seçmeli quiz üretimi
- Flashcard modu (spaced repetition mantığı basit versiyon)
- Not listesi + arama/kategori
- Ayarlar: dil (TR/EN), tema (açık/koyu), API key girişi
- Onboarding (3 ekran)

### Dahil DEĞİL (bilinçli kapsam dışı — scope creep yapma)
- Kullanıcı hesabı / login sistemi (mock yeterli, GERÇEK auth yok)
- Ödeme / abonelik sistemi
- Bulut senkronizasyonu / multi-device
- Gerçek zamanlı işbirliği
- Push notification

---

## 3. Teknik Mimari

| Katman | Seçim | Not |
|---|---|---|
| Framework | React Native + Expo (SDK güncel) | Expo Router ile |
| Navigasyon | Expo Router (tab + stack) | |
| State | Context API | Redux/Zustand gereksiz bu boyutta |
| Yerel veri | expo-sqlite | Notlar, quiz'ler, flashcard'lar cihazda saklanır |
| Ses kaydı | expo-audio | |
| AI sağlayıcı | Çoklu (Groq, OpenAI, Gemini, OpenRouter) | Adapter mimarisi, `config/providers.ts` + `lib/ai/`. Kullanıcı ayarlardan sağlayıcı + model seçer |
| Transkript (ses) | Sağlayıcının `stt` yetenekli modeli | Model listesi runtime'da API'den çekilir, hardcode değil |
| OCR (fotoğraf) | Sağlayıcının `vision` yetenekli modeli | `lib/ai/service.ts` → `extractTextFromImage` |
| Özet + Quiz + Flashcard | Sağlayıcının `chat` yetenekli modeli | `lib/ai/service.ts` → `generateSummary/generateQuiz/generateFlashcards` |
| i18n | react-i18next | Desteklenen diller `config/languages.ts`'den okunur, hardcoded değil |
| Tema | StyleSheet + theme.ts | NativeWind yok, senin bildiğin yaklaşım |
| API key yönetimi | Uygulama içi ayarlar (sağlayıcı başına) | Kullanıcı seçtiği sağlayıcının key'ini ayarlardan girer, cihazda saklanır; kodda hardcoded key YOK |

### Dil Sistemi (Language System)

Tek bir dosyada desteklenen diller merkezi olarak tanımlanır, uygulamanın her yerinde (i18n, Note veri modeli, ayarlar ekranı) bu tek kaynaktan türetilir. Yeni dil eklemek = bu listeye bir satır eklemek + bir çeviri dosyası eklemek.

```typescript
// config/languages.ts
export const SUPPORTED_LANGUAGES = ['tr', 'en'] as const;
export type LanguageCode = typeof SUPPORTED_LANGUAGES[number];

export const LANGUAGE_LABELS: Record<LanguageCode, string> = {
  tr: 'Türkçe',
  en: 'English',
};
```

`locales/` klasöründeki dosya isimleri de bu listedeki kodlarla birebir eşleşmeli (`tr.json`, `en.json`). i18next `resources` objesi bu diziden dinamik oluşturulur.

---

## 4. Klasör Yapısı (taslak)

```
studymate-ai/
├── app/                     # Expo Router sayfaları
│   ├── (onboarding)/         # 3 slide onboarding
│   ├── (tabs)/
│   │   ├── home.tsx          # Ana dashboard (streak, total, weekly goal, recent)
│   │   ├── notes.tsx         # Not listesi + arama + etiket filtresi
│   │   ├── quiz.tsx          # Quiz listesi + arama
│   │   └── settings.tsx
│   ├── create-note.tsx       # Not oluşturma (ses / fotoğraf / dosya)
│   ├── note/[id].tsx         # Not detay
│   ├── quiz/[id].tsx         # Quiz player
│   ├── flashcard/[id].tsx    # Flashcard player (spaced repetition)
│   └── weekly-goal.tsx       # Haftalık hedef düzenleme
├── components/
│   ├── ui/                   # Button, Input, Card, EmptyState
│   └── study/                # AudioPlayerCard (not detay ses oynatma)
├── lib/
│   ├── ai/                   # Sağlayıcıdan bağımsız AI katmanı
│   │   ├── service.ts        # transcribeAudio, extractTextFromImage, generateSummary/Quiz/Flashcards, generateNoteMetadata
│   │   ├── providers/        # adapter'lar (openai-compatible.ts, gemini.ts) + getProviderAdapter
│   │   ├── prompts.ts, utils.ts, models.ts, model-classifier.ts, useModelCatalog.ts
│   ├── db.ts                 # expo-sqlite işlemleri (versiyonlu migration)
│   ├── spacedRepetition.ts   # SM-2-lite zamanlayıcı
│   ├── AppContext.tsx        # Global state (dil, tema, AI ayarları, weeklyGoal)
│   └── theme.ts
├── config/
│   ├── languages.ts          # Desteklenen diller — tek kaynak (single source of truth)
│   └── providers.ts          # AI sağlayıcı meta verisi (id, ad, baseUrl) — tek kaynak
├── locales/
│   ├── tr.json
│   └── en.json
├── types/
│   ├── index.ts              # Note, QuizQuestion, Flashcard
│   └── ai.ts                 # ProviderId, AICapability, AISettings, AIProvider
├── .env.example
└── docs/
    └── SETUP.md              # Alıcı için kurulum kılavuzu (Codester teslimi)
```

---

## 5. Veri Modelleri

```typescript
import { LanguageCode } from '../config/languages';

interface Note {
  id: string;
  title: string;
  sourceType: 'audio' | 'image';
  audioUri?: string;    // sourceType === 'audio' ise dolu
  imageUri?: string;    // sourceType === 'image' ise dolu
  transcript: string;   // ses ise stt çıktısı, fotoğraf ise OCR çıktısı
  summary: string;
  createdAt: string;
  language: LanguageCode; // config/languages.ts'den türetilir, hardcoded değil
  tags: string[];       // AI'nin ürettiği 1-5 anahtar kelime (filtreleme için)
}

interface QuizQuestion {
  id: string;
  noteId: string;
  question: string;
  options: string[];
  correctIndex: number;
}

interface Flashcard {
  id: string;
  noteId: string;
  front: string;
  back: string;
  lastReviewed?: string;
  // Spaced repetition durumu (SM-2-lite, lib/spacedRepetition.ts)
  interval: number;     // sonraki tekrara kadar gün sayısı
  easeFactor: number;   // zorluk çarpanı (>= 1.3)
  repetitions: number;  // ardışık başarılı tekrar sayısı
  dueDate: string;      // kartın tekrar due olacağı ISO tarih
}
```

---

## 6. Ekran Listesi

1. Onboarding (3 ekran, skip/next)
2. Ana ekran — Home Dashboard (streak, toplam not, haftalık hedef, son notlar)
3. Not listesi — arama (başlık) + AI etiket filtresi
4. Not oluşturma ekranı — ses kaydı (canlı süre göstergesi) VEYA fotoğraf çek/galeriden seç/dosya
5. Not detay — kaynak medya (fotoğraf önizleme / ses oynatma), transkript, özet, quiz/flashcard'a geç butonları
6. Quiz listesi (arama) + Quiz player ekranı
7. Flashcard ekranı (spaced repetition)
8. Haftalık hedef düzenleme ekranı
9. Ayarlar — dil, tema, AI sağlayıcı + model + API key

---

## 7. Zaman Çizelgesi (12-13 gün, günde 2-3 saat)

Fotoğraf/OCR özelliği eklendiği için takvim ~1-2 gün uzadı — aşağıda güncel:

| Gün | İş |
|---|---|
| 1 | İskelet + navigasyon + tema sistemi + config/languages.ts |
| 2-3 | Ses kaydı ekranı + Groq Whisper entegrasyonu |
| 4 | Fotoğraf çek/yükle (expo-image-picker) + Groq Vision OCR entegrasyonu |
| 5 | Özet + quiz üretimi (Llama, hem ses hem fotoğraf kaynağı için ortak) |
| 6 | Flashcard modu |
| 7 | i18n + Ayarlar ekranı (dil sistemi dahil) |
| 8-9 | Polish, gerçek cihaz testi, bug fix |
| 10 | Dokümantasyon (SETUP.md, kurulum adımları) |
| 11 | Ekran görüntüleri + demo GIF, Codester listing metni |
| 12-13 | Buffer + submission |

---

## 8. Codester Teslim Gereksinimleri (unutma, en kritik kısım)

- [ ] Kurulum dokümantasyonu (PDF veya markdown)
- [ ] Kullanılan tüm icon/font'ların ticari lisans uygunluğu kontrol edilmiş
- [ ] Temiz, yorumlu kod (hardcoded API key YOK)
- [ ] Gerçek cihazda test edilmiş ekran görüntüleri (min. 5-6 adet)
- [ ] Demo GIF veya kısa video
- [ ] `.env.example` dosyası dahil
- [ ] Listing metni (ürün açıklaması, özellik listesi, kimin için)
