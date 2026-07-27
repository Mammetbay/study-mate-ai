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

## [2026-07-27] - AI Provider Mimarisi Refactoru (Groq → Çoklu Sağlayıcı)
Tekil `lib/groq.ts` (454 satır) kaldırılıp, birden fazla AI sağlayıcısını destekleyen adapter tabanlı `lib/ai/` mimarisine geçildi. Commit: `dac324c`.

*   **Çoklu Sağlayıcı Desteği:** Groq, OpenAI, Google Gemini ve OpenRouter. Statik meta veriler (id, ad, baseUrl) `config/providers.ts` içinde. Model listeleri hardcode DEĞİL — çalışma anında her sağlayıcının API'sinden canlı çekiliyor (OpenRouter public, diğerleri key gerektirir).
*   **Adapter Deseni:** `lib/ai/providers/index.ts` `getProviderAdapter(id)` ile cache'li adapter döndürür. Groq/OpenAI/OpenRouter ortak `OpenAICompatibleProvider` (`openai-compatible.ts`) kullanır; Gemini kendi `GeminiProvider` (`gemini.ts`) adaptörünü kullanır. Ortak arayüz: `types/ai.ts` içindeki `AIProvider` (`listModels`, `transcribeAudio`, `chatCompletion`, `visionCompletion`).
*   **Servis Katmanı:** `lib/ai/service.ts` sağlayıcıdan bağımsız iş fonksiyonlarını sunar — `transcribeAudio`, `extractTextFromImage`, `generateSummary`, `generateQuiz`, `generateFlashcards`. Her biri aktif adaptörü seçer, `AISettings`'ten key + modeli alır.
*   **Yetenek (Capability) Sistemi:** Modeller `stt` | `vision` | `chat` olarak sınıflandırılır (`lib/ai/model-classifier.ts`, `lib/ai/models.ts`). `AISettings.selectedModels` her yetenek için ayrı model tutar; `useModelCatalog` hook'u (`lib/ai/useModelCatalog.ts`) katalog çekimini yönetir.
*   **Yardımcılar & Prompt'lar:** Metin normalize, transkript doğrulama, JSON çıkarma → `lib/ai/utils.ts`. Sistem/kullanıcı prompt'ları → `lib/ai/prompts.ts`.
*   **Tipler:** `types/ai.ts` — `ProviderId`, `AICapability`, `AIModel`, `ProviderConfig`, `AISettings`, `AIProvider`, `ChatMessage`, `ChatOptions`.
*   **State & UI:** `lib/AppContext.tsx` çoklu sağlayıcı + per-provider API key + seçili modelleri tutacak şekilde genişletildi. `app/(tabs)/settings.tsx` (+406 satır) sağlayıcı seçimi, key girişi ve yetenek başına model seçimi ile yenilendi. `create-note.tsx` ve `note/[id].tsx` yeni `lib/ai/service` fonksiyonlarını çağıracak şekilde güncellendi. `en.json`/`tr.json` API key ve model seçim metinleriyle güncellendi.

> Not: Bu refactora göre proje dokümanları güncellendi — `AGENTS.md` (AI bölümü + API key kuralı), `CLAUDE.md` (özellik listesi + dosya tablosu, `lib/groq.ts` yerine `lib/ai/*`) ve `docs/studymate-ai-scope.md` (§1 SaaS notu, §2 özellik kapsamı, §3 tech stack + API key yönetimi) çoklu-sağlayıcı gerçeğine çevrildi.

## [2026-07-27] - Eksik MVP Özellikleri Tamamlandı (Arama, Kategori, Spaced Repetition, Home)
Dokümanlarda (scope §2) söz verilip kodda eksik kalan MVP özellikleri tamamlandı ve küçük stub'lar giderildi.

