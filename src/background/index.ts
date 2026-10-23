chrome.runtime.onInstalled.addListener(() => {
  console.log('EchoScope extension installed successfully');
});

// Relay any messages if needed
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'PING') {
    sendResponse({ pong: true });
    return true;
  }
  return false;
});
