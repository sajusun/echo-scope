chrome.runtime.onInstalled.addListener(() => {
  console.log("EchoScope extension installed successfully");
});
chrome.runtime.onMessage.addListener((e, r, n) => e.type === "PING" ? (n({ pong: !0 }), !0) : !1);
