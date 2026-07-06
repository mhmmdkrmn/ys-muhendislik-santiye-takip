# YS Muhendislik Santiye Takip

Santiye, metraj ve gunluk is takibi icin Next.js + Supabase tabanli web uygulamasi.

## Yerel calistirma

```bash
npm install
npm run dev
```

Yerel adres:

```text
http://localhost:3000
```

## Ucretsiz yayin plani

1. GitHub'da yeni repo ac: `ys-muhendislik-santiye-takip`
2. Bu klasoru GitHub reposuna push et.
3. Supabase'de yeni proje ac.
4. Supabase `Project Settings > API` ekranindan su degerleri al:
   - `Project URL`
   - `anon public key`
5. Vercel'de `New Project` ile GitHub reposunu import et.
6. Vercel `Environment Variables` alanina ekle:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
7. Deploy et.

## Ilk roller

- `admin`: Tum santiyeler, kullanicilar, metrajlar ve raporlar.
- `saha`: Kendi sorumlu oldugu santiye icin gunluk is ve metraj girisi.

## Supabase

Baslangic SQL dosyasi:

```text
supabase/schema.sql
```

Supabase SQL Editor icinde calistirilabilir.
