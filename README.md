# 🎨 COLOR PIX — Chrome Extension

A sleek, powerful color picker and matcher extension for Chrome.

## Features

| Feature | Description |
|---|---|
| 🔍 **Eye Dropper** | Pick any color from the current webpage |
| 🎨 **Palette** | Save up to 36 colors, right-click a swatch to remove |
| 🔤 **Manual Entry** | Type any HEX value to add it |
| ↔️ **Color Matcher** | Compare two colors, see similarity % and ΔE |
| 🌈 **Harmony Colors** | Auto-generate complementary/harmony colors |
| ♿ **Contrast Checker** | WCAG AA / AAA accessibility compliance check |
| 📋 **Copy Values** | One-click copy of HEX, RGB, or HSL |

---

## Installation (Developer Mode)

1. Open Chrome and go to: `chrome://extensions/`
2. Enable **Developer mode** (top-right toggle)
3. Click **"Load unpacked"**
4. Select the `color-matcher-extension` folder
5. The extension icon will appear in your toolbar ✅

---

## How to Use

### Pick a Color
- Click the extension icon to open the popup
- Click **"Pick Color from Page"**
- The EyeDropper tool launches — click anywhere on the page
- The color is instantly saved to your palette

### Manual HEX Entry
- Type a HEX value (e.g. `#ff6f91` or `ff6f91`) in the input field
- Click **Add** or press Enter

### Color Matching
- Go to the **Match** tab
- Set a current color (pick or type one first), then click **Color A** or **Color B**
- The similarity score and harmony colors appear automatically

### Contrast Checker
- Go to the **Contrast** tab
- Choose text color and background color
- WCAG AA/AAA pass/fail results update in real time

---

## File Structure

```
color-pix-extension/
├── manifest.json       # Extension config (MV3)
├── popup.html          # Main UI
├── popup.js            # UI logic + color utilities
├── content.js          # Injected into pages (picker fallback)
├── background.js       # Service worker
└── icons/
    ├── icon16.png
    ├── icon32.png
    ├── icon48.png
    └── icon128.png
```

---

## Keyboard Shortcuts

| Key | Action |
|---|---|
| `Enter` | Add typed HEX color |
| `Escape` | Cancel color picking mode |
| Right-click swatch | Remove color from palette |

---

## Tech Notes

- Built with Manifest V3
- Uses the native `EyeDropper` API (Chrome 95+)
- Colors persist via `chrome.storage.local`
- No external dependencies — pure HTML/CSS/JS
