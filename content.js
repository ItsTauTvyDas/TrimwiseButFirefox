// content.js (Chrome + Firefox compatible)

let allArticles = [];
let currentOffset = 0;
let showMoreButton = null;
let BATCH_SIZE = 20; // default

const ext = (typeof browser !== "undefined") ? browser : chrome;

// Promise/Callback bridge for storage
function storageSyncGet(keys) {
  try {
    const ret = ext.storage.sync.get(keys);
    if (ret && typeof ret.then === "function") return ret; // Firefox
  } catch {}
  return new Promise((resolve) => {
    ext.storage.sync.get(keys, (result) => resolve(result)); // Chrome
  });
}

function updateArticleList() {
  allArticles = Array.from(
    document.querySelectorAll('article[data-testid^="conversation-turn-"]')
  );
}

function trimMessages() {
  updateArticleList();

  const total = allArticles.length;
  if (total === 0) return;

  const visibleCount = Math.min((currentOffset + 1) * BATCH_SIZE, total);
  const hiddenCount = total - visibleCount;
  const firstVisibleIndex = total - visibleCount;

  allArticles.forEach((article, index) => {
    article.style.display = index >= firstVisibleIndex ? "" : "none";
  });

  insertOrMoveShowMoreButton(firstVisibleIndex, hiddenCount, total, visibleCount);
}

function insertOrMoveShowMoreButton(beforeIndex, hidden, total, visible) {
  if (showMoreButton) {
    showMoreButton.remove();
    showMoreButton = null;
  }

  const wrapper = document.createElement("div");
  wrapper.style.display = "flex";
  wrapper.style.justifyContent = "center";
  wrapper.style.margin = "16px 0";

  const button = document.createElement("button");
  button.style.padding = "8px 14px";
  button.style.backgroundColor = "#10a37f";
  button.style.color = "#fff";
  button.style.border = "none";
  button.style.borderRadius = "18px";
  button.style.cursor = "pointer";
  button.style.fontSize = "var(--text-base)";
  button.style.fontFamily =
    "ui-sans-serif,-apple-system,system-ui,Segoe UI,Helvetica,Apple Color Emoji,Arial,sans-serif,Segoe UI Emoji,Segoe UI Symbol";
  button.style.boxShadow = "0 1px 3px rgba(0,0,0,0.2)";

  if (visible >= total) {
    button.innerText = "All messages are shown";
    button.onclick = () => {
      currentOffset = 0;
      trimMessages();
    };

    wrapper.appendChild(button);

    // Insert at top (before first article) if possible
    if (allArticles[0] && allArticles[0].parentNode) {
      allArticles[0].parentNode.insertBefore(wrapper, allArticles[0]);
    }
  } else {
    const toShowNow = Math.min(BATCH_SIZE, hidden);
    button.innerText =
      hidden === 0
        ? "All messages are shown"
        : `Show ${toShowNow} more messages (${hidden} hidden)`;

    button.onclick = () => {
      currentOffset++;
      trimMessages();
    };

    const target = allArticles[beforeIndex];
    if (target && target.parentNode) {
      wrapper.appendChild(button);
      target.parentNode.insertBefore(wrapper, target);
    }
  }

  showMoreButton = wrapper;
}

(async () => {
  const data = await storageSyncGet("batchSize");
  if (data.batchSize) {
    const n = parseInt(data.batchSize, 10);
    if (Number.isFinite(n) && n > 0) BATCH_SIZE = n;
  }

  // Run once immediately with the loaded setting, then keep trimming
  trimMessages();
  setInterval(trimMessages, 3000);
})();
