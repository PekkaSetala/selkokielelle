chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'selkokielelle-translate',
    title: 'Muunna selkokielelle',
    contexts: ['selection'],
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'selkokielelle-translate') {
    chrome.tabs.sendMessage(tab.id, {
      type: 'TRANSLATE',
      text: info.selectionText,
    }).catch(() => {});
  }
});

chrome.commands.onCommand.addListener((command, tab) => {
  if (command === 'trigger-translate') {
    chrome.tabs.sendMessage(tab.id, { type: 'TRANSLATE_SELECTION' }).catch(() => {});
  }
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'FETCH_TRANSLATE') {
    fetch('https://selkokielelle.fi/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: msg.text }),
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        sendResponse({ status: res.status, ok: res.ok, data });
      })
      .catch(() => {
        sendResponse({ status: 0, ok: false, data: {} });
      });
    return true; // keep message channel open for async response
  }
});
