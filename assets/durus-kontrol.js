/* Dost Arabî — duruş taraması (s8).
 *
 * Ne yapar: gizli düzenleme kipi (@revise) açıkken CLAUDE.md'de yazılı
 * duruşumuza uymayabilecek yerleri işaretler. İki yolu var:
 *   1) SAYFA TARAMASI — açık olan sayfadaki metin kutularına işaret koyar.
 *   2) SİTE TARAMASI — veri dosyalarının hepsini indirip tarar ve bulguları
 *      tek listede gösterir. Sayfa sayfa gezmeye gerek kalmaz; asıl
 *      kullanım biçimi budur.
 *
 * Kurallar `research/anlayis-evrimi/DURUS_KONTROL.md`'den türetildi;
 * ikisi elle senkron tutulur.
 *
 * Ne YAPMAZ: hiçbir metni değiştirmez, hiçbir şeyi sunucuya göndermez,
 * sıradan okuyucuya hiçbir şey göstermez. Bulduğu şey bir iddia değil,
 * bir bakma davetidir -- her işaret susturulabilir.
 *
 * En önemli tek karar: <em> içindeki metin TARANMAZ. Sitede alıntılar
 * <em> ile işaretleniyor; Dost'un/Konuk'un/Daphne'nin kendi kesinliği ya
 * da kendi süre ifadesi bizim iddiamız değil (CLAUDE.md "Kapsam DIŞI").
 *
 * Canlıda da yayındadır (kullanıcı kararı, 2026-07-29): sync-to-live.py
 * artık dosyanın canlıda VAR olduğunu doğrular. Bu başlık uzun süre
 * tersini söyledi ("yalnızca önizlemede"); karar değişince yorum
 * unutulmuştu, 2026-08-05 çapraz denetiminde yakalandı.
 */
