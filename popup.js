const monitorToggle = document.getElementById("monitorToggle");
const approvalEndpoint = document.getElementById("approvalEndpoint");
const approvalApiKey = document.getElementById("approvalApiKey");
const statusEl = document.getElementById("status");
const telegramStatusEl = document.getElementById("telegramStatus");
const lastDetectionEl = document.getElementById("lastDetection");

function setStatus(message, isError = false) {
  statusEl.textContent = message;
  statusEl.classList.toggle("error", isError);
}

function showLastDetection(detection) {
  if (!detection) {
    lastDetectionEl.textContent = "No popup detected yet.";
    return;
  }

  lastDetectionEl.textContent = `Last popup: ${detection.countdownText} (${new Date(
    detection.detectedAt
  ).toLocaleTimeString()})`;
}

function sendMessage(message) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }

      if (!response?.ok) {
        reject(new Error(response?.reason || "Unknown runtime error"));
        return;
      }

      resolve(response);
    });
  });
}

async function hydrateState() {
  try {
    const response = await sendMessage({ type: "POPUP_GET_STATE" });
    monitorToggle.checked = response.settings.monitoringEnabled;
    approvalEndpoint.value = response.settings.approvalEndpoint;
    approvalApiKey.value = response.settings.approvalApiKey;
    telegramStatusEl.textContent = response.telegramEnabled
      ? "Telegram status: configured in config.js"
      : "Telegram status: not configured (add TELEGRAM_BOT_TOKEN + CHAT_ID in config.js)";
    showLastDetection(response.latestDetection);
    setStatus("Ready");
  } catch (error) {
    setStatus(`Failed to load: ${error.message}`, true);
  }
}

document.getElementById("saveBtn").addEventListener("click", async () => {
  try {
    await sendMessage({
      type: "POPUP_SAVE_SETTINGS",
      monitoringEnabled: monitorToggle.checked,
      approvalEndpoint: approvalEndpoint.value,
      approvalApiKey: approvalApiKey.value
    });
    setStatus("Settings saved");
  } catch (error) {
    setStatus(`Save failed: ${error.message}`, true);
  }
});

document.getElementById("approveBtn").addEventListener("click", async () => {
  try {
    await sendMessage({ type: "MANUAL_APPROVE_LATEST" });
    setStatus("Approved and clicked");
  } catch (error) {
    setStatus(`Approval failed: ${error.message}`, true);
  }
});

document.getElementById("telegramBtn").addEventListener("click", async () => {
  try {
    await sendMessage({ type: "TELEGRAM_TEST" });
    setStatus("Telegram test message sent");
  } catch (error) {
    setStatus(`Telegram test failed: ${error.message}`, true);
  }
});

document.getElementById("testBtn").addEventListener("click", async () => {
  try {
    await chrome.notifications.create({
      type: "basic",
      iconUrl: "icons/icon128.png",
      title: "Attendance available",
      message: "Test notification from popup UI",
      priority: 1
    });
    setStatus("Browser notification sent");
  } catch (error) {
    setStatus(`Test failed: ${error.message}`, true);
  }
});

hydrateState();