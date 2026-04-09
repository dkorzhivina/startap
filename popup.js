const PRICES = { item: 30, food: 10 };
const FILL_STEP = 100 / 6; 
const WHITE_LIST = ["github.com", "wikipedia.org", "stackoverflow.com", "habr.com"];
console.log("POPUP WORKS");

const DOG_SVG = `
<svg viewBox="0 0 200 220" xmlns="http://www.w3.org/2000/svg" id="dog-svg-element" style="cursor:pointer;">
    <defs>
        <filter id="ultraShadow"><feDropShadow dx="0" dy="4" stdDeviation="3" flood-opacity="0.3"/></filter>
        <linearGradient id="furBase" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#E1A95F;" /><stop offset="100%" style="stop-color:#CD853F;" /></linearGradient>
    </defs>
    <g filter="url(#ultraShadow)">
        <path id="dog-tail" d="M145 150 Q190 135 165 75 Q175 100 155 115" fill="#8B4513" transform-origin="145px 150px" />
        <ellipse cx="100" cy="145" rx="58" ry="52" fill="url(#furBase)" />
        <path d="M70 135 Q100 125 130 135 Q125 170 100 185 Q75 170 70 135" fill="#FFF8DC" opacity="0.9" />
    </g>
    
    <g id="dirt-layer" style="opacity: 0; pointer-events: none;">
        <circle cx="70" cy="150" r="8" fill="#5D4037" opacity="0.6"/>
        <circle cx="130" cy="140" r="6" fill="#5D4037" opacity="0.5"/>
        <circle cx="100" cy="170" r="10" fill="#5D4037" opacity="0.4"/>
    </g>

    <g filter="url(#ultraShadow)">
        <ellipse cx="58" cy="72" rx="20" ry="42" fill="#8B4513" />
        <ellipse cx="142" cy="72" rx="20" ry="42" fill="#8B4513" />
        <path d="M52 95 Q45 65 75 55 Q90 45 100 45 Q110 45 125 55 Q155 65 148 95 Q148 130 100 130 T52 95" fill="url(#furBase)" />
        
        <g id="eyes-group">
            <circle cx="80" cy="88" r="10" fill="white" />
            <circle cx="120" cy="88" r="10" fill="white" />
            <circle cx="80" cy="89" r="6" fill="#111" />
            <circle cx="120" cy="89" r="6" fill="#111" />
            <rect id="eye-lid-l" x="65" y="78" width="30" height="0" fill="#E1A95F" />
            <rect id="eye-lid-r" x="105" y="78" width="30" height="0" fill="#E1A95F" />
        </g>

        <ellipse cx="100" cy="112" rx="26" ry="18" fill="#FFF8DC" />
        <path id="mouth-path" d="M90 110 Q100 120 110 110" fill="none" stroke="#8B4513" stroke-width="2.5" stroke-linecap="round" />
        <rect x="94" y="100" width="12" height="8" rx="4" fill="#222" />
    </g>
    
    <g id="acc-hat" style="opacity:0; pointer-events:none;" transform="translate(100, 50)"><ellipse cx="0" cy="5" rx="40" ry="8" fill="#111"/><path d="M-28 2 L-24 -38 Q0 -45 24 -38 L28 2 Z" fill="#222"/></g>
    <g id="acc-glasses" style="opacity:0; pointer-events:none;" transform="translate(100, 89)"><circle cx="-20" cy="0" r="15" fill="rgba(0,0,0,0.1)" stroke="#333" stroke-width="2"/><circle cx="20" cy="0" r="15" fill="rgba(0,0,0,0.1)" stroke="#333" stroke-width="2"/></g>
    <g id="acc-tie" style="opacity:0; pointer-events:none;" transform="translate(100, 130)"><path d="M0 0 L10 25 L0 35 L-10 25 Z" fill="#EF4444"/></g>
</svg>`;

