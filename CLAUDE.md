# Dost Arabi (dostarabi.com) — Proje Notları

## Kökensel duruş: Anlamaya çalışıyoruz, anlatmaya değil

Bu ilke 2026-07-12'de kullanıcı tarafından kalıcı olarak onaylandı ve
sitenin bütün diğer ilkelerinin (daire/merkez, çizim kullanımı, dahil
her şeyin) üzerine oturduğu **en temel duruştur** — aşağıdaki bütün
kurallar bu duruşun ayrıntılarıdır, kendisi değil.

Biz Dost'u (Muhyiddîn İbnü'l-Arabî'yi) **anlamaya çalışıyoruz,
anlatmaya değil.** Dost gibi çok yüksek bir mertebede olan birini,
bizim gibi henüz hicapları kalkmamış ("perdeli") kişilerin tam olarak
anlaması mümkün değildir. Niyetimiz onu anlamaktır — bu site, o
anlama çabasının ta kendisidir; ulaşılmış, kapanmış bir sonuç değil.

**Bu, sitenin dilinde/sesinde şöyle yansımalı:**
- Metinler "İbn Arabî şunu söylüyor / kanıtlıyor / gösteriyor" gibi
  kapanmış, otoriter bir sesle değil; "bu ifadeyi şöyle okuyoruz,"
  "bize göre bu şuna işaret ediyor olabilir," "bu satırlar önümüze şu
  soruyu koyuyor" gibi, okuyucuyu da bu ortak anlama çabasına davet
  eden, arayan bir sesle yazılmalı.
- Konuk/İzutsu/Affifi gibi şârihlerin yorumları da "kesin doğru" olarak
  değil, "bir okuma," "bir yaklaşım" olarak sunulmalı — onlar da kendi
  mertebelerinden anlamaya çalışan kişilerdi, hakem değil.
- Bu hava kozmetik bir üslup meselesi değil, sitenin epistemik
  duruşudur. Sitenin her köşesinde — başlıklar, tanıtım metinleri,
  insight'lar, soru-cevaplar, hatta hata mesajları — sezilmeli: "biz
  burada Dost'u anlamaya çalışıyoruz, onu tarif etmiyoruz."

**Pratik sonuç:** Yeni yazılan HER metin (insight, analogy, soru-cevap,
tanıtım yazısı, araştırma notu) bu ruhla yazılmalı — bu, sona
bırakılabilecek isteğe bağlı bir rötuş değil, baştan düşünülmesi
gereken bir yazım kuralı. Geçmişte yazılmış içerik de zaman zaman bu
mercekle gözden geçirilip, gerekiyorsa daha alçakgönüllü, arayan bir
sese çevrilmeli; en görünür/çevresel metinler (site tanıtımı, bölüm
girişleri, karşılama ekranı) 2026-07-12'de bu ilk gözden geçirmeyle
güncellendi, ama bu tek seferlik bir "düzeltme" değil, kalıcı bir
hassasiyet olarak sürdürülmeli.

## Temel tasarım ilkesi: Daire ve merkez

Bu site, Muhyiddîn İbnü'l-Arabî'nin iç dünyasını ve varlık mertebelerini
görselleştirmeye çalışıyor. Sitenin tasarım dilinde şu ilke **kalıcı ve
her zaman geçerli** bir yön göstericidir:

> **"O'ndan geldik, O'na gidiyoruz. Seyahatimiz O'ndan O'na."**
> *(From Him we came, to Him we go. Our journey is from Him to Him.)*

İbn Arabî'nin ve tasavvufun iç dünyasında daire ve merkezindeki nokta imgesi
sürekli kullanılır — her şey başladığı yere döner. (Örnek: anne karnındaki
bir bebeğin, annesinin karnından annesinin kollarına çıkışı da dairesel bir
dönüştür.) Hayret makamının "insanı bir daire çizdirmesi" İbn Arabî'nin
kendi ifadesidir ve Hâller Haritası'ndaki son-başa dönüş okunun ilhamıdır.

