# 🎯 Quick Start: Add a Samsung TV in 30 Seconds

## The Easy Way (Recommended)

### Step 1: Open Setup Page
Go to: **https://signage.aquatiq.com/setup.html**

### Step 2: Fill Out Form
- **Screen Name**: "Reception Display"
- **Location**: "Main Office"  
- **Template**: "Office (Standard)"

### Step 3: Generate QR Code
Click **"Generate QR Code"** button

### Step 4: Configure TV
On your Samsung TV with MagicInfo:
1. Open **URL Launcher** app
2. **Scan the QR code** with Samsung remote
3. Set these options:
   - Play Mode: **URL**
   - URL Refresh: **30 seconds**
   - Auto Play: **On**
   - Kiosk Mode: **On** (optional but recommended)

### Step 5: Done! 🎉
- TV automatically registers itself
- Content starts playing immediately
- Shows as "Online" in admin panel within 1 minute

---

## What Changed?

### Before (Complex)
1. ❌ Find MAC address manually
2. ❌ Log into admin panel  
3. ❌ Create screen manually
4. ❌ Create content
5. ❌ Create playlist
6. ❌ Assign playlist to screen
7. ❌ Type long URL on TV
8. ❌ Hope everything works

**Time: 5-10 minutes per TV**

### Now (Simple)
1. ✅ Go to /setup.html
2. ✅ Fill out 2 fields
3. ✅ Scan QR code
4. ✅ **DONE!**

**Time: 30 seconds per TV**

---

## Templates Included

### 🏢 Office (Standard)
- Company dashboard
- News feed
- General information
- **Duration**: 60 sec/slide

### 📦 Warehouse
- BxSoftware logistics dashboard
- Real-time picking/receiving stats
- Auto-refresh every 30 seconds
- **Duration**: 30 sec

### 🏪 Retail
- Product displays
- Promotions
- Seasonal content
- **Duration**: 45 sec/slide

### 🍽️ Restaurant  
- Menu rotation
- Daily specials
- Allergen information
- **Duration**: 30 sec/slide

---

## URLs You Need

| Purpose | URL |
|---------|-----|
| **Setup page** | https://signage.aquatiq.com/setup.html |
| **Admin panel** | https://tools.aquatiq.com/signage |
| **API docs** | https://signage.aquatiq.com/health |

---

## Troubleshooting

### TV not showing up in admin panel?
1. Check TV has internet connection
2. Verify URL was entered correctly  
3. Look at TV screen - any error messages?
4. Wait 60 seconds and refresh admin panel

### Content not updating?
- Changes take 30-60 seconds to sync
- Check TV is showing as "Online" (green dot)
- Try manually reloading URL Launcher app

### MAC address issues?
- New system doesn't require MAC address entry!
- TV auto-registers on first connection
- If using old URLs, they still work

---

## Pro Tips

### For IT Staff
- Print QR codes and label each TV location
- Create a "TV Setup Station" for all new installations
- Use same template for all TVs in same department

### For Content Changes  
- All changes in admin panel: tools.aquatiq.com/signage
- TV auto-updates within 30-60 seconds
- No need to touch TV after initial setup

### For Multiple TVs
- Generate multiple QR codes at once
- Label each QR code with location
- Keep backup printouts

---

## What Happens Behind the Scenes?

1. **TV opens URL** with unique setup ID
2. **Player detects** MAC address (Tizen API)
3. **Auto-registers** screen in database
4. **Applies template** with pre-configured content
5. **Starts heartbeat** every 30 seconds
6. **Checks for updates** every 60 seconds
7. **Shows content** based on schedule

---

## Support

Need help?  
1. Check [SIMPLE-TV-SETUP.md](./SIMPLE-TV-SETUP.md) for detailed docs
2. Contact Aquatiq development team

---

**Last Updated**: February 2026  
**Status**: ✅ Production Ready
