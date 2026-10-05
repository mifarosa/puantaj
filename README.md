# Puantaj
Skor tabelası web uygulaması (PWA). Canlı adres: https://puantaj.mifarosa.com

## Sporlar
- **Basit Skor**: kuralsız A–B sayacı
- **Masa Tenisi**: 11 sayı, 2 fark; servis 2 sayıda bir, 10–10’dan sonra her sayıda değişir; 3 / 5 / 7 set
- **Voleybol**: 25 sayı, 2 fark, son set 15; sayıyı alan servis atar; 3 / 5 set
- **Basketbol**: +1 / +2 / +3, 4 çeyrek, geri sayan saat (son dakikada saliseli), uzatma 5 dk
- **Futbol**: 2 devre, ileri sayan saat, uzatma dakikaları (45+2 gibi)

## Kullanım
- Ekran ikiye bölünür: dikeyde üst/alt, yatayda sol/sağ. Ortadaki şeritte ayarlar, geri al, set/devre bilgisi, saat ve taraf değiştir var.
- Takım alanının **üst yarısı +1**, **alt yarısı −1**. Basketbolda üst yarı +1 / +2 / +3.
- Skor eski tabelalar gibi kart çevirerek değişir.
- Set bitince sonuç ekranı çıkar; maç bitince sonuç geçmişe kaydedilir.
- Maç durumu cihazda saklanır, sayfa yenilense de kaybolmaz. Çevrimdışı çalışır, ana ekrana eklenebilir.

## Çalıştırma
Derleme adımı yok:

```sh
npx http-server -p 8080 .
```

GitHub Pages ile `main` dalı / kök klasörden yayınlanır; alan adı `CNAME` dosyasında.
