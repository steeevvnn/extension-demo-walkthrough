/**
 * Demo Guide - Background Service Worker
 * Handles extension icon clicks and messaging with content scripts
 */

// Listen for extension icon clicks
chrome.action.onClicked.addListener(async (tab) => {
  // Only run on Salesforce Lightning pages
  if (!tab.url || (!tab.url.includes('.lightning.force.com') && !tab.url.includes('.my.salesforce.com'))) {
    console.log('[Demo Guide] Not a Salesforce Lightning page, ignoring click');
    return;
  }

  try {
    // Send toggle message to content script
    await chrome.tabs.sendMessage(tab.id, { action: 'toggleOverlay' });
  } catch (error) {
    // Content script may not be loaded yet, try injecting it
    console.log('[Demo Guide] Content script not responding, attempting to inject');

    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['scriptData.js', 'contentScript.js']
      });

      await chrome.scripting.insertCSS({
        target: { tabId: tab.id },
        files: ['overlay.css']
      });

      // Wait briefly for scripts to initialize, then send toggle
      setTimeout(async () => {
        try {
          await chrome.tabs.sendMessage(tab.id, { action: 'toggleOverlay' });
        } catch (e) {
          console.error('[Demo Guide] Failed to toggle after injection:', e);
        }
      }, 100);
    } catch (injectError) {
      console.error('[Demo Guide] Failed to inject content script:', injectError);
    }
  }
});

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'getStoredStep') {
    chrome.storage.local.get(['demoGuideCurrentStep'], (result) => {
      sendResponse({ stepIndex: result.demoGuideCurrentStep || 0 });
    });
    return true; // Keep channel open for async response
  }

  if (message.action === 'saveStep') {
    chrome.storage.local.set({ demoGuideCurrentStep: message.stepIndex }, () => {
      sendResponse({ success: true });
    });
    return true;
  }

  if (message.action === 'clearStep') {
    chrome.storage.local.remove(['demoGuideCurrentStep'], () => {
      sendResponse({ success: true });
    });
    return true;
  }
});