*   **Not arama + kategori (scope §2 "Not listesi + arama/kategori"):**
    *   `types/index.ts` → `Note.category?: string` eklendi.
    *   `lib/db.ts` → `notes.category` kolonu (versiyonlu migration, `PRAGMA user_version`), `insertNote` kategoriyi yazar, `getCategories()` distinct kategori listesi döndürür.
    *   `app/create-note.tsx` → opsiyonel "Kategori" Input alanı; not oluştururken kaydedilir.
    *   `app/(tabs)/notes.tsx` → arama çubuğu (başlık + transkriptte, client-side `useMemo` filtresi) + yatay kategori çipleri ("Tümü" + distinct kategoriler) + kartta kategori rozeti. Sonuç yoksa ayrı boş durum.
*   **Spaced Repetition (scope §2 "flashcard modu — spaced repetition basit versiyon"):**
    *   `lib/spacedRepetition.ts` (YENİ) → SM-2-lite: `schedule(state, 'known'|'missed')`, `initialSRState()`, `isDue()`. known → interval 1/3/interval*ef büyür, ef +0.1; missed → interval sıfırlanır, ef −0.2, kart aynı gün tekrar due.
    *   `types/index.ts` → `Flashcard`'a `interval/easeFactor/repetitions/dueDate` (zorunlu) eklendi.
    *   `lib/db.ts` → flashcards tablosuna SR kolonları (migration), `getFlashcardsByNoteId` artık `ORDER BY dueDate ASC` (en çok gecikmiş kart önce), `updateFlashcardReview` → `updateFlashcardSchedule` (SR state persist).
    *   `lib/ai/service.ts` → `generateFlashcards` yeni kartlara `initialSRState()` ekler (hemen due).
    *   `app/flashcard/[id].tsx` → `markResult` artık `schedule()` hesaplayıp `updateFlashcardSchedule` ile kalıcı yazar; lokal state senkron tutulur. Önceki sadece `lastReviewed` yazan versiyon kaldırıldı.
*   **Home dashboard gerçek veriye bağlandı:** `app/(tabs)/home.tsx` mock `0` değerleri kaldırıldı. `useFocusEffect` ile `getNotes` çekilir; `totalNotes`, `dayStreak` (ardışık günler, bugün için 1 gün tolerans), `weeklyGoalCurrent` (son 7 gün) hesaplanır; Recent Notes gerçek son 3 notu listeler (yoksa boş durum).
*   **Küçük stub'lar giderildi:**
    *   `create-note.tsx` "Files" butonu → `expo-document-picker` ile görsel dosyası seçip base64'e çevirip (`fetch`+`FileReader`) mevcut OCR akışına verir. **DİKKAT: `expo-document-picker` paketi kurulmalı** (`npx expo install expo-document-picker`).
    *   `settings.tsx` "Clear All Notes" → `clearAllNotes(db)` (flashcards+quizzes+notes DELETE) bağlandı, başarı uyarısı.
    *   `create-note.tsx` not özeti `'Pending...'` yerine `''` (boş) — note detail `hasSummary` kontrolüyle uyumlu.
*   **i18n:** `notes.allCategories/noResultsTitle/noResultsDesc`, `createNote.category/categoryPlaceholder`, `settings.clearSuccess` (tr+en) eklendi. TR settings bloğundaki eksik diyakritikler (Saglayici→Sağlayıcı vb.) düzeltildi.

> Not: `docs/studymate-ai-scope.md` (§2 özellik kapsamı — arama/kategori/spaced repetition artık uygulandı; §7 zaman çizelgesi geçmiş kayıt olarak dokunulmadı) ve `CLAUDE.md` (proje durumu) bu değişikliklere göre güncellendi.

## [2026-07-27] - UX Düzeltmeleri (AI etiketler, oto-başlık, quiz arama, haftalık hedef, ses kaydı)
App test edilirken yeni özelliklerde bulunan hatalar giderildi ve birkaç yetenek eklendi.

