# StudyMate AI - Proje Hafızası (Memory)

Bu dosya, projenin gelişimini, alınan kararları ve tamamlanan adımları takip etmek için oluşturulmuştur.

## [2026-07-22] - Proje Başlangıcı ve Planlama
*   `docs/studymate-ai-scope.md` ve `DESIGN.md` dokümanları okundu.
*   Projenin temel hedefleri, dahil olan/olmayan özellikler ve teknoloji yığını anlaşıldı.
*   `package.json` incelendi; temel kütüphanelerin (expo-audio, expo-sqlite, react-i18next vb.) kurulu olduğu görüldü.
*   Uygulamanın genel geliştirme planı oluşturuldu (Implementation Plan).

## [2026-07-22] - Phase 1 & 2 Tamamlandı (Eski)
*   **i18n Entegrasyonu:** `config/languages.ts`, `locales/tr.json` ve `locales/en.json` oluşturuldu, `react-i18next` yapılandırması `lib/i18n.ts` içine yazıldı.
*   **Tema ve Tip Tanımlamaları:** `DESIGN.md` kurallarına uygun olarak `lib/theme.ts` ve veri modelleri için `types/index.ts` oluşturuldu.
*   **Expo Router & Navigasyon:** `app/(tabs)` altında `notes`, `flashcards` ve `settings` sekmeleri tasarlandı. Ana sayfadan (`app/index.tsx`) `notes` sekmesine yönlendirme eklendi.
*   **Veritabanı:** `expo-sqlite` ile (SDK 51 uyumlu) `notes`, `quizzes` ve `flashcards` tablolarını kuran `lib/db.ts` yazıldı.
*   **Global State (Context API):** `lib/AppContext.tsx` oluşturularak dil, tema ve API Key için state yapısı kuruldu.
*   **Root Layout:** Tüm bileşenler `app/_layout.tsx` içinde birleştirildi; font yüklemeleri, db inisializasyonu ve context provider sarmalaması tamamlandı.

## [2026-07-22] - Phase 1 Revizyonu (Gerçek Kapsam)
*   **Tasarım İncelemesi:** `studymate-ai-scope.md`, `DESIGN.md` ve `assets/design-reference` klasöründeki görseller detaylıca incelendi. Önceki iterasyonun Phase 1 hedeflerine ulaşmadığı belirlendi.
*   **Tab Bar Güncellemesi:** 3 tab (notes, flashcards, settings) yerine tasarımda belirtilen 4 tab (Home, Notes, Quiz, Settings) yapısına geçildi. `flashcards` tabı kaldırıldı.
*   **Onboarding:** Hiç olmayan 3 slaytlık Onboarding (Record, AI Summaries, Quizzes) akışı (`app/(onboarding)`) tasarım referanslarına tam uyumlu şekilde sıfırdan implemente edildi.
*   **Ana Sayfa (Home Dashboard):** Selamlama, day streak, total notes, weekly goal progress bar ve recent notes listesini içeren dashboard sayfası eklendi.
*   **Ayarlar (Settings):** Sadece placeholder olan ekran, tam işlevsel bir Settings ekranına (Dil seçimi, Dark/Light tema toggle, güvenli API Key girişi, About linkleri ve Danger zone) dönüştürüldü.
*   **Yeni Not (Create Note):** Tasarıma uygun biçimde baştan yazıldı. Mikrofon UI, dekoratif waveform ve fotoğraf çekme/yükleme bölümleri (camera, gallery, file) eklendi.
*   **Ortak UI Bileşenleri:** `Button`, `Card`, `Input`, `EmptyState`, `SectionHeader` ve `SettingsRow` componentleri `DESIGN.md` kurallarına sıkı sıkıya bağlı kalınarak oluşturuldu.
*   **i18n Genişletmesi:** `en.json` ve `tr.json` dosyaları uygulamadaki tüm UI metinlerini kapsayacak şekilde büyük oranda genişletildi, hardcoded string bırakılmadı.
*   **Kalıcılık (AsyncStorage):** AppContext güncellenerek Dil, Tema, API Key ve Onboarding tamamlanma durumları `AsyncStorage` ile kalıcı hale getirildi.

