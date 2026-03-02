// background.js
importScripts("config.js");

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === "ATTENDANCE_DETECTED") {

        chrome.notifications.create({
            type: "basic",
            iconUrl: "https://cdn-icons-png.flaticon.com/512/1827/1827392.png",
            title: "🚨 Attendance Alert",
            message: "Attendance popup detected! Open class NOW!",
            priority: 2
        });

        fetch(`https://api.telegram.org/bot${CONFIG.TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                chat_id: CONFIG.CHAT_ID,
                text: "🚨 Attendance popup detected!"
            })
        });
    }
});
