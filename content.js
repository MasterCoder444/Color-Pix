// Content script: Listens for messages from background/popup
// and handles color picking fallback on pages

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'PICK_COLOR_FROM_PAGE') {
    startPickerMode();
  }
});

function startPickerMode() {
  const overlay = document.createElement('div');
  overlay.id = '__colorMatcher_overlay';
  overlay.style.cssText = `
    position: fixed; inset: 0; z-index: 2147483647;
    cursor: crosshair !important;
    background: transparent;
  `;

  // Tooltip
  const tooltip = document.createElement('div');
  tooltip.style.cssText = `
    position: fixed; z-index: 2147483648;
    background: #0d0d0f; color: #f0f0f5;
    font-family: 'Space Mono', monospace, sans-serif;
    font-size: 12px; padding: 6px 10px;
    border-radius: 6px; border: 1px solid #2a2a32;
    pointer-events: none; display: none;
    white-space: nowrap; box-shadow: 0 4px 12px rgba(0,0,0,0.5);
  `;
  document.body.appendChild(overlay);
  document.body.appendChild(tooltip);

  overlay.addEventListener('mousemove', e => {
    tooltip.style.display = 'block';
    tooltip.style.left = (e.clientX + 14) + 'px';
    tooltip.style.top = (e.clientY + 14) + 'px';

    const el = document.elementFromPoint(e.clientX, e.clientY);
    if (el && el !== overlay) {
      const style = window.getComputedStyle(el);
      const bg = style.backgroundColor;
      if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') {
        tooltip.textContent = bg;
        const colorSquare = `<span style="display:inline-block;width:10px;height:10px;background:${bg};border-radius:2px;margin-right:6px;border:1px solid rgba(255,255,255,0.2)"></span>`;
        tooltip.innerHTML = colorSquare + bg;
      } else {
        tooltip.textContent = 'Click to pick';
      }
    }
  });

  overlay.addEventListener('click', e => {
    e.stopPropagation();
    e.preventDefault();
    overlay.style.display = 'none';

    const el = document.elementFromPoint(e.clientX, e.clientY);
    overlay.remove();
    tooltip.remove();

    if (el) {
      const style = window.getComputedStyle(el);
      const bg = style.backgroundColor;
      if (bg && bg !== 'rgba(0, 0, 0, 0)') {
        chrome.runtime.sendMessage({ type: 'COLOR_PICKED', color: bg });
      }
    }
  });

  // Escape cancels
  document.addEventListener('keydown', function esc(e) {
    if (e.key === 'Escape') {
      overlay.remove();
      tooltip.remove();
      document.removeEventListener('keydown', esc);
    }
  });
}
