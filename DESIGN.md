# DESIGN.md — StudyMate AI

Bu dosya AI kodlama ajanları (Claude Code, Kilo Code, Cursor vb.) için yazılmıştır. UI kodu üretirken renk, tipografi, spacing ve component kurallarını burada belirtilen değerlerden al — tahmin etme, uydurma.

Görsel referans için: `/assets/design-reference/` klasöründeki PNG ekran görüntülerine bak (Banani ile üretildi). Bu dosyadaki değerler o görsellerin makine-okunabilir karşılığıdır.

---

## Brand / Ürün

StudyMate AI — üniversite öğrencileri için gece çalışma temalı bir AI ders asistanı. Genel his: sakin, odaklanmış, güvenilir. Oyuncul/çocuksu DEĞİL.

---

## Renkler

### Dark mode (varsayılan)

| Kullanım | Hex |
|---|---|
| Background | `#0F1115` |
| Card / surface | `#1A1D24` |
| Primary (buton, aktif tab, link) | `#F59E0B` |
| Primary pressed | `#D97706` |
| Accent (doğru cevap, ilerleme çubuğu) | `#2DD4BF` |
| Error (yanlış cevap) | `#F87171` |
| Text primary | `#F1F2F4` |
| Text secondary / muted | `#9CA3AF` |

### Light mode

| Kullanım | Hex |
|---|---|
| Background | `#F8F9FB` |
| Card / surface | `#FFFFFF` |
| Text primary | `#111827` |
| Text secondary | `#6B7280` |
| Primary / Accent / Error | Dark mode ile aynı |

**Kural:** Amber (`#F59E0B`) SADECE primary CTA butonları, aktif tab ikonu ve linkler için kullanılır. Rastgele dekoratif yerlerde kullanma.

---

## Tipografi

- Font: **Inter** (expo-google-fonts/inter)
- Başlıklar: Bold (700), gövde metin: Regular (400)
- Türkçe karakterler (ç, ğ, ı, ö, ş, ü) her ekranda test edilmeli

---

## Spacing & Radius

| Öğe | Değer |
|---|---|
| Kart köşe yarıçapı | 16px |
| Buton / input köşe yarıçapı | 12px |
| Ekran kenar boşluğu (padding) | 16-20px |
| Kartlar arası boşluk | 12px |

---

## Component Kuralları

- **Primary buton:** Dolu amber arkaplan, beyaz/açık metin, 12px radius
- **Secondary buton:** Outline (kenarlık), transparan arkaplan, amber kenarlık
- **Kart:** `#1A1D24` arkaplan (dark mode), 16px radius, hafif gölge
- **Alt tab bar:** TÜM ana ekranlarda (Home, Notes, Quiz, Settings) birebir aynı — aynı ikon seti, aynı spacing, aynı aktif/pasif renk durumu. Bu kural ihlal edilemez.

---

## İkonlar

- Tek bir ikon seti kullan: outline/line stil, 2px stroke, yuvarlak uçlar
- Ekranlar arası ikon stili DEĞİŞMEZ — özellikle alt tab bar ikonları

---

## Görsel Referans Konumu

`/assets/design-reference/` klasörüne şu dosyaları koy (Banani export'ları):
`HomeDashboard.png`, `CreateNote.png`, `NoteDetail.png`, `QuizScreen.png`, `FlashcardScreen.png`, `Settings.png`, `OnboardingSlide1-3.png`

Bir ekranı kodlarken ilgili PNG'yi + bu dosyayı birlikte referans göster.
