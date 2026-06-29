# Odeme Paneli

Bu proje Next.js + Supabase tabanli bir odeme takip panelidir.

## Calisma Sekli

- Giris yontemi: Google OAuth, Facebook OAuth veya e-posta/sifre
- Her kullanici sadece kendi verisini gorur
- Faturalar Supabase Storage icinde kullanici bazli klasorde tutulur

## Local

`.env.local` olustur:

```env
NEXT_PUBLIC_SUPABASE_URL=https://mhoidirxbxqaktkhhavp.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

Calistir:

```bash
npm run dev
```

Production benzeri calistir:

```bash
npm run build
npm run start
```

## Supabase

1. [supabase-setup.sql](/C:/Users/selim/odeme-paneli/supabase-setup.sql) dosyasini SQL Editor'da calistir.
2. `Authentication > Providers` icinde `Email`, `Google` ve `Facebook` acik kalsin.
3. `Storage` icinde `faturalar` bucket'i olsun.
4. `Authentication > URL Configuration` icine local ve production URL'lerini ekle.

## Vercel

Vercel proje env'leri:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Deploy sonrasi production URL'yi su yerlere ekle:

- Supabase `Site URL`
- Supabase redirect allow list
- Google OAuth authorized origins
- Google OAuth redirect ayarlari
- Meta/Facebook Login valid OAuth redirect URI:
  `https://mhoidirxbxqaktkhhavp.supabase.co/auth/v1/callback`
- Supabase `Authentication > Providers > Facebook` icine Meta `App ID` ve `App Secret`

## Zorunlu Manuel Adimlar

Asagidaki isler hesap oturumu gerektirdigi icin panelden yapilmalidir:

- Supabase provider ayarlari
- Google Cloud OAuth client ayarlari
- Meta Facebook Login app ayarlari
- Vercel proje olusturma ve env girme

Repo tarafi hazirdir.

## Codex genis yetkili calisma ortami

Bu repo odedimi.com projesi icin Codex ile guvenli gelistirme, test, deploy ve inceleme akisini destekler.

Codex yapabilir:

- Kaynak kodu okuyup duzenleyebilir.
- Yeni dosya ve migration dosyasi ekleyebilir.
- Lint, typecheck, test ve build calistirabilir.
- Git branch, commit, push ve PR akislarini yonetebilir.
- Supabase SQL migration dosyalari hazirlayabilir.
- Vercel, Supabase, GitHub ve admin panelini browser uzerinden test edebilir.

Codex onay almadan yapmamalidir:

- Production verisini silmek veya toplu degistirmek.
- Admin yetkisi vermek veya almak.
- Force push yapmak.
- `git reset --hard`, `git clean -fd` gibi geri donusu zor komutlar calistirmak.
- DNS, domain, billing, kart veya fatura ayari degistirmek.
- Kisisel hesaplara, banka/kart bilgilerine veya alakasiz dosyalara erismek.
- Secret, cookie, token veya session dosyalarini repoya eklemek.

## Mac'te Codex'i guncel projeyle acma

Calismaya baslamadan once:

```bash
npm run codex:mac
```

Bu komut:

- Local degisiklik varsa durur.
- `git fetch origin` calistirir.
- Aktif branch icin `git pull --rebase origin <branch>` calistirir.
- `.codex-browser-profile` ve `logs` klasorlerini local olarak hazirlar.

Local degisiklik varsa otomatik ezmez.

## Windows'ta Codex'i guncel projeyle acma

```powershell
npm run codex:win
```

Bu komut Mac akisiyle ayni guvenlik kontrollerini uygular.

## Browser agent kullanimi

Codex in-app browser varsayilan yoldur. Ayrica guvenli ve ayri Chrome profili acmak icin:

Mac:

```bash
bash scripts/open-browser-profile-mac.sh
```

Windows:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/open-browser-profile-windows.ps1
```

Browser agent sadece odedimi.com, GitHub, Supabase ve Vercel gibi proje isleri icin kullanilmalidir.

## Guvenli browser profili

Local browser profili:

```text
.codex-browser-profile/
```

Bu klasor `.gitignore` icindedir. Repoya eklenmemelidir.

Bu profile kisisel Gmail, banka, kart, sifre yoneticisi veya alakasiz hesaplar eklenmemelidir.

Browser agent loglari:

```text
logs/browser-agent.log
```

Loglarda secret, cookie, token, sifre veya kisisel veri tutulmamalidir.

## Supabase ve GitHub yetki sinirlari

Supabase:

- Service role key sadece server-side env icinde kalmalidir.
- Service role key frontend'e veya `NEXT_PUBLIC_` degiskenlerine konmamalidir.
- Production DB'de veri silme veya toplu update icin acik onay gerekir.
- RLS policy dosyalari migration olarak hazirlanir ve SQL Editor'de kontrollu calistirilir.

GitHub:

- SSH remote kullanilir.
- Force push kullanilmaz.
- Riskli degisikliklerde branch/PR akisi tercih edilir.
- Direkt `main` push gerekiyorsa once `git status` ve degisiklik ozeti kontrol edilir.

## Production islemlerde onay kurallari

Onay gerektiren islemler:

- Kullanici silme veya pasiflestirme.
- Admin yetkisi verme/alma.
- Payment/project kayitlarini toplu degistirme.
- Database temizleme.
- Domain, DNS, Vercel billing veya Supabase billing degisikligi.
- Production env secret rotasyonu.

Onay gerektirmeyen dusuk riskli islemler:

- Kod okuma.
- Lint, test, build calistirma.
- Migration dosyasi hazirlama.
- Local dev server calistirma.
- Read-only panel kontrolu.

## Is bitince commit/push akisi

Mac:

```bash
bash scripts/save-work.sh "Commit mesajin"
```

Windows:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/save-work.ps1 "Commit mesajin"
```

Commit mesaji verilmezse script mesaj ister. Bos mesajla commit yapmaz.

Scriptler secret ve local runtime dosyalarini stage etmemeye calisir:

- `.env*`
- `.vercel/`
- `.codex-browser-profile/`
- `logs/`
- `*.pem`
- `*.key`

## Conflict cikarsa ne yapilacak

`git pull --rebase` conflict verirse:

1. Codex islemi durdurur.
2. Conflict dosyalari raporlanir.
3. Kullanici onayi olmadan dosyalar resetlenmez.
4. Cozumden sonra lint/typecheck/build tekrar calistirilir.

## Secret dosyalari neden repoya eklenmemeli

Secret dosyalari repoya girerse:

- Service role key ile database tamamen ele gecirilebilir.
- Admin session veya API keyleri ele gecirilebilir.
- Vercel/Supabase/GitHub erisimi riske girebilir.

Bu nedenle gercek secret degerleri sadece Vercel/Supabase/GitHub panelinde veya local `.env.local` icinde tutulur. `.env.example` yalnizca isim ve placeholder icermelidir.

## Kurulum testleri

Kontrol listesi:

- `npm run codex:mac` local degisiklik varsa pull yapmadan durur.
- `.env*`, `.codex-browser-profile/`, `.vercel/` ve `logs/` repoya girmez.
- `bash scripts/save-work.sh "test"` commit mesaji olmadan commit yapmaz.
- Browser profile ayri klasorde acilir.
- Normal kullanici `/admin` alanina giremez.
- Admin API endpointleri server-side cookie ve admin kontrolu ister.
- Deploy oncesi `npm run lint`, `npx tsc --noEmit`, `npm run test`, `npm run build` gecmelidir.
