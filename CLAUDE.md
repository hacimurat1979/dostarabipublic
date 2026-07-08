# Dost Arabi (dostarabi.com) — Proje Notları

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
  Önce `claude/ibn-arabi-visualization-9hmpmh` dalına (özel repo), sonra
  aynı değişiklikleri `/workspace/dostarabipublic` üzerinde `main` dalına
  (herkese açık ayna repo) push et.
- Commit'ten önce: JSON doğrulaması + Playwright ile deep-link/arama/
  cross-link/zoom/mobil dokunma testleri.
- Uygulamada bir teknik tanım yapılan her yerde, günlük hayattan uygun bir
  analoji ile açıklamayı tercih et (`analogy` alanı — `detail-analogy`
  CSS sınıfı ile görsel olarak diğer metinlerden ayrıştırılmış şekilde
  gösterilir).
