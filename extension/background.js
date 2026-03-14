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