**Bu yüzden:** Bu web sitesi için yapılan HER görsel/tasarım kararında,
mümkün olduğunca **dairesel formları** tercih et — grafik düzenleri, geçiş
animasyonları, dekoratif öğeler, yükleme/karşılama ekranları, ikonografi vb.
Doğrusal/dikey/kutu tabanlı düzenler yerine, anlam elverdiğinde döngüsel,
merkezli, "başlangıcına dönen" kompozisyonları tercih et. Bu, kozmetik bir
tercih değil, sitenin taşıdığı metafizik anlatıyla (varlığın Hak'tan çıkıp
Hakk'a dönüşü) doğrudan ilişkilidir.

Bu ilkeyi uygularken zorlama yapma — bir öğe doğası gereği dairesel değilse
(örn. bir arama kutusu), onu zorla daireye sokma. Ama bir seçenek olduğunda
(graf düzeni, animasyon eğrisi, bir bölümün çerçevesi, bir yükleme
göstergesi) dairesel/döngüsel olanı öncelikle düşün.

## İkinci temel ilke: Mümkün olan her yerde çizim kullan

Bu kural 2026-07-10'da kullanıcı tarafından kalıcı olarak onaylandı.
İbn Arabî'yi (Dost) anlamaya/anlatmaya çalışırken, iki veya daha fazla
kavram/terim arasındaki ilişki, fark veya karşıtlık **salt metinle**
anlatıldığında çoğu zaman soyut kalır. Mümkün olan her yerde, bu ilişkiyi
küçük, sade bir SVG çizimiyle görselleştirmeyi düşün — iki kartın yan yana
durup aralarındaki bağı okuyucunun kendi çıkarması yerine, o bağı doğrudan
gösteren bir şema. (Örnek: İllet-Malûl ilişkisi için karşılıklı ok çizimi
+ Allah-âlem için tek yönlü "vehb" oku ile karşılaştırma — bkz.
`assets/terimler.js` içindeki `diagramRenderers`.)

Bu, yeni içerik eklerken (yeni terimler, yeni kitaplar işlenirken) baştan
düşünülmesi gereken bir adım olmalı, sona bırakılan isteğe bağlı bir süs
değil. Geçmişte işlenmiş içerik (Fütûhât'tan çıkardığımız kavramlar,
terimler sözlüğü vb.) de zaman zaman bu gözle yeniden gözden geçirilip,
çizim eklenebilecek yerler varsa eklenmeli.

## Genel proje kuralları

- Statik site: vanilla HTML/CSS/JS + D3.js v7. Yeni framework/bağımlılık
  ekleme.
- Üç dil: TR/EN/PT-BR, `window.DostI18n` sistemi ile (`I18n.pick3()`,
  `I18n.getLang()`, `I18n.applyStatic()`).
- Veri dosyaları (`data/ibn-arabi/*.json`) düzenlenirken: hedefli `Edit`
  çağrıları kullan (asla toplu `Write`/yeniden serileştirme — mevcut
  formatlamayı bozar). Her değişiklikten sonra
  `python3 -c "import json; json.load(open(...))"` ile doğrula; sadece
  parse değil, beklenen anahtarların (örn. `cite` alanının yanlışlıkla
  `text` içine gömülmemesi gibi) yapısal olarak doğru yerde olduğunu da
  kontrol et.
- Git: asla force-push yok, asla amend yok (her zaman yeni commit). Commit
  trailer'ı: `Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>` ve
  `Claude-Session: https://claude.ai/code/session_01BjN3AdN1ydT99PkC2hMojC`.
- Commit'ten önce: JSON doğrulaması + Playwright ile deep-link/arama/
  cross-link/zoom/mobil dokunma testleri.
- Uygulamada bir teknik tanım yapılan her yerde, günlük hayattan uygun bir
  analoji ile açıklamayı tercih et (`analogy` alanı — `detail-analogy`
  CSS sınıfı ile görsel olarak diğer metinlerden ayrıştırılmış şekilde
  gösterilir).

## Yayın akışı: HER ZAMAN önce önizleme, sonra canlı (KULLANICI ONAYI ZORUNLU)

Bu kural 2026-07-09'da kullanıcı tarafından kalıcı olarak onaylandı ve tüm
gelecek oturumlarda geçerlidir — istisnasız her değişiklik için uygulanır,
"küçük" veya "basit" görünen değişiklikler dahil.

Üç repo var, sırasıyla:

1. **`claude/ibn-arabi-visualization-9hmpmh`** dalı (özel repo, `hacimurat1979/Dost`)
   — çalışma alanı. Her değişiklik önce buraya push edilir, test edilir.
2. **`hacimurat1979/dost-onizleme`**, `main` dalı — herkese açık ama
   `robots.txt` + `noindex` ile arama motorlarından gizli, Google Analytics'i
   kaldırılmış, üstte sarı "ÖNİZLEME" şeridi olan bir kontrol adresi:
   **`https://hacimurat1979.github.io/dost-onizleme/`**. (1) adımından sonra
   içerik buraya da push edilir (sadece `index.html`, `compare.html`,
   `assets/`, `data/` — `futuhat/`, `diger-eserler/`, `CNAME` kopyalanmaz;
   `index.html`'e preview-özel düzenlemeler eklenir: `<title>` başına
   `[ÖNİZLEME]`, `<meta name="robots" content="noindex, nofollow">`, Google
   Analytics script'i kaldırılır, `<body>` başına sarı "ÖNİZLEME" şeridi
   eklenir — bunlar private repo'nun kendi `index.html`'ine YAZILMAZ, sadece
   preview kopyasına özeldir, her senkronda tekrar uygulanmalı).
3. **`/workspace/dostarabipublic`**, `main` dalı — canlı site
   (dostarabi.com'u besleyen herkese açık ayna repo).

**KURAL 1 — Her önizleme güncellemesinden sonra linki paylaş.** Önizleme
reposuna her push'tan sonra (GitHub Pages'in deploy'u alması için ~20-40
saniye bekleyip curl ile doğruladıktan sonra), kullanıcıya önizleme linkini
**`https://hacimurat1979.github.io/dost-onizleme/`** açıkça paylaş — sadece
"önizlemeye aldım" deyip linki atlama. Kullanıcı farklı cihazlardan
bağlanabiliyor, linki her seferinde tekrar görmesi gerekiyor.

**KURAL 2 — Kullanıcı açıkça onaylamadan canlıya ASLA push etme.** Onay
gelmeden "canlıya aldım" deme veya `dostarabipublic`/`main`'e commit/push
yapma. Kullanıcı "tamam", "onaylıyorum", "canlıya al" gibi net bir onay
verene kadar bekle — bu, sohbetin en başındaki genel talimattan bağımsız,
bu proje için ek ve daha katı bir kuraldır.
