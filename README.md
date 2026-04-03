# Odeme Paneli

Bu proje Next.js + Supabase tabanli bir odeme takip panelidir.

## Calisma Sekli

- Giris yontemi: Google OAuth veya e-posta/sifre
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
2. `Authentication > Providers` icinde sadece `Email` ve `Google` acik kalsin.
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

## Zorunlu Manuel Adimlar

Asagidaki isler hesap oturumu gerektirdigi icin panelden yapilmalidir:

- Supabase provider ayarlari
- Google Cloud OAuth client ayarlari
- Vercel proje olusturma ve env girme

Repo tarafi hazirdir.
