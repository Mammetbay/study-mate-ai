# AGENTS.md — StudyMate AI

Bu dosya AI kodlama ajanları (Claude Code, Kilo Code, Cursor) içindir. Görevine başlamadan önce aşağıdaki referans dosyaları oku.

## Önce Oku

- `docs/studymate-ai-scope.md` — tam özellik kapsamı, tech stack kararları, veri modelleri, klasör yapısı, zaman çizelgesi. **Bu projenin tek doğru kaynağıdır (source of truth).** Belirsiz kaldığın her noktada önce buraya bak.
- `DESIGN.md` — renk, tipografi, spacing, component kuralları. UI kodu yazarken buradaki değerleri kullan, tahmin etme.

## Proje Özeti

React Native + Expo ile geliştirilen, satılabilir bir kod şablonu (Codester). Ses kaydı veya fotoğraftan otomatik transkript, özet, quiz ve flashcard üreten bir öğrenci uygulaması. Detay: `docs/studymate-ai-scope.md`.

## Tech Stack (sabit, değiştirme)

- React Native + Expo + Expo Router
- TypeScript strict mode
- State: Context API — Redux/Zustand/MobX YOK
- Yerel veri: expo-sqlite — backend/API sunucusu YOK
- Stil: StyleSheet + `lib/theme.ts` — NativeWind/Tailwind YOK
- i18n: react-i18next, diller `config/languages.ts`'den okunur
- AI: Groq Whisper (transkript), Groq Vision (fotoğraf OCR), Groq Llama (özet/quiz)

## Build & Çalıştırma

```
npm install
npx expo start
npx expo start --ios
npx expo start --android
npx tsc --noEmit        # typecheck, her değişiklikten sonra çalıştır
```

## Kod Stili

- Sadece fonksiyonel komponent + hook, class component yok
- `any` kullanma, strict TypeScript
- Bir dosyada bir komponent, PascalCase dosya adı

```typescript
// components/ui/Button.tsx — örnek pattern
import { theme } from '@/lib/theme';

export function PrimaryButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable style={styles.button} onPress={onPress}>
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { backgroundColor: theme.colors.primary, borderRadius: theme.radius.button },
  label: { color: theme.colors.textOnPrimary, fontFamily: 'Inter-Bold' },
});
```

## Kesin Sınırlar (asla yapma)

- Groq API key'i asla hardcode etme — `.env`'den `process.env` ile oku, alıcı kendi key'ini girer
- Kullanıcı hesabı, auth, backend sunucu, billing EKLEME — bu bir client-only şablon (bkz. scope doc §1, "Dahil Değil")
- Redux/Zustand/MobX ekleme — Context API yeterli
- NativeWind/Tailwind ekleme — StyleSheet + theme.ts kullan
- UI metnini hardcode etme — her metin `react-i18next` üzerinden `locales/*.json`'dan gelir
- `config/languages.ts` dışında bir yerde dil union'ı (`'tr' | 'en'` gibi) tanımlama — tek kaynak orası

## Tasarım Tutarlılığı

- Tüm renk/spacing/radius değerleri `DESIGN.md`'den gelir, yeni değer icat etme
- Alt tab bar tüm ana ekranlarda (Home, Notes, Quiz, Settings) piksel piksel aynı olmalı — ikon seti, spacing, aktif/pasif durum

## Güvenlik

- `.env` gitignore'da — asla commit etme
- Kaynak kodda hiçbir secret/API key hardcoded olmamalı

## Commit Stili

- Küçük, tek amaçlı commit'ler, geniş zaman: `Add quiz scoring logic`, `Fix tab bar icon consistency`