## [2026-07-23] - Phase 2 & 3 Tamamlandı (Ses Kaydı ve OCR)
*   **Groq API Entegrasyonu:** `lib/groq.ts` oluşturuldu. Ses kayıtlarını metne çevirmek için `whisper-large-v3-turbo` entegre edildi. Fotoğraf okuma (OCR) işlemleri için Llama Vision modeli deprecate olduğu için yerine çalışır durumdaki `qwen/qwen3.6-27b` modeli kullanılarak kod güncellendi.
*   **Veritabanı İşlemleri:** `lib/db.ts` içine not ekleme (`insertNote`), notları listeleme (`getNotes`) ve not detayı getirme (`getNoteById`) yardımcı fonksiyonları eklendi.
*   **Ses ve Fotoğraf Kaydı:** `app/create-note.tsx` ekranında kurala uygun olarak yeni nesil `expo-audio` paketi kullanılarak ses kayıt altyapısı (başlat, bitir, timer) ve `expo-image-picker` ile fotoğraf çekme/galeri seçme özellikleri eklendi. Alınan ses/fotoğraf verileri Groq'a gönderilerek metne dönüştürülüyor.
*   **Dinamik Not Listesi:** `app/(tabs)/notes.tsx` güncellenerek statik placeholder yerine SQLite veritabanındaki notların listelendiği, sayfa her açıldığında yenilenen dinamik yapı (FlatList) kuruldu.
*   **Not Detay Sayfası:** Oluşturulan notu görüntülemek için `app/note/[id].tsx` iskeleti kuruldu.

## [2026-07-23] - Kritik Hata Düzeltmeleri ve AI Çıktı Doğrulaması
*   **Veritabanı Syntax ve Bağlantı Düzeltmesi (NullPointerException):** `lib/db.ts` içerisindeki fazladan `);` syntax hatası giderildi, `SQLiteProvider` inisiyalizasyon çökmesi engellendi. `app/create-note.tsx`, `app/(tabs)/notes.tsx` ve `app/note/[id].tsx` ekranlarında `useSQLiteContext()` hook'u entegre edilerek `db` parametre geçişleri düzeltildi.
*   **React Native FormData Boundary Düzeltmesi:** `lib/groq.ts` içindeki `transcribeAudio` fonksiyonunda manuel eklenen `'Content-Type': 'multipart/form-data'` başlığı kaldırıldı. React Native'in otomatik `boundary` parametresi oluşturması sağlanarak Groq API 400 (`could not process file - is it a valid media file?`) hatası tamamen çözüldü.
*   **Groq Vision OCR Temizliği:** `lib/groq.ts` içindeki OCR sistem komutları `system` rolüne taşındı. Olası `<think>...</think>` blokları ve markdown üst-veri (`**...**`) temizliği güçlendirildi; metinsiz görseller için `NO_READABLE_TEXT` kontrolü eklendi.
*   **Whisper Halüsinasyon ve Sessizlik Engelleme:**
    *   Whisper API isteğinde `temperature: '0.0'` kullanılarak deterministik çıktı sağlandı.
    *   `prompt` alanına ders/sınıf konuşması bağlamı eklenerek YouTube altyazı kalıpları engellendi.
    *   `normalizeText` fonksiyonu yazılarak Türkçe özel karakterler ve uzantılar için bağışık arama sağlandı.
    *   `avgNoSpeechProb > 0.4` ve `maxNoSpeechProb > 0.7` eşik değerleri ile `HALLUCINATION_TRIGGERS` süzgeci entegre edildi. Sessiz ve uydurma kayıtlar veritabanına yazılmadan `NO_SPEECH_DETECTED` hatası verilecek şekilde UI uyarısı sağlandı.

## [2026-07-24] - Phase 4 Tamamlandı + Flashcard Modu
*   **Quiz sekmesi:** `app/(tabs)/quiz.tsx` SQLite `getNotesWithQuizzes` ile dolduruldu; kart tıklanınca `/quiz/[id]` açılıyor.
*   **Quiz player UI:** `QuizScreen.png` referansına göre A–D şıklar, teal progress %, doğru/yanlış border + ikon, **Next Question** CTA eklendi.
*   **Not detay UI:** `NoteDetail.png` referansına göre Summary | Transcript sekmeleri, AI özet kartı (teal bullet), altta Generate Quiz / Generate Flashcards CTA’ları.
*   **Flashcard pipeline:** `generateFlashcards` (Groq Qwen), `insertFlashcards` / `getFlashcardsByNoteId` / `updateFlashcardReview` DB helpers.
*   **Flashcard ekranı:** `app/flashcard/[id].tsx` — `FlashcardScreen.png` uyumlu flip, segment progress, known/missed, Previous/Next, Known/Missed/Remaining istatistikleri.
*   **i18n:** `common.apiKeyRequired*`, quiz/flashcard/noteDetail eksik anahtarları `en.json` / `tr.json` içine eklendi.
