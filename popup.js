let stats = { food: 100, clean: 100, happy: 100, coins: 0, inventory: {}, effects: { eff_wash: false, eff_eat: false, eff_pet: false } };
let whitelist = [];
let isActionActive = false;
const petSprite = document.getElementById('pet-sprite');

// 1. Инициализация
chrome.storage.local.get(['stats', 'whitelist'], (res) => {
    if (res.stats) {
        stats = res.stats;
        if (!stats.effects) stats.effects = { eff_wash: false, eff_eat: false, eff_pet: false };
        if (Array.isArray(stats.inventory) || !stats.inventory) stats.inventory = {};
    }
    if (res.whitelist) whitelist = res.whitelist;
    
    updateUI();
    renderWhitelist();
    updateFoodSelect();
    initTabs();
    initShop();
    updateDisplayGlow(); // Включаем свечение при старте
});


// Слушатель изменений (монеты от контент-скрипта)
chrome.storage.onChanged.addListener((changes) => {
    if (changes.stats) {
        const newStats = changes.stats.newValue;
        // Обновляем только монеты, чтобы не мешать анимации шкал
        stats.coins = newStats.coins;
        // Если пришло обновление инвентаря из другого места — тоже подхватим
        stats.inventory = newStats.inventory || {};
        updateUI();
    }
});

// Логика свечения ЖК-дисплея
function updateDisplayGlow() {
    // Используем query для поиска активной вкладки в ПОСЛЕДНЕМ ФОКУСИРОВАННОМ окне
    // Это критично для работы Side Panel
    chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
        const tab = tabs[0];
        const display = document.querySelector('.pet-display');
        if (!tab || !display) return;

        chrome.storage.local.get(['whitelist'], (res) => {
            const whitelist = res.whitelist || [];
            // Если URL недоступен (например, служебная страница Chrome), ставим темное
            const url = tab.url ? tab.url.toLowerCase() : "";
            const isStudying = whitelist.some(site => url.includes(site.toLowerCase()));

            if (isStudying) {
                display.classList.remove('not-studying-glow');
                display.classList.add('studying-glow');
            } else {
                display.classList.remove('studying-glow');
                display.classList.add('not-studying-glow');
            }
        });
    });
}
// 2. СЛУШАТЕЛИ СОБЫТИЙ (Чтобы цвет менялся сразу при переходе на другой сайт)

// Когда мы переключаемся между вкладками
chrome.tabs.onActivated.addListener(updateDisplayGlow);

// Когда на вкладке меняется URL (например, перешли с Google на YouTube)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete') {
        updateDisplayGlow();
    }
});
// Магазин
function initShop() {
    document.querySelectorAll('.buy-btn').forEach(btn => {
        btn.onclick = function() {
            const price = parseInt(this.getAttribute('data-price'));
            const item = this.getAttribute('data-item');
            const isEffect = this.classList.contains('effect');

            if (stats.coins >= price) {
                if (isEffect) {
                    if (stats.effects[item]) return;
                    stats.effects[item] = true;
                    this.innerText = "OWNED";
                    this.disabled = true;
                } else {
                    stats.inventory[item] = (stats.inventory[item] || 0) + 1;
                }
                stats.coins -= price;
                chrome.storage.local.set({ stats }, () => { updateUI(); updateFoodSelect(); });
            } else { alert("Мало монет! 💰"); }
        };
    });
}

// Действия
document.getElementById('btn-feed').onclick = () => {
    const item = document.getElementById('food-select').value;
    if (item === "none" || !stats.inventory[item]) return;
    const energy = { steak: 70, bone: 35, cookie: 15 };
    stats.food = Math.min(100, stats.food + (energy[item] || 10));
    stats.inventory[item]--;
    if (stats.effects.eff_eat) createParticles('🍗');
    setAnimation('anim-eat');
    save();
};

document.getElementById('btn-wash').onclick = () => {
    stats.clean = 100;
    if (stats.effects.eff_wash) createParticles('💧');
    setAnimation('anim-wash');
    save();
};

document.getElementById('btn-pet').onclick = () => {
    stats.happy = Math.min(100, stats.happy + 20);
    if (stats.effects.eff_pet) createParticles('❤️');
    setAnimation('anim-pet');
    save();
};

function createParticles(emoji) {
    const container = document.getElementById('particles-container');
    if (!container) return;
    for (let i = 0; i < 8; i++) {
        const p = document.createElement('div');
        p.className = 'particle';
        p.innerText = emoji;
        p.style.setProperty('--dx', (Math.random() - 0.5) * 160 + 'px');
        p.style.setProperty('--dy', (Math.random() * -120 - 20) + 'px');
        container.appendChild(p);
        setTimeout(() => p.remove(), 1000);
    }
}

