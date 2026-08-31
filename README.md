# Daktent Inventaris PWA

Zero-dependency, mobile-first inventarisapp met centrale Supabase REST-opslag. Foto's worden vóór upload verkleind en privé in Supabase Storage opgeslagen. De app werkt zonder npm, framework of build-stap.

## Lokaal openen

Serveer deze map met een eenvoudige statische webserver. Open daarna het getoonde adres. Rechtstreeks openen als `file://` wordt afgeraden omdat een service worker dan niet werkt.

## Supabase koppelen

1. Voer de schema- en opeenvolgende migratiebestanden uit in de SQL Editor.
2. Activeer e-mail/wachtwoord-authenticatie en maak de gezamenlijke gebruiker aan.
3. Vul alleen de project-URL en publishable key in `config.js` in. Gebruik nooit een service-role key.
4. Publiceer de bestanden rechtstreeks via GitHub Pages.

## Versie 21

- actuele kogeldruk wordt vóór een beladingsmoment expliciet gevraagd;
- historische metingen worden nooit automatisch als actueel gebruikt;
- off-gridplanning voor water, stroom, solar en gas;
- pakstatus per reis van `Nog thuis` tot `Gecontroleerd`;
- herstelbare verwijdering via de prullenbak;
- zelf een hoofdfoto per artikel kiezen;
- trailerplattegrond met zonegewichten en bestaande KT-EU2/Symbioz-limieten.

## Bestanden

- `index.html`, `styles.css`, `app.js`: interface en interacties
- `api.js`: lokale en Supabase datastore-adapters
- `auth.js`, `storage.js`: browser-native Supabase Auth- en Storage-clients
- `seed.js`: zes boxen en voorbeeldinventaris
- `manifest.webmanifest`, `sw.js`: installatie en offline fallback
- `supabase-schema.sql`: tabellen, indexen, RLS en privé-opslagbucket

De map kan zonder build-stap op GitHub Pages of een andere statische host worden gepubliceerd.
