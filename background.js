importScripts("analyzer.js");

console.log("BACKGROUND STARTED");

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  console.log("📩 RECEIVED:", msg);

  if (msg.type === "PAGE_DATA") {
    const data = msg.payload || {};

    let score = 0;

    try {
      // ❌ YouTube отключили
      score = analyzeText(data.text || "", data.url || "");
    } catch (e) {
      console.error("❌ ANALYZE ERROR:", e);
      score = 0;
    }

    console.log("🔥 SCORE:", score);

    chrome.storage.local.get(["stats"], (res) => {
      let stats = res.stats || {
        hunger: 80,
        happiness: 50,
        cleanliness: 80
      };

      // защита
      if (typeof stats.happiness !== "number") {
        stats.happiness = 50;
      }

      if (score > 3) {
        stats.happiness += 2;
      } else {
        stats.happiness -= 2;
      }

      // ограничение
      stats.happiness = Math.max(0, Math.min(100, stats.happiness));

      chrome.storage.local.set({
        stats,
        lastScore: score
      });

      // ❗ sendResponse должен быть внутри get
      sendResponse({ ok: true, score });
    });

    return true; // обязательно для async
  }
});