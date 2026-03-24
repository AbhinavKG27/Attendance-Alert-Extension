const SHARED_CONFIG = {
  TARGET_HOST_KEYWORD: "example-website.com",
  DETECTION: {
    MODAL_SELECTORS: [
      '[role="dialog"]',
      '.modal',
      '.ant-modal',
      '.MuiDialog-root',
      '.ReactModal__Content'
    ],
    BUTTON_TEXT_PATTERN: /mark\s+your\s+attendance/i,
    TIMER_PATTERN: /(\d{1,2}:\d{2}|\d+\s*(sec|secs|second|seconds|min|mins|minute|minutes))/i,
    SCAN_DEBOUNCE_MS: 300,
    RECHECK_VISIBLE_MS: 1500,
    POPUP_COOLDOWN_MS: 60000
  },
  APPROVAL: {
    POLL_INTERVAL_MINUTES: 0.2
  },
  TELEGRAM: {
    POLL_INTERVAL_MINUTES: 0.2
  },
  STORAGE_KEYS: {
    MONITORING_ENABLED: "monitoringEnabled",
    APPROVAL_ENDPOINT: "approvalEndpoint",
    APPROVAL_API_KEY: "approvalApiKey",
    LAST_DETECTED_POPUP_ID: "lastDetectedPopupId",
    LAST_TELEGRAM_UPDATE_ID: "lastTelegramUpdateId"
  }
};