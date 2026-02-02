# 🎯 Super Enkel URL for Samsung TV

## URL Format - MYE kortere! ✨

### Før (Lang og komplisert):
```
https://signage.aquatiq.com/player.html?setup=12345678-1234-1234-1234-123456789012&name=Reception%20Display&location=Main%20Office&template=office-basic
```
**Lengde**: 140+ tegn  
**Lett å skrive feil**: ❌ Ja!

### Nå (Superkort!):
```
https://signage.aquatiq.com/tv/abc123
```
**Lengde**: 35 tegn (75% kortere!)  
**Lett å skrive feil**: ✅ Nei!

---

## 📱 Slik bruker du det (30 sekunder)

### 1. Gå til oppsett-siden
```
https://signage.aquatiq.com/setup.html
```

### 2. Fyll ut 2 felt
- **Skjermnavn**: "Resepsjon"
- **Plassering**: "Hovedkontor"

### 3. Klikk "Generer URL"
Du får en kort URL som ser slik ut:
```
https://signage.aquatiq.com/tv/p4k7n2
```

### 4. Kopier & lim inn i TV-en
- Åpne **URL Launcher** på Samsung TV
- **Lim inn** URL-en
- **Ferdig!** 🎉

---

## ✨ Hvorfor dette er bedre

| Funksjon | Gammel URL | Ny Kort URL |
|----------|-----------|-------------|
| **Lengde** | 140+ tegn | 35 tegn |
| **Lett å skrive** | ❌ Nei | ✅ Ja |
| **Lett å huske** | ❌ Nei | ✅ Ja |
| **Lett å dele** | ❌ Nei | ✅ Ja |
| **QR-kode** | ✅ Stor | ✅ Mindre |
| **SMS/E-post** | ❌ Blir kuttet | ✅ Fungerer |

---

## 🔗 URL Detaljer

### Format
```
https://signage.aquatiq.com/tv/{6-tegn-kode}
```

### Eksempler
```
https://signage.aquatiq.com/tv/abc123
https://signage.aquatiq.com/tv/p4k7n2
https://signage.aquatiq.com/tv/x9m2w5
```

### Hva skjer bak kulissene?
1. Du lager en kort URL via setup-siden
2. Serveren lagrer skjermnavnet og plasseringen
3. Du får en 6-tegns kode (kun små bokstaver og tall)
4. Når TV-en åpner URL-en, blir den automatisk videresendt til riktig oppsett
5. TV-en registrerer seg og starter å vise innhold

---

## 🎯 Praktiske Eksempler

### Scenario 1: E-post til tekniker
**Før**:
```
Hei! Bruk denne URL-en på TV-en:
https://signage.aquatiq.com/player.html?setup=12345678-1234-1234-1234-123456789012&name=Reception%20Display&location=Main%20Office&template=office-basic

(URL-en kan være kuttet - kopier hele)
```

**Nå**:
```
Hei! Bruk denne URL-en på TV-en:
https://signage.aquatiq.com/tv/abc123

✅ Klart!
```

### Scenario 2: SMS til kollega
**Før**: ❌ For lang til SMS

**Nå**:
```
TV setup: signage.aquatiq.com/tv/abc123
```

### Scenario 3: Skriv på TV-fjernkontroll
**Før**: 😫 140+ tegn å skrive...

**Nå**: 😊 35 tegn - lett å skrive!

---

## 🔒 Sikkerhet og Gyldighet

### Gyldighet
- Kort URL-er er gyldige i **1 år**
- Automatisk opprydding av utløpte URL-er
- Kan gjenbrukes om nødvendig

### Sikkerhet
- 6-tegns kode gir 2,1 milliarder mulige kombinasjoner
- Ingen sensitive data i URL-en
- TV-en må fortsatt være på nettverket ditt

---

## 📊 Tekniske Detaljer

### API Endepunkt
```bash
POST /api/short-url
Content-Type: application/json

{
  "name": "Resepsjon Display",
  "location": "Hovedkontor",
  "template": "office-basic"
}
```

### Respons
```json
{
  "success": true,
  "short_id": "abc123",
  "short_url": "https://signage.aquatiq.com/tv/abc123",
  "full_url": "https://signage.aquatiq.com/player.html?setup=abc123&name=Resepsjon Display&location=Hovedkontor&template=office-basic"
}
```

### Redirect
```
GET /tv/abc123
→ Redirects to /player.html med alle parametere
→ TV starter automatisk registrering
```

---

## 🚀 Komme i gang

### For Administratorer
1. Gå til `https://signage.aquatiq.com/setup.html`
2. Generer URL-er for alle TV-er
3. Skriv ut eller e-post URL-ene til teknikere
4. Ferdig!

### For Teknikere
1. Motta kort URL (f.eks. `signage.aquatiq.com/tv/abc123`)
2. Gå til TV-en
3. Åpne URL Launcher
4. Lim inn URL-en
5. Ferdig!

---

## ❓ FAQ

### Q: Kan jeg fortsatt bruke gamle lange URL-er?
**A**: Ja! Gamle URL-er fungerer fortsatt.

### Q: Hva skjer hvis jeg mister en kort URL?
**A**: Bare lag en ny! Det tar 10 sekunder.

### Q: Kan jeg tilpasse 6-tegns koden?
**A**: Nei, den genereres automatisk for sikkerhet.

### Q: Hvor mange kort URL-er kan jeg lage?
**A**: Ubegrenset! (Men gamle utløper etter 1 år)

### Q: Kan jeg se hvilke TV-er som bruker en URL?
**A**: Ja, i admin-panelet på `tools.aquatiq.com/signage`

---

## 🎉 Oppsummering

**Fra dette**:
```
https://signage.aquatiq.com/player.html?setup=12345678-1234-1234-1234-123456789012&name=Reception%20Display&location=Main%20Office&template=office-basic
```

**Til dette**:
```
https://signage.aquatiq.com/tv/abc123
```

**= 75% kortere, 100% enklere!** ✨

---

**Last Updated**: Februar 2026  
**Status**: ✅ Live i produksjon
