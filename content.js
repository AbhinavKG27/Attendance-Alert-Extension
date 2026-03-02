console.log("🎯Attendance Modal Detector (Anti-Spam Version)");

let alertTriggered = false;

// Strong keywords (case-insensitive)
const KEYWORDS = [
    "mark your attendance",
    "mark attendance"
];

// Check if modal is visible on screen
function isVisible(element) {
    const style = window.getComputedStyle(element);
    return (
        style.display !== "none" &&
        style.visibility !== "hidden" &&
        element.offsetHeight > 0 &&
        element.offsetWidth > 0
    );
}

// Check keyword match safely
function containsAttendance(text) {
    if (!text) return false;
    const lower = text.toLowerCase();
    return KEYWORDS.some(k => lower.includes(k));
}

// Trigger alert once
function sendAlert(text) {
    if (alertTriggered) return;

    alertTriggered = true;
    console.log("🚨 REAL ATTENDANCE POPUP DETECTED:", text);

    chrome.runtime.sendMessage({
        type: "ATTENDANCE_DETECTED",
        text: "Attendance Popup Detected!"
    });

    // Cooldown (prevents spam alerts)
    setTimeout(() => {
        alertTriggered = false;
    }, 60000); // 60 sec cooldown (very important)
}

// Mutation observer (only for NEW visible modals)
const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
            if (!node || node.nodeType !== 1) continue;

            try {
                // Check if it's a modal/dialog
                const modalCandidates = [
                    node,
                    ...node.querySelectorAll('[role="dialog"], .modal, .popup, .dialog')
                ];

                for (const modal of modalCandidates) {
                    if (!isVisible(modal)) continue;

                    const text = modal.innerText || "";
                    if (containsAttendance(text)) {
                        sendAlert(text);
                        return;
                    }

                    // Check buttons inside modal
                    const buttons = modal.querySelectorAll("button");
                    for (const btn of buttons) {
                        if (containsAttendance(btn.innerText)) {
                            sendAlert(btn.innerText);
                            return;
                        }
                    }
                }

            } catch (err) {
                console.error("Detection error:", err);
            }
        }
    }
});

// Observe DOM changes (best for popup modals)
observer.observe(document.body, {
    childList: true,
    subtree: true
});