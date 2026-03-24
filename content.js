(() => {
  const state = {
    monitoringEnabled: true,
    observer: null,
    popupDetected: false,
    lastPopupId: null,
    debounceTimer: null,
    visibilityTimer: null
  };

  const debug = (...args) => console.log("[AttendanceMonitor]", ...args);

  function isVisible(el) {
    if (!el) return false;
    const rect = el.getBoundingClientRect();
    const style = window.getComputedStyle(el);
    return (
      style.display !== "none" &&
      style.visibility !== "hidden" &&
      style.opacity !== "0" &&
      rect.width > 0 &&
      rect.height > 0
    );
  }

  function getCandidateModals() {
    const selectors = SHARED_CONFIG.DETECTION.MODAL_SELECTORS.join(",");
    return Array.from(document.querySelectorAll(selectors)).filter(isVisible);
  }

  function extractPopupInfo(modal) {
    const button = Array.from(modal.querySelectorAll("button, [role='button']")).find((node) =>
      SHARED_CONFIG.DETECTION.BUTTON_TEXT_PATTERN.test(node.textContent || "")
    );

    if (!button || !isVisible(button)) {
      return null;
    }

    const contentText = (modal.innerText || "").replace(/\s+/g, " ").trim();
    const timerMatch = contentText.match(SHARED_CONFIG.DETECTION.TIMER_PATTERN);
    const countdownText = timerMatch ? timerMatch[1] : "Timer not detected";

    return {
      button,
      countdownText,
      popupId: `${location.pathname}|${countdownText}|${button.textContent.trim()}`
    };
  }

  function detectAttendancePopup() {
    const modals = getCandidateModals();
    for (const modal of modals) {
      const info = extractPopupInfo(modal);
      if (info) return info;
    }
    return null;
  }

  function sendDetection(info) {
    chrome.runtime.sendMessage(
      {
        type: "ATTENDANCE_POPUP_DETECTED",
        payload: {
          popupId: info.popupId,
          countdownText: info.countdownText,
          pageUrl: location.href,
          detectedAt: new Date().toISOString()
        }
      },
      () => {
        if (chrome.runtime.lastError) {
          debug("Failed to deliver popup message:", chrome.runtime.lastError.message);
        }
      }
    );
  }

  function runScan(source = "mutation") {
    if (!state.monitoringEnabled) return;

    const info = detectAttendancePopup();
    if (!info) {
      state.popupDetected = false;
      state.lastPopupId = null;
      return;
    }

    const isNewPopup = info.popupId !== state.lastPopupId;
    if (!state.popupDetected || isNewPopup) {
      state.popupDetected = true;
      state.lastPopupId = info.popupId;
      debug(`Popup detected from ${source}`, info.popupId, info.countdownText);
      sendDetection(info);
    }
  }

  function scheduleScan(source) {
    if (state.debounceTimer) clearTimeout(state.debounceTimer);
    state.debounceTimer = setTimeout(() => runScan(source), SHARED_CONFIG.DETECTION.SCAN_DEBOUNCE_MS);
  }

  function attachObserver() {
    if (state.observer) state.observer.disconnect();

    state.observer = new MutationObserver(() => {
      scheduleScan("mutation");
    });

    state.observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["class", "style", "aria-hidden"]
    });

    debug("MutationObserver attached");
  }

  function setupSpaNavigationListener() {
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function (...args) {
      originalPushState.apply(this, args);
      scheduleScan("pushState");
    };

    history.replaceState = function (...args) {
      originalReplaceState.apply(this, args);
      scheduleScan("replaceState");
    };

    window.addEventListener("popstate", () => scheduleScan("popstate"));
  }

  function clickAttendanceButton() {
    const info = detectAttendancePopup();
    if (!info) {
      return { ok: false, reason: "Attendance popup/button not found" };
    }

    info.button.click();
    return { ok: true, countdownText: info.countdownText, popupId: info.popupId };
  }

  chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
    if (request.type === "MONITORING_UPDATED") {
      state.monitoringEnabled = Boolean(request.enabled);
      debug("Monitoring state updated:", state.monitoringEnabled);
      if (state.monitoringEnabled) {
        scheduleScan("monitoring-enabled");
      }
      sendResponse({ ok: true });
      return true;
    }

    if (request.type === "EXECUTE_MARK_ATTENDANCE") {
      const result = clickAttendanceButton();
      sendResponse(result);
      return true;
    }

    return false;
  });

  chrome.storage.local.get([SHARED_CONFIG.STORAGE_KEYS.MONITORING_ENABLED], (stored) => {
    state.monitoringEnabled = stored[SHARED_CONFIG.STORAGE_KEYS.MONITORING_ENABLED] ?? true;
    attachObserver();
    setupSpaNavigationListener();

    state.visibilityTimer = setInterval(() => {
      if (document.visibilityState === "visible") {
        scheduleScan("visibility-check");
      }
    }, SHARED_CONFIG.DETECTION.RECHECK_VISIBLE_MS);

    debug("Content script initialized", { monitoringEnabled: state.monitoringEnabled });
  });
})();