# 🎯 Forenklet TV-Oppsett for Samsung MagicInfo

## Oversikt

Det nye oppsettet gjør det **super enkelt** å legge til nye Samsung TV-er med MagicInfo URL Launcher. Ingen manuell MAC-adresse-innskriving eller komplisert konfigurasjon nødvendig!

## ✨ Nye Funksjoner

### 1. QR-kode Generator
- Gå til: `https://signage.aquatiq.com/setup.html`
- Fyll ut skjermnavn og plassering
- Velg en ferdig mal (kontor, lager, butikk, restaurant)
- Klikk "Generer QR-kode"
- Skann QR-koden med Samsung-fjernkontrollen

### 2. Auto-registrering
- TV-en registrerer seg automatisk ved første tilkobling
- Ingen behov for å legge inn MAC-adresse manuelt
- Automatisk tildeling av innhold basert på valgt mal

### 3. Deployment Templates
Fire ferdige maler som settes opp automatisk:
- **Kontor**: Standard rotasjon med dashboard
- **Lager**: BxSoftware logistikk-dashboard
- **Butikk**: Produktvisning og kampanjer
- **Restaurant**: Meny og tilbud

## 🚀 Slik setter du opp en ny TV (3 steg)

### Steg 1: Generer oppsett-URL

1. Åpne i nettleseren: `https://signage.aquatiq.com/setup.html`
2. Fyll ut:
   - **Skjermnavn**: f.eks. "Resepsjon Display"
   - **Plassering**: f.eks. "Hovedkontor"
   - **Mal**: Velg "Kontor (Standard)"
3. Klikk **"Generer QR-kode"**

### Steg 2: Konfigurer Samsung TV

1. Start **MagicInfo** på TV-en
2. Gå til **URL Launcher**
3. **Skann QR-koden** eller kopier URL-en manuelt
4. Angi disse innstillingene:
   - **Play Mode**: URL
   - **URL Refresh**: 30 sekunder
   - **Auto Play**: On
   - **Kiosk Mode**: On

### Steg 3: Ferdig! 🎉

TV-en vil:
1. ✅ Automatisk registrere seg i systemet
2. ✅ Få tildelt valgt mal med innhold
3. ✅ Starte visning av innhold umiddelbart
4. ✅ Sende heartbeat hvert 30. sekund
5. ✅ Vises som "Online" i admin-panelet

## 📱 QR-kode Eksempel

```
https://signage.aquatiq.com/player.html?setup=abc123&name=Resepsjon&location=Hovedkontor&template=office-basic
```

## 🔧 Teknisk Oversikt

### Nye API Endpoints

#### `POST /api/screen-api/register`
Auto-registrerer en ny skjerm:
```json
{
  "mac_address": "00:11:22:33:44:55",
  "name": "Resepsjon Display",
  "location": "Hovedkontor",
  "ip_address": "192.168.1.100"
}
```

**Respons:**
```json
{
  "success": true,
  "screen": {
    "id": "uuid",
    "name": "Resepsjon Display",
    "location": "Hovedkontor",
    "mac_address": "00:11:22:33:44:55",
    "is_new": true
  },
  "message": "Skjerm registrert"
}
```

### Nye Filer

#### `/setup.html` - QR-kode Generator
- Visuelt grensesnitt for å generere oppsett-URL-er
- Integrert QR-kode generator
- Maler for forskjellige bruksområder

#### `/player.html` - Smart Player
- Auto-registrering ved første tilkobling
- MAC-adresse deteksjon (Tizen API eller URL parameter)
- Automatisk mal-anvendelse
- Fallback-håndtering
- Heartbeat og innholds-synkronisering

#### `/src/routes/screen-registration.ts`
- Backend-logikk for auto-registrering
- Duplikat-sjekk (samme MAC-adresse)
- Opprettelse av standard spilleliste
- Template-integrasjon

## 🎯 Sammenligning: Gammelt vs Nytt

### Gammelt Oppsett (5-10 minutter)
1. ❌ Finn MAC-adresse på TV-en
2. ❌ Logg inn på admin-panelet
3. ❌ Opprett skjerm manuelt
4. ❌ Legg til innhold
5. ❌ Opprett spilleliste
6. ❌ Tildel spilleliste til skjerm
7. ❌ Skriv inn URL manuelt på TV
8. ❌ Test at alt fungerer

### Nytt Oppsett (30 sekunder)
1. ✅ Gå til `/setup.html`
2. ✅ Fyll ut skjermnavn
3. ✅ Velg mal
4. ✅ Skann QR-kode
5. ✅ **FERDIG!**

## 💡 Tips og Triks

### For IT-ansvarlige
- Print ut QR-koder og fest på hver TV-lokasjon
- Lag en "TV Setup"-sone hvor alle nye TV-er konfigureres
- Bruk samme mal for alle TV-er i samme avdeling

### For endringer senere
- Alle endringer gjøres i admin-panelet på `tools.aquatiq.com/signage`
- TV-en vil automatisk oppdatere innhold ved neste sjekk (30-60 sek)
- Ingen behov for å røre TV-en etter første oppsett

### Feilsøking
Hvis TV-en ikke vises i admin-panelet:
1. Sjekk at TV-en har internett
2. Verifiser at URL-en er skrevet riktig
3. Se på TV-skjermen - vises det en feilmelding?
4. Kontroller at URL Launcher er aktivert i MagicInfo

## 📊 Overvåking

TV-status vises i sanntid på `tools.aquatiq.com/signage`:
- 🟢 **Grønn**: TV er online
- 🔴 **Rød**: TV har ikke sendt heartbeat på >30 sek
- 📊 **Sist sett**: Når TV-en sist kommuniserte med serveren
- 🎬 **Nåværende innhold**: Hva som vises akkurat nå

## 🔄 Automatiske Templates

### Office-Basic
- Dashboard rotasjon
- Nyhetsfeed
- Firmainformasjon
- **Varighet**: 60 sek per slide

### Warehouse
- BxSoftware logistikk-dashboard
- Real-time plukk/mottaksstatistikk
- Auto-refresh hvert 30. sekund
- **Varighet**: 30 sek

### Retail
- Produktvisning
- Kampanjer
- Sesonginnhold
- **Varighet**: 45 sek per slide

### Restaurant
- Meny-rotasjon
- Dagens tilbud
- Allergenerinformasjon
- **Varighet**: 30 sek per slide

## 🚀 Skalerbarhet

Systemet er designet for å håndtere:
- ✅ 1-1000+ skjermer
- ✅ Automatisk oppdatering av alle skjermer samtidig
- ✅ Geografisk distribusjon (flere lokasjoner)
- ✅ Multi-tenant support (flere kunder)

## 📞 Support

Hvis du trenger hjelp:
1. Sjekk denne dokumentasjonen først
2. Se etter feilmeldinger i konsollen på TV-en
3. Kontakt Aquatiq utviklingsteam

---

**Oppdatert**: Februar 2026  
**Status**: ✅ Produksjonsklar
