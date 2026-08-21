# Daktent Inventaris PWA

Zero-dependency, mobile-first inventarisapp. De lokale demomodus werkt volledig in de browser en bewaart data in `localStorage`. Foto's worden vóór opslag verkleind. De datastore achter `api.js` kan via `config.js` worden omgeschakeld naar Supabase REST.

## Lokaal openen

Serveer deze map met een eenvoudige statische webserver. Open daarna het getoonde adres. Rechtstreeks openen als `file://` wordt afgeraden omdat een service worker dan niet werkt.

## Supabase koppelen

1. Maak een Supabase-project en voer `supabase-schema.sql` uit in de SQL Editor.
2. Activeer e-mail/wachtwoord-authenticatie en maak de gezamenlijke gebruiker aan.
3. Vul alleen de project-URL en publishable/anon key in `config.js` in. Gebruik nooit de service-role key.
4. De resterende auth- en Storage-HTTP-aanroepen kunnen daarna worden geactiveerd; de database-adapter staat al in `api.js`.

## Bestanden

- `index.html`, `styles.css`, `app.js`: interface en interacties
- `api.js`: lokale en Supabase datastore-adapters
- `auth.js`, `storage.js`: browser-native Supabase Auth- en Storage-clients
- `seed.js`: zes boxen en voorbeeldinventaris
- `manifest.webmanifest`, `sw.js`: installatie en offline fallback
- `supabase-schema.sql`: tabellen, indexen, RLS en privé-opslagbucket

De map kan zonder build-stap op GitHub Pages of een andere statische host worden gepubliceerd.
