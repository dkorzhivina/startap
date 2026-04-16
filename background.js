// background.js
chrome.runtime.onInstalled.addListener(() => {
    console.log("Shiba-Kun Study Pro запущен!");
});
// background.js
chrome.action.onClicked.addListener((tab) => {
  chrome.windows.create({
    url: "popup.html",
    type: "popup",
    width: 360,
    height: 520,
    focused: true
  });
});
