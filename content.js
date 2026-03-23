console.log("🎯 Kodnest Attendance Detector Running");

let alertTriggered = false;

// Keywords to detect attendance popup
const KEYWORDS = [
  "attendance",
  "mark attendance",
  "mark your attendance",
  "click to mark",
  "confirm attendance"
];

// Check if element is visible on screen
function isVisible(el) {
  if (!el) return false;

  const style = window.getComputedStyle(el);
  const rect = el.getBoundingClientRect();

  return (
    style.display !== "none" &&
    style.visibility !== "hidden" &&
    rect.width > 0 &&
    rect.height > 0 &&
    rect.top < window.innerHeight &&
    rect.bottom > 0
  );
}

// Check if text contains attendance keywords
function containsAttendance(text) {
  if (!text) return false;

  const lower = text.toLowerCase();
  return KEYWORDS.some(k => lower.includes(k));
}

// Send alert once
function sendAlert(text) {
  if (alertTriggered) return;

  alertTriggered = true;

  console.log("🚨 Attendance popup detected:", text);

  chrome.runtime.sendMessage({
    type: "ATTENDANCE_DETECTED",
    text: "Attendance popup detected!"
  });

  // Prevent spam alerts
  setTimeout(() => {
    alertTriggered = false;
  }, 45000);
}

// Scan a node for attendance popup
function scanNode(node) {
  if (!node || node.nodeType !== 1) return;

  try {
    const elements = [
      node,
      ...node.querySelectorAll("button, div, span")
    ];

    for (const el of elements) {
      if (!isVisible(el)) continue;

      const text = el.innerText || "";

      if (containsAttendance(text)) {
        sendAlert(text);
        return true;
      }
    }
  } catch (e) {
    console.error("Scan error:", e);
  }

  return false;
}

// MutationObserver for dynamic popups
const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    for (const node of mutation.addedNodes) {
      if (scanNode(node)) return;
    }
  }
});

// Start observing DOM
observer.observe(document.body, {
  childList: true,
  subtree: true
});

// Initial scan (in case popup already exists)
setTimeout(() => {
  scanNode(document.body);
}, 2000);