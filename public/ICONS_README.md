# 🎨 CYBERGUARD X Icons & Branding

## Generated Icons

All icons feature a cybersecurity-themed shield with lock design in gradient purple/blue colors.

### Files:

- **`logo.svg`** (2.4 KB) - High-resolution logo for use in app
  - 512x512px SVG
  - Gradient background
  - Detailed shield and lock design
  - Use in headers, splash screens, marketing

- **`favicon.svg`** (949 B) - Modern SVG favicon
  - 64x64px optimized
  - Vector format (scales perfectly)
  - Supported by modern browsers

- **`favicon.ico`** (362 KB) - Multi-resolution ICO
  - Contains: 16x16, 32x32, 48x48, 64x64, 128x128, 256x256
  - Compatible with all browsers
  - Automatically used by browsers

- **`icon-192.png`** (16 KB) - Android/PWA icon
  - 192x192px PNG
  - Used for Android home screen
  - PWA manifest icon

- **`icon-512.png`** (28 KB) - Large PWA icon
  - 512x512px PNG
  - High-resolution PWA icon
  - Splash screens

- **`apple-touch-icon.png`** (15 KB) - iOS home screen icon
  - 180x180px PNG
  - Used when added to iOS home screen
  - Rounded automatically by iOS

- **`manifest.json`** (1.4 KB) - PWA manifest
  - App name and description
  - Icon definitions
  - Theme colors (#667eea)
  - Shortcuts to Dashboard and CTF

## Design Specs

### Colors:
- **Primary Gradient**: `#667eea` → `#764ba2`
- **Accent Gradient**: `#f093fb` → `#f5576c`
- **Background**: White with transparency
- **Theme Color**: `#667eea` (Purple-blue)

### Elements:
- **Shield** - Protection and security
- **Lock** - Authentication and access control
- **Circuit patterns** - Technology and cyber
- **Glow effects** - Modern, digital aesthetic

## Browser Support

- ✅ **Modern browsers**: favicon.svg (vector, perfect scaling)
- ✅ **All browsers**: favicon.ico (multi-resolution fallback)
- ✅ **iOS**: apple-touch-icon.png (180x180)
- ✅ **Android**: icon-192.png, icon-512.png (PWA)
- ✅ **PWA**: manifest.json with all icons

## Usage

Icons are automatically referenced in the HTML `<head>`:

```html
<link rel="icon" href="/favicon.ico" type="image/x-icon">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="manifest" href="/manifest.json">
```

## PWA Features

The manifest enables:
- Install to home screen (mobile)
- Standalone app mode
- Custom splash screen
- Shortcuts to Dashboard and CTF
- Offline capability (when service worker added)

## Regenerating Icons

If you need to regenerate icons from the SVG source:

```bash
cd public

# Generate favicon.ico
convert -background none favicon.svg -define icon:auto-resize=256,128,64,48,32,16 favicon.ico

# Generate PNG icons
convert -background none logo.svg -resize 192x192 icon-192.png
convert -background none logo.svg -resize 512x512 icon-512.png
convert -background none logo.svg -resize 180x180 apple-touch-icon.png
```

**Requires**: ImageMagick (`apt install imagemagick`)

## Customization

To customize the icons:

1. Edit `logo.svg` or `favicon.svg` in a vector editor (Inkscape, Figma, etc.)
2. Save the SVG files
3. Regenerate the PNG and ICO files using the commands above
4. Update `manifest.json` if changing colors or theme

## Brand Guidelines

- **Name**: CYBERGUARD X
- **Tagline**: "Offensive & Defensive Security Lab"
- **Primary Use**: Cybersecurity training platform
- **Target Audience**: Security professionals, students, teams

---

**Generated**: October 2024  
**Tool**: Custom SVG design + ImageMagick conversion  
**License**: Part of CYBERGUARD X project
