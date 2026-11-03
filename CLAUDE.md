# Dost Arabi (dostarabi.com) — canlı ayna repo

Bu repo, dostarabi.com'u besleyen **canlı aynadır**.
Burada doğrudan değişiklik yapılmaz.
Bütün çalışma özel repoda (`hacimurat1979/Dost`) yapılır
ve `scripts/sync-to-live.py` ile buraya kopyalanır.
Burada yapılan bir değişiklik bir sonraki senkronda kaybolur.

Kuralların tam ve güncel hâli özel repodaki `CLAUDE.md`'dedir.
Bu dosya yalnız onun özetidir (son güncelleme: 2026-10-21).

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
- **Açık Sorular yayından kaldırıldı (2026-10-07):** içeriği bizim
  sorularımızdı; `/acik-sorular` ana haritaya düşüyor.
- **Daphne makalelerine üçer soru (2026-10-09, kullanıcı kararı):** makalenin
  kendi akışından doğar; Dost'a ya da bizim bağlantılarımıza atıf yok.
- **Daphne'nin Ortak Temalar ve Bağlar Haritası sekmeleri (2026-10-10,
  kullanıcı kararı):** bizim kurduğumuz köprüleri gösterir; 2026-10-05
  öncesindeki dolu hâliyle geri getirildi. İstisna bu içerikle sınırlı;
  yeni tema/bağ önce kullanıcıyla karara bağlanır.
- **Daphne Eksen Seyri sekmesi (2026-10-19, kullanıcı kararı):** Eksen
  İplikleri'nin sayıya dökülmüş okuması (dört dilimde eksen sayıları,
  eksen başına üç alıntı özeti, birlikte geçen eksenler). Eksen
  etiketlemesini biz yaptık; sayfa yazıların ardındaki hayata, duyguya ya
  da kişiliğe dair hiçbir çıkarım yapmaz. İstisna bu sekmeyle sınırlı.
  Her taranan Daphne yazısında güncellenir: yazının eksenleri işaretlenir,
  sayılar profilden otomatik hesaplanır, alıntılar gözden geçirilir.
- **Daphne verisi canlıda şifrelidir (2026-10-21, kullanıcı kararı):**
  `data/gizli/*.enc` (AES-GCM; parola kullanıcıda, depoda yok). Düz metin
  Daphne dosyaları buraya konmaz; özel repodaki sync betiği şifreler.
  Burada Daphne verisi düz metin olarak asla eklenmez.
- **Gönül Defteri (2026-10-27, kullanıcı kararı):** `/gonul/` altındaki yazılar
  kullanıcının KENDİ sesidir, okuma özeti değil (kuralın adı konmuş istisnası,
  yalnız bu dizin). Sayfalar `scripts/gonul-uret.py` ile özel repoda üretilir;
  burada elle değişiklik yapılmaz. Yazı yoksa dizin hiç yoktur.
- **Kenar notlarım:** Daphne okumasında yalnız sahibine açık notlar; canlıda
  `data/gizli/*.enc` içinde şifreli (resimler dahil). Düz metin buraya eklenmez.
- **Mişkâtü'l-Envâr'da** her sayfa hadisin kendi Türkçe metniyle açılır.
- **Üç dil (TR/EN/PT) birlikte güncellenir.**
- **Yaptığımız işi olduğundan farklı göstermeyiz:**
  süre ya da emek şişirme yok ("yıllardır", "titizlikle", "binlerce").
- Şemalar ve çizimler korunur; künye/şeffaflık cümleleri
  ("bu şemayı biz çizdik") yorum değildir.

- **Bu repodaki `assets/*.js` ve `*.css` küçültülmüştür (2026-10-29):** özel repodaki okunur kaynaklar
  yayın adımında esbuild ile küçültülüp buraya yazılır (`scripts/canli-kucult.py`). Burada elle düzenleme
  yapılmaz; kaynak özel repodadır.
- **Okuma araçları (2026-10-29):** Dinle, Okuma kipi, paragraf notu (yalnız cihazda), alıntı/atıf, yan yana
  oku, Defterim yedeği, katmanlı çevrimdışı paket, bugünün parçası. Hepsi okuyucunun kendi cihazında çalışır;
  site içeriği değil, okuma araçlarıdır. Çeviri gözden geçirme künyesi yalnız kayıt varsa görünür
  (`data/ceviri-gozden-gecirme.json`, şu an kayıt yok).

- **Mobil kabuk V3 "Üç Kapı" (2026-10-30, kullanıcı kararı):** alt çubuk Keşfet · Oku · Defterim; Ara üstte;
  haritada tek "Görünüm" hapı. Geri alma: `?kabuk=v2`. Kaynak özel repoda.
