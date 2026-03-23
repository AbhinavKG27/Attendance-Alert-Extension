importScripts("config.js");

let lastUpdateId = 0;

// Listen for detection alerts from content.js
chrome.runtime.onMessage.addListener((request) => {
    if (request.type === "ATTENDANCE_DETECTED") {

        // Desktop notification
        chrome.notifications.create({
            type: "basic",
            iconUrl: "icons/icon128.png",
            title: "🚨 Attendance Alert",
            message: request.text,
            priority: 2
        });

        // Telegram alert
        fetch(`https://api.telegram.org/bot${CONFIG.TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                chat_id: CONFIG.CHAT_ID,
                text: "🚨 Attendance popup detected!"
            })
        });
    }
});

// 🔁 Poll Telegram every 5 sec for remote commands
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

            const message = update.message?.text?.toLowerCase();
            if (!message) continue;

            console.log("📩 Telegram command:", message);

            if (message.includes("mark")) {
                triggerAttendanceClick();
            }
        }
    } catch (err) {
        console.error("Polling error:", err);
    }
}, 5000);

// Send command to content.js
function triggerAttendanceClick() {
    chrome.tabs.query({}, (tabs) => {
        for (const tab of tabs) {
            if (tab.url && tab.url.includes("kodnest")) {
                chrome.tabs.sendMessage(tab.id, {
                    type: "FORCE_CLICK_ATTENDANCE"
                });
            }
        }
    });

    // Confirmation message
    fetch(`https://api.telegram.org/bot${CONFIG.TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            chat_id: CONFIG.CHAT_ID,
            text: "✅ Attendance command executed"
        })
    });
}