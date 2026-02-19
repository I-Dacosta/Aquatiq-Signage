# 🖥️ Samsung MagicInfo Integration - Complete Guide

## Overview

Your Aquatiq Digital Signage system is **fully compatible** with Samsung Smart displays using the **URL Launcher** app. No MagicInfo Server license required!

## 🎯 What Works Out of the Box

✅ **Samsung Tizen displays** (2016+)  
✅ **URL Launcher app** (free, pre-installed)  
✅ **Auto-registration** (no manual MAC entry)  
✅ **QR code setup** (30 second deployment)  
✅ **4 templates** (Office, Warehouse, Retail, Restaurant)  
✅ **Real-time monitoring** (heartbeat every 30 sec)  
✅ **Content rotation** (playlists & schedules)  
✅ **BxSoftware integration** (warehouse dashboard)

## 🚀 Quick Start (30 Seconds)

### 1. Generate Player URL

```
1. Open in browser: https://signage.aquatiq.com/setup.html
2. Fill in:
   - Screen Name: "Reception Display"
   - Location: "Main Office"  
   - Template: "Office (Standard)"
3. Click "Generate QR Code"
4. Copy the short URL (e.g., https://signage.aquatiq.com/tv/abc123)
```

### 2. Configure Samsung Display

**On the Samsung TV:**

```
1. Press HOME or SOURCE on remote
2. Navigate to "URL Launcher" (under Apps or MagicInfo)
3. Scan QR code OR paste the short URL
4. Set these options:
   ✅ Play Mode: URL
   ✅ URL Refresh: 30 seconds
   ✅ Auto Start: ON
   ✅ Kiosk Mode: ON
```

### 3. Verify

- Display auto-registers within 30 seconds
- Shows as "Online" (green) in admin panel
- Content starts playing immediately

**Admin panel:** https://tools.aquatiq.com/signage

## 📋 Supported Samsung Models

### Compatible Displays

| Series | Year | URL Launcher | Status |
|--------|------|--------------|--------|
| QM/QH/QE Series | 2016-2026 | ✅ Built-in | Fully Supported |
| PM Series | 2019-2026 | ✅ Built-in | Fully Supported |
| QB/QBR Series | 2018-2026 | ✅ Built-in | Fully Supported |  
| DB/DM Series | 2020-2026 | ✅ Built-in | Fully Supported |
| Smart Signage Platform | 2016+ | ✅ Built-in | Fully Supported |

### Requirements

- **Tizen OS**: Version 4.0 or higher
- **Internet**: HTTPS outbound on port 443
- **URL Launcher**: Pre-installed (check under Apps)
- **Firmware**: Up to date (recommended)

**Check your model:**
```
1. Press MENU on remote
2. Go to: Support → About This TV
3. Look for "Tizen" version number
```

## 🔧 Setup Options Comparison

### Option 1: URL Launcher (Your Setup) ✅

**What it is:**
- Free app pre-installed on Samsung displays
- Loads a web app URL (your player.html)
- Perfect for web-based content

**Pros:**
- ✅ FREE (no licensing)
- ✅ 30-second setup via QR code
- ✅ Auto-registration
- ✅ Works on ALL Tizen displays
- ✅ Easy content updates
- ✅ Real-time monitoring

**Cons:**
- ❌ Requires internet
- ❌ Web content only (no offline files)

**Best for:**
- Web dashboards
- Live data displays
- YouTube/video embeds
- Dynamic content
- **This is YOUR current setup** ✅

### Option 2: MagicInfo Player ❌

**What it is:**
- Enterprise digital signage software
- Requires MagicInfo Server ($$$)
- Complex setup and management

**Pros:**
- ✅ Offline playback
- ✅ Multi-zone layouts
- ✅ Advanced scheduling
- ✅ Enterprise features

**Cons:**
- ❌ Requires paid server license (~$1000+)
- ❌ Complex setup (days)
- ❌ Per-display licensing
- ❌ Steep learning curve

**Best for:**
- Large enterprises (100+ displays)
- Offline environments
- Highly regulated industries

**Verdict:** ❌ Not needed for your use case

## 🎨 How It Works

### Architecture

```
Samsung Display → URL Launcher → Player.html → Signage Server → Content
     (Tizen)          (Free App)    (Web App)      (Node.js)        (APIs)
```

### Player Flow

```
1. Display loads https://signage.aquatiq.com/tv/abc123
2. Player.html detects MAC address (Tizen API)
3. Auto-registers with server (POST /api/screen-api/register)
4. Fetches current content (GET /api/screen-api/{mac}/current)
5. Displays content in iframe
6. Sends heartbeat every 30 seconds
7. Checks for updates every 60 seconds
8. Rotates content based on schedule
```

### Player Features

**Auto-registration:**
- Detects MAC via Tizen API
- Falls back to pseudo-MAC if API unavailable
- Stores device ID in localStorage
- No manual configuration needed

