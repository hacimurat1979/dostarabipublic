# Dost Arabi (dostarabi.com) — canlı ayna repo

Bu repo, dostarabi.com'u besleyen **canlı aynadır**.
Burada doğrudan değişiklik yapılmaz.
Bütün çalışma özel repoda (`hacimurat1979/Dost`) yapılır
ve `scripts/sync-to-live.py` ile buraya kopyalanır.
Burada yapılan bir değişiklik bir sonraki senkronda kaybolur.

Kuralların tam ve güncel hâli özel repodaki `CLAUDE.md`'dedir.
Bu dosya yalnız onun özetidir (son güncelleme: 2026-10-06).

## Geçerli temel kurallar

- **Site yalnız okumaların özetidir (2026-10-05, en üst kural).**
  Yazılan her metin okuduğumuz kaynağın özetidir:
  metnin ne söylediği, doğrudan alıntılar,
  okuduğumuz şârihlerin görüşü (onların görüşü olarak),
  olgusal bilgi (künye, tahrîc, tarih, yapı).
  Bizim değerlendirmemiz, çıkarımımız, benzetmemiz (`analogy` artık
  kullanılmaz) ve kendi kurduğumuz bağlantılar yazılmaz.
  Kendi çıkarımlarımız ancak kullanıcıyla birlikte karar verildikten
  sonra işlenir.
- **Mişkâtü'l-Envâr'da** her sayfa hadisin kendi Türkçe metniyle açılır.
- **Üç dil (TR/EN/PT) birlikte güncellenir.**
- **Yaptığımız işi olduğundan farklı göstermeyiz:**
  süre ya da emek şişirme yok ("yıllardır", "titizlikle", "binlerce").
- Şemalar ve çizimler korunur; künye/şeffaflık cümleleri
  ("bu şemayı biz çizdik") yorum değildir.

## Yayın akışı (2026-10-06)

Önizleme adımı kaldırıldı.
Özel repoda `npm run kontrol` temiz çıkınca
`scripts/sync-to-live.py` çalıştırılır,
bu repoda commit edilip `main`'e gönderilir; onay beklenmez,
ne yapıldığı kullanıcıya bildirilir.
Asla force-push ya da amend yapılmaz.