let stats = { hunger: 100, happy: 100, clean: 100, coins: 0, foodCount: 0, isStudying: false };
let items = { hat: { owned: false, active: false }, glasses: { owned: false, active: false }, tie: { owned: false, active: false } };

let prevHappy = null;

async function init() {
    const container = document.getElementById('dog-container');
    if (!container) return;

    container.innerHTML = DOG_SVG;

    const data = await chrome.storage.local.get(['dogStats', 'dogItems', 'stats']);

    if (data.dogStats) stats = { ...stats, ...data.dogStats };
    if (data.dogItems) items = data.dogItems;

    // 🔥 ВАЖНО: подтягиваем happiness из background при старте
    if (data.stats) {
        stats.happy = data.stats.happiness;
    }

    const dog = container.querySelector('#dog-svg-element');
    if (dog) {
        dog.onclick = () => {
            addStat('happy', '💖 Радость!');
            spawnEmoji('❤️');
            animateDog("happy");
        };
    }

    updateUI();
    startBlinking();

    // деградация статов
    setInterval(async () => {
        await checkCurrentTab();

        if (!stats.isStudying) {
            stats.hunger = Math.max(0, stats.hunger - 0.2);
            stats.happy = Math.max(0, stats.happy - 0.2);
            stats.clean = Math.max(0, stats.clean - 0.2);
        }

        updateUI();
        save();
    }, 1000);

    // фарм монет
    setInterval(() => {
        if (stats.isStudying) {
            stats.coins += 5;
            updateUI();
            save();
        }
    }, 10000);

    // ===== КНОПКИ =====

    const washBtn = document.getElementById('wash-act');
    if (washBtn) {
        washBtn.onclick = () => {
            addStat('clean', '🧼 Чисто!');
            spawnEmoji('💧');
            animateDog("happy");
        };
    }

    const feedBtn = document.getElementById('feed-act');
    if (feedBtn) {
        feedBtn.onclick = () => {
            if (stats.foodCount > 0) {
                stats.foodCount--;
                addStat('hunger', '🍗 Ням!');
                spawnEmoji('🍗');
                animateDog("eat");
            }
        };
    }

    const shopBtn = document.getElementById('shop-toggle');
    if (shopBtn) {
        shopBtn.onclick = () => {
            const shop = document.getElementById('shop-menu');
            if (shop) shop.classList.toggle('active');
        };
    }

    const buyFoodBtn = document.getElementById('buy-food-btn');
    if (buyFoodBtn) {
        buyFoodBtn.onclick = () => {
            if (stats.coins >= PRICES.food) {
                stats.coins -= PRICES.food;
                stats.foodCount++;
                save();
                updateUI();
            }
        };
    }

    ['hat', 'glasses', 'tie'].forEach(id => {
        const btn = document.getElementById('btn-' + id);
        if (btn) {
            btn.onclick = () => {
                if (items[id].owned) {
                    items[id].active = !items[id].active;
                } else if (stats.coins >= PRICES.item) {
                    stats.coins -= PRICES.item;
                    items[id].owned = true;
                    items[id].active = true;
                }
                save();
                updateUI();
            };
        }
    });
}

function startBlinking() {
    setInterval(() => {
        const lidL = document.getElementById('eye-lid-l');
        const lidR = document.getElementById('eye-lid-r');

        if (lidL) lidL.setAttribute('height', '20');
        if (lidR) lidR.setAttribute('height', '20');

        setTimeout(() => {
            if (lidL) lidL.setAttribute('height', '0');
            if (lidR) lidR.setAttribute('height', '0');
        }, 150);
    }, 4000);
}

function spawnEmoji(emoji) {
    const container = document.getElementById('dog-container');
    if (!container) return;

    for (let i = 0; i < 6; i++) {
        const span = document.createElement('span');
        span.textContent = emoji;
        span.className = 'floating-emoji';

        const x = (Math.random() - 0.5) * 150;
        const y = (Math.random() - 0.5) * 150;

        span.style.setProperty('--x', `${x}px`);
        span.style.setProperty('--y', `${y}px`);

        container.appendChild(span);

        setTimeout(() => span.remove(), 1000);
    }
}