**Content loading:**
- Loads URLs in sandboxed iframe
- Supports HTML5, YouTube, dashboards
- Hardware-accelerated rendering
- Auto-refresh on content change

**Monitoring:**
- Heartbeat every 30 seconds
- Online/offline status tracking
- Content playback verification
- Error reporting to server

**Offline handling:**
- Shows error screen
- Auto-retry with countdown
- Exponential backoff
- Max 10 retries before giving up

## 📱 Content Types Supported

### Web Content (Recommended)

```html
✅ HTML5 pages
✅ Embedded dashboards
✅ YouTube/Vimeo embeds
✅ iframes
✅ JavaScript/CSS  
✅ SVG graphics
✅ Web fonts
✅ CSS animations (limited)
```

### Videos

```
✅ YouTube embeds (recommended)
✅ Direct MP4 links
✅ SharePoint videos
✅ HLS streams
✅ HTML5 video tags
```

### Not Supported

```
❌ Flash content (deprecated)
❌ Java applets
❌ ActiveX controls
❌ Desktop applications
❌ Local files (unless served via HTTP)
```

### Performance Limits (Samsung Tizen)

```
⚠️ Max page size: ~50MB
⚠️ Max image resolution: 10MP (3840x2560)
⚠️ Max video bitrate: 20Mbps
⚠️ JavaScript heap: ~200MB
⚠️ Browser memory: ~500MB
```

**Optimization tips:**
- Compress images (WebP recommended)
- Use lazy loading
- Limit animations
- Minimize JavaScript
- Use CDN for external resources

## 🎯 Templates Explained

### 1. Office (Standard)

**What it does:**
- Rotates between company dashboard, news, weather
- General-purpose office content
- 60-second duration per slide

**Best for:**
- Reception areas
- Break rooms
- Conference rooms
- Office hallways

**Content:**
```
1. Company dashboard (60s)
2. News feed (60s)
3. Weather (60s)
4. Announcements (60s)
→ Repeat
```

### 2. Warehouse

**What it does:**
- Shows BxSoftware logistics dashboard
- Real-time picking/receiving stats
- Auto-refresh every 30 seconds

**Best for:**
- Warehouse floors
- Logistics areas
- Shipping/receiving
- Production monitoring

**Content:**
```
> BxSoftware dashboard (continuous)
- Picking statistics
- Receiving statistics
- Real-time updates
```

### 3. Retail

**What it does:**
- Product showcases
- Promotions and sales
- Seasonal content
- 45-second rotation

**Best for:**
- Retail stores
- Showrooms
- Sales floors
- Product displays

**Content:**
```
1. Featured products (45s)
2. Current promotions (45s)
3. Seasonal offers (45s)
→ Repeat
```

### 4. Restaurant

**What it does:**
- Menu rotation
- Daily specials
- Allergen information
- 30-second slides

**Best for:**
- Restaurants
- Cafeterias
- Food courts
- Menu boards

**Content:**
```
1. Main menu (30s)
2. Daily specials (30s)
3. Desserts/drinks (30s)
4. Allergen info (30s)
→ Repeat
```

## 🔍 Troubleshooting

### Display Not Registering

**Symptoms:**
- Display not showing in admin panel after 60+ seconds
- Player shows loading screen forever

**Solutions:**
1. **Check internet connection**
   ```
   Menu → Network → Test Connection
   Verify internet works, not just LAN
   ```

2. **Verify URL is correct**
   ```
   Should be: https://signage.aquatiq.com/tv/abc123
   Not: http:// (must be HTTPS)
   Not: /player.html directly
   ```

3. **Check Tizen API**
   ```
   Display logs may show:
   [MAC] Tizen API not available
   → Falls back to pseudo-MAC (still works!)
   ```

4. **Firewall/proxy**
   ```
   Ensure outbound HTTPS (443) allowed to:
   - signage.aquatiq.com
   - tools.aquatiq.com
   ```

### Black Screen

**Symptoms:**
- Display shows black screen
- No content loads

**Solutions:**
1. **Check content URL**
   ```
   Open https://signage.aquatiq.com/tv/abc123 in browser
   Verify content displays there
   ```

2. **iframe blocking**
   ```
   Content site must allow iframe embedding
   Check for X-Frame-Options header
   ```

3. **CORS issues**
   ```
   Content must send:
   Access-Control-Allow-Origin: *
   OR
   frame-ancestors 'self' https://signage.aquatiq.com
   ```

4. **Mixed content**
   ```
   All content must be HTTPS (not HTTP)
   Check browser console for errors
   ```

### Content Not Updating

**Symptoms:**
- Old content still showing
- Changes in admin panel not reflected

**Solutions:**
1. **Wait for sync**
   ```
   Changes take 30-60 seconds to propagate
   Player checks every 60 seconds
   ```