function save() { chrome.storage.local.set({ stats }, updateUI); }

function updateUI() {
    // Обновляем шкалы, если элементы существуют на странице
    const foodBar = document.getElementById('visual-bar-food');
    const cleanBar = document.getElementById('visual-bar-clean');
    const happyBar = document.getElementById('visual-bar-happy');
    const coinText = document.getElementById('coin-count');

    if (foodBar) foodBar.style.width = stats.food + '%';
    if (cleanBar) cleanBar.style.width = stats.clean + '%';
    if (happyBar) happyBar.style.width = stats.happy + '%';
    if (coinText) coinText.innerText = Math.floor(stats.coins);
}

function updateFoodSelect() {
    const select = document.getElementById('food-select');
    if (!select) return;
    select.innerHTML = '';
    const names = { steak: "🍖 Стейк", bone: "🦴 Кость", cookie: "🍪 Печенье" };
    let hasFood = false;
    for (let key in stats.inventory) {
        if (stats.inventory[key] > 0) {
            let opt = document.createElement('option');
            opt.value = key;
            opt.innerText = `${names[key]} (${stats.inventory[key]})`;
            select.appendChild(opt);
            hasFood = true;
        }
    }
    if (!hasFood) select.innerHTML = '<option value="none">Пусто</option>';
}

function initTabs() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.onclick = () => {
            const target = btn.getAttribute('data-tab');
            document.querySelectorAll('.tab-btn, .tab-content').forEach(el => el.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(target).classList.add('active');
        };
    });
}

function setAnimation(className) {
    isActionActive = true;
    petSprite.className = className;
    setTimeout(() => { petSprite.className = 'anim-idle'; isActionActive = false; }, 3000);
}

// Учеба
document.getElementById('btn-add-site').onclick = () => {
    const input = document.getElementById('site-input');
    const site = input.value.trim().toLowerCase();
    if (site && !whitelist.includes(site)) {
        whitelist.push(site);
        chrome.storage.local.set({ whitelist }, () => { input.value = ''; renderWhitelist(); updateDisplayGlow(); });
    }
};
// Кнопка добавления ТЕКУЩЕГО сайта
document.getElementById('btn-add-current').onclick = async () => {
    // 1. Получаем активную вкладку
    const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    
    if (tab && tab.url) {
        try {
            // 2. Извлекаем чистый домен (из https://www.google.com -> google.com)
            const url = new URL(tab.url);
            let domain = url.hostname.replace('www.', ''); 

            // 3. Проверяем дубликаты и добавляем
            if (domain && !whitelist.includes(domain)) {
                whitelist.push(domain);
                
                // 4. Сохраняем в память
                chrome.storage.local.set({ whitelist }, () => {
                    renderWhitelist();    // Перерисовываем список в UI
                    updateDisplayGlow(); // Включаем зеленое свечение, если мы на этом сайте
                });
            }
        } catch (e) {
            console.error("Не удалось прочитать URL:", e);
        }
    }
};
function renderWhitelist() {
    const list = document.getElementById('whitelist');
    if (!list) return;
    list.innerHTML = '';
    whitelist.forEach((site, index) => {
        const li = document.createElement('li');
        li.className = 'whitelist-item';
        li.innerHTML = `<span>${site}</span><button class="del-btn" data-idx="${index}">×</button>`;
        li.querySelector('.del-btn').onclick = () => { whitelist.splice(index, 1); chrome.storage.local.set({ whitelist }, () => { renderWhitelist(); updateDisplayGlow(); }); };
        list.appendChild(li);
    });
}

// Интервал автоматического расхода характеристик (1 раз в секунду)
setInterval(() => {
    if (!isActionActive) {
        // Уменьшаем статы только в переменной (в оперативной памяти)
        stats.food = Math.max(0, stats.food - 0.55);
        stats.clean = Math.max(0, stats.clean - 0.55);
        stats.happy = Math.max(0, stats.happy - 0.55);
        
        // Рисуем на экране
        updateUI();
        
        // Сохраняем в постоянную память НЕ каждую секунду, а раз в 10 секунд
        // Это освободит очередь для начисления монет
    }
}, 1000);
// Сохраняем данные в память раз в 10 секунд
setInterval(() => {
    chrome.storage.local.set({ stats });
}, 10000);

// И сохраняем принудительно, если пользователь закрывает окно
window.onunload = () => {
    chrome.storage.local.set({ stats });
};
document.getElementById('btn-side-panel').onclick = async () => {
  const windowId = (await chrome.windows.getCurrent()).id;
  
  // Включаем боковую панель и открываем её
  await chrome.sidePanel.setOptions({
    windowId: windowId,
    path: 'popup.html',
    enabled: true
  });
  
  chrome.sidePanel.open({ windowId });
};