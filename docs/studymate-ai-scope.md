# StudyMate AI — Proje Kapsamı ve Teknik Dokümantasyon

## 1. Proje Özeti

**Ne:** Ders notlarını sesli kayıttan otomatik transkripte, özete, quiz'e ve flashcard'a çeviren React Native + Expo mobil uygulama şablonu (Codester'da satılacak kaynak kod ürünü).

**Kimin için (Codester alıcısı):** Kendi eğitim/öğrenci odaklı mobil uygulamasını hızlıca kurmak isteyen indie geliştiriciler, ed-tech ajansları, özel ders/kurs işletmeleri.

**Bu bir SaaS DEĞİL:** Alıcı ürünü satın alır, kendi Groq API key'ini `.env` dosyasına ekler, kendi markasıyla yayınlar. Backend, kullanıcı yönetimi, billing sistemi bu üründe yok — bilinçli olarak yok.

---

## 2. Özellik Kapsamı

### Dahil (MVP)
- Sesli ders kaydı (expo-audio)
- **Fotoğraf çekerek veya galeriden yükleyerek not oluşturma** (defter/slayt fotoğrafından metin çıkarma — Groq Vision/OCR)
- Otomatik transkript (Groq Whisper — ses için) / OCR (Groq Vision — fotoğraf için)
- Otomatik özet (Groq Llama)
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
| Transkript (ses) | Groq `whisper-large-v3-turbo` | Ücretsiz tier: günde 2000 istek, kart gerekmez |
| OCR (fotoğraf) | Groq Vision modeli (ör. `llama-4-scout-17b-16e-instruct`) | Groq'un resmi dokümantasyonunda OCR use-case'i olarak destekleniyor. ⚠️ Build sırasında model adını console.groq.com/docs/vision'dan doğrula — model isimleri zaman zaman değişiyor/deprecate oluyor |
| Özet + Quiz üretimi | Groq Llama (metin modeli) | Build sırasında console.groq.com/docs/models'dan güncel/aktif model adını doğrula |
| i18n | react-i18next | Desteklenen diller `config/languages.ts`'den okunur, hardcoded değil |
| Tema | StyleSheet + theme.ts | NativeWind yok, senin bildiğin yaklaşım |
| API key yönetimi | `.env` + config dosyası | Alıcı kendi key'ini girer, kodda hardcoded key YOK |

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
├── app/                    # Expo Router sayfaları
│   ├── (onboarding)/
│   ├── (tabs)/
│   │   ├── notes.tsx
│   │   ├── flashcards.tsx
│   │   └── settings.tsx
│   └── note/[id].tsx
├── components/
│   ├── ui/                 # Button, Input, Card, Modal
│   └── study/               # RecordButton, ImagePickerButton, QuizCard, FlashcardView
├── lib/
│   ├── groq.ts              # transcribeAudio(), extractTextFromImage(), summarizeAndGenerateQuiz()
│   ├── db.ts                 # expo-sqlite işlemleri
│   └── theme.ts
├── config/
│   └── languages.ts          # Desteklenen diller — tek kaynak (single source of truth)
├── locales/
│   ├── tr.json
│   └── en.json
├── types/
│   └── index.ts
├── .env.example
└── docs/
    └── SETUP.md              # Alıcı için kurulum kılavuzu
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
  transcript: string;   // ses ise Whisper çıktısı, fotoğraf ise OCR çıktısı
  summary: string;
  createdAt: string;
  language: LanguageCode; // config/languages.ts'den türetilir, hardcoded değil
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
}
```

---

## 6. Ekran Listesi

1. Onboarding (3 ekran, skip/next)
2. Ana ekran — Not listesi
3. Not oluşturma ekranı — ses kaydı (canlı süre göstergesi) VEYA fotoğraf çek/galeriden seç
4. Not detay — transkript, özet, quiz/flashcard'a geç butonları
5. Quiz ekranı
6. Flashcard ekranı
7. Ayarlar — dil, tema, API key

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