async function checkCurrentTab() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.url) {
            stats.isStudying = WHITE_LIST.some(site =>
                tabs[0].url.includes(site)
            );
        }
    });
}

function addStat(stat, msg) {
    stats[stat] = Math.min(100, stats[stat] + FILL_STEP);
    updateUI();
    save();
    showMessage(msg, "#3b82f6");
}

function updateUI() {
    document.getElementById('coin-count').textContent = Math.floor(stats.coins);
    document.getElementById('food-stock').textContent = stats.foodCount;

    document.getElementById('bar-hunger').style.width = stats.hunger + '%';
    document.getElementById('bar-happy').style.width = stats.happy + '%';
    document.getElementById('bar-clean').style.width = stats.clean + '%';

    const isSad = stats.hunger < 30 || stats.happy < 30 || stats.clean < 30;

    const tail = document.getElementById('dog-tail');
    if (tail) {
        tail.style.animation = isSad
            ? "tailWag 2s infinite alternate ease-in-out"
            : "tailWag 0.4s infinite alternate ease-in-out";
    }

    const mouth = document.getElementById('mouth-path');
    if (mouth) {
        mouth.setAttribute(
            'd',
            isSad
                ? 'M90 120 Q100 110 110 120'
                : 'M90 110 Q100 120 110 110'
        );
    }

    const hat = document.getElementById('acc-hat');
    const glasses = document.getElementById('acc-glasses');
    const tie = document.getElementById('acc-tie');

    if (hat) hat.style.opacity = items.hat.active ? 1 : 0;
    if (glasses) glasses.style.opacity = items.glasses.active ? 1 : 0;
    if (tie) tie.style.opacity = items.tie.active ? 1 : 0;

    ['hat', 'glasses', 'tie'].forEach(id => {
        const btn = document.getElementById('btn-' + id);
        if (btn) {
            btn.className = `shop-item ${items[id].owned ? '' : 'locked'} ${items[id].active ? 'selected' : ''}`;
        }
    });
}

function showMessage(text, color) {
    const el = document.getElementById('status-text');
    if (el) {
        el.textContent = text;
        el.style.color = color;
    }
}

function save() {
    chrome.storage.local.set({ dogStats: stats, dogItems: items });
}

function animateDog(type) {
    const dog = document.getElementById('dog-svg-element');
    if (!dog) return;

    dog.style.animation = "none";

    setTimeout(() => {
        if (type === "happy") {
            dog.style.animation = "bounce 0.5s ease";
        }

        if (type === "eat") {
            dog.style.animation = "bounce 0.3s ease";
        }

        if (type === "sleep") {
            dog.style.animation = "sad 1s infinite";
        }

        if (type === "bad") {
            dog.style.animation = "shake 0.5s";
        }
    }, 10);
}

// 🔥 ГЛАВНОЕ: реакция на анализ
chrome.storage.onChanged.addListener((changes) => {
    if (changes.stats) {
        const newStats = changes.stats.newValue;

        // 👉 первый запуск — просто запоминаем и ВЫХОДИМ
        if (prevHappy === null) {
            prevHappy = newStats.happiness;
            stats.happy = newStats.happiness;
            updateUI();
            return; // ❗ ВАЖНО
        }

        if (newStats.happiness > prevHappy) {
            showMessage("🔥 Полезный контент!", "green");
            animateDog("happy");
        } else if (newStats.happiness < prevHappy) {
            showMessage("😴 Бесполезный сайт...", "red");
            animateDog("bad");
        }

        stats.happy = newStats.happiness;
        prevHappy = newStats.happiness;

        updateUI();
    }
});

document.addEventListener('DOMContentLoaded', init);