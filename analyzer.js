const STUDY_KEYWORDS = [
  "javascript", "python", "react",
  "tutorial", "course", "lesson",
  "обучение", "программирование",
  "lecture", "алгоритм",
  "университет",
  "студент",
  "курс",
  "образование",
  "дистанционное обучение",
  "учебный портал"
];

const FUN_KEYWORDS = [
  "prank", "funny", "meme",
  "challenge", "fail", "tiktok"
];

const DISTRACTION_SITES = [
  "wildberries.ru",
  "youtube.com",
  "tiktok.com",
  "instagram.com",
  "vk.com"
];

function analyzeText(text, url = "") {
  if (typeof text !== "string") return 0;

  text = text.toLowerCase();

  let score = 0;

  // 🔥 проверка сайта
  if (DISTRACTION_SITES.some(site => url.includes(site))) {
    score -= 5;
  }

  STUDY_KEYWORDS.forEach(word => {
    if (text.includes(word)) score += 2;
  });

  FUN_KEYWORDS.forEach(word => {
    if (text.includes(word)) score -= 2;
  });

  return score;
}

function analyzeYouTube(title, description) {
  const text = (String(title || "") + " " + String(description || "")).toLowerCase();

  let score = 0;

  STUDY_KEYWORDS.forEach(word => {
    if (text.includes(word)) score += 3;
  });

  FUN_KEYWORDS.forEach(word => {
    if (text.includes(word)) score -= 3;
  });

  return score;
}

console.log("ANALYZER CLEAN LOADED");