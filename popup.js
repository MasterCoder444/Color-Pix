// ─── COLOR UTILITIES ─────────────────────────────────────────────────────────

function hexToRgb(hex) {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.trim());
  return r ? { r: parseInt(r[1], 16), g: parseInt(r[2], 16), b: parseInt(r[3], 16) } : null;
}

function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
}

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  if (max === min) { h = s = 0; }
  else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function hslToRgb(h, s, l) {
  s /= 100; l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = n => { const k = (n + h / 30) % 12; return l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1); };
  return { r: Math.round(f(0) * 255), g: Math.round(f(8) * 255), b: Math.round(f(4) * 255) };
}

function getLuminance(r, g, b) {
  const toLinear = c => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

function getContrastRatio(hex1, hex2) {
  const c1 = hexToRgb(hex1), c2 = hexToRgb(hex2);
  if (!c1 || !c2) return 1;
  const l1 = getLuminance(c1.r, c1.g, c1.b), l2 = getLuminance(c2.r, c2.g, c2.b);
  const bright = Math.max(l1, l2), dark = Math.min(l1, l2);
  return (bright + 0.05) / (dark + 0.05);
}

// Delta E (CIE76 approximation in RGB space)
function colorDelta(hex1, hex2) {
  const c1 = hexToRgb(hex1), c2 = hexToRgb(hex2);
  if (!c1 || !c2) return 100;
  const dR = c1.r - c2.r, dG = c1.g - c2.g, dB = c1.b - c2.b;
  return Math.sqrt(dR * dR + dG * dG + dB * dB);
}

function similarityPct(hex1, hex2) {
  const maxDelta = Math.sqrt(3 * 255 * 255);
  const d = colorDelta(hex1, hex2);
  return Math.max(0, Math.round((1 - d / maxDelta) * 100));
}

function isLight(hex) {
  const rgb = hexToRgb(hex);
  if (!rgb) return false;
  return getLuminance(rgb.r, rgb.g, rgb.b) > 0.179;
}

function generateHarmony(hex) {
  const rgb = hexToRgb(hex);
  if (!rgb) return [];
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  const angles = [30, 60, 120, 180, 210, 240, 300];
  return angles.map(offset => {
    const h = (hsl.h + offset) % 360;
    const { r, g, b } = hslToRgb(h, hsl.s, hsl.l);
    return rgbToHex(r, g, b);
  });
}

function isValidHex(hex) {
  return /^#[0-9a-fA-F]{6}$/.test(hex.trim());
}

// ─── STATE ───────────────────────────────────────────────────────────────────
let palette = [];
let currentColor = null;
let slotColors = { A: null, B: null };

async function loadPalette() {
  return new Promise(resolve => {
    chrome.storage.local.get(['palette', 'lastColor'], data => {
      palette = data.palette || [];
      if (data.lastColor) {
        currentColor = data.lastColor;
        displayCurrentColor(currentColor);
      }
      resolve();
    });
  });
}

function savePalette() {
  chrome.storage.local.set({ palette });
}

// ─── UI UPDATES ───────────────────────────────────────────────────────────────

function displayCurrentColor(hex) {
  if (!hex) return;
  const rgb = hexToRgb(hex);
  if (!rgb) return;
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);

  document.getElementById('currentColorDisplay').style.display = 'flex';
  document.getElementById('mainSwatch').style.background = hex;
  document.getElementById('hexVal').textContent = hex.toUpperCase();
  document.getElementById('rgbVal').textContent = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
  document.getElementById('hslVal').textContent = `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
}

function renderPalette() {
  const grid = document.getElementById('paletteGrid');
  const empty = document.getElementById('emptyPalette');
  grid.innerHTML = '';

  if (palette.length === 0) {
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';

  palette.forEach((hex, i) => {
    const sw = document.createElement('div');
    sw.className = 'swatch';
    if (hex === currentColor) sw.classList.add('selected');
    sw.style.background = hex;
    sw.title = hex.toUpperCase();
    sw.addEventListener('click', () => selectSwatch(hex, sw));
    sw.addEventListener('contextmenu', e => { e.preventDefault(); removeColor(i); });
    grid.appendChild(sw);
  });
}

function selectSwatch(hex, el) {
  document.querySelectorAll('.swatch').forEach(s => s.classList.remove('selected'));
  el.classList.add('selected');
  currentColor = hex;
  displayCurrentColor(hex);
  chrome.storage.local.set({ lastColor: hex });
}

function addToPalette(hex) {
  hex = hex.toLowerCase().trim();
  if (!isValidHex(hex)) { flashInput(); return; }
  if (!palette.includes(hex)) {
    palette.unshift(hex);
    if (palette.length > 36) palette.pop();
    savePalette();
  }
  currentColor = hex;
  chrome.storage.local.set({ lastColor: hex });
  displayCurrentColor(hex);
  renderPalette();
}

function removeColor(index) {
  palette.splice(index, 1);
  savePalette();
  renderPalette();
}

function flashInput() {
  const inp = document.getElementById('hexInput');
  inp.style.borderColor = '#ff6f91';
  setTimeout(() => inp.style.borderColor = '', 800);
}

// ─── COPY TO CLIPBOARD ────────────────────────────────────────────────────────
function copyText(text) {
  navigator.clipboard.writeText(text).then(() => {
    const toast = document.getElementById('copiedToast');
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 1500);
  });
}

// ─── CONTRAST CHECKER ────────────────────────────────────────────────────────
function updateContrast() {
  const fg = document.getElementById('fgColor').value;
  const bg = document.getElementById('bgColor').value;
  const ratio = getContrastRatio(fg, bg);
  const r = ratio.toFixed(2);

  document.getElementById('contrastPreview').style.background = bg;
  document.getElementById('contrastPreview').style.color = fg;
  document.getElementById('contrastRatio').textContent = r + ':1';
  document.getElementById('contrastAAA').textContent = r + ':1';
  document.getElementById('contrastLarge').textContent = r + ':1';

  // WCAG 2.1 thresholds
  const aaPass = ratio >= 4.5;
  const aaaPass = ratio >= 7;
  const largePass = ratio >= 3;

  const aa = document.getElementById('passAA');
  const aaa = document.getElementById('passAAA');
  const lg = document.getElementById('passLarge');

  aa.textContent = aaPass ? '✓ Pass' : '✗ Fail';
  aa.className = 'wcag-pass ' + (aaPass ? 'pass' : 'fail');
  aaa.textContent = aaaPass ? '✓ Pass' : '✗ Fail';
  aaa.className = 'wcag-pass ' + (aaaPass ? 'pass' : 'fail');
  lg.textContent = largePass ? '✓ Pass' : '✗ Fail';
  lg.className = 'wcag-pass ' + (largePass ? 'pass' : 'fail');
}

// ─── MATCHER ─────────────────────────────────────────────────────────────────
function updateMatcher() {
  const { A, B } = slotColors;
  const result = document.getElementById('matchResult');
  const harmonySection = document.getElementById('harmonySection');

  if (A) {
    const sA = document.getElementById('slotA');
    sA.style.background = A;
    sA.style.color = isLight(A) ? '#000' : '#fff';
    sA.textContent = A.toUpperCase();
  }
  if (B) {
    const sB = document.getElementById('slotB');
    sB.style.background = B;
    sB.style.color = isLight(B) ? '#000' : '#fff';
    sB.textContent = B.toUpperCase();
  }

  if (A && B) {
    result.style.display = 'block';
    const pct = similarityPct(A, B);
    const delta = colorDelta(A, B).toFixed(1);
    document.getElementById('matchBar').style.width = pct + '%';
    document.getElementById('matchPct').textContent = pct + '% similar';
    document.getElementById('matchDelta').textContent = 'ΔE: ' + delta;

    // Harmony from color A
    harmonySection.style.display = 'block';
    const harmonies = generateHarmony(A);
    const grid = document.getElementById('harmonyGrid');
    grid.innerHTML = '';
    harmonies.forEach(h => {
      const chip = document.createElement('div');
      chip.className = 'harmony-chip';
      chip.style.background = h;
      chip.title = h.toUpperCase();
      chip.addEventListener('click', () => {
        slotColors.B = h;
        updateMatcher();
      });
      grid.appendChild(chip);
    });
  } else {
    result.style.display = 'none';
    harmonySection.style.display = 'none';
  }
}

// ─── EYE DROPPER ─────────────────────────────────────────────────────────────
async function pickColor() {
  if (!window.EyeDropper) {
    // Fallback: inject content script picker
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    chrome.scripting.executeScript({ target: { tabId: tab.id }, func: () => {
      document.body.style.cursor = 'crosshair';
      const handler = e => {
        e.preventDefault();
        document.body.style.cursor = '';
        document.removeEventListener('click', handler, true);
        const el = document.elementFromPoint(e.clientX, e.clientY);
        if (el) {
          const style = window.getComputedStyle(el);
          const bg = style.backgroundColor || style.color;
          chrome.runtime.sendMessage({ type: 'COLOR_PICKED', color: bg });
        }
      };
      document.addEventListener('click', handler, true);
    }});
    window.close();
    return;
  }

  try {
    const dropper = new EyeDropper();
    const result = await dropper.open();
    const hex = result.sRGBHex;
    addToPalette(hex);
  } catch (e) {
    // user cancelled
  }
}

// ─── TABS ─────────────────────────────────────────────────────────────────────
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById('tab-' + tab.dataset.tab).classList.add('active');
    if (tab.dataset.tab === 'contrast') updateContrast();
  });
});

// ─── EVENT LISTENERS ─────────────────────────────────────────────────────────
document.getElementById('pickBtn').addEventListener('click', pickColor);

document.getElementById('addColor').addEventListener('click', () => {
  const val = document.getElementById('hexInput').value.trim();
  const hex = val.startsWith('#') ? val : '#' + val;
  addToPalette(hex);
  document.getElementById('hexInput').value = '';
});

document.getElementById('hexInput').addEventListener('keydown', e => {
  if (e.key === 'Enter') document.getElementById('addColor').click();
});

document.getElementById('clearAll').addEventListener('click', () => {
  if (confirm('Clear all saved colors?')) {
    palette = [];
    savePalette();
    currentColor = null;
    document.getElementById('currentColorDisplay').style.display = 'none';
    renderPalette();
    chrome.storage.local.remove('lastColor');
  }
});

// Copy buttons
['Hex', 'Rgb', 'Hsl'].forEach(type => {
  document.getElementById('copy' + type).addEventListener('click', () => {
    copyText(document.getElementById(type.toLowerCase() + 'Val').textContent);
  });
  document.getElementById(type.toLowerCase() + 'Val').addEventListener('click', () => {
    copyText(document.getElementById(type.toLowerCase() + 'Val').textContent);
  });
});

// Matcher slots
['A', 'B'].forEach(slot => {
  document.getElementById('slot' + slot).addEventListener('click', () => {
    // Use current color if available
    if (currentColor) {
      slotColors[slot] = currentColor;
      updateMatcher();
    } else {
      document.getElementById('picker' + slot).click();
    }
  });
  document.getElementById('picker' + slot).addEventListener('input', e => {
    slotColors[slot] = e.target.value;
    updateMatcher();
  });
});

// Contrast inputs
document.getElementById('fgColor').addEventListener('input', updateContrast);
document.getElementById('bgColor').addEventListener('input', updateContrast);

// Listen for color picked from content script
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'COLOR_PICKED' && msg.color) {
    const rgb = msg.color.match(/\d+/g);
    if (rgb && rgb.length >= 3) {
      const hex = rgbToHex(+rgb[0], +rgb[1], +rgb[2]);
      addToPalette(hex);
    }
  }
});

// ─── INIT ─────────────────────────────────────────────────────────────────────
loadPalette().then(() => {
  renderPalette();
  updateContrast();
});
