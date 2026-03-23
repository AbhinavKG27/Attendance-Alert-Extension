console.log("🎯 Detector Running");

let alertTriggered = false;

const KEYWORDS = SHARED_CONFIG.KEYWORDS;

// visibility check
function isVisible(el) {
  if (!el) return false;

  const rect = el.getBoundingClientRect();
  const style = window.getComputedStyle(el);

  return (
    style.display !== "none" &&
    style.visibility !== "hidden" &&
    rect.width > 0 &&
    rect.height > 0
  );
}

// keyword match
function containsAttendance(text) {
  if (!text) return false;
  const lower = text.toLowerCase();
  return KEYWORDS.some(k => lower.includes(k));
}

// auto click
function autoClickAttendance(root) {
  const elements = root.querySelectorAll("button, div, span, a");

  for (const el of elements) {
    if (!isVisible(el)) continue;

    const text = el.innerText || "";

    if (containsAttendance(text)) {
      console.log("🤖 Clicking:", text);
      el.click();
      return true;
    }
  }

  return false;
}

// alert
function sendAlert(text) {
  if (alertTriggered) return;

  alertTriggered = true;

  chrome.runtime.sendMessage({
    type: "ATTENDANCE_DETECTED",
    text: "Attendance auto-clicked!"
  });

  setTimeout(() => {
    alertTriggered = false;
  }, 45000);
}

// scan
function scanNode(node) {
  if (!node || node.nodeType !== 1) return;

  const elements = [node, ...node.querySelectorAll("div, button, span")];

  for (const el of elements) {
    if (!isVisible(el)) continue;

    const text = el.innerText || "";

    if (containsAttendance(text)) {
      if (autoClickAttendance(document.body)) {
        sendAlert(text);
      }
      return true;
    }
  }

  return false;
}

// observe
const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    for (const node of mutation.addedNodes) {
      if (scanNode(node)) return;
    }
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});

// initial scan
setTimeout(() => {
  scanNode(document.body);
}, 2000);

// remote command
chrome.runtime.onMessage.addListener((request) => {
  if (request.type === "FORCE_CLICK_ATTENDANCE") {
    console.log("📱 Remote click triggered");
    autoClickAttendance(document.body);
  }
});