(function () {
  "use strict";

  // s7: kod "s6" derken belge (DURUS_KONTROL.md) "sürüm 5" diyordu ve
  // ikisinde de aynı 14 kural vardı -- numaralar bir noktada ayrışmış,
  // fark edilmemişti. Dört yeni kural eklenirken ikisi s7'de eşitlendi.
  // s8: rekabet-dili (kullanıcı bulgusu; 19 kural).
  // s9: sure-sisirme'ye cümle kapsamlı BIZ_SESI koşulu. Kural sayısı
  // değişmedi; kuralın kapsamı, kendi `neden`inin zaten söylediği yere
  // ("kendimiz hakkında") çekildi. Ölçüm K1'in yanında.
  // s10: sahiplik testi Türkçe eklere açıldı ve İKİYE ayrıldı (dar/geniş),
  // çünkü olumlu ve olumsuz kutup aynı kalıbı kaldırmıyor. bag-kimin
  // 54'ten 20'ye indi, öteki kuralların sayısı değişmedi. Ölçüm G7'nin
  // yanında.
  // s11 (2026-10-09): 2026-10-05'in "site yalnız okumaların özetidir"
  // kuralına göre yedi yeni kural (değerlendirme, çekince, birinci çoğul
  // çıkarım, okuma yolculuğu, benzetme, modern bilim, kendi bağımız;
  // ölçüt scripts/ayiklama/KILAVUZ.md). Eski "Yerine:" önerilerinin
  // bir kısmı artık YASAK kalıpları öneriyordu ("şöyle okuyoruz", "bize
  // göre", "olabilir") -- hepsi "Dost … diyor" kalıbına çevrildi. Eski
  // kapalı-ses / rekabet / gösterme kuralları "Dost … diyor" diye
  // aktaran cümlelerde susuyor (AKTARIM): oradaki kesinlik ya da yarış
  // kaynağın sözü, bizim değil.
  var SURUM = "s11";
  var DISMISS_KEY = "dost-durus-susturulan";
  // Repoda paylaşılan susturmalar (karar defteri deseni): bir cihazda
  // verilen "Bu doğru — kaldır" kararları dışa aktarılır, Claude bu
  // dosyaya işler, öteki cihazlar açılışta okur.
  var PAYLASILAN = "data/durus-susturulan.json";

  // YALNIZ TÜRKÇE (s3, kullanıcı kararı). Gerekçe: kalıplar Türkçe için
  // yazıldı ve Türkçede ölçüldü; üç dile birden nişan almak hem kuralları
  // bulanıklaştırıyordu hem üç kat gürültü üretiyordu. İş akışı da buna
  // uygun: bir metni Türkçesinden düzeltiyoruz, sonra İngilizce ve
  // Portekizcesi ona göre yeniden yazılıyor (bkz. CLAUDE.md, "üç dilde
  // birlikte revizyon" kuralı). Yani Türkçeyi taramak üçünü de taramak
  // demek -- yeter ki o kural tutulsun.
  function turkceMi() {
    return !window.DostI18n || window.DostI18n.getLang() === "tr";
  }

  // --- ortak koşullar ---------------------------------------------------

  // "Bu söz/bağ bizim" diyen işaretler. Birden çok kural buna bakıyor:
  // CLAUDE.md'nin künye kuralları yalnız KENDİMİZ hakkındaki cümleler için
  // geçerli, âlemin tarifi için değil.
  //
  // s10: burası eskiden `\b(biz|bizim|bizce|...)\b` idi ve yanındaki
  // yorum "bu kalıpların hepsi ASCII harfle başlıyor, sınır doğru
  // kuruluyor" diyordu. Kelimenin BAŞI doğruydu, SONU değildi: Türkçe
  // eklemeli bir dil ve `\bbiz\b` "bize"ye eşleşmiyor -- "bize göre",
  // yani bir okumanın bizim olduğunu söylemenin en sık biçimi, bu teste
  // görünmüyordu. Ölçüldü: bag-kimin'in 54 isabetinin 8'i tam olarak
  // "bize/bize göre" diyen cümlelerdi ve hiçbiri sayılmıyordu; cümle
  // kapsamında SAHIPLIK'in eşleşme sayısı 54'te 0'dı.
  //
  // Bu, dosyanın iki yerde zaten belgelediği hatanın (JS'in \b'si ASCII)
  // üçüncü örneği -- orada kelimenin başı, burada sonu. Zamir artık
  // ekleriyle birlikte yazılıyor, sınırlar da ONEK/SONEK ile Unicode
  // farkında kuruluyor.
  // İKİ AYRI TEST, çünkü sahiplik iki ZIT kutupta kullanılıyor ve tek
  // kalıp ikisine birden yaramıyor:
  //
  //   OLUMLU kutup (sure-sisirme, emek-sisirme, sureklilik-ima):
  //     "yalnız BİZİM hakkımızdaki cümlede tetiklen". Burada testin DAR
  //     olması gerekir -- iddianın öznesi biz olmalıyız.
  //   OLUMSUZ kutup (bag-kimin):
  //     "bağın bizim olduğu SÖYLENMEMİŞSE işaretle". Burada testin GENİŞ
  //     olması gerekir -- konuştuğumuzu gösteren herhangi bir işaret yeter.
  //
  // Ölçüldü (2026-08-29): tek geniş kalıp ikisine birden verildiğinde
  // bag-kimin 54'ten 27'ye indi (doğru), ama olumlu kutuptaki üç kural
  // 4 YENİ YANLIŞ ALARM üretti -- "O her gün bir iştedir" âyeti,
  // Süleyman kıssası, "binlerce mürde-nefis" (Füsûs'un kendi sözü) ve
  // İbn Arabî'nin Ebû Yahya ile "yıllarca süren dostluğu". Dördünde de
  // cümle "Bize göre…" ile açılıyor; ama "bize göre" BİZİM HÜKMÜMÜZE
  // bağlanıyor, sürenin/ölçeğin sahibi hâlâ kaynak. Yani geniş kalıp
  // olumlu kutupta çerçeveyi içerikle karıştırıyor.
  var SAHIPLIK = new RegExp(
    "(?<![\\p{L}\\p{N}])(?:biz|bizim|bizce|kuruyoruz|kurduğumuz|kurduk" +
    "|okuyoruz|okumamız|okuma denemesi|yazdığımız|izlediğimiz" +
    "|biriktirdiğimiz|taradığımız)(?![\\p{L}\\p{N}])", "iu");

  // s10: geniş test. Eskiden yalnız dar test vardı ve `\bbiz\b`
  // "bize"ye eşleşmiyordu -- Türkçe eklemeli bir dil, "bize göre" ise bir
  // okumanın bizim olduğunu söylemenin en sık biçimi. Ölçüldü:
  // bag-kimin'in 54 isabetinin 8'i tam olarak "bize/bize göre" diyen
  // cümlelerdi ve hiçbiri sayılmıyordu; cümle kapsamında dar testin
  // eşleşme sayısı 54'te 0'dı, yani koşul fiilen ölüydü.
  //
  // Bu, dosyanın iki yerde zaten belgelediği hatanın (JS'in \b'si ASCII)
  // üçüncü örneği -- orada kelimenin BAŞI kaçıyordu, burada SONU.
  var SAHIPLIK_GENIS = new RegExp(
    "(?<![\\p{L}\\p{N}])(?:biz(?:e|de|den|i|im|imiz|ce)?" +
    // birinci çoğul iyelik ortacı: "ettiğimiz", "okuduğumuz", "gördüğümüz"
    "|[\\p{L}]+[dt][ıiuü]ğ[ıiuü]m[ıiuü]z" +
    "|kuruyoruz|kurduğumuz|kurduk|okuyoruz|okumamız|okuma denemesi" +
    "|yazdığımız|izlediğimiz|biriktirdiğimiz|taradığımız)(?![\\p{L}\\p{N}])", "iu");
  function BIZIM(metin) { return SAHIPLIK.test(metin); }
  // Geniş test ayrıca birinci çoğul ÇEKİMİ de sayar ("gördük", "buluyoruz"):
  // olumsuz kutupta soru "bu cümlede sesimiz duyuluyor mu", ve bir fiil
  // çekimi bunu zamir kadar açık söylüyor. BIRINCI_COGUL aşağıda tanımlı.
  function BAGSIZ(metin) {
    return !SAHIPLIK_GENIS.test(metin) && !BIRINCI_COGUL.test(metin);
  }

  // Bir isabetin ÖNÜNDE, yakınında bir nakil işareti var mı? Sitede her
  // alıntı <em> ile sarılmıyor -- özellikle esma.json'da "İbn Arabî: '…'"
  // biçiminde düz tırnaklı nakiller var ve Türkçede düz tırnak aynı
  // zamanda kesme işareti olduğu için ("Hakk'ın") onları körlemesine
  // silemiyoruz. Onun yerine nakli, kendinden önce gelen atıf ifadesinden
  // tanıyoruz. Ölçüldü: kapali-ses isabetlerinin çoğu bu türdendi.
  // s11: kesme işareti ardından harf geliyorsa iyelik ekidir ("Dost'un",
  // "İbn Arabî'nin"), nakil değil. Önceki kalıp bunu ayırmıyordu: "Dost'un"
  // geçen her cümlenin ardındaki 170 karakter "alıntı" sayılıp hiç
  // taranmıyordu -- değerlendirmede "Bize göre … Dost'un en çarpıcı …"
  // deneme cümlesinin yalnız ilk kelimesi yakalanıyordu.
  var NAKIL = /(İbn Arabî|İbn Arabi|Dost|Konuk|İzutsu|Affifi|Daphne|şöyle diyor|şöyle der|şöyle yazıyor|buyurur|diyor ki|anlatıyor|aktarıyor|nakleder|yazıyor)\s*(?:[-–—:"“‘]|['’](?![\p{L}]))/iu;
  function NAKIL_DISI(metin, index) {
    return !NAKIL.test(metin.slice(Math.max(0, index - 170), index));
  }

  // İsabetin geçtiği CÜMLE bizim sesimizde mi? SAHIPLIK'ten farkı iki
  // katmanlı: (1) kapsam cümle, paragraf değil -- paragrafın uzağındaki
  // bir "biz" yakındaki bir övünmeyi aklamasın; (2) SAHIPLIK'in sabit
  // sözcük listesine ek olarak birinci çoğul ÇEKİMİ de sayılıyor
  // ("uğraşıyoruz", "taradık"), çünkü liste ne kadar uzasa da her fiili
  // sayamaz.
  // Ek "-ız/-iz" (isim yüklemi: "hazırız") BİLEREK yok: "tanımadığınız"
  // gibi ikinci çoğullara takılıyordu -- ölçtük, c1k4'ün günlük hayat
  // analojisini bu yüzden bizim sesimiz sanıyordu.
  var BIRINCI_COGUL =
    /[\wçğıöşüÇĞİÖŞÜ]{2,}(?:[ıiuü]yoruz|[ıiuü]yorduk|acağız|eceğiz|[dt][ıiuü]k|[dt]ik|m[ıiuü]ş[ıiuü]zdır)(?![\wçğıöşüÇĞİÖŞÜ])/i;
  function cumleyiAl(metin, index) {
    var bas = Math.max(metin.lastIndexOf(".", index), metin.lastIndexOf("?", index),
                       metin.lastIndexOf("!", index), metin.lastIndexOf(";", index));
    var son = metin.indexOf(".", index);
    return metin.slice(bas + 1, son < 0 ? metin.length : son + 1);
  }
  function BIZ_SESI(metin, index) {
    var c = cumleyiAl(metin, index);
    return SAHIPLIK.test(c) || BIRINCI_COGUL.test(c);
  }

  // s11: AKTARIM -- isabetin cümlesi bir kaynağın ne dediğini mi
  // aktarıyor? Sitenin özet sesi "Dost … diyor / anlatıyor / ayırıyor";
  // bu çerçevede geçen bir kesinlik, yarış ya da değerlendirme kaynağın
  // sözüdür. Ölçüt iki parçalı: cümlede üçüncü tekil bir aktarım fiili
  // (ya da "Konuk'a göre" gibi bir kaynak atfı) VAR ve bizim sesimiz
  // (bize/bizce, birinci çoğul çekim) YOK. Özne çoğu cümlede düşük ("…
  // diye anlatıyor"); sitede üçüncü tekil aktarım fiilinin öznesi
  // geleneksel olarak kaynaktır.
  var AKTARIM_FIIL = new RegExp("(?<![\\p{L}\\p{N}])(?:diyor|der|söylüyor|söyler|anlatıyor|anlatır|aktarıyor|aktarır|ayırıyor|ayırır" +
    "|sayıyor|sayar|belirtiyor|açıklıyor|açıklar|yazıyor|yazar|naklediyor|nakleder|soruyor|ekliyor|bildiriyor" +
    "|uyarıyor|tarif ediyor|tanımlıyor|vurguluyor|hatırlatıyor|kaydediyor|ifade ediyor|dile getiriyor|zikrediyor" +
    "|buyuruyor|buyurur|yorumluyor|cevap veriyor|karşılık veriyor|bağlıyor|benzetiyor|kıyaslıyor|örnekliyor" +
    "|kuruyor|sunuyor|getiriyor|gösteriyor|ele alıyor|tartışıyor|işliyor|bulunuyor|bulunur|uyarır|yorumlanıyor" +
    "|açılıyor|kapanıyor|geçiyor|başlıyor|devam ediyor" +
    "|diye|der ki|dediği|dediğine|söylediği|anlattığı|aktardığı|diyerek)(?![\\p{L}\\p{N}])", "iu");
  var KAYNAGA_GORE = /(?:Dost|İbn Arabî|İbn Arabi|Konuk|Konevî|Kâşânî|Kayserî|Cendî|İzutsu|Izutsu|Affifi|Chittick|Corbin|Knysh|Daphne|şârih|metn)[’']?(?:[ae]|y[ae]|n[ae]|ın[ae]|in[ae]|un[ae]|ün[ae]) göre/i;
  // Kaynak adı + herhangi bir üçüncü tekil "-yor" fiili de aktarımdır
  // ("Dost bu fikri bir benzetmeyle somutlaştırıyor") -- fiil listesi ne
  // kadar uzasa da her fiili sayamaz.
  var KAYNAK_ADI = /(?:Dost|İbn Arabî|İbn Arabi|İbnü'l-Arabî|Konuk|Konevî|Kâşânî|Kayserî|Cendî|İzutsu|Izutsu|Affifi|Chittick|Corbin|Knysh|Daphne)(?![\p{L}])/u;
  var UCUNCU_TEKIL = /[\p{L}]{2,}(?:yor|yorlar)(?![\p{L}])/u;
  function AKTARIM(metin, index) {
    var c = cumleyiAl(metin, index);
    if (SAHIPLIK_GENIS.test(c) || BIRINCI_COGUL.test(c)) return false;
    return AKTARIM_FIIL.test(c) || KAYNAGA_GORE.test(c) || (KAYNAK_ADI.test(c) && UCUNCU_TEKIL.test(c));
  }
  function AKTARIM_DISI(metin, index) {
    return NAKIL_DISI(metin, index) && !AKTARIM(metin, index);
  }
  // Künye/şeffaflık cümleleri ("bu şemayı biz çizdik", "İngilizce çeviri
  // bizim aktarımımız") yorum değil, dürüstlük -- birinci çoğul taşısalar
  // da okuma-yolculuğu kuralından muaf (KILAVUZ.md, KORU).
  var KUNYE = /(?:çizdik|çizildi|çiziyoruz|aktarımımız|çevirimiz|çevirdik|aktardık|derledik|işaretledik|kısalttık|sadeleştirdik|ekledik|dizdik|sıraladık|numaraladık|dokunarak|tıklayarak|çevirisini|şerhini|tercümesini|çalışmasını|sırasını izl|bize ait)/i;
  function KUNYE_DISI(metin, index) {
    return NAKIL_DISI(metin, index) && !KUNYE.test(cumleyiAl(metin, index));
  }

  // JS'in \b'si ASCII: "şüphesiz" sözcüğünün başındaki ş bir "word
  // character" sayılmadığı için /\bşüphesiz\b/ HİÇ eşleşmiyor. s1'de bu
  // sessizce yanlış çalışıyordu (Türkçe harfle başlayan bütün kalıplar
  // kaçıyordu; Python'la yaptığımız ön ölçüm bunu göstermemişti, çünkü
  // Python'un \b'si Unicode farkında). Sınırları Unicode harf/rakam
  // sınıflarıyla kendimiz kuruyoruz.
  var ONEK = "(?<![\\p{L}\\p{N}])";
  var SONEK = "(?![\\p{L}\\p{N}])";
  function tamKelime(alt) { return new RegExp(ONEK + "(?:" + alt + ")" + SONEK, "giu"); }
  function basKelime(alt) { return new RegExp(ONEK + "(?:" + alt + ")", "giu"); }

  // --- Kurallar (DURUS_KONTROL.md s2) ----------------------------------
  // `re` global olmalı: bir metinde birden çok isabet sayılabilsin diye
  // lastIndex sıfırlanarak kullanılıyor.
  var KURALLAR = [
    {
      id: "sure-sisirme", seviye: "kural", ad: "Süre şişirme",
      re: tamKelime("yıllar boyunca|yıllardır|yıllarca|aylar boyunca|aylardır|haftalardır|uzun süredir|uzun zamandır|nice zamandır"),
      neden: "Kendimiz hakkında süre iddiası. CLAUDE.md: “Okuma tarihimiz kısa; uzunmuş gibi yazmak yalandır.”",
      yerine: "Süre değil kapsam yaz: “bu ciltte”, “okuduğumuz bölümlerde”, “şimdiye kadar” — ya da sayı ver.",
      // Kural, kendi `neden`inde "KENDİMİZ hakkında" diyordu ama bunu hiç
      // sınamıyordu; kardeşi emek-sisirme'de `kosul: BIZIM` vardı, burada
      // yoktu. CLAUDE.md süre ifadelerini kaynağın sözünde ve günlük hayat
      // analojilerinde açıkça "Kapsam DIŞI" tutuyor.
      //
      // ÖLÇÜM (2026-08-29, kapsam listesinin tamamı + Daphne kartları):
      // kural 12 isabet veriyordu, HİÇBİRİ bizim hakkımızda değildi --
      // İbn Arabî'nin Fâtıma bint el-Müsennâ'ya yıllarca hizmeti (2),
      // 1172-1193 İşbiliye yılları, c1k4'ün telefon analojisi, c2k18/c2k25
      // biyografi, ve Daphne'nin kendi süresini anlattığı 6 kart cümlesi.
      // Yani 0/12. Cümle kapsamlı BIZ_SESI ile on ikisi de susuyor.
      //
      // BİLİNEN SINIR: kişisiz bir övünme ("yıllardır süren bir
      // çalışmanın ürünü") birinci çoğul taşımadığı için kaçıyor. Elde
      // kurulmuş altı deneme cümlesinin beşi yakalanıyor, altıncısı bu.
      // Kaçırmayı bilerek kabul ediyoruz: 12 yanlış alarmın bedeli, bir
      // kalıbın gözden kaçmasından ağır.
      esKosul: BIZ_SESI,
    },
    {
      id: "emek-sisirme", seviye: "kural", ad: "Emek/ölçek şişirme",
      re: basKelime("titizlikle tara|didik didik|sayısız|binlerce|yüzlerce|büyük bir çabayla|kapsamlı bir tarama"),
      neden: "Ölçüsü doğrulanamayan bir emek/ölçek nitelemesi.",
      yerine: "Sayılabilir olanı say; sayamıyorsan niteleme.",
      // Yalnız BİZİM hakkımızdaki cümlelerde geçerli: "tek bir Vücûd'un
      // sayısız sûrette göründüğü gibi" bir emek iddiası değil, âlemin
      // tarifi -- ölçtük, isabetlerin çoğu bu türdendi.
      kosul: BIZIM,
    },
    {
      id: "sureklilik-ima", seviye: "kural", ad: "Süreklilik ima etme",
      re: basKelime("düzenli olarak|düzenli aralıklarla|sistematik olarak (?:tara|izl|takip)|her gün|her hafta|aralıksız|durmadan (?:tara|izl)|sürekli (?:tarıyor|izliyor|takip ediyor)"),
      neden: "CLAUDE.md: “Süreklilik ima etme: aslında tek bir turda yapılmış bir işi sürekli/düzenli bir çalışmaymış gibi anlatmak.”",
      yerine: "Ne yaptıysak onu yaz: “bu turda”, “bu ciltte”, “bir kez”.",
      kosul: BIZIM,
    },
    {
      id: "bilimsel-oncelik", seviye: "kural", ad: "Bilimsel öncelik iddiası",
      // Olumsuzlanmış hâli isabet saymıyoruz: sitede bu kalıp çoğu zaman
      // TAM TERSİ için, bir çekince cümlesinde geçiyor ("…önceden görmüş
      // ya da kastetmiş DEĞİL").
      re: new RegExp(ONEK + "(?:önceden görmüş|önceden bilmiş|öngörmüş|bilim bunu kanıtl|bilim doğrul|modern bilim göster|bilimsel olarak doğrulan)"
        + "(?![^.!?]{0,70}(?:değil|değildir|olmuyor)" + SONEK + ")", "giu"),
      neden: "CLAUDE.md: “asla ‘İbn Arabî bunu önceden görmüştü’ ya da ‘bilim bunu kanıtlıyor’ gibi bir iddiaya dönüştürülmemeli.”",
      // s11: eski öneri ("Bize … hatırlatıyor", "bir çağrışım olarak")
      // 2026-10-05'ten beri kendisi yasak -- benzetme yazmıyoruz.
      yerine: "Sil. Metin bir bilimsel iddia kurmuyorsa site de kurmaz; yalnız ne dediğini aktar: “Dost … diyor”.",
    },
    {
      id: "kanit-dili", seviye: "kural", ad: "Kanıt dili",
      re: new RegExp(ONEK + "(?:kanıtlıyor|kanıtlar ki|kanıtıdır|ispatlıyor|ispat ediyor|ispatıdır|kesin olarak göster|tartışmasız biçimde|şüpheye yer bırakmayacak)"
        + "(?![^.!?]{0,70}(?:değil|değildir)" + SONEK + ")", "giu"),
      neden: "CLAUDE.md: kapanmış, otoriter bir ses değil; arayan bir ses.",
      yerine: "Kanıt hükmü bizim değil: aktarım fiiliyle yaz — “Dost … diyor / anlatıyor / ayırıyor”.",
      esKosul: AKTARIM_DISI,
    },

    {
      id: "kapali-ses", seviye: "gozden-gecir", ad: "Kapalı ses",
      re: tamKelime("şüphesiz|kuşkusuz|elbette|besbelli|apaçık|hiç kuşku yok|açıkça görülüyor"),
      neden: "Kesinlik bildiren bir bağlaç. Kendi sesimizdeyse duruşumuza aykırı.",
      yerine: "Kesinliği kaldır; kesinlik kaynağınsa onun sözü olarak aktar: “Dost … diyor”.",
      // s11: "Dost … diyor" çerçevesindeki kesinlik kaynağın kesinliği
      // (değerlendirmede 14 isabetin çoğu buydu).
      esKosul: AKTARIM_DISI,
    },
    {
      id: "gosterme-dili", seviye: "gozden-gecir", ad: "Gösterme dili",
      // Yalın "gösteriyor" bilerek YOK: "şunu gösteriyor olabilir" gibi
      // temkinli kullanımları da yakalar ve kuralı kullanılamaz yapardı.
      // Yalnız kapanış bildiren biçimleri arıyoruz.
      re: basKelime("açıkça gösteriyor|net (?:bir )?biçimde gösteriyor|gösterir ki|ortaya koyuyor ki|ortaya koymaktadır|görüldüğü üzere|anlaşılacağı üzere"),
      neden: "Bir okumayı sonuç gibi kapatan biçim; hüküm bizim sesimizde.",
      yerine: "Metnin söylediğini aktar: “Dost … diyor”, “bölüm … ile açılıyor”.",
      esKosul: AKTARIM_DISI,
    },
    {
      id: "tamamlanmis-anlama", seviye: "gozden-gecir", ad: "Tamamlanmış anlama",
      re: basKelime("artık (?:biliyoruz|anlıyoruz|biliriz)|anlaşılmıştır|netleşmiştir|kesinleşmiştir|böylece anlaşıl|sonuç olarak diyebiliriz|meselenin özü şudur|artık açıktır"),
      neden: "Kökensel duruş: “anlamaya çalışıyoruz, anlatmaya değil.” Anlama kapanmış gibi yazılmamalı.",
      yerine: "Hükmü sil; metnin söylediğini aktar: “Dost … diyor / anlatıyor”.",
      esKosul: AKTARIM_DISI,
    },
    {
      id: "mutlak-genelleme", seviye: "gozden-gecir", ad: "Külliyat ölçeğinde genelleme",
      // İlk hâli "her zaman / asla / kesinlikle / mutlaka" gibi sıradan
      // pekiştireçleri de yakalıyordu: 444 isabet, yani kullanılamaz.
      // Asıl kaygı bunlar değil, KÜLLİYATIN TAMAMI hakkında hüküm kurmak
      // -- okuduğumuz kısım sınırlı. Kalıplar ona indirildi.
      re: basKelime("hiçbir yerde|hiçbir eserinde|hiçbir kitabında|bütün külliyat|tüm külliyat|bütün eserlerinde|tüm eserlerinde|her zaman ve her yerde|istisnasız|hiçbir yerinde"),
      neden: "Külliyatın tamamı hakkında bir hüküm. Okuduğumuz kısım sınırlı; bunu doğrulayamayız.",
      yerine: "Külliyat hükmünü sil; olgu olarak kapsam ver: “bu kısımda”, “bu ciltte”.",
      esKosul: AKTARIM_DISI,
    },
    {
      id: "sarih-hakemligi", seviye: "gozden-gecir", ad: "Şârihi hakem yapmak",
      re: new RegExp("(?:Konuk|İzutsu|Izutsu|Affifi|Chittick|Corbin)[^.!?]{0,70}?" + ONEK
        + "(?:haklı olarak|doğru olarak|doğrusu|isabetle|doğru biçimde|yanılıyor|hatalı olarak|yanlış anlamış)" + SONEK, "giu"),
      neden: "CLAUDE.md: şârihler “hakem değil” — onların yorumu da bir okuma.",
      yerine: "Şârihin görüşünü onun görüşü olarak, hükümsüz aktar: “Konuk … diye açıklıyor”, “Izutsu'ya göre …”.",
    },
    {
      id: "okuru-yonlendirme", seviye: "gozden-gecir", ad: "Okuru yönlendirme",
      re: tamKelime("unutmayın|unutmayalım|dikkat edin ki|bilmelisiniz|anlamalısınız|şunu bilin|görmelisiniz|kabul etmeliyiz"),
      neden: "Öğretici/buyurucu ses. Site okuduğunu özetler; okura hitap etmez.",
      yerine: "Okura hitabı sil; metnin söylediğini aktar: “Dost … diyor”.",
      esKosul: AKTARIM_DISI,
    },
    {
      id: "bag-kimin", seviye: "gozden-gecir", ad: "Bağ kimin?",
      // "tıpkı" ve "benzer biçimde" bilerek YOK: sıradan benzetme
      // sözcükleri ("tıpkı evren gibi") ve kuralı kullanılamaz hâle
      // getiriyorlardı -- ölçtük, 297 isabetin çoğu onlardan geliyordu.
      re: tamKelime("aynı hareketi|aynı deseni|aynı örüntü|aynı formülü|örtüşüyor|örtüşmesi|paralellik|birebir aynı"),
      neden: "İki kaynağı birbirine bağlayan bir cümle. 2026-10-05'ten beri kendi kurduğumuz bağlantılar yazılmıyor.",
      // s11: eskiden "bağın bizim olduğunu SÖYLE" diyordu (BAGSIZ koşulu);
      // artık bizim bağımız yazılmıyor, yani "bizim" demek aklamıyor.
      // Susan yalnız kaynağın KENDİ kurduğu bağ ("Dost burada … paralellik
      // kuruyor") -- AKTARIM.
      yerine: "Bağı Dost kurmuyorsa sil. Kuruyorsa onun sözü olarak aktar: “Dost bunu … bâbında anlattığını söylüyor”.",
      esKosul: AKTARIM_DISI,
    },
    {
      id: "niyeti-bilmek", seviye: "gozden-gecir", ad: "Dost'un niyetini bilmek",
      // Kalıp kasıtlı dar: "Dost'un kastı ne?" biçimindeki retorik soru
      // ya da "kastı şu:" biçimindeki net beyan yakalanıyor; olasılık
      // bildiren "kastını anlamaya çalışıyoruz" yakalanmıyor.
      re: new RegExp(ONEK + "(?:(?:Dost'un|İbn Arabî'nin|onun)\\s+(?:kastı|muradı)|(?:kastı|muradı)\\s+şu(?:dur)?)" + SONEK, "giu"),
      neden: "Bir müellifin niyetini ya da kastını doğrudan bilmek iddialı. Kökensel duruş: anlama çabasındayız, hakem değiliz.",
      yerine: "Niyet hükmünü sil; Dost kastını kendisi söylüyorsa onu aktar: “Dost … kastettiğini söylüyor”.",
      esKosul: NAKIL_DISI,
    },
    {
      id: "dogmatik-ozet", seviye: "gozden-gecir", ad: "Dogmatik özet",
      re: basKelime("buradaki (?:temel )?mesaj|öğretinin özü|bir cümleyle özetl|kısacası şunu söyl|özetle şunu söyl|özetle diyebilir"),
      neden: "Bir pasajı veya öğretiyi tek bir mesaja/öze indirgemek, okumayı kapanmış bir sonuç gibi sunar.",
      yerine: "Tek mesaja indirgeme; metnin sırasını aktar: “Dost önce …, sonra … anlatıyor”.",
      esKosul: NAKIL_DISI,
    },

    /* --- s7'de eklenen dört kural -------------------------------------
       Kaynak: flutter/agent-plugins deposundaki `natural-writing`
       becerisi (bkz. research/flutter-depolari-inceleme.md). O listenin
       maddeleri mevcut 14 kuralla tek tek karşılaştırıldı; çoğunun
       karşılığı zaten vardı (superficial analysis -> gosterme-dili,
       attribution -> kanit-dili + sarih-hakemligi, absolute claims ->
       mutlak-genelleme, temporal inflation -> sure-sisirme). Aşağıdaki
       dördünün karşılığı YOKTU.

       Hepsi corpus'ta ölçüldü (16.427 metin parçası, 2.409.790 karakter)
       ve ölçüm iki kalıbı ciddi biçimde daralttı -- ayrıntısı her kuralın
       kendi yorumunda. */

    {
      id: "konu-sisirme", seviye: "gozden-gecir", ad: "Konuyu şişirme",
      // K2 (emek-sisirme) BİZİM emeğimizi şişirmeye bakıyor; bu ise
      // KONUNUN önemini şişirmeye. Site Dost hakkında yazdığı için en
      // olası tuzak bu.
      //
      // Ölçüm kalıbı iki kez daralttı:
      //  - "doruk noktası" ve "dönüm noktası" çıkarıldı. Bu corpus metin
      //    YAPISI çözümlüyor; oralarda ikisi de teknik terim ("bölümün
      //    dönüm noktası" = metnin döndüğü yer, "motif doruk noktasına
      //    ulaşıyor"). 13 isabetin 12'si bu türdendi.
      //  - "eşsiz" ve "benzersiz" HİÇ eklenmedi: tenzihin ta kendisi
      //    ("Zât hiçbir şeye benzemez"). Bunları işaretlemek doktrini
      //    hata sanmak olurdu.
      // Kalan: 1 isabet ("başyapıtı").
      re: basKelime("kilometre taşı|derin (?:bir )?iz bırak|paha biçilmez|çığır aç|müstesna bir yer|abidevi|şaheser|başyapıt"),
      neden: "Konunun önemini nitelemeyle yükseltmek. Bir şey önemliyse bunu olgular gösterir; övgü bizim sesimiz değil.",
      yerine: "Niteleme yerine olgu: ne zaman yazıldı, kaç cilt, nerede tamamlandı.",
      esKosul: AKTARIM_DISI,
    },
    {
      id: "zarif-degisim", seviye: "gozden-gecir", ad: "Adı yerine sıfat koymak",
      // "Elegant variation": adı tekrar etmemek için yücelten bir
      // dolaylama uydurmak. Kökensel duruşla çelişiyor -- yücelten sıfat
      // anlamanın değil anlatmanın dili.
      //
      // Kalıp ölçümde tamamen değişti. İlk hâli "büyük şeyh|ünlü sûfî|
      // büyük mutasavvıf" gibi genel unvanları da içeriyordu ve 2 isabetin
      // İKİSİ de yanlıştı: ikisi de Dost'tan DEĞİL, onun anlattığı
      // hikâyedeki ÜÇÜNCÜ kişilerden söz ediyordu ("büyük şeyh
      // Ebü'l-Abbas el-Hassâr", "iki ünlü sûfî anekdotu"). Regex kimden
      // söz edildiğini bilemez. Bu yüzden kalıp, yalnız Dost'un ADININ
      // YERİNE geçebilecek dolaylamalara indirildi.
      // Şimdiki isabet: 0 -- yani bu bir önleme kuralı, bulgu kuralı değil.
      re: basKelime("Endülüslü (?:mütefekkir|bilge|sûfî|sufi|filozof)|(?:büyük|ulu|yüce|muhteşem) üstat|ulu şeyh"),
      neden: "Adı tekrar etmekten kaçınmak için yücelten bir dolaylama. Adı tekrar etmek ya da zamir kullanmak serbest.",
      yerine: "“İbn Arabî”, “Dost”, ya da düpedüz “o”.",
      esKosul: NAKIL_DISI,
    },
    {
      id: "olumsuz-kosutluk", seviye: "gozden-gecir", ad: "“Sadece … değil, aynı zamanda …”",
      // Kalıp bilerek TAM yapıyı istiyor: yalnız "sadece" değil, ardından
      // gelen "değil, aynı zamanda" da şart. Aksi hâlde sıradan "sadece"
      // kullanımları kuralı kullanılamaz hâle getirirdi.
      // Ölçüm: 4 isabet, dördü de gerçek -- hepsi bizim çözümleme
      // cümlelerimiz. Bu yüzden "kural" değil "gözden geçir": kalıp her
      // zaman yanlış değil, ama kapsamlılık hissi veren bir refleks
      // olduğu için bakılmayı hak ediyor.
      re: new RegExp(ONEK + "(?:sadece|yalnız|yalnızca)[^.!?]{0,60}?\\s+değil,\\s*(?:aynı zamanda|bir o kadar da|ayrıca|hem de)", "giu"),
      neden: "Kapsamlılık hissi veren bir kalıp. Çoğu yerde iki yarı da düz cümleyle söylenebilir.",
      yerine: "İki şeyi ayrı cümlelerle aktar: “Dost … diyor. … da ekliyor.”",
      esKosul: NAKIL_DISI,
    },
    {
      id: "ragmen-kapanisi", seviye: "gozden-gecir", ad: "“Rağmen … devam ediyor” kapanışı",
      // Bir metni "bütün bunlara rağmen X önemini korumaya devam ediyor"
      // diye bitirmek yaygın bir bitiriş refleksi: hiçbir şey söylemez,
      // yalnız kapanış hissi verir.
      // Kalıp iki yarıyı birden istiyor (ödün + "devam" fiili); tek
      // başına "rağmen" yakalanmıyor. Ölçüm: 0 isabet -- önleme kuralı.
      re: new RegExp(ONEK + "(?:bütün bunlara|tüm bunlara|her şeye|buna) rağmen[^.!?]{0,80}?(?:olmaya devam|önemini koru|canlılığını koru|güncelliğini koru|yaşamaya devam|etkisini sürdür)", "giu"),
      neden: "Bir şey söylemeyen kapanış formülü. Duruşumuz son olguyla bitmeyi yeğler.",
      yerine: "Son cümleyi at; metin son olgusuyla bitsin.",
      esKosul: NAKIL_DISI,
    },
    {
      id: "rekabet-dili", seviye: "kural", ad: "Rekabet dili",
      // Kullanıcı kararı, 2026-08-28: "Allah dostları arasında rekabet
      // olmaz." Bu kural o cümlenin taramadaki karşılığı.
      //
      // Kuralı doğuran bulgu bizim kendi cümlemizdi: Daphne kartlarından
      // birinde "üç yol birbirinin RAKİBİ değil" yazmıştık. Cümle rekabeti
      // olumsuzluyordu ama çerçeveyi yine de kuruyordu -- Affifi'nin
      // aktardığı üçlemede böyle bir çerçeve yok, onu biz getirmiştik.
      // Düzeltildi ("birbirini dışlamıyor").
      //
      // Kalıp DAR tutuldu, çünkü mertebe/derece dili meşru: Dost'un kendisi
      // makamları sıralıyor ("nikâhın nafilesi daha güçlüdür"). Bu yüzden
      // "üstün", "daha yüksek", "derece" HİÇ eklenmedi -- onları
      // işaretlemek doktrini hata sanmak olurdu. Yakalanan yalnız kişiler
      // arası YARIŞ çerçevesi.
      //
      // Muafiyet iki katmanlı ve zaten hazırdı: (1) <em> içi hiç taranmıyor,
      // yani Dost'un/Konuk'un/Daphne'nin kendi sözü kapsam dışı; (2)
      // NAKIL_DISI, "İbn Arabî: …" gibi atıf ifadesinden sonra gelen düz
      // tırnaklı nakilleri de eliyor. Geriye yalnız BİZİM sesimiz kalıyor.
      //
      // ÖLÇÜM (2026-08-28, bütün veri dosyalarında, <em> ve nakil
      // muafiyetleri uygulanmış hâlde): önce 19 isabet, düzeltmelerden
      // sonra 15. Döküm, çünkü sayı tek başına yanıltıcı.
      //
      // BİZİM sesimizde çıkan ve DÜZELTİLEN dördü:
      //   - "üç yol birbirinin rakibi değil" (Daphne kartı, uc-iman-yolu)
      //     -> "birbirini dışlamıyor". Kuralı doğuran bulgu buydu.
      //   - "İki okuma yarışıyor" (c14k165, iki yerde)
      //     -> "İki okuma yan yana duruyor".
      //   - "iki rakip okuma" (c15k182) -> "iki ayrı okuma".
      //   Dördü de rekabeti olumsuzluyor ya da reddediyordu; çerçeveyi
      //   yine de kuruyorlardı. Bir de İbnü Atâullah alıntısının bir
      //   nüshası ileri-bakışlı muafiyetle elendi.
      //
      // KALAN 15, dosya dosya -- hiçbiri düzeltilmedi, çünkü hiçbiri
      // bizim yorumumuz değil:
      //   elestiri-arkeolojisi 7 -- Knysh künyeli tarihsel polemikler
      //     (Timur'un düzenlettiği münazara, kadılık makamı mücadelesi)
      //     ve bu düzeltmenin kendi kaydı.
      //   daphne-profile 2      -- İbnü Atâullah'ın Hikem'inden bir cümle.
      //   fusus-atlas 2         -- "şirk, rakip bir ilah icad etmek değildir".
      //   c1k10 1               -- Dost'un Hevâ'yı "rakip güç" sayması.
      //   c7k95 1               -- nafilelerin birbirine "rakip çıkması".
      //   c8k108 1              -- Dost'un ressam-hakîm kıyası.
      //   esma 1                -- bayrak yarışı benzetmesi (günlük analoji,
      //                            CLAUDE.md'de açıkça kapsam dışı).
      //
      // Kalıcı isabet sayısının sıfır olmaması bilerek: bu kural bir
      // temizlik listesi değil, her yeni metinde tekrar bakılacak bir yer.
      //
      // Bu kuralın nakil muafiyeti ötekilerden GENİŞ: atıf, alıntının
      // ARDINDAN da gelebiliyor ("'…' -- İbnü Atâullah'ın bu cümlesi").
      // Ortak NAKIL_DISI yalnız geriye bakıyor; burada ileriye de
      // bakılıyor. Muafiyeti yalnız bu kurala verdik, ötekilerin ölçülmüş
      // davranışını değiştirmemek için.
      re: tamKelime("rakip|rakibi|rakibiydi|rakipler|rakipleri|rekabet|rekabeti|rekabetçi|yarışıyor|yarıştı|yarışır|yarışında|boy ölçüş\\w*"),
      neden: "Rekabet çerçevesi. Allah dostları arasında rekabet olmaz; velîler, yollar ve mertebeler birbirine karşı yarışmaz. Çerçeveyi olumsuzlayarak kurmak da (“rakibi değil”) aynı kapıya çıkar.",
      yerine: "Kaynağın kendi sözüyse ya da künyeli tarihsel bir polemikse KALSIN -- yeter ki kimin sözü olduğu görünsün. Bizim yorumumuzsa sil; olgu kalacaksa yarışsız aktar: “itiraz etti”, “mektup yazdı”.",
      esKosul: function (metin, index) {
        if (!AKTARIM_DISI(metin, index)) return false;
        // İleriye bakış: isabetten sonraki kısa pencerede bir atıf varsa
        // (ör. "-- İbnü Atâullah'ın bu cümlesi") bu bir nakildir.
        return !/(--|—|–)?\s*(İbn Arabî|İbn Arabi|Dost|Konuk|İzutsu|Affifi|Daphne|İbnü [A-ZÇĞİÖŞÜ]|[A-ZÇĞİÖŞÜ][\wçğıöşü'’-]+(?:'in|'ın|'nin|'nın|'un|'ün|'nun|'nün))\s+(?:bu )?(?:cümlesi|sözü|ifadesi|deyişi|kıyası|benzetmesi)/u
          .test(metin.slice(index, index + 120));
      },
    },

    /* --- s11: "site yalnız okumaların özetidir" (2026-10-05) ----------
       Ölçüt scripts/ayiklama/KILAVUZ.md'nin SİL listesi. Hepsi alıntı
       (<em>) ve nakil sonrası metni taramıyor; değerlendirme ve kendi
       bağımız ayrıca "Dost … diyor" çerçevesinde (AKTARIM) susuyor.
       Çekince ve birinci çoğul kuralları AKTARIM'da SUSMUYOR: "Belki de
       Dost burada … anlatıyor" bizim hipotezimiz, aktarım fiili onu
       aklamıyor. Ölçüm DURUS_KONTROL.md'de. */
    {
      id: "degerlendirme", seviye: "kural", ad: "Değerlendirme",
      // "dikkat çekiyor" yok: "Dost … dikkat çekiyor" bir aktarım fiili.
      // "olağanüstü", "harikulade" yok: Fütûhât'ta terim (mucize/keramet).
      // "en güzel", "en derin" yok: tırnaksız Dost sözlerinde ve konu
      // tariflerinde ("sırların en derini") geçiyor -- ölçümde 33 isabetin
      // çoğu bunlardı.
      re: basKelime("çarpıcı|dikkat çekici|dikkati çeken|ilginç|ilgi çekici|ilgi çekiyor|ayrı bir ilgi"
        + "|etkileyici|büyüleyici|büyüleyen|şaşırtıcı|muhteşem|en net örne"
        + "|en açık örne|özellikle önemli|son derece önemli|çok önemli|büyük önem taşı|ustalıkla|ustaca|incelikle kur"),
      neden: "Bizim değerlendirmemiz. 2026-10-05: site yalnız okumaların özetidir; “çarpıcı”, “dikkat çekici”, “en güzel” yazılmaz.",
      yerine: "Sıfatı at, içeriği aktar: “Bize göre en çarpıcı olanı Dost'un X demesi” → “Dost X diyor.”",
      esKosul: AKTARIM_DISI,
    },
    {
      id: "cekince-dili", seviye: "kural", ad: "Çekince / hipotez",
      // Ölçüm (2026-10-09): yalın "olabilir/belki/sanki" 119 isabet verdi,
      // çoğu kaynağın KENDİ kipliği ("doğru da olabilir yanlış da",
      // "belki kâbiliyetin şartı O'nun atâsıdır") ya da tırnak içi söz.
      // Kalıp hipotez biçimlerine indirildi: "-yor/-mış/-dır olabilir",
      // "belki de", "gibi görünüyor".
      re: basKelime("belki de|belki bu|belki burada|gibi görünüyor|gibi duruyor|gibi geliyor|muhtemelen|galiba"
        + "|[\\p{L}]+(?:yor|mış|miş|muş|müş|dır|dir|dur|dür|tır|tir|tur|tür) olabilir|anlamına gelebilir|demek olabilir|akla getiriyor"),
      neden: "Bizim ürettiğimiz bir anlam önerisi (hipotez). KILAVUZ.md: metinde olmayan bir anlam üretiyorsa SİL.",
      yerine: "Metin söylüyorsa çekincesiz aktar: “Dost … diyor”. Söylemiyorsa cümleyi sil.",
      esKosul: NAKIL_DISI,
    },
    {
      id: "biz-cikarimi", seviye: "kural", ad: "Birinci çoğul çıkarım",
      re: basKelime("bize göre|bizce|bize öyle geliyor|kanaatimizce|kanımızca|okumamıza göre|(?:şöyle |böyle |bunu |bu satırları )?okuyoruz"
        + "|düşünüyoruz|sanıyoruz|tahmin ediyoruz|yorumluyoruz|çıkarıyoruz|çıkardığımız|anlıyoruz"
        + "|bize (?:şunu )?(?:hatırlatıyor|düşündürüyor|çağrıştırıyor|gösteriyor)"),
      // Künye cümlesi ("Konuk'un şerhini okuyoruz") okuduğumuz kaynağı
      // söyler -- şeffaflık, çıkarım değil.
      esKosul: KUNYE_DISI,
      neden: "Bizim çıkarımımız. 2026-10-05: kendi çıkarımlarımız ancak kullanıcıyla birlikte karar verildikten sonra yazılır.",
      yerine: "Çerçeveyi at, metnin söylediğini bırak: “Bu ifadeyi Dost'un X'i Y'ye bağladığı şeklinde okuyoruz” → “Dost X'i Y'ye bağlıyor.” (metin açıkça söylüyorsa; değilse sil)",
    },
    {
      id: "okuma-yolculugu", seviye: "gozden-gecir", ad: "Okuma yolculuğumuz",
      // Birinci çoğul anlatı ("iniyoruz", "bakıyoruz", "karşımıza çıkıyor")
      // ve kendi sorularımız. Künye cümleleri (KUNYE) muaf.
      re: basKelime("anlamaya çalışıyoruz|henüz bilmiyoruz|karşımıza çık|önümüze (?:şu )?soru|soruyu koyuyor|izlediğimiz|okuduğumuz bölümler boyunca"
        + "|iniyoruz|yolculuğa çık|bakıyoruz|merak ediyoruz|soruyoruz|soralım|hatırlayalım|görelim|bakalım|dönelim"
        + "|izliyoruz|takip ediyoruz|fark ediyoruz|keşfediyoruz|buluyoruz|görüyoruz"),
      neden: "Okuma yolculuğumuz ve sorularımız (KILAVUZ.md, SİL). Site okumamızı değil, okuduğumuzu anlatır.",
      yerine: "Anlatıyı at, içeriği aktar: “Bu bölümde … iniyoruz” → “Dost bu bölümde … anlatıyor.” Künye cümlesiyse (“bu şemayı biz çizdik”) kalsın.",
      esKosul: KUNYE_DISI,
    },
    {
      id: "benzetme", seviye: "gozden-gecir", ad: "Benzetme",
      // "tıpkı" bilerek yok: ölçümde 63 isabetin hepsi Dost'un kendi
      // kıyaslarının özeti ("tıpkı havanın suya inkılâbı gibi").
      re: basKelime("bir benzetmeyle|benzetmek gerekirse|şöyle düşünün|düşünün ki|bir düşünün|günlük hayat|gündelik hayat"
        + "|hepimizin|tıpkı bizim|bugünkü dille|modern dille"),
      neden: "Benzetme bizim eklememiz olabilir. KILAVUZ.md: benzetmeyi Dost/şârih yapmıyorsa SİL (`analogy` alanı artık yok).",
      yerine: "Benzetme Dost'unsa onun sözü olarak aktar: “Dost bunu … benzetiyor”. Değilse sil.",
      esKosul: AKTARIM_DISI,
    },
    {
      id: "modern-bilim", seviye: "kural", ad: "Modern bilimle benzetme",
      re: basKelime("modern (?:fizik|bilim|kozmoloji|psikoloji)|kuantum|izafiyet|görelilik kuram|evrim kuram|nörobilim|beyin bilim"
        + "|hologram|fraktal|büyük patlama|big bang|termodinamik|entropi|kara delik|algoritma|bilgisayar|yazılım|yapay zek|dalga-parçacık"),
      neden: "Modern bilimden örnek bizim benzetmemiz. 2026-10-05: benzetme (günlük hayat ya da modern bilim) yazılmaz.",
      yerine: "Sil. Metin bunu kurmuyor; yalnız Dost'un ne dediğini aktar.",
      esKosul: NAKIL_DISI,
    },
    {
      id: "kendi-bag", seviye: "kural", ad: "Kendi kurduğumuz bağ",
      re: basKelime("aynı motif|motif burada|burada da beliri|yeniden karşımıza|daha önce gördüğümüz|daha önce okuduğumuz|önceki kısımda gördü"
        // "N. kısımdaki … tartışmasının devamı" yapı bilgisidir (KORU) -- yok.
        + "|iki kısım arasında|biriken parçalar|bir dikiş|haritamız|grafımız|serimiz"
        + "|ilk hadis şunu söylüyordu|bu ikincisi ise"),
      neden: "Kısımlar/kitaplar arasında bizim kurduğumuz bağlantı (KILAVUZ.md, SİL). Dost'un kendi çapraz atfı (“bunu … bâbında anlattık”) korunur.",
      yerine: "Bağı sil; Dost'un kendi atfıysa onu aktar: “Dost bunu … bâbında anlattığını söylüyor”.",
      esKosul: AKTARIM_DISI,
    },
  ];

  var SECICI = [
    "#detail-content p", "#detail-content li", "#detail-content blockquote",
    "#futuhat-article p", "#futuhat-article li", "#futuhat-article blockquote",
    "#fusus-article p", "#fusus-article li", "#fusus-article blockquote",
    ".hakkinda-content__section p", ".hakkinda-content__subtitle",
    ".tasiyici-intro__p", ".tasiyici-sira p", ".tasiyici-sonnot",
    ".tasiyici-note__body", ".helix-scene__note-body",
    // Daphne bölümü (compare.html, 2026-10-09).
    ".daphne-okuma__ozet", ".daphne-bag__neden", ".daphne-soru__metin",
    ".futuhat-hero__summary", ".fusus-hero__summary",
  ].join(", ");

  // Site taraması için hangi veri dosyası hangi görünüme ait:
  // data/ibn-arabi/tarama-kapsami.json. Liste eskiden hem burada hem
  // tahkik-tarama.js içinde ayrı ayrı dururdu; ikisi zamanla ayrıştı ve
  // kimse fark etmedi. Artık tek kaynak var, üstelik
  // scripts/tarama-kapsami-kontrol.py kapsam kararı verilmemiş bir veri
  // dosyası bulduğunda derlemeyi durduruyor.
  var KAPSAM = "data/ibn-arabi/tarama-kapsami.json";

  // Taranmayan alanlar. `analogy`: CLAUDE.md'nin "Kapsam DIŞI" maddesi
  // günlük hayat analojilerini açıkça muaf tutuyor. Ötekiler metin değil
  // künye/etiket alanları.
  var MUAF_ALAN = { analogy: 1, source: 1, sources: 1, kaynak: 1, cite: 1,
                    url: 1, id: 1, view: 1, pageRange: 1, arabic: 1 };
  var DIL = { tr: 1, en: 1, pt: 1 };

  var acikKutu = null;
  var siteBulgulari = null;

  // --- yardımcılar ------------------------------------------------------
  function hash(s) {
    // djb2. Susturma anahtarı metne bağlı: metin değişince işaret geri
    // gelsin diye.
    var h = 5381;
    for (var i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
    return (h >>> 0).toString(36);
  }
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function yerelSusturulan() {
    try { return JSON.parse(localStorage.getItem(DISMISS_KEY) || "{}"); }
    catch (e) { return {}; }
  }
  // Yerel kararlar + repodaki paylaşılan dosya (açılışta bir kez okunur).
  var paylasilan = {};
  var paylasilanYuklendi = false;
  function paylasilaniYukle() {
    if (paylasilanYuklendi) return Promise.resolve();
    paylasilanYuklendi = true;
    return fetch(PAYLASILAN, { cache: "no-cache" }).then(function (r) {
      return r.ok ? r.json() : [];
    }).then(function (liste) {
      (Array.isArray(liste) ? liste : []).forEach(function (k) {
        if (k && k.anahtar && (!k.tarama || k.tarama === "durus")) paylasilan[k.anahtar] = k.zaman || "repo";
      });
    }).catch(function () { /* dosya yayında yoksa (canlıda research/ yok) yalnız yerel kararlar */ });
  }
  function susturulanlar() {
    var d = yerelSusturulan();
    for (var k in paylasilan) if (!d[k]) d[k] = paylasilan[k];
    return d;
  }
  // s11: karar artık kimin neyi neden susturduğunu da taşıyor -- dışa
  // aktarıma giriyor ve data/durus-susturulan.json'a işleniyor.
  function sustur(anahtar, bilgi) {
    var d = yerelSusturulan();
    var kayit = { zaman: new Date().toISOString() };
    if (bilgi) for (var k in bilgi) if (bilgi[k] != null) kayit[k] = bilgi[k];
    d[anahtar] = kayit;
    try { localStorage.setItem(DISMISS_KEY, JSON.stringify(d)); }
    catch (e) {
      if (window.__dostRevise) window.__dostRevise.uyari("Susturma kaydedilemedi (depolama dolu ya da kapalı).");
    }
  }
  function katman(kapat) {
    if (window.DostReviseKatman) return window.DostReviseKatman.ac(kapat);
    return function () {};
  }
  function anahtarla(kuralId, metin) {
    return kuralId + ":" + hash(metin.replace(/\s+/g, " ").trim());
  }

  // Alıntı dışı metin: <em>/<q> içeriği aynı uzunlukta boşluğa çevriliyor
  // (konumlar korunsun diye).
  function alintisizDom(el) {
    var out = "";
    (function yuru(node) {
      for (var i = 0; i < node.childNodes.length; i++) {
        var c = node.childNodes[i];
        if (c.nodeType === 3) { out += c.nodeValue; continue; }
        if (c.nodeType !== 1) continue;
        if (c.classList && c.classList.contains("durus-rozet-grup")) continue;
        if (c.tagName === "EM" || c.tagName === "Q") {
          out += new Array((c.textContent || "").length + 1).join(" ");
          continue;
        }
        yuru(c);
      }
    })(el);
    return tirnaksiz(out);
  }
  // s11: tırnak içi de taranmıyor. Sitede alıntıların bir kısmı <em>
  // yerine düz ya da kıvrık tırnakla veriliyor ('…', "…", “…”); onların
  // içindeki "sanki", "en güzel", "olabilir" kaynağın sözü. Açılış
  // tırnağı boşluk/noktalama sonrası gelmeli (Hakk'ın gibi kesmeler
  // dışarıda kalsın); içerideki kesme+harf (Allah'ın) tırnağı kapatmaz.
  // Uzunluk korunur (isabet konumları kaymasın).
  var TIRNAK = /(^|[\s(:—–-])(?:'(?:[^'\n]|'(?=\p{L}))+?'(?![\p{L}])|"[^"\n]+?"|“[^”]*?”)/gu;
  function tirnaksiz(s) {
    return String(s).replace(TIRNAK, function (m, on) {
      return on + new Array(m.length - on.length + 1).join(" ");
    });
  }
  function alintisizMetin(s) {
    return tirnaksiz(String(s).replace(/<em>[\s\S]*?<\/em>/g, function (m) {
      return new Array(m.length + 1).join(" ");
    }).replace(/<[^>]+>/g, " "));
  }

  // Ortak çekirdek: bir metinde hangi kurallar tetikleniyor?
  // `muafKural`: o bağlamda çalışmayan kural kimlikleri (Daphne'nin kendi
  // konusu sistem kuramı/fizik -- tarama-kapsami.json durusMuafKural).
  function kurallariUygula(taranan, tamMetin, muafKural) {
    if (taranan.replace(/\s+/g, "").length < 40) return [];
    var d = susturulanlar();
    var out = [];
    KURALLAR.forEach(function (k) {
      if (muafKural && muafKural.indexOf(k.id) >= 0) return;
      if (k.kosul && !k.kosul(taranan)) return;
      k.re.lastIndex = 0;
      var m, esler = [];
      while ((m = k.re.exec(taranan)) !== null) {
        if (!k.esKosul || k.esKosul(taranan, m.index)) {
          esler.push({ es: m[0].trim(), i: m.index });
        }
        if (k.re.lastIndex === m.index) k.re.lastIndex++;
      }
      if (!esler.length) return;
      var anahtar = anahtarla(k.id, tamMetin);
      if (d[anahtar]) return;
      out.push({ kural: k, esler: esler, anahtar: anahtar });
    });
    return out;
  }

  // Günlük hayat analojileri ve benzeri etiketli bloklar taranmıyor
  // (CLAUDE.md "Kapsam DIŞI"). DİKKAT: .detail-analogy sınıfını "Bir
  // çekince", "Makamı ve terki" gibi başka etiketler de kullanıyor --
  // yani muafiyet gereğinden biraz geniş. Bilerek böyle: taramanın
  // yanlış susması, yanlış bağırmasından iyidir.
  function muafMi(el) { return !!el.closest(".detail-analogy"); }

  var DAPHNE_MUAF = ["modern-bilim", "benzetme"];
  function bulgular(el) {
    if (!turkceMi() || muafMi(el)) return [];
    var daphne = /compare\.html$/.test(location.pathname)
      || !!el.closest('[data-dost-dosya="data/daphne-profile.json"]');
    // Rozet grubu metne dahil edilmez (önceden "🔸" anahtara giriyordu).
    var tam = (el.textContent || "");
    var g = el.querySelector(":scope > .durus-rozet-grup");
    if (g) tam = tam.slice(0, tam.length - (g.textContent || "").length);
    return kurallariUygula(alintisizDom(el), tam, daphne ? DAPHNE_MUAF : null);
  }

  // --- sayfa içi işaretleme ---------------------------------------------
  function kutuAc(rozet, bulgu, el) {
    kutuKapat();
    var kutu = document.createElement("div");
    kutu.className = "durus-kutu";
    kutu.innerHTML = kutuIcerik(bulgu);
    document.body.appendChild(kutu);
    var r = rozet.getBoundingClientRect();
    kutu.style.top = (window.scrollY + r.bottom + 6) + "px";
    kutu.style.left = Math.max(8, Math.min(
      window.scrollX + r.left - 140,
      window.scrollX + document.documentElement.clientWidth - kutu.offsetWidth - 8)) + "px";
    acikKutu = kutu;
    kutuBirak = katman(kutuKapat);
    kutu.querySelector('[data-act="kapat"]').addEventListener("click", kutuKapat);
    kutu.querySelector('[data-act="sustur"]').addEventListener("click", function () {
      sustur(bulgu.anahtar, { kural: bulgu.kural.id, ozet: (el.textContent || "").slice(0, 120), url: location.pathname });
      kutuKapat();
      isaretle(el);
      sayaciGuncelle();
    });
  }
  function kutuIcerik(bulgu) {
    var esler = bulgu.esler.map(function (e) { return e.es; });
    return '<p class="durus-kutu__ad">' + (bulgu.kural.seviye === "kural" ? "🔸" : "🔹")
      + " " + esc(bulgu.kural.ad)
      + ' <span class="durus-kutu__sev">' + (bulgu.kural.seviye === "kural" ? "kural" : "gözden geçir") + "</span></p>"
      + '<p class="durus-kutu__es">' + esler.map(function (e) {
          return "<span>" + esc(e) + "</span>";
        }).join(" ") + "</p>"
      + '<p class="durus-kutu__neden">' + esc(bulgu.kural.neden) + "</p>"
      + '<p class="durus-kutu__yerine"><strong>Yerine:</strong> ' + esc(bulgu.kural.yerine) + "</p>"
      + '<div class="durus-kutu__alt">'
      + '<button type="button" data-act="sustur">Bu doğru — işareti kaldır</button>'
      + '<button type="button" data-act="kapat">Kapat</button>'
      + "</div>";
  }
  var kutuBirak = null;
  function kutuKapat() {
    if (kutuBirak) { kutuBirak(); kutuBirak = null; }
    if (acikKutu) { acikKutu.remove(); acikKutu = null; }
  }

  function isaretle(el) {
    var eski = el.querySelector(":scope > .durus-rozet-grup");
    if (eski) eski.remove();
    el.classList.remove("durus-isaretli", "durus-isaretli--kural");

    var bs = bulgular(el);
    if (!bs.length) return;

    var grup = document.createElement("span");
    grup.className = "durus-rozet-grup";
    grup.setAttribute("contenteditable", "false");   // @revise metni düzenlenebilir yapıyor
    bs.forEach(function (b) {
      var rozet = document.createElement("button");
      rozet.type = "button";
      rozet.className = "durus-rozet durus-rozet--" + b.kural.seviye;
      rozet.textContent = b.kural.seviye === "kural" ? "🔸" : "🔹";
      rozet.title = b.kural.ad + " — " + b.esler.map(function (e) { return e.es; }).join(", ");
      rozet.setAttribute("aria-label", "Duruş uyarısı: " + b.kural.ad);
      rozet.addEventListener("click", function (e) {
        e.preventDefault(); e.stopPropagation();
        kutuAc(rozet, b, el);
      });
      grup.appendChild(rozet);
    });
    el.appendChild(grup);
    el.classList.add("durus-isaretli");
    if (bs.some(function (b) { return b.kural.seviye === "kural"; })) {
      el.classList.add("durus-isaretli--kural");
    }
  }

  function tara() {
    document.querySelectorAll(SECICI).forEach(isaretle);
    sayaciGuncelle();
  }

  function temizle() {
    kutuKapat();
    siteKapat();
    document.querySelectorAll(".durus-rozet-grup").forEach(function (g) { g.remove(); });
    document.querySelectorAll(".durus-isaretli").forEach(function (el) {
      el.classList.remove("durus-isaretli", "durus-isaretli--kural");
    });
    if (cip) { cip.remove(); cip = null; }
  }

  // --- sayaç (kip açıkken HER ZAMAN görünür) ----------------------------
  // İlk sürümde sayaç yalnız bulgu varken çıkıyordu; temiz bir sayfada
  // ekranda hiçbir şey olmadığı için taramanın çalışıp çalışmadığı belli
  // olmuyordu (kullanıcı bildirdi). Artık "temiz" hâli de görünüyor.
  var cip = null;
  function sayaciGuncelle() {
    var kural = document.querySelectorAll(".durus-rozet--kural").length;
    var gg = document.querySelectorAll(".durus-rozet--gozden-gecir").length;
    if (!cip) {
      cip = document.createElement("div");
      cip.className = "durus-cip";
      cip.innerHTML =
        '<button type="button" class="durus-cip__sayac"></button>'
        + '<button type="button" class="durus-cip__site" title="Bütün veri dosyalarını tara">Siteyi tara</button>'
        // Mekanik tahkik (assets/tahkik-tarama.js) aynı çipten açılıyor:
        // ikisi de @revise kipinin "metne bakma" araçları ve aynı veri
        // dosyalarını okuyorlar. Ayrı düğme, çünkü ayrı soru soruyorlar --
        // duruş: "bu cümle duruşumuza uyuyor mu"; tahkik: "bu metin
        // ölçülebilir biçimde yoğun mu, bir dili eksik mi".
        + '<button type="button" class="durus-cip__tahkik" title="Mekanik tahkik: M5 yoğunluk + M7 üç dil kayması">Tahkik</button>';
      document.body.appendChild(cip);
      cip.querySelector(".durus-cip__sayac").addEventListener("click", sonrakineGit);
      cip.querySelector(".durus-cip__site").addEventListener("click", siteAc);
      cip.querySelector(".durus-cip__tahkik").addEventListener("click", function () {
        if (window.__dostTahkik) window.__dostTahkik.ac();
      });
    }
    var s = cip.querySelector(".durus-cip__sayac");
    if (!turkceMi()) {
      // Sayaç yine de duruyor: "hiçbir şey görünmüyor" hâli bir kez
      // kafa karıştırdı, bir daha karıştırmasın.
      s.innerHTML = '<span class="durus-cip__temiz">🇹🇷 tarama yalnız Türkçede</span>';
      s.title = "Duruş taraması " + SURUM + " — kalıplar Türkçe için yazıldı";
      return;
    }
    s.innerHTML = (kural || gg)
      ? (kural ? '<span class="durus-cip__k">🔸 ' + kural + "</span>" : "")
        + (gg ? '<span class="durus-cip__g">🔹 ' + gg + "</span>" : "")
      : '<span class="durus-cip__temiz">✓ bu sayfa temiz</span>';
    s.title = "Duruş taraması " + SURUM + " — sıradaki işarete git";
  }

  var sonrakiIdx = 0;
  function sonrakineGit() {
    var hepsi = document.querySelectorAll(".durus-rozet");
    if (!hepsi.length) return;
    sonrakiIdx = sonrakiIdx % hepsi.length;
    var hedef = hepsi[sonrakiIdx++];
    hedef.scrollIntoView({ block: "center", behavior: "smooth" });
    hedef.focus({ preventScroll: true });
  }

  // --- SİTE TARAMASI ----------------------------------------------------
  // Asıl kullanım biçimi: bütün veri dosyalarını indirip tarar. Sayfa
  // sayfa gezmeye gerek kalmaz.
  function json(yol) {
    return window.DostGraphUtils
      ? window.DostGraphUtils.fetchJson(yol)
      : fetch(yol).then(function (r) { return r.json(); });
  }

  // JSON ağacında yürürken: en yakın "id"li ata kaydı ve alan adını
  // taşıyoruz, ki bulguyu bir kayda ve mümkünse bir bağlantıya
  // bağlayabilelim.
  // `dilTr`: bu dal bir {tr,en,pt} sözlüğünün TÜRKÇE kolundan mı geliyor?
  // Yalnız o dal taranıyor (s3). Hiçbir dil sözlüğünün altında olmayan
  // düz metinler de taranmıyor: onlar id/url/etiket gibi alanlar, revize
  // edilecek düzyazı değil.
  // `kok`: yoldaki EN DIŞTAKİ id'li kayıt -- gezinmenin hedefi bu olmalı.
  // `kayit`: en yakın id'li kayıt -- başlık/etiket için. Fütûhât
  // kısımlarında ikisi ayrışıyor: kök `c14k158` (kısmın kendisi, yani
  // açılacak sayfa), yakın kayıt `c14k158-s1` (bölüm). Önce yalnız
  // yakını taşıyorduk ve `goTo("futuhat","c14k158-s1")` diye gidiyorduk;
  // kısım açılıyordu ama doğru kısım olduğu tesadüftü.
  // s11: kaydın kimliği. id yoksa url (Daphne yazıları) ya da kenarın
  // iki ucu ("kaynak→hedef") -- scripts/duzenleme-uygula.py aynı çözücüyle
  // kaydı buluyor.
  function kimlik(o) {
    if (typeof o.id === "string") return o.id;
    if (typeof o.url === "string" && o.ozet) return o.url;
    if (typeof o.source === "string" && typeof o.target === "string") return o.source + "→" + o.target;
    if (typeof o.from === "string" && typeof o.to === "string") return o.from + "→" + o.to;
    return null;
  }
  // `yol`: kökten bu değere giden anahtar/sıra dizisi; `kokSira`: kök
  // kaydın yoldaki konumu. Alan adresi = kök kayıttan sonraki parçalar,
  // dil anahtarı hariç ("sections[2].blocks[3].text").
  function adresYaz(parcalar) {
    var s = "";
    parcalar.forEach(function (p) { s += typeof p === "number" ? "[" + p + "]" : (s ? "." : "") + p; });
    return s;
  }
  function gez(o, alan, kok, kayit, dilTr, cb, yol, kokSira) {
    yol = yol || [];
    if (o && typeof o === "object" && !Array.isArray(o)) {
      var kim = kimlik(o);
      var yakin = kim ? o : kayit;
      var yeniKok = kok, yeniSira = kokSira;
      if (!kok && kim) { yeniKok = o; yeniSira = yol.length; }
      Object.keys(o).forEach(function (anahtar) {
        gez(o[anahtar], DIL[anahtar] ? alan : anahtar, yeniKok, yakin,
            DIL[anahtar] ? (anahtar === "tr") : dilTr, cb,
            yol.concat([anahtar]), yeniSira);
      });
    } else if (Array.isArray(o)) {
      o.forEach(function (v, i) { gez(v, alan, kok, kayit, dilTr, cb, yol.concat([i]), kokSira); });
    } else if (typeof o === "string") {
      if (dilTr) {
        var rel = kok ? yol.slice(kokSira) : yol.slice();
        if (rel.length && rel[rel.length - 1] === "tr") rel.pop();
        cb(alan, o, kok, kayit, adresYaz(rel));
      }
    }
  }

  // d: kapsam dosya kaydı {yol, gorunum, gorunumId, etiket, muafAlan,
  // durusMuafKural, dosya (yazım kaynağı; Fütûhât'ta atlas)}.
  function dosyaTara(d, bulgular, veri) {
    var muaf = {};
    (d.muafAlan || []).forEach(function (a) { muaf[a] = 1; });
    var isle = function (veri) {
      gez(veri, null, null, null, false, function (alan, s, kok, kayit, alanYolu) {
        if (MUAF_ALAN[alan] || muaf[alan] || s.length < 40) return;
        kurallariUygula(alintisizMetin(s), s, d.durusMuafKural).forEach(function (b) {
          var kokId = kok && kimlik(kok);
          bulgular.push({
            kural: b.kural, esler: b.esler, anahtar: b.anahtar,
            etiket: d.etiket, view: d.gorunum,
            id: d.gorunumId != null ? (d.gorunumId || null) : (kokId && kokId.indexOf("→") < 0 ? kokId : null),
            dosya: d.dosya || d.yol, kayit: kokId, alan: kok ? alanYolu : null,
            baslik: kayit && (kayit.title || kayit.name || kayit.topic || kayit.question || kayit.label),
            metin: s,
          });
        });
      });
    };
    if (veri) { isle(veri); return Promise.resolve(); }
    return json(d.yol).then(isle).catch(function (e) {
      console.warn("Duruş taraması: " + d.yol + " okunamadı", e);
    });
  }

  // --- "buradayım": hedefe gidip ilgili paragrafı gösterme -------------
  // Doğru sayfayı açmak yetmiyordu; kullanıcı paragrafı elle arıyordu.
  // Gezindikten sonra metni DOM'da bulup ekrana getiriyor, paragrafı
  // kısa süre vurguluyor ve eşleşen ifadeyi geçici bir <mark> ile
  // işaretliyor. İçerik eşzamansız çizildiği için bir süre yokluyoruz.
  function sadelestir(s) {
    return String(s).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  }
  // HTML etiketlerini boşluk bırakmadan siler — DOM textContent ile karşılaştırma için
  function etiketSil(s) {
    return String(s).replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
  }
  function trKucuk(s) { return String(s).toLocaleLowerCase("tr"); }

  var vurguZaman = null;
  function vurguTemizle() {
    document.querySelectorAll(".durus-vurgu").forEach(function (el) {
      el.classList.remove("durus-vurgu");
    });
    document.querySelectorAll("mark.durus-vurgu-es").forEach(function (m) {
      var p = m.parentNode;
      if (!p) return;
      while (m.firstChild) p.insertBefore(m.firstChild, m);
      p.removeChild(m);
      p.normalize();
    });
  }

  // Eşleşen ifadeyi tek bir metin düğümü içinde bulup <mark>'a sarar.
  // Düğüm sınırına denk gelirse (araya bir <em>/<a> girmişse) vazgeçer --
  // paragraf vurgusu zaten yeterli bir "buradayım".
  function esiIsaretle(el, es) {
    var yuru = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
    var hedef = trKucuk(es);
    var n;
    while ((n = yuru.nextNode())) {
      if (n.parentNode && n.parentNode.closest(".durus-rozet-grup")) continue;
      var i = trKucuk(n.nodeValue).indexOf(hedef);
      if (i < 0) continue;
      var r = document.createRange();
      r.setStart(n, i);
      r.setEnd(n, i + es.length);
      var m = document.createElement("mark");
      m.className = "durus-vurgu-es";
      try { r.surroundContents(m); return m; } catch (e) { return null; }
    }
    return null;
  }

  function vurgula(bulgu) {
    vurguTemizle();
    if (vurguZaman) { clearTimeout(vurguZaman); vurguZaman = null; }
    var es = bulgu.esler[0].es;
    // İki kademeli arama: önce metnin başından uzunca bir dilim (kesin),
    // bulunamazsa yalnız eşleşen ifade (honorifics gibi eklentiler metni
    // değiştirmiş olabilir).
    // etiketSil: DOM textContent ile örtüşmesi için <em> gibi etiketleri
    // boşluk yerine silerek kaldırır (sadelestir " " bırakır → uyuşmazlık).
    var uzun = trKucuk(etiketSil(bulgu.metin).slice(0, 90));
    var kisa = trKucuk(es);
    var bitis = Date.now() + 8000;

    (function dene() {
      var adaylar = document.querySelectorAll(SECICI);
      var el = null, yedek = null;
      for (var i = 0; i < adaylar.length; i++) {
        var t = trKucuk(sadelestir(adaylar[i].textContent));
        if (t.indexOf(uzun) !== -1) { el = adaylar[i]; break; }
        if (!yedek && t.indexOf(kisa) !== -1) yedek = adaylar[i];
      }
      el = el || yedek;
      if (!el) {
        if (Date.now() < bitis) setTimeout(dene, 220);
        return;
      }
      esiIsaretle(el, es);
      el.classList.add("durus-vurgu");
      // detail-panel position:fixed içindeyse scrollIntoView ana sayfayı
      // kaydırır, panelin içini değil — panelin scrollTop'unu elle ayarla.
      var panelEl = document.getElementById("detail-panel");
      if (panelEl && !panelEl.hidden && panelEl.contains(el)) {
        var elRect = el.getBoundingClientRect();
        var pRect = panelEl.getBoundingClientRect();
        panelEl.scrollTop += elRect.top - pRect.top - panelEl.clientHeight / 2 + elRect.height / 2;
      } else {
        el.scrollIntoView({ block: "center", behavior: "smooth" });
      }
      vurguZaman = setTimeout(vurguTemizle, 6000);
    })();
  }

  // --- hafif tarama (s11) ------------------------------------------------
  // Site taraması her seferinde ~10 MB indiriyordu (telefon verisinde
  // ağır). İki önlem: (1) telefonda varsayılan "yalnız bu bölüm" --
  // açık görünümün dosyaları; (2) dosya bazında önbellek: HEAD isteğinin
  // ETag/Last-Modified'ı ve kural sürümü değişmemişse dosya yeniden
  // indirilmez, önceki bulgular kullanılır.
  var ONBELLEK_KEY = "dost-durus-onbellek";
  function telefonMu() {
    return !!(window.matchMedia && window.matchMedia("(max-width: 700px), (pointer: coarse)").matches);
  }
  var kapsamSecimi = null;   // "bolum" | "site"
  function gecerliGorunum() {
    if (/compare\.html$/.test(location.pathname)) return { view: "compare.html" };
    var m = /^\/(?:en\/|pt\/)?([a-z-]+)(?:\/([A-Za-z0-9_-]+))?/.exec(location.pathname);
    return m ? { view: m[1], id: m[2] } : { view: "ontoloji" };
  }
  function onbellekOku() {
    try { return JSON.parse(localStorage.getItem(ONBELLEK_KEY) || "{}"); } catch (e) { return {}; }
  }
  function onbellekYaz(o) {
    try { localStorage.setItem(ONBELLEK_KEY, JSON.stringify(o)); }
    catch (e) { try { localStorage.removeItem(ONBELLEK_KEY); } catch (e2) {} }
  }
  var KURAL_BY_ID = {};
  KURALLAR.forEach(function (k) { KURAL_BY_ID[k.id] = k; });
  function etiketiAl(yol) {
    return fetch(yol, { method: "HEAD", cache: "no-cache" }).then(function (r) {
      return r.ok ? (r.headers.get("ETag") || r.headers.get("Last-Modified") || "") : "";
    }).catch(function () { return ""; });
  }
  function onbellekliTara(d, bulgular, ob, sayac) {
    return etiketiAl(d.yol).then(function (etiket) {
      var k = ob[d.yol];
      if (etiket && k && k.e === etiket && k.s === SURUM) {
        sayac.atlanan++;
        k.b.forEach(function (x) {
          var kural = KURAL_BY_ID[x.k];
          if (!kural) return;
          bulgular.push(Object.assign({}, x.v, { kural: kural }));
        });
        return;
      }
      var yerel = [];
      return dosyaTara(d, yerel).then(function () {
        sayac.indirilen++;
        yerel.forEach(function (x) { bulgular.push(x); });
        if (etiket) {
          ob[d.yol] = { e: etiket, s: SURUM, b: yerel.map(function (x) {
            var v = Object.assign({}, x); delete v.kural;
            return { k: x.kural.id, v: v };
          }) };
        }
      });
    });
  }
  var sonSayac = null;
  function siteTara(secim) {
    var bulgular = [];
    var ob = onbellekOku();
    var sayac = { indirilen: 0, atlanan: 0, dosya: 0 };
    var g = gecerliGorunum();
    return paylasilaniYukle().then(function () { return json(KAPSAM); }).then(function (kapsam) {
      var dosyalar = kapsam.dosyalar.slice();
      var atlas = "data/ibn-arabi/futuhat-atlas.json";
      var kisimlar = json(kapsam.futuhat.indeks).then(function (idx) {
        return (idx.parts || []).map(function (p) {
          return { yol: kapsam.futuhat.parcaKlasoru + p.id + ".json", gorunum: "futuhat",
                   etiket: "Fütûhât " + p.id, dosya: atlas, kisim: p.id };
        });
      }).catch(function (e) { console.warn("Duruş taraması: kısım listesi okunamadı", e); return []; });
      return kisimlar.then(function (kl) {
        var hepsi = dosyalar.concat(kl);
        if (secim === "bolum") {
          hepsi = hepsi.filter(function (d) {
            if (d.gorunum !== g.view) return false;
            // Fütûhât'ta "bu bölüm" = açık kısım (yoksa hepsi).
            if (d.kisim && g.id) return d.kisim === g.id;
            return true;
          });
        }
        sayac.dosya = hepsi.length;
        return Promise.all(hepsi.map(function (d) { return onbellekliTara(d, bulgular, ob, sayac); }));
      });
    }).then(function () {
      onbellekYaz(ob);
      sonSayac = sayac;
      // Aynı metin birden çok dosyada geçebiliyor (atlas + parça kopyası);
      // aynı kural+metin çiftini bir kez gösteriyoruz.
      var gorulen = {};
      return bulgular.filter(function (b) {
        var k = b.anahtar;
        if (gorulen[k]) return false;
        gorulen[k] = 1;
        return true;
      });
    });
  }

  var sitePanel = null;
  var siteBirak = null;
  function siteKapat() {
    if (siteBirak) { siteBirak(); siteBirak = null; }
    if (sitePanel) { sitePanel.remove(); sitePanel = null; }
  }

  function siteAc(secim) {
    siteKapat();
    if (secim !== "bolum" && secim !== "site") secim = kapsamSecimi || (telefonMu() ? "bolum" : "site");
    if (secim !== kapsamSecimi) siteBulgulari = null;
    kapsamSecimi = secim;
    sitePanel = document.createElement("div");
    siteBirak = katman(siteKapat);
    sitePanel.className = "durus-site";
    sitePanel.innerHTML =
      '<div class="durus-site__backdrop"></div>'
      + '<div class="durus-site__card" role="dialog" aria-modal="true" aria-label="Site duruş taraması">'
      + '<div class="durus-site__head"><p class="durus-site__title">Site duruş taraması <span>' + SURUM + '</span></p>'
      + '<button type="button" class="durus-site__close" aria-label="Kapat">×</button></div>'
      + '<div class="durus-site__body"><p class="durus-site__yukleniyor">Veri dosyaları taranıyor…</p></div>'
      + "</div>";
    document.body.appendChild(sitePanel);
    sitePanel.querySelector(".durus-site__backdrop").addEventListener("click", siteKapat);
    sitePanel.querySelector(".durus-site__close").addEventListener("click", siteKapat);

    var yukle = siteBulgulari ? Promise.resolve(siteBulgulari) : siteTara(secim);
    yukle.then(function (bs) {
      siteBulgulari = bs;
      siteCiz();
    }).catch(function (e) {
      // Kapsam dosyası (tarama-kapsami.json) okunamazsa panel sonsuza
      // dek "taranıyor…" diyordu + yakalanmamış bir rejection kalıyordu.
      // Tek tek veri dosyaları zaten sessizce atlanıyor; buraya yalnız
      // kapsamın kendisi düşer -- o da susturulacak bir şey değil.
      var govde = sitePanel && sitePanel.querySelector(".durus-site__body");
      if (govde) govde.innerHTML = '<p class="durus-site__yukleniyor">Tarama başlatılamadı: '
        + 'kapsam listesi (tarama-kapsami.json) okunamadı. Konsola bakın.</p>';
      console.error("Duruş taraması başlatılamadı", e);
    });
  }

  function siteCiz() {
    if (!sitePanel) return;
    var d = susturulanlar();
    var bs = siteBulgulari.filter(function (b) { return !d[b.anahtar]; });
    var body = sitePanel.querySelector(".durus-site__body");
    var kapsamHtml = '<p class="durus-site__suzgec durus-site__kapsam">'
      + '<button type="button" data-kapsam="bolum" aria-pressed="' + (kapsamSecimi === "bolum") + '">'
      + esc(ui({ tr: "Yalnız bu bölüm", en: "This section only", pt: "Só esta secção" })) + "</button>"
      + '<button type="button" data-kapsam="site" aria-pressed="' + (kapsamSecimi === "site") + '">'
      + esc(ui({ tr: "Bütün site", en: "Whole site", pt: "Todo o site" })) + "</button>"
      + (sonSayac ? ' <span class="durus-site__sayac">' + sonSayac.dosya + " dosya · "
        + sonSayac.atlanan + " " + esc(ui({ tr: "değişmemiş (önbellek)", en: "unchanged (cached)", pt: "inalterados (cache)" }))
        + "</span>" : "")
      + "</p>";
    var kapsamBagla = function () {
      body.querySelectorAll("[data-kapsam]").forEach(function (btn) {
        btn.addEventListener("click", function () { siteAc(btn.dataset.kapsam); });
      });
    };
    if (!bs.length) {
      body.innerHTML = kapsamHtml + '<p class="durus-site__temiz">✓ Kuralların hiçbiri tetiklenmedi. '
        + "Bu, metinlerin doğru olduğunu değil, bu " + KURALLAR.length
        + " kalıbın bulunmadığını söyler.</p>";
      kapsamBagla();
      return;
    }
    // Kurala göre grupla; kural seviyesi önce.
    var gruplar = {};
    bs.forEach(function (b) { (gruplar[b.kural.id] = gruplar[b.kural.id] || []).push(b); });
    var sirali = KURALLAR.filter(function (k) { return gruplar[k.id]; });

    bs.forEach(function (b, i) { b.__i = i; });
    var kSay = bs.filter(function (b) { return b.kural.seviye === "kural"; }).length;
    body.innerHTML = kapsamHtml +
      '<p class="durus-site__ozet">🔸 ' + kSay + " kural · 🔹 " + (bs.length - kSay)
      + " gözden geçir · " + siteBulgulari.length + " bulgunun "
      + (siteBulgulari.length - bs.length) + " tanesi susturulmuş</p>"
      + sirali.map(function (k) {
        var g = gruplar[k.id];
        return '<section class="durus-site__grup">'
          + '<h3>' + (k.seviye === "kural" ? "🔸" : "🔹") + " " + esc(k.ad)
          + ' <span>' + g.length + "</span></h3>"
          + '<p class="durus-site__neden">' + esc(k.neden) + "</p>"
          + g.map(function (b) { return siteSatir(b); }).join("")
          + "</section>";
      }).join("");

    kapsamBagla();
    body.querySelectorAll("[data-sustur]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var b = bs[Number(btn.dataset.i)];
        sustur(btn.dataset.sustur, b ? { kural: b.kural.id, dosya: b.dosya, kayit: b.kayit, alan: b.alan,
                                         ozet: sadelestir(b.metin).slice(0, 120) } : null);
        siteCiz();
        tara();
      });
    });
    body.querySelectorAll("[data-oner]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        oneriAc(btn.closest(".durus-site__satir"), bs[Number(btn.dataset.oner)], "durus");
      });
    });
    body.querySelectorAll("a.durus-site__git").forEach(function (a) {
      a.addEventListener("click", function (e) {
        e.preventDefault();
        var b = bs[Number(a.dataset.i)];
        siteKapat();
        gitVeVurgula(a.dataset.view, a.dataset.id, b);
      });
    });
  }

  // Bulgunun görünümüne git ve paragrafı vurgula. Sonu .html olan görünüm
  // (Daphne: compare.html) ya da yönlendiricisi olmayan sayfa: tam sayfa.
  function gitVeVurgula(view, id, b) {
    if (/\.html$/.test(view)) {
      if (location.pathname.slice(-view.length) === view) { if (b) vurgula(b); return; }
      location.href = "/" + view;
      return;
    }
    if (window.__dostNav) window.__dostNav.goTo(view, id || undefined);
    else { location.href = "/" + view + (id ? "/" + id : ""); return; }
    if (b) setTimeout(function () { vurgula(b); }, 350);
  }

  // "Düzeltme öner" (s11): bulgunun alanını, tam Türkçe metniyle bir
  // düzenleme kutusunda açar; "Kuyruğa ekle" adresli bir kayıt bırakır
  // (edit-mode.js kuyrugaEkle). Adres yoksa düğme görünmez.
  function oneriAc(satir, b, kaynakArac) {
    if (!satir || !b || satir.querySelector(".durus-oneri")) return;
    var kutu = document.createElement("div");
    kutu.className = "durus-oneri";
    kutu.innerHTML = '<textarea class="durus-oneri__metin" rows="5"></textarea>'
      + '<div class="durus-oneri__alt">'
      + '<button type="button" data-oneri="ekle">' + esc(ui({ tr: "Kuyruğa ekle", en: "Add to queue", pt: "Adicionar à fila" })) + "</button>"
      + '<button type="button" data-oneri="vazgec">' + esc(ui({ tr: "Vazgeç", en: "Cancel", pt: "Cancelar" })) + "</button>"
      + "</div>";
    satir.appendChild(kutu);
    var ta = kutu.querySelector("textarea");
    ta.value = b.metin;
    ta.focus();
    kutu.querySelector('[data-oneri="vazgec"]').addEventListener("click", function () { kutu.remove(); });
    kutu.querySelector('[data-oneri="ekle"]').addEventListener("click", function () {
      var yeni = ta.value.trim();
      if (!yeni || yeni === b.metin || !window.__dostRevise) { kutu.remove(); return; }
      var ok = window.__dostRevise.kuyrugaEkle({
        dosya: b.dosya, kayit: b.kayit, alan: b.alan, lang: "tr",
        heading: (b.etiket || "") + (b.kayit ? " · " + b.kayit : ""),
        before: b.metin, after: yeni,
        before_metin: sadelestir(b.metin), after_metin: sadelestir(yeni),
        kaynak_arac: kaynakArac, kural: b.kural ? b.kural.id : (b.tur || null),
      });
      if (ok) kutu.remove();
    });
  }

  function siteSatir(b) {
    var i = b.esler[0].i;
    var duz = alintisizMetin(b.metin);
    var bas = Math.max(0, i - 90);
    var parca = (bas ? "…" : "") + duz.slice(bas, i)
      + '<mark>' + esc(b.esler[0].es) + "</mark>"
      + duz.slice(i + b.esler[0].es.length, i + b.esler[0].es.length + 90) + "…";
    var nere = esc(b.etiket) + (b.baslik ? " · " + esc(t3(b.baslik)) : (b.id ? " · " + esc(b.id) : ""));
    return '<div class="durus-site__satir">'
      + '<p class="durus-site__nere">' + nere
      + (b.view
          ? ' <a class="durus-site__git" href="#" data-i="' + b.__i + '" data-view="' + esc(b.view)
            + '" data-id="' + esc(b.id || "") + '">aç →</a>'
          : "")
      + "</p>"
      + '<p class="durus-site__parca">' + parca + "</p>"
      + (b.kayit ? '<p class="durus-site__adres"><code>' + esc([b.dosya, b.kayit, b.alan].filter(Boolean).join(" · ")) + "</code></p>" : "")
      + '<div class="durus-site__eylem">'
      + '<button type="button" class="durus-site__sustur" data-i="' + b.__i + '" data-sustur="' + esc(b.anahtar) + '">Bu doğru — kaldır</button>'
      + (b.kayit && b.alan && window.__dostRevise
          ? '<button type="button" class="durus-site__oner" data-oner="' + b.__i + '">'
            + esc(ui({ tr: "Düzeltme öner", en: "Suggest a fix", pt: "Sugerir correção" })) + "</button>"
          : "")
      + "</div></div>";
  }
  function ui(d) {
    var l = (window.DostI18n && window.DostI18n.getLang && window.DostI18n.getLang()) || "tr";
    return d[l] || d.tr;
  }
  function t3(x) {
    if (typeof x === "string") return x;
    return (window.DostI18n && window.DostI18n.pick3(x)) || (x && (x.tr || x.en || x.pt)) || "";
  }

  // --- kipe bağlanma ----------------------------------------------------
  // edit-mode.js'e dokunmuyoruz; sadece body sınıfını izliyoruz. Böylece
  // iki dosya bağımsız kalıyor ve kip kapanınca bütün işaretler siliniyor.
  var acik = false;
  var icerikGozcusu = null;
  var taramaZaman = null;

  // Bir mutasyon kaydı yalnızca BİZİM ürettiğimiz düğümlerden mi
  // oluşuyor? (Yukarıdaki (a) korumasının ölçütü.)
  var BIZIM_SINIFLAR = ["durus-rozet-grup", "durus-rozet", "durus-cip",
                        "durus-kutu", "durus-site", "durus-vurgu-es"];
  function bizimDugum(n) {
    if (!n) return false;
    if (n.nodeType === 3) {
      // Kendi <mark>'ımızı sararken/çözerken metin düğümü taşınıyor.
      return !!(n.parentNode && n.parentNode.closest
                && n.parentNode.closest("mark.durus-vurgu-es, .durus-rozet-grup, .durus-site, .durus-kutu"));
    }
    if (n.nodeType !== 1) return true;
    for (var i = 0; i < BIZIM_SINIFLAR.length; i++) {
      if (n.classList && n.classList.contains(BIZIM_SINIFLAR[i])) return true;
    }
    return !!(n.closest && n.closest(".durus-site, .durus-kutu, .durus-rozet-grup"));
  }
  function bizimMi(k) {
    var hepsi = [].slice.call(k.addedNodes).concat([].slice.call(k.removedNodes));
    return hepsi.length > 0 && hepsi.every(bizimDugum);
  }
  function taramaGecikmeli() {
    if (taramaZaman) clearTimeout(taramaZaman);
    taramaZaman = setTimeout(function () { taramaZaman = null; tara(); }, 300);
  }

  function kipDegisti() {
    var simdi = document.body.classList.contains("dost-edit-mode");
    if (simdi === acik) return;
    acik = simdi;
    if (acik) {
      paylasilaniYukle().then(function () { if (acik) tara(); });
      tara();
      // Detay paneli / kısım metni sonradan çiziliyor, o yüzden DOM'u
      // izliyoruz. Ama bu iki koruma olmadan sayfa KİLİTLENİYOR:
      //
      // (a) Kendi ürettiğimiz düğümleri (rozet, sayaç, kutu, vurgu)
      //     yok sayıyoruz. Yoksa şu zincir kuruluyor: biz rozet ekliyoruz
      //     → sayfadaki başka bir gözcü (honorifics/çapraz-link gibi metne
      //     dokunanlar) tetikleniyor ve DOM'u değiştiriyor → bizim gözcü
      //     tetikleniyor → yeniden rozet ekliyoruz → …
      // (b) Tarama bir zamanlayıcıya alınıyor. MutationObserver geri
      //     çağrıları mikro-görev; uçtan uca bir zincir kurulduğunda
      //     fetch/promise'lere hiç sıra gelmiyor ve sayfa yanıt vermiyor.
      //     setTimeout bir makro-görev olduğu için olay döngüsü nefes
      //     alıyor. (2026-07-29'da ölçüldü: @revise açıkken sayfadaki bir
      //     fetch hiç tamamlanmıyordu.)
      icerikGozcusu = new MutationObserver(function (kayitlar) {
        if (kayitlar.every(bizimMi)) return;
        taramaGecikmeli();
      });
      icerikGozcusu.observe(document.body, { childList: true, subtree: true });
    } else {
      if (icerikGozcusu) { icerikGozcusu.disconnect(); icerikGozcusu = null; }
      if (taramaZaman) { clearTimeout(taramaZaman); taramaZaman = null; }
      temizle();
    }
  }

  new MutationObserver(kipDegisti).observe(document.body, {
    attributes: true, attributeFilter: ["class"],
  });
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", kipDegisti);
  } else kipDegisti();

  document.addEventListener("click", function (e) {
    if (acikKutu && !e.target.closest(".durus-kutu") && !e.target.closest(".durus-rozet")) kutuKapat();
  });
  // Escape artık burada değil, GU.registerStepBack'in merkezi sırasında --
  // iki katman aynı anda açıkken tek Escape'in hepsini kapatmaması için.
  // İki alt-katman arasındaki öncelik (site paneli > tekil kutu) korunuyor.
  if (window.DostGraphUtils) {
    window.DostGraphUtils.registerStepBack(null, function () {
      if (sitePanel) { siteKapat(); return true; }
      if (acikKutu) { kutuKapat(); return true; }
      return false;
    });
  }

  // Testler ve elden tarama için.
  window.__dostDurus = {
    tara: tara, bulgular: bulgular, kurallar: KURALLAR, surum: SURUM,
    siteTara: siteTara, siteAc: siteAc,
    oneriAc: oneriAc, gitVeVurgula: gitVeVurgula, sustur: sustur,
    susturulanlar: susturulanlar,
    metinTara: function (s) { return kurallariUygula(alintisizMetin(s), s); },
    vurgula: vurgula, vurguTemizle: vurguTemizle,
    // Tek dosya taraması: testler 209 dosyayı indirmeden hedef id'lerini
    // doğrulayabilsin diye açık.
    dosyaTara: function (yol, view, etiket) {
      var bs = [];
      return dosyaTara({ yol: yol, gorunum: view, etiket: etiket }, bs).then(function () { return bs; });
    },
  };
})();