2. **Force refresh**
   ```
   Press EXIT on remote
   Reopen URL Launcher
   Content reloads immediately
   ```

3. **Check heartbeat**
   ```
   Admin panel → Click display
   Verify "Last seen" is recent (<60s)
   If >60s, display is offline
   ```

4. **Verify schedule**
   ```
   Admin panel → Schedules
   Check active schedule covers current time
   Verify playlist has content items
   ```

### Display Shows Offline

**Symptoms:**
- Admin shows red dot (offline)
- "Last seen" is 60+ seconds ago

**Solutions:**
1. **Check display power**
   ```
   Verify display is on
   Check for sleep mode
   ```

2. **Network connectivity**
   ```
   Test internet on display
   Ping signage.aquatiq.com
   ```

3. **URL Launcher running**
   ```
   Check app is still active
   Restart URL Launcher if needed
   ```

4. **Server status**
   ```
   Check server health:
   curl https://signage.aquatiq.com/health
   Should return: {"status":"ok"}
   ```

## 🔒 Security Best Practices

### Display Configuration

```
✅ Enable Kiosk Mode (prevents tampering)
✅ Set admin password on display
✅ Disable USB ports (in settings)
✅ Lock settings menu
✅ Use HTTPS only
```

### Network Security

```
✅ Separate VLAN for displays
✅ Firewall whitelist:
   - signage.aquatiq.com (HTTPS 443)
   - tools.aquatiq.com (HTTPS 443)  
   - api.bxsoftware.no (HTTPS 443)
✅ Block outbound except whitelisted
✅ Monitor for unusual traffic
```

### Content Security

```
✅ iframe sandbox attributes set
✅ CSP headers configured
✅ No user input in content
✅ Regular content audits
✅ HTTPS for all resources
```

## 📊 Monitoring

### Admin Panel

```
Access: https://tools.aquatiq.com/signage

Features:
- Real-time status (online/offline)
- Last seen timestamp
- Current content playing
- Heartbeat history
- Error logs
```

### Display Health Indicators

| Indicator | Meaning | Action |
|-----------|---------|--------|
| 🟢 Green | Online (<60s) | Normal operation |
| 🔴 Red | Offline (>60s) | Check network/power |
| ⚠️ Yellow | Warning | Check error logs |

### Heartbeat Monitoring

```javascript
Heartbeat sent every 30 seconds:
POST /api/screen-api/{mac}/heartbeat
{
  "ip_address": "192.168.1.100",
  "content_id": "current-content-uuid"
}

If no heartbeat for 60s → Status: Offline
```

## 🚀 Deployment at Scale

### 10+ Displays

**Batch setup:**
```
1. Generate all QR codes at once:
   - Visit /setup.html
   - Create one per location
   - Print and label each

2. Deploy in parallel:
   - Team of 2 people
   - 60 seconds per display
   - Check admin panel after each

3. Verify:
   - All displays show green
   - All heartbeats recent
   - All content playing
```

### 100+ Displays

**Enterprise deployment:**
```
1. Pre-configure network:
   - VLAN for displays
   - DHCP with reservations
   - Firewall rules in place

2. Batch URL generation:
   - Import CSV to /setup.html
   - Export QR codes as PDF
   - Print batch labels

3. Deployment teams:
   - 3-4 teams of 2 people
   - One building/floor per team
   - Checklist for each display

4. Monitoring:
   - Central dashboard for status
   - Alerts for offline displays
   - Automated health checks
```

## 📞 Support & Resources

### Documentation

- **Setup Guide**: [SAMSUNG-SETUP-GUIDE.md](./SAMSUNG-SETUP-GUIDE.md)
- **Quick Start**: [QUICKSTART.md](./signage-server/QUICKSTART.md)
- **Simple TV Setup**: [SIMPLE-TV-SETUP.md](./signage-server/SIMPLE-TV-SETUP.md)
- **API Documentation**: [README.md](./signage-server/README.md)

### Web Interfaces

- **Setup Page**: https://signage.aquatiq.com/setup.html
- **Admin Panel**: https://tools.aquatiq.com/signage
- **API Health**: https://signage.aquatiq.com/health

### Common Questions

**Q: Do I need a MagicInfo Server?**  
A: No! URL Launcher is free and works perfectly for your use case.

**Q: Can displays work offline?**  
A: No, URL Launcher requires internet. Use MagicInfo Player if offline needed.

**Q: How many displays can I have?**  
A: Unlimited! System scales from 1 to 1000+ displays.

**Q: What about display licenses?**  
A: No licenses needed for URL Launcher. It's free on all Samsung Tizen displays.

**Q: Can I use non-Samsung displays?**  
A: Yes! Any device with a web browser works. Just open the player URL.

---

**Version**: 1.0  
**Last Updated**: February 2026  
**Maintained by**: Aquatiq AS
