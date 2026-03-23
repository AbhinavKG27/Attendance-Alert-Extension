importScripts("config.js", "sharedConfig.js");

let lastUpdateId = 0;

// Handle alerts from content.js
chrome.runtime.onMessage.addListener((request) => {
  if (request.type === "ATTENDANCE_DETECTED") {

    chrome.notifications.create({
      type: "basic",
      iconUrl: "icons/icon128.png",
      title: "🚨 Attendance Alert",
      message: request.text,
      priority: 2
    });

    fetch(`https://api.telegram.org/bot${CONFIG.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({
        chat_id: CONFIG.CHAT_ID,
        text: "🚨 Attendance detected & handled!"
      })
    });
  }
});

// 🔁 Telegram polling for remote commands
setInterval(async () => {
  try {
    const res = await fetch(
      `https://api.telegram.org/bot${CONFIG.TELEGRAM_BOT_TOKEN}/getUpdates`
    );
    const data = await res.json();

    if (!data.result) return;

    for (const update of data.result) {
      if (update.update_id <= lastUpdateId) continue;

      lastUpdateId = update.update_id;

      const msg = update.message?.text?.toLowerCase();
      if (!msg) continue;

      console.log("📩 Command:", msg);

      if (msg.includes("mark")) {
        triggerAttendanceClick();
      }
    }

  } catch (err) {
    console.error("Polling error:", err);
  }
}, 5000);

// Send click command to tab
function triggerAttendanceClick() {
  chrome.tabs.query({}, (tabs) => {
    for (const tab of tabs) {
      if (tab.url && tab.url.includes(SHARED_CONFIG.TARGET_SITE)) {
        chrome.tabs.sendMessage(tab.id, {
          type: "FORCE_CLICK_ATTENDANCE"
        });
      }
    }
  });

  // confirmation
  fetch(`https://api.telegram.org/bot${CONFIG.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({
      chat_id: CONFIG.CHAT_ID,
      text: "✅ Attendance command executed"
    })
  });
}