importScripts("config.js", "sharedConfig.js");

const runtimeState = {
  latestDetection: null,
  detectionCache: new Map(),
  lastTelegramUpdateId: 0
};

function readStorage(keys) {
  return new Promise((resolve) => chrome.storage.local.get(keys, resolve));
}

function writeStorage(data) {
  return new Promise((resolve) => chrome.storage.local.set(data, resolve));
}

async function getSettings() {
  const values = await readStorage([
    SHARED_CONFIG.STORAGE_KEYS.MONITORING_ENABLED,
    SHARED_CONFIG.STORAGE_KEYS.APPROVAL_ENDPOINT,
    SHARED_CONFIG.STORAGE_KEYS.APPROVAL_API_KEY,
    SHARED_CONFIG.STORAGE_KEYS.LAST_DETECTED_POPUP_ID,
    SHARED_CONFIG.STORAGE_KEYS.LAST_TELEGRAM_UPDATE_ID
  ]);

  runtimeState.lastTelegramUpdateId = values[SHARED_CONFIG.STORAGE_KEYS.LAST_TELEGRAM_UPDATE_ID] ?? 0;

  return {
    monitoringEnabled: values[SHARED_CONFIG.STORAGE_KEYS.MONITORING_ENABLED] ?? true,
    approvalEndpoint: values[SHARED_CONFIG.STORAGE_KEYS.APPROVAL_ENDPOINT] || "",
    approvalApiKey: values[SHARED_CONFIG.STORAGE_KEYS.APPROVAL_API_KEY] || "",
    lastDetectedPopupId: values[SHARED_CONFIG.STORAGE_KEYS.LAST_DETECTED_POPUP_ID] || ""
  };
}

function hasTelegramConfig() {
  return Boolean(CONFIG?.TELEGRAM_BOT_TOKEN && CONFIG?.CHAT_ID);
}

async function sendTelegramMessage(text) {
  if (!hasTelegramConfig()) return;

  try {
    const response = await fetch(`https://api.telegram.org/bot${CONFIG.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        chat_id: CONFIG.CHAT_ID,
        text
      })
    });

    if (!response.ok) {
      console.warn("[AttendanceMonitor] Telegram send failed", response.status);
    }
  } catch (error) {
    console.warn("[AttendanceMonitor] Telegram send error", error?.message || error);
  }
}

async function notifyAttendanceDetected(payload) {
  const message = `Attendance available (${payload.countdownText})`;
  await chrome.notifications.create({
    type: "basic",
    iconUrl: "icons/icon128.png",
    title: "Attendance available",
    message,
    priority: 2
  });

  await sendTelegramMessage(
    `🚨 Attendance available\n⏳ ${payload.countdownText}\n🧠 Reply with "approve" to mark attendance.`
  );
}

function isDuplicatePopup(popupId) {
  const now = Date.now();
  const existing = runtimeState.detectionCache.get(popupId);
  if (existing && now - existing < SHARED_CONFIG.DETECTION.POPUP_COOLDOWN_MS) {
    return true;
  }
  runtimeState.detectionCache.set(popupId, now);
  return false;
}

async function sendDetectionToApprovalServer(payload, settings) {
  if (!settings.approvalEndpoint) return;

  try {
    const response = await fetch(`${settings.approvalEndpoint.replace(/\/$/, "")}/events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(settings.approvalApiKey ? { "x-api-key": settings.approvalApiKey } : {})
      },
      body: JSON.stringify({
        event: "attendance_popup_detected",
        payload
      })
    });

    if (!response.ok) {
      console.warn("[AttendanceMonitor] Failed to push event", response.status);
    }
  } catch (error) {
    console.warn("[AttendanceMonitor] Approval event push failed", error?.message || error);
  }
}

async function handlePopupDetected(payload, sender) {
  const settings = await getSettings();
  if (!settings.monitoringEnabled) return;

  if (!payload?.popupId || isDuplicatePopup(payload.popupId)) {
    return;
  }

  runtimeState.latestDetection = {
    ...payload,
    tabId: sender.tab?.id,
    approved: false
  };

  await writeStorage({
    [SHARED_CONFIG.STORAGE_KEYS.LAST_DETECTED_POPUP_ID]: payload.popupId
  });

  await notifyAttendanceDetected(payload);
  await sendDetectionToApprovalServer(runtimeState.latestDetection, settings);
}

async function executeApprovalOnTab(trigger = "manual") {
  const detection = runtimeState.latestDetection;
  if (!detection?.tabId) return { ok: false, reason: "No pending popup/tab" };

  try {
    const response = await chrome.tabs.sendMessage(detection.tabId, {
      type: "EXECUTE_MARK_ATTENDANCE"
    });

    if (response?.ok) {
      runtimeState.latestDetection.approved = true;
      await chrome.notifications.create({
        type: "basic",
        iconUrl: "icons/icon128.png",
        title: "Attendance approved",
        message: "Approval received. Attendance button clicked.",
        priority: 2
      });

      await sendTelegramMessage(`✅ Attendance marked (${trigger}).`);
      return { ok: true };
    }

    return { ok: false, reason: response?.reason || "Unknown content response" };
  } catch (error) {
    return { ok: false, reason: error?.message || String(error) };
  }
}

async function pollForMobileApproval() {
  const settings = await getSettings();
  if (!settings.approvalEndpoint || !runtimeState.latestDetection || runtimeState.latestDetection.approved) {
    return;
  }

  try {
    const response = await fetch(`${settings.approvalEndpoint.replace(/\/$/, "")}/approvals/latest`, {
      headers: settings.approvalApiKey ? { "x-api-key": settings.approvalApiKey } : {}
    });

    if (!response.ok) {
      console.warn("[AttendanceMonitor] Approval poll non-OK", response.status);
      return;
    }

    const data = await response.json();
    const isApproved = data?.approve === true;
    const matchesPopup = !data?.popupId || data.popupId === runtimeState.latestDetection.popupId;

    if (isApproved && matchesPopup) {
      await executeApprovalOnTab("api");
    }
  } catch (error) {
    console.warn("[AttendanceMonitor] Approval poll failed", error?.message || error);
  }
}

