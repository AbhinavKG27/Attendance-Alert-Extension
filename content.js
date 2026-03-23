console.log("🎯 Kodnest Detector Running");

let alertTriggered = false;

const KEYWORDS = [
  "attendance",
  "mark attendance",
  "mark your attendance",
  "click to mark",
  "confirm attendance"
];

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

function containsAttendance(text) {
  if (!text) return false;
  const lower = text.toLowerCase();
  return KEYWORDS.some(k => lower.includes(k));
}

// Auto-click attendance
function autoClickAttendance(root) {
  const elements = root.querySelectorAll("button, div, span, a");

  for (const el of elements) {
    if (!isVisible(el)) continue;

    const text = el.innerText || "";
    if (containsAttendance(text)) {
      console.log("🤖 Auto-click:", text);
      el.click();
      return true;
    }
  }
  return false;
}

function sendAlert(text) {
  if (alertTriggered) return;

  alertTriggered = true;

  chrome.runtime.sendMessage({
    type: "ATTENDANCE_DETECTED",
    text: "Attendance detected & clicked!"
  });

  setTimeout(() => {
    alertTriggered = false;
  }, 45000);
}

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

// Detect popup
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

// Initial scan
setTimeout(() => {
  scanNode(document.body);
}, 2000);

// 📱 Remote command listener
chrome.runtime.onMessage.addListener((request) => {
  if (request.type === "FORCE_CLICK_ATTENDANCE") {
    console.log("📱 Remote trigger received");
    autoClickAttendance(document.body);
  }
});