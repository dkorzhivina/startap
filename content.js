console.log("CONTENT SCRIPT LOADED");

setTimeout(() => {
  analyzePage();
}, 2000);

// повторный анализ (важно для YouTube)
setTimeout(() => {
  analyzePage();
}, 5000);

function analyzePage() {
  if (!document.body) {
    console.log("NO BODY");
    return;
  }

  const url = window.location.href;

  let text = "";
  try {
    text = document.body.innerText.slice(0, 5000);
  } catch (e) {
    console.log("TEXT ERROR", e);
  }

  let data = {
    url,
    title: document.title,
    text,
    isYouTube: url.includes("youtube.com")
  };

  // YouTube анализ
  if (data.isYouTube) {
    const titleEl = document.querySelector("h1");
    const descEl = document.querySelector("#description");

    data.videoTitle = titleEl ? titleEl.innerText : "";
    data.videoDescription = descEl ? descEl.innerText : "";
  }

  console.log("SEND DATA:", data);

  chrome.runtime.sendMessage({
  type: "PAGE_DATA",
  payload: data
}, (response) => {
  if (chrome.runtime.lastError) {
    console.log("BG NOT READY:", chrome.runtime.lastError.message);
  } else {
    console.log("BG RESPONSE:", response);
  }
});
}