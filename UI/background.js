// Background script for AI Quiz Assistant
// Handle tab opening requests from content script

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'openTab') {
    chrome.tabs.create({
      url: request.url,
      active: false // Open in background so user can continue with the quiz
    }).then((tab) => {
      console.log(`Opened web search tab for Q${request.questionIndex}: ${request.url}`);
      sendResponse({ success: true, tabId: tab.id });
    }).catch((error) => {
      console.error('Error opening tab:', error);
      sendResponse({ success: false, error: error.message });
    });
    
    // Return true to indicate async response
    return true;
  }
});