async function pollTelegramCommands() {
  if (!hasTelegramConfig()) return;

  const offset = runtimeState.lastTelegramUpdateId + 1;

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${CONFIG.TELEGRAM_BOT_TOKEN}/getUpdates?timeout=0&offset=${offset}`
    );

    if (!response.ok) {
      console.warn("[AttendanceMonitor] Telegram poll failed", response.status);
      return;
    }

    const data = await response.json();
    if (!Array.isArray(data?.result)) return;

    for (const update of data.result) {
      runtimeState.lastTelegramUpdateId = Math.max(runtimeState.lastTelegramUpdateId, update.update_id);

      const incomingChatId = String(update?.message?.chat?.id || "");
      const expectedChatId = String(CONFIG.CHAT_ID);
      if (!incomingChatId || incomingChatId !== expectedChatId) {
        continue;
      }

      const text = (update?.message?.text || "").trim().toLowerCase();
      if (!text) continue;

      if (text === "approve" || text === "/approve" || text === "mark") {
        const result = await executeApprovalOnTab("telegram");
        if (!result.ok) {
          await sendTelegramMessage(`❌ Approval failed: ${result.reason}`);
        }
      }

      if (text === "status" || text === "/status") {
        if (runtimeState.latestDetection && !runtimeState.latestDetection.approved) {
          await sendTelegramMessage(
            `🟡 Pending attendance popup\n⏳ ${runtimeState.latestDetection.countdownText}\nReply "approve" to mark.`
          );
        } else {
          await sendTelegramMessage("✅ No pending attendance popup right now.");
        }
      }
    }

    await writeStorage({
      [SHARED_CONFIG.STORAGE_KEYS.LAST_TELEGRAM_UPDATE_ID]: runtimeState.lastTelegramUpdateId
    });
  } catch (error) {
    console.warn("[AttendanceMonitor] Telegram polling error", error?.message || error);
  }
}

chrome.runtime.onInstalled.addListener(async () => {
  const settings = await getSettings();
  await writeStorage({
    [SHARED_CONFIG.STORAGE_KEYS.MONITORING_ENABLED]: settings.monitoringEnabled
  });

  chrome.alarms.create("poll-approval", {
    periodInMinutes: SHARED_CONFIG.APPROVAL.POLL_INTERVAL_MINUTES
  });

  chrome.alarms.create("poll-telegram", {
    periodInMinutes: SHARED_CONFIG.TELEGRAM.POLL_INTERVAL_MINUTES
  });
});

chrome.runtime.onStartup.addListener(() => {
  chrome.alarms.create("poll-approval", {
    periodInMinutes: SHARED_CONFIG.APPROVAL.POLL_INTERVAL_MINUTES
  });

  chrome.alarms.create("poll-telegram", {
    periodInMinutes: SHARED_CONFIG.TELEGRAM.POLL_INTERVAL_MINUTES
  });
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === "poll-approval") {
    await pollForMobileApproval();
  }

  if (alarm.name === "poll-telegram") {
    await pollTelegramCommands();
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "ATTENDANCE_POPUP_DETECTED") {
    handlePopupDetected(request.payload, sender)
      .then(() => sendResponse({ ok: true }))
      .catch((error) => sendResponse({ ok: false, reason: error?.message || String(error) }));
    return true;
  }

  if (request.type === "POPUP_GET_STATE") {
    getSettings()
      .then((settings) =>
        sendResponse({ ok: true, settings, latestDetection: runtimeState.latestDetection, telegramEnabled: hasTelegramConfig() })
      )
      .catch((error) => sendResponse({ ok: false, reason: error?.message || String(error) }));
    return true;
  }

  if (request.type === "POPUP_SAVE_SETTINGS") {
    const nextSettings = {
      [SHARED_CONFIG.STORAGE_KEYS.MONITORING_ENABLED]: Boolean(request.monitoringEnabled),
      [SHARED_CONFIG.STORAGE_KEYS.APPROVAL_ENDPOINT]: request.approvalEndpoint?.trim() || "",
      [SHARED_CONFIG.STORAGE_KEYS.APPROVAL_API_KEY]: request.approvalApiKey?.trim() || ""
    };

    writeStorage(nextSettings)
      .then(async () => {
        const tabs = await chrome.tabs.query({ url: "*://*.example-website.com/*" });
        await Promise.all(
          tabs.map((tab) =>
            chrome.tabs
              .sendMessage(tab.id, {
                type: "MONITORING_UPDATED",
                enabled: Boolean(request.monitoringEnabled)
              })
              .catch(() => undefined)
          )
        );
        sendResponse({ ok: true });
      })
      .catch((error) => sendResponse({ ok: false, reason: error?.message || String(error) }));

    return true;
  }

  if (request.type === "MANUAL_APPROVE_LATEST") {
    executeApprovalOnTab("popup")
      .then((result) => sendResponse(result))
      .catch((error) => sendResponse({ ok: false, reason: error?.message || String(error) }));
    return true;
  }

  if (request.type === "TELEGRAM_TEST") {
    sendTelegramMessage("✅ Telegram is connected to Attendance Monitor.")
      .then(() => sendResponse({ ok: true }))
      .catch((error) => sendResponse({ ok: false, reason: error?.message || String(error) }));
    return true;
  }

  return false;
});