- **Okuma işaretleri ve araçlar (2026-10-30):** paragraf bağlantısı (`#pN`), vurgulayıcı ve Defterim etiketleri
  (yalnız cihazda), aramada eşleşen cümle önizlemesi, kısım künyesi, `?` kısayol sayfası; @revise/@share ek araçları.

- **Şemalar Arşivi (2026-10-31, kullanıcı onayı):** `/semalar/` sitedeki şemaları köken halkasıyla toplar (altın = Dost'un eli,
  mürekkep = bizim çizdiğimiz, mavi = bizim okuma çerçevemiz); Berzah ve Hayal şemaları yalnız aynı terimin geçtiği
  yerleri ve kısmın kendi cümlesini gösterir, bağın anlamı yazılmaz. Kaynak özel repoda; burada elle değişiklik yapılmaz.
- **Paragraf kuralı (2026-10-31, kullanıcı kararı):** uzun tek paragraf cümle sınırlarında görsel alt paragraflara ayrılır
  (otomatik, `par-ara` işareti); ✕ düğmesi paneli kapatır; kişiler arası "rakip/rekabet" çerçevesi bizim sesimizle yazılmaz.

- **Yan Yana: Dost ve Kuantum Fiziği (2026-11-01, kullanıcı onayı):** `/yan-yana/` altı düz statik sayfalar; Dost'un
  metninden alıntıları fizik literatürüyle yan yana koyan BİZİM okuma çerçevemizdir, okuma özeti değildir (kuralın adı konmuş
  istisnası); her sayfada künye, "aynıdır/doğrulandı" yok; yalnız Türkçe; `noindex`, sitemap'te yok. Sayfalar özel
  repoda `scripts/yanyana-uret.py` ile üretilir; burada elle değişiklik yapılmaz.

- **İletişim (2026-11-02, issue #9):** e-posta adresi sitede hiçbir yerde düz metin durmaz; altbilgideki "İletişim" bağlantısı
  `/iletisim/` sayfasına gider, "Yaz" düğmesi adresi `assets/iletisim.js` ile kurup kullanıcının e-posta uygulamasını açar.
  Kaynak özel repoda (`scripts/iletisim-uret.py`); burada elle değişiklik yapılmaz.

- **Yan Yana, 2 Kasım turu (2026-11-02, kullanıcı onayı):** `/yan-yana/makaleler/` (kuantum fiziğinin elli konusunda 82 makale özeti; deney·kuram·yorum
  etiketleri bizim sınıflamamız; kendi özetine bakılmadan yazılanlar işaretli), `/yan-yana/paralel/` (okurun fizik makalesini ve Dost'tan bir sırlı anlatımı yan yana
  okuduğu masa; site eşleştirme önermez, çiftler cihazda durur), Hesapla gör on hesap, zaman çizgisi. Kaynak özel repoda; burada elle değişiklik yapılmaz.
- **Arayüz (2026-11-02):** detay panellerinde Ayrıntı katmanı, Oku araçları tek halkada, @revise menüsü sadeleşti, `@daphne`/`@share` düz sayfalarda da çalışır.

- **Yan Yana üç dilli (2026-11-02):** `/yan-yana/en/` ve `/yan-yana/pt/` (Türkçe kaynağın çevirisi, bizim aktarımımız); yalnız sırlı anlatımlar dizini Türkçe (Sığmayanlar, Füsûs, Denetim 2026-11-03'te çevrildi).
  Fizik makaleleri 63 konu; kısaltmalar (HEM…) tam adla yazılır; sözlükte sitedeki düğümlere köprü. Kaynak özel repoda; burada elle değişiklik yapılmaz.

- **Yan Yana gezinme ve araçlar (2026-11-03):** Bölümler menüsü + arama, biçimler arası ileri/geri, içindekiler, cihazda "okudum" işareti, terim kutusu, Kaynaklar süzgeci, Genel sonuçta yakınlık haritası; sayfalar aramaya ve sitemap'e açıldı. Kaynak özel repoda.

## Yayın akışı (2026-10-06)

Önizleme adımı kaldırıldı.
Özel repoda `npm run kontrol` temiz çıkınca
`scripts/sync-to-live.py` çalıştırılır,
bu repoda commit edilip `main`'e gönderilir; onay beklenmez,
ne yapıldığı kullanıcıya bildirilir.
Asla force-push ya da amend yapılmaz
(tek istisna: 2026-10-21'de kullanıcı onayıyla Daphne düz metnini
geçmişten silmek için yapılan bir defalık force-push).
