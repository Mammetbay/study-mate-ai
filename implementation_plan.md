# Implementation Plan — Phase 4: AI Özet ve Quiz Üretimi (Groq Qwen Vision/Text Model)

Bu aşamada, not transkriptlerinden **Groq** üzerindeki aktif `qwen/qwen3.6-27b` modelini kullanarak otomatik **Özet (Summary)** ve **Çoktan Seçmeli Quiz** soruları üretme, bunları SQLite veritabanına kaydetme ve interaktif Quiz çözme ekranını implemente etme hedeflenmektedir.

---

## User Review Required

> [!IMPORTANT]
> **Groq Model Seçimi:** Llama modellerindeki deprecation sebebiyle Özet ve Quiz üretimi için projede aktif çalışan `qwen/qwen3.6-27b` modeli kullanılacaktır.
> **Otomatik vs. Manuel Tetikleme:** Not ilk oluşturulduğunda kullanıcı bekletilmemekte, transkript elde edilir edilmez kayıt yapılmaktadır. Not detay ekranında veya oluşturma sonrasında "Özet Üret" ve "Quiz Oluştur" butonları ile kullanıcı istediği an AI işlemlerini başlatabilmektedir.

---

## Proposed Changes

### 1. Groq AI Entegrasyonu — `lib/groq.ts`

#### [MODIFY] [groq.ts](file:///d:/Workspace/StudyMate_AI/lib/groq.ts)

- **`generateSummary(transcript: string, apiKey: string, language: LanguageCode): Promise<string>`**
  - Groq `qwen/qwen3.6-27b` modeline `chat/completions` isteği atar.
  - Metni 3-5 maddelik net, yapılandırılmış ders özeti şeklinde Türkçe veya İngilizce döndürür.
- **`generateQuiz(transcript: string, apiKey: string, language: LanguageCode): Promise<QuizQuestion[]>`**
  - Not transkriptinden 4 şıklı 3-5 adet quiz sorusu üretir (`qwen/qwen3.6-27b` modeli ile).
  - JSON formatında çıktı alıp güvenli bir şekilde parse eder: `[ { question: string, options: string[], correctIndex: number } ]`.

---

### 2. Veritabanı Fonksiyonları — `lib/db.ts`

#### [MODIFY] [db.ts](file:///d:/Workspace/StudyMate_AI/lib/db.ts)

- **`updateNoteSummary(db, noteId, summary)`**: Üretilen özeti `notes` tablosuna yazar.
- **`insertQuizQuestions(db, questions)`**: Üretilen soruları `quizzes` tablosuna kaydeder.
- **`getQuizQuestionsByNoteId(db, noteId)`**: Not ID'sine göre quiz sorularını getirir (options JSON.parse yapılır).
- **`getNotesWithQuizzes(db)`**: Quiz sekmesinde listelemek üzere içinde quiz olan notları getirir.

---

### 3. Not Detay Ekranı Güncellemesi — `app/note/[id].tsx`

#### [MODIFY] [note/[id].tsx](file:///d:/Workspace/StudyMate_AI/app/note/%5Bid%5D.tsx)

- Transkript kartının altına **Özet Kartı** ve **Quiz Kartı** eklenir.
- Eğer özet üretilmemişse: **"Özet Üret"** butonu gösterilir, tıklandığında yükleme durumu ile özet üretilip kaydedilir.
- Eğer quiz üretilmemişse: **"Quiz Üret"** butonu gösterilir, sorular üretilip veritabanına yazılır.
- Quiz varsa: **"Quiz'i Çöz"** butonu ile Quiz çözme ekranına yönlendirilir.

---

### 4. Quiz Sekmesi ve Çözme Ekranı

#### [MODIFY] [(tabs)/quiz.tsx](file:///d:/Workspace/StudyMate_AI/app/%28tabs%29/quiz.tsx)

- SQLite'tan quiz içeren notları çeker.
- Her not için soru sayısını gösteren kart listesi sunar.
- Tıklandığında quiz çözme ekranına gider.

#### [NEW] [app/quiz/[id].tsx](file:///d:/Workspace/StudyMate_AI/app/quiz/%5Bid%5D.tsx)

- İlerleme çubuğu (Progress Bar)
- Soru metni ve 4 adet şık seçeneği (Pressable)
- Yanıt verdikten sonra:
  - Doğru cevap: Yeşil/Accent (`#2DD4BF`)
  - Yanlış cevap: Kırmızı/Error (`#F87171`)
- Son ekran: Toplam skor, başarı yüzdesi ve "Tekrar Çöz" / "Notlara Dön" butonları.

---

### 5. Dil & Çeviriler — `locales/tr.json` & `locales/en.json`

#### [MODIFY] [tr.json](file:///d:/Workspace/StudyMate_AI/locales/tr.json) & [en.json](file:///d:/Workspace/StudyMate_AI/locales/en.json)

- Özet üretme, Quiz çözme, skor kartı ve yükleme metinlerinin eklenmesi.

---

## Verification Plan

### Automated Tests
```bash
npx tsc --noEmit
```

### Manual Verification
1. Mevcut bir notun detayına girilip "Özet Üret" butonuna basılacak ve `qwen/qwen3.6-27b` modelinden dönen özetin karta aktarıldığı görülecek.
2. "Quiz Üret" butonuna basılıp soruların başarıyla üretildiği ve JSON parse edildiği doğrulanacak.
3. "Quiz'i Çöz" butonuna tıklanarak interaktif quiz ekranında doğrular/yanlışlar işaretlenecek ve skor ekranı test edilecek.
