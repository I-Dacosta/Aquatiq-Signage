# 📺 Samsung Smart Display Setup Guide

## Device Compatibility

✅ **Supported Samsung Displays:**
- Samsung Smart Signage (Tizen OS)
- Samsung MagicINFO compatible displays
- Samsung QM/QH/QE Series
- Any Samsung display with URL Launcher app

## 🎯 Quick Setup (30 Seconds)

### What You Need:
- Samsung display with internet connection
- Samsung remote control
- Web browser to generate QR code

### Step-by-Step:

#### 1. Generate Player URL
```
1. Open browser: https://signage.aquatiq.com/setup.html
2. Fill in:
   - Screen Name: "Reception Display"
   - Location: "Main Office"
   - Template: "Office (Standard)"
3. Click "Generate QR Code"
```

#### 2. Configure Samsung Display

**On the Samsung display:**

```
1. Press SOURCE on remote
2. Select "URL Launcher" (may be under Apps)
3. Scan QR code OR manually enter URL
4. Configure settings:
   
   URL Settings:
   ✅ URL: [Your generated URL from step 1]
   ✅ Play Mode: URL
   ✅ URL Refresh: 30 seconds
   ✅ Auto Start: ON
   
   Display Settings:  
   ✅ Kiosk Mode: ON (prevents user interaction)
   ✅ Auto Play: ON
   ✅ Screen Sleep: OFF
   
   Network Settings:
   ✅ Connected to internet
   ✅ Firewall allows: https://signage.aquatiq.com
```

#### 3. Verify Setup

The display will:
- ✅ Auto-register within 30 seconds
- ✅ Appear as "Online" in admin panel
- ✅ Start showing content immediately
- ✅ Send heartbeat every 30 seconds

## 🔍 Troubleshooting

### Display shows "Connection Error"

**Check network:**
```bash
# On display (if accessible):
1. Settings → Network → Test Connection
2. Verify internet access
3. Check firewall allows outbound HTTPS
```

**Check URL:**
```
❌ Wrong: http://signage.aquatiq.com/player.html  
✅ Correct: https://signage.aquatiq.com/player.html?setup=ABC123&name=Screen&location=Office&template=office-basic
```

### Display not appearing in admin panel

**Timing:**
- Wait 60 seconds after first load
- Display auto-registers on first heartbeat

**MAC Address:**
- System auto-detects on Tizen displays
- If failed, URL will use setup ID instead
- Both methods work equally well

### Content not updating

**Refresh intervals:**
- Content checks: Every 60 seconds
- Heartbeat: Every 30 seconds
- Template changes: Apply within 90 seconds

**Force refresh:**
```
1. On Samsung remote: Press EXIT
2. Re-open URL Launcher
3. Content reloads immediately
```

### Black screen or loading forever

**Common causes:**
1. **CORS issue** - Ensure signage server allows iframe embedding
2. **HTTPS mixed content** - All URLs must be HTTPS
3. **Network timeout** - Check server is reachable
4. **Firewall blocking** - Whitelist signage.aquatiq.com

**Debug steps:**
```
1. Press MENU on Samsung remote
2. Go to: Support → Self Diagnosis → Reset
3. Restart URL Launcher app
4. Check if error message appears
```

## 📱 URL Launcher vs MagicInfo Player

### URL Launcher (Your Setup)

**Pros:**
- ✅ Free (no licensing needed)
- ✅ Simple setup (QR code or URL)
- ✅ Works on all Tizen displays
- ✅ Web-based content
- ✅ Easy content updates

**Cons:**
- ❌ No offline content caching
- ❌ Requires internet connection
- ❌ Limited playback options (web only)

**Best for:**
- Digital signage with live web content
- Dashboards and data displays
- YouTube/video embeds
- HTML5 content

### MagicInfo Player (Alternative)

**Pros:**
- ✅ Offline content playback
- ✅ Advanced scheduling
- ✅ Multi-zone layouts
- ✅ Enterprise monitoring
- ✅ Content templates library

**Cons:**
- ❌ Requires MagicInfo Server ($$$)
- ❌ Complex setup
- ❌ License per display
- ❌ Steep learning curve

**Best for:**
- Large enterprise deployments (50+ displays)
- Regulated environments needing offline playback
- Complex scheduling needs
- Multi-zone content layouts

## 🎨 Content Requirements for Samsung Displays

### Supported Formats

**Web Content (URL Launcher):**
```
✅ HTML5 pages
✅ Embedded YouTube/Vimeo
✅ iframes
✅ JavaScript/CSS
✅ WebGL (limited on some models)
✅ SVG graphics
```

**Not Supported:**
```
❌ Flash content
❌ Java applets
❌ ActiveX controls
❌ Desktop applications
```

### Performance Optimization

**Best Practices:**
```html
<!-- Optimize images -->
<img src="image.jpg" loading="lazy" width="1920" height="1080">

<!-- Limit animations -->
<style>
  @media (prefers-reduced-motion) {
    * { animation: none !important; }
  }
</style>

<!-- Prevent memory leaks -->
<script>
  // Clear intervals/timeouts when changing content
  window.addEventListener('beforeunload', () => {
    // Cleanup code here
  });
</script>
```

**Resource Limits (Tizen Browser):**
- Max page size: ~50MB
- Max images: <10MP resolution
- Max video bitrate: 20Mbps
- Memory: ~500MB per page
- JavaScript heap: ~200MB

### iframe Security

Your setup uses iframes - ensure parent allows embedding:

```html
<!-- In your content pages -->
<meta http-equiv="Content-Security-Policy" content="frame-ancestors 'self' https://signage.aquatiq.com">

<!-- Allow fullscreen for videos -->
<iframe 
  src="content-url"
  allow="fullscreen; autoplay"
  sandbox="allow-scripts allow-same-origin allow-presentation"
></iframe>
```

## 🔧 Advanced Configuration

### Custom Player Settings

Edit player URL parameters:

```
https://signage.aquatiq.com/player.html
  ?setup=ABC123              # Setup ID
  &name=Reception            # Screen name
  &location=Office           # Location
  &template=office-basic     # Template
  &mac=00:11:22:33:44:55    # (Optional) Force MAC
  &refresh=30                # (Optional) Refresh interval
  &debug=true                # (Optional) Show debug info
```

### Template Customization

Available templates:

```javascript
// office-basic: Standard office rotation
{
  "content": ["dashboard", "news", "weather"],
  "duration": 60,
  "transition": "fade"
}

// warehouse: BxSoftware logistics
{
  "content": ["bx-dashboard"],
  "duration": 30,
  "refresh": "real-time"
}

// retail: Product showcase
{
  "content": ["products", "promotions"],
  "duration": 45,
  "transition": "slide"
}

// restaurant: Menu display
{
  "content": ["menu", "specials"],
  "duration": 30,
  "allergens": true
}
```

### Network Configuration

**Firewall Rules:**
```
Outbound HTTPS (443):
✅ signage.aquatiq.com
✅ tools.aquatiq.com
✅ api.bxsoftware.no (if using BX dashboard)
✅ YouTube domains (if using YouTube embeds)

Ports:
✅ 443 (HTTPS)
✅ 123 (NTP for time sync - optional)
```

**DNS Requirements:**
```
signage.aquatiq.com → 31.97.38.31
tools.aquatiq.com   → 31.97.38.31
```

## 📊 Monitoring & Analytics

### View Display Status

**Admin Panel:**
```
https://tools.aquatiq.com/signage

Dashboard shows:
- 🟢 Online displays (green dot)
- 🔴 Offline displays (red dot)  
- ⏰ Last seen timestamp
- 📍 Location and name
- 🎬 Current content
- 📱 IP address
```

### Heartbeat System

Displays ping server every 30 seconds:

```javascript
POST /api/screen-api/{mac}/heartbeat
{
  "ip_address": "192.168.1.100",
  "content_id": "uuid-of-current-content"
}
```

**Status indicators:**
- Online: Last heartbeat < 60 sec ago
- Offline: No heartbeat for 60+ seconds
- Error: Heartbeat contains error field

### Logs & Debugging

**Server logs:**
```bash
# Show registrations
docker logs aquatiq-signage-server | grep "registered"

# Show heartbeats
docker logs aquatiq-signage-server | grep "heartbeat"

# Show warnings/errors
docker logs aquatiq-signage-server | grep -E "ERROR|WARNING"
```

**Display-side debugging:**
```javascript
// Add ?debug=true to player URL
https://signage.aquatiq.com/player.html?setup=ABC123&debug=true

// Shows overlay with:
- Current content URL
- Last heartbeat time
- Connection status
- Error messages
```

## 🚀 Deployment Checklist

### Pre-Installation

- [ ] Samsung display with Tizen OS
- [ ] Internet connection configured
- [ ] Static IP assigned (recommended)
- [ ] Firewall rules configured
- [ ] Display mounted and powered
- [ ] Remote control available

### Installation

- [ ] Generate QR code at /setup.html
- [ ] Open URL Launcher on display
- [ ] Scan QR code or enter URL
- [ ] Configure launch settings
- [ ] Verify auto-start enabled
- [ ] Test content displays

### Post-Installation

- [ ] Display appears in admin panel (within 60 sec)
- [ ] Status shows green (online)
- [ ] Content rotates correctly
- [ ] Heartbeat timestamp updates
- [ ] Test content update from admin
- [ ] Document display location/name

### Multi-Display Deployment

**For 10+ displays:**

```bash
# 1. Generate all QR codes at once
Visit /setup.html → Batch mode

# 2. Print and label QR codes
Label each with location name

# 3. Configure displays in parallel
Team of 2: one person per display
Time per display: ~60 seconds

# 4. Verify all online
Admin panel shows all displays green
```

## 🔒 Security Best Practices

### Display Security

```
✅ Enable Kiosk Mode (prevents tampering)
✅ Disable USB ports (in Samsung settings)
✅ Set admin password on display
✅ Physically secure remote control
✅ Use HTTPS only (no HTTP)
```

### Network Security

```
✅ VLANfor displays (separate from user network)
✅ Firewall rules (whitelist only needed domains)
✅ No outbound except HTTPS
✅ Monitor for unusual traffic
```

### Content Security

```
✅ CORS headers properly configured
✅ CSP headers on content pages
✅ iframe sandbox attributes
✅ No embedded user input
✅ Regular content audits
```

## 📞 Support

### Common Issues

| Issue | Solution |
|-------|----------|
| Display offline | Check internet, verify heartbeat |
| Black screen | Check URL, verify CORS headers |
| No auto-start | Enable Auto Play in URL Launcher |
| Content frozen | Increase refresh interval |
| Wrong content | Check template assignment |

### Contact Support

- **Admin Panel**: https://tools.aquatiq.com/signage
- **Setup Page**: https://signage.aquatiq.com/setup.html
- **API Health**: https://signage.aquatiq.com/health
- **Development Team**: Aquatiq AS

---

**Document Version**: 1.0  
**Last Updated**: February 2026  
**Compatible With**: Samsung Tizen OS 4.0+
