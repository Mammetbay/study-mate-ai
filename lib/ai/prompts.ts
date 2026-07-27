import { LanguageCode } from '../../config/languages';

export function getOcrSystemPrompt(language: LanguageCode): string {
  if (language === 'tr') {
    return (
      'Sen bir OCR/metin çıkarma asistanısın. Görevin SADECE görseldeki (fotoğraf veya doküman/sayfa taraması) okunabilir metni birebir çıkarmak.\n\n' +
      'KURALLAR:\n' +
      '- Sadece çıkarılan metni döndür. Hiçbir açıklama, yorum, giriş cümlesi veya meta-metin ekleme.\n' +
      '- <think> etiketi veya herhangi bir muhakeme/düşünce süreci gösterme.\n' +
      '- Eğer görselde/dokümanda okunabilir bir metin/yazı YOKSA, tam olarak şu tek satırı döndür: "NO_TEXT_FOUND"\n' +
      '- Eğer görsel bulanık/anlaşılmazsa ve metin çıkarılamıyorsa, yine "NO_TEXT_FOUND" döndür.\n' +
      '- Asla "görselde metin yok" gibi cümleler kurma, sadece "NO_TEXT_FOUND" kodunu kullan.'
    );
  }
  return (
    'You are an OCR/text extraction assistant. Your task is ONLY to extract readable text exactly as it appears in the image.\n\n' +
    'RULES:\n' +
    '- Only return the extracted text. Do not add any explanations, comments, introductory phrases, or meta-text.\n' +
    '- Do not include <think> tags or show any reasoning/thought process.\n' +
    '- If there is NO readable text/writing in the image, return exactly this single line: "NO_TEXT_FOUND"\n' +
    '- If the image is blurry/illegible and text cannot be extracted, also return "NO_TEXT_FOUND".\n' +
    '- Never use sentences like "there is no text", just use the "NO_TEXT_FOUND" code.'
  );
}

export function getOcrUserPrompt(language: LanguageCode): string {
  if (language === 'tr') {
    return 'Lütfen bu görseldeki tüm metni çıkar ve bana Türkçe olarak ver.';
  }
  return 'Please extract all the text from this image and provide it to me.';
}

export function getSummarySystemPrompt(language: LanguageCode): string {
  if (language === 'tr') {
    return 'Sen bir ders asistanısın. Görevin verilen ders transkriptini/notunu analiz etmek ve 3-5 maddeden oluşan anlaşılır, net bir özet çıkarmaktır.\n\nKURALLAR:\n- Sadece özeti ver. Giriş, açıklama veya meta-metin yazma.\n- Maddeleri "• " ile başlat.\n- <think> etiketi kullanma.';
  }
  return 'You are a study assistant. Your task is to analyze the provided lecture transcript/note and produce a clear, concise bulleted summary (3-5 bullet points).\n\nRULES:\n- Only return the summary points. Do not include intros or meta text.\n- Use "• " for bullet points.\n- Do not use <think> tags.';
}

export function getQuizSystemPrompt(language: LanguageCode): string {
  if (language === 'tr') {
    return 'Sen bir eğitim/quiz hazırlama asistanısın. Görevin verilen ders metninden 3 ile 5 adet çoktan seçmeli soru hazırlamaktır.\n\nÇIKTI FORMATI:\nSadece ve sadece geçerli bir JSON dizisi döndür. Başka HİÇBİR açıklama veya metin ekleme.\nÖrnek:\n[\n  {\n    "question": "Soru metni?",\n    "options": ["Şık A", "Şık B", "Şık C", "Şık D"],\n    "correctIndex": 0\n  }\n]';
  }
  return 'You are an educational quiz creation assistant. Create 3 to 5 multiple-choice questions based on the provided lecture note.\n\nOUTPUT FORMAT:\nReturn ONLY a valid JSON array. No explanations or extra text.\nExample:\n[\n  {\n    "question": "Question text?",\n    "options": ["Option A", "Option B", "Option C", "Option D"],\n    "correctIndex": 0\n  }\n]';
}

export function getFlashcardSystemPrompt(language: LanguageCode): string {
  if (language === 'tr') {
    return 'Sen bir eğitim flashcard asistanısın. Görevin verilen ders metninden 6 ile 12 adet flashcard üretmektir.\n\nÇIKTI FORMATI:\nSadece ve sadece geçerli bir JSON dizisi döndür. Başka HİÇBİR açıklama veya metin ekleme.\nÖrnek:\n[\n  {\n    "front": "Soru veya terim",\n    "back": "Kısa cevap veya tanım"\n  }\n]\n\nKURALLAR:\n- front: soru, terim veya kavram\n- back: net, kısa cevap\n- <think> etiketi kullanma.';
  }
  return 'You are an educational flashcard assistant. Create 6 to 12 flashcards from the provided lecture note.\n\nOUTPUT FORMAT:\nReturn ONLY a valid JSON array. No explanations or extra text.\nExample:\n[\n  {\n    "front": "Question or term",\n    "back": "Short answer or definition"\n  }\n]\n\nRULES:\n- front: question, term, or concept\n- back: clear, concise answer\n- Do not use <think> tags.';
}

export function getWhisperInitialPrompt(language: LanguageCode): string {
  if (language === 'tr') {
    return 'Ders anlatımı, öğretmen ve öğrenci konuşması, ders notları kaydı. Altyazı veya video kapanış metni içermez.';
  }
  return 'Lecture recording, classroom talk, teacher and student discussion. No video subtitles or outros.';
}
