document.getElementById("testBtn").addEventListener("click", () => {
    chrome.runtime.sendMessage({
        type: "ATTENDANCE_DETECTED",
        text: "Test Alert from Extension UI"
    });
});