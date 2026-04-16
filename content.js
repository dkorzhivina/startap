let currentWhitelist = [];

// 1. Загружаем список при старте
chrome.storage.local.get(['whitelist'], (res) => {
  currentWhitelist = res.whitelist || [];
});

// 2. МГНОВЕННОЕ ОБНОВЛЕНИЕ: слушаем изменения в хранилище
chrome.storage.onChanged.addListener((changes) => {
  if (changes.whitelist) {
    currentWhitelist = changes.whitelist.newValue || [];
    console.log("Shiba-Kun: Список учебы обновлен!");
  }
});

// 3. ЦИКЛ НАЧИСЛЕНИЯ
setInterval(() => {
  // Проверяем только активную вкладку
  if (document.visibilityState === 'visible') {
    chrome.storage.local.get(['stats'], (res) => {
      let stats = res.stats || { food: 100, clean: 100, happy: 100, coins: 0 };
      const currentHost = window.location.hostname.toLowerCase();
      
      // Сверяем текущий сайт с обновляемым списком
      const isStudying = currentWhitelist.some(site => 
        site.trim() !== "" && currentHost.includes(site.toLowerCase())
      );
      
      if (isStudying) {
        stats.coins = (stats.coins || 0) + 2;
      } else {
        stats.coins = Math.max(0, (stats.coins || 0) - 1);
      }
      
      chrome.storage.local.set({ stats });
    });
  }
}, 5000);