*   **Not arama sadeleştirildi:** `app/(tabs)/notes.tsx` araması artık yalnızca **not başlığına** göre filtreler (önceki transkript eşleşmesi kaldırıldı) — daha seçkin sonuç.
*   **Kategori → AI etiketleri (keys):** Kullanıcının elle kategori yazması kaldırıldı. Artık not oluşturulurken AI 1-5 adet anahtar kelime (etiket) üretir.
    *   `types/index.ts` → `Note.category?: string` **kaldırıldı**, yerine `tags: string[]` (zorunlu) geldi.
    *   `lib/db.ts` → `notes.tags` kolonu (JSON string), `NoteRow` + `mapNoteRow` ile JSON parse; `getNotes`/`getNoteById` map'lenir; `getCategories` yerine `getAllTags` (tüm notların etiketlerini birleştirip distinct+sort).
    *   `lib/ai/service.ts` → yeni `generateNoteMetadata(transcript, settings, language)` → `{ title, tags }` (chat modeli, JSON nesnesi; tags lowercase/trim/dedupe/max5). `lib/ai/prompts.ts` → `getNoteMetadataSystemPrompt`. `lib/ai/utils.ts` → `extractJsonObject`.
    *   `app/(tabs)/notes.tsx` → arama kutusunun yanındaki çipler artık etiket bazlı (`getAllTags`); kartta en fazla 2 etiket rozeti; filtre `note.tags.includes(tag)`.
*   **Oto-başlık:** Kullanıcı başlık girmezse `generateNoteMetadata`'dan gelen AI başlığı kullanılır; **AI başarısız olursa** eski davranış (`Lecture <tarih>` / `Photo Note <tarih>`) uygulanır. Metadata best-effort try/catch içinde — not oluşturmayı bloklamaz. Ortak `saveNote()` yardımcısı ses+görsel yollarındaki tekrarı kaldırdı (`app/create-note.tsx`).
*   **Quiz arama:** `app/(tabs)/quiz.tsx` → quiz adına (noteTitle) göre arama kutusu + `useMemo` filtre + sonuç yoksa boş durum.
*   **Not kartı önizleme:** `notes.tsx` kartında başlık altında `summary` varsa (2 satır) özet, yoksa transkript gösterilir.
*   **Haftalık hedef düzenlenebilir:** `lib/AppContext.tsx` → kalıcı `weeklyGoal` (+`setWeeklyGoal`, AsyncStorage `@studymate_weekly_goal`, varsayılan 25). `app/(tabs)/home.tsx` → sabit `WEEKLY_GOAL_TOTAL` yerine context; haftalık hedef kartı artık dokunulabilir → `app/weekly-goal.tsx` (YENİ, stepper ±5, 1-200 clamp). `_layout.tsx`'e `weekly-goal` Stack.Screen (slide_from_bottom) eklendi.
*   **Ses kaydı düzeltmesi:** `app/create-note.tsx` → kayıttan önce `setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true })` çağrılıyor (eksikliği iOS/sessiz modda kaydın sessizce başlamamasına yol açıyordu). Ayrıca mic butonundaki `disabled={!sttSupported}` kaldırıldı → STT modeli yokken buton artık `common.sttNotSupported` uyarısını gösterebiliyor. `stop()` artık `await` edilir.
*   **i18n:** `quiz.searchPlaceholder/noResultsTitle/noResultsDesc`, `weeklyGoal.title/subtitle/perWeek/save` (tr+en) eklendi; `createNote.category/categoryPlaceholder` kaldırıldı, `createNote.noteTitle/noteTitlePlaceholder` "opsiyonel/oto-isim" metnine güncellendi.

> Not: `expo-document-picker` zaten `package.json`'da kurulu (~14.0.8). Tüm değişiklikler `npx tsc --noEmit` temiz geçer.

## [2026-07-27] - Not Detay Medya + Doküman Senkronu
Codester-dışı küçük açıklar kapatıldı (kullanıcı seçimi: fotoğraf gösterimi + ses oynatma + scope senkronu; About linkleri bilinçli hariç).

