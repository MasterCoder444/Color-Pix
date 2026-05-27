// Background service worker
// Relays messages between content script and popup

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'COLOR_PICKED') {
    // Store the picked color so popup can read it on next open
    chrome.storage.local.set({ pendingColor: msg.color });
  }
});

// On extension install or update
chrome.runtime.onInstalled.addListener(() => {
  console.log('Color Matcher installed.');
});