*   **Not detayda fotoğraf:** `app/note/[id].tsx` → ScrollView başında, `sourceType==='image' && imageUri` ise `expo-image`'ten `Image` ile 200px yükseklik, `theme.radius.card` önizleme.
*   **Not detayda ses oynatma:** `components/study/AudioPlayerCard.tsx` (YENİ) → `useAudioPlayer`/`useAudioPlayerStatus` (expo-audio); play/pause (amber daire) + accent ilerleme çubuğu + mm:ss. `note/[id].tsx` `sourceType==='audio' && audioUri` ise mount eder (koşullu mount → hook'lar hep tanımlı uri ile). Yeni i18n metni yok.
*   **Doküman drift giderildi:** `docs/studymate-ai-scope.md` → §4 klasör yapısı gerçek kodla (lib/ai/, tabs: home/notes/quiz/settings, create-note/note/quiz/flashcard/weekly-goal, components/study, config/providers, types/ai), §5 `Note.tags` + `Flashcard` SR alanları eklendi, §6 ekran listesi güncellendi (Home Dashboard, not listesi araması, kaynak medya, weekly-goal ekranı).

> Kapsam dışı (bilinçli): Settings About linkleri (`onPress={()=>{}}` hâlâ stub), `.env.example`/README (Codester §8). Tüm değişiklikler `npx tsc --noEmit` temiz.

## [2026-07-27] - Settings About linkleri bağlandı
Son Codester-dışı işlevsel açık kapatıldı.

*   **`config/about.ts` (YENİ):** `privacyPolicyUrl`, `termsOfServiceUrl`, `supportEmail` — alıcının düzenleyeceği tek kaynak placeholder değerler (`example.com`).
*   **`app/(tabs)/settings.tsx`:** About satırları (Privacy/Terms/Contact) artık `onPress={()=>{}}` yerine `openLink()` → `Linking.canOpenURL`+`openURL` (Contact = `mailto:`). Açılamazsa `common.error`/`common.unknownError` uyarısı. Yeni i18n metni yok.

> Bu noktada Codester-dışı işlevsel backlog boş. Kalanlar: Codester §8 teslimleri (SETUP.md, ekran görüntüleri, demo GIF, listing, `.env.example`/README düzeltmesi) ve onay gerektiren opsiyonel refactor/polish.

## [2026-07-28] - DB Migration Şeması Netleştirildi (v4) + Doküman Senkron Kontrolü
Commit edilmemiş tüm çalışma dizini değişiklikleri gözden geçirildi; hepsi zaten bu dosyada + `CLAUDE.md`/`AGENTS.md`/`docs/studymate-ai-scope.md` içinde kayıtlıydı. Tek drift `lib/db.ts` migration versiyonuydu; düzeltildi.

*   **`lib/db.ts` versiyonlu migration (güncel gerçek):** `DATABASE_VERSION = 4`, `PRAGMA user_version` ile kontrol; `addColumnIfMissing` / `dropColumnIfExists` idempotent yardımcıları var (taze kurulumda no-op, eski DB'de ALTER). Adımlar:
    *   **v2** — flashcards'a SR kolonları (`interval` DEFAULT 0, `easeFactor` REAL DEFAULT 2.5, `repetitions` DEFAULT 0, `dueDate`).
    *   **v3** — notes'a `tags` (JSON string) kolonu.
    *   **v4** — deprecated `category` kolonu `notes`'tan **DÜŞÜRÜLDÜ** (`dropColumnIfExists`). (Önceki kayıt "category kolonu geri uyum için kaldı" diyordu — artık geçerli değil; kolon tamamen kaldırıldı.)
*   Base `CREATE TABLE IF NOT EXISTS` şeması taze kurulumlara tüm kolonları (tags + SR alanları) doğrudan verir; versiyonlu ALTER'lar yalnızca eski DB'ler için.
*   Diğer tüm working-tree değişiklikleri (AI provider mimarisi, tags/oto-başlık, spaced repetition, home dashboard, weekly-goal, quiz arama, ses kaydı fix, not detay medya, about linkleri, `expo-document-picker`) bu dosyadaki önceki kayıtlarla birebir örtüşüyor — ek kayıt gerekmedi.
