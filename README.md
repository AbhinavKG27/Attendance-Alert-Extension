# 🎯 Attendance Alert — Smart Popup Automation Extension

> A production-grade Chrome Extension that detects attendance-marking popups on college portals in real time, auto-clicks the action button, and delivers instant Telegram notifications to your phone — with full remote-control support from your mobile.

---

## 📌 Overview

**Attendance Alert** is an event-driven browser automation tool built for students. It uses the browser's native `MutationObserver` API to watch the DOM in real time. The moment an attendance popup appears on your college portal, the extension:

1. Detects the popup via configurable CSS selectors
2. Identifies the correct action button using text pattern matching
3. Automatically clicks it (with smart debouncing to avoid double-actions)
4. Sends an instant alert to your phone via Telegram
5. Optionally accepts remote commands from your phone to trigger actions manually

The entire detection and automation logic is config-driven via `sharedConfig.js`, making it trivial to adapt the extension to any portal or LMS.

---

## ✨ Features

| Feature | Description |
|---|---|
| 🔍 **Real-time DOM Detection** | Watches for popup mutations using `MutationObserver` — no polling, zero delay |
| 🎛️ **Multi-selector Support** | Targets dialogs via `[role="dialog"]`, `.modal`, `.ant-modal`, `.MuiDialog-root`, `.ReactModal__Content`, and more |
| 🤖 **Auto-click with Debounce** | Finds and clicks the target button with a 300ms debounce to prevent duplicate triggers |
| 📱 **Telegram Notifications** | Sends real-time alerts to your phone the moment an action is taken |
| 📡 **Remote Command Execution** | Send `mark` from your Telegram; the extension executes the action remotely on your browser |
| 🛡️ **Cooldown System** | 60-second popup cooldown prevents spam alerts for repeated popups |
| ⏱️ **Timer Detection** | Parses countdown timers inside popups using regex (`sec`, `secs`, `min`, `mins`, etc.) |
| ⚙️ **Config-driven Architecture** | All detection logic lives in `sharedConfig.js` — swap portals without touching core code |
| 🔐 **Secure Credential Management** | API keys kept in a gitignored `config.js`; only `config.example.js` template is committed |
| 🌐 **Backend Server** | Node.js backend (`server.js`) handles Telegram webhook polling and relays commands to the extension |

---

## 🧠 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     CHROME EXTENSION                        │
│                                                             │
│  ┌─────────────┐    DOM Events    ┌──────────────────────┐  │
│  │  content.js │ ──────────────► │    MutationObserver  │  │
│  │             │                  │    Modal Detection   │  │
│  │  Injected   │ ◄─────────────  │    Button Click      │  │
│  │  into page  │   Execute cmd   └──────────────────────┘  │
│  └──────┬──────┘                                            │
│         │ chrome.runtime.sendMessage                        │
│  ┌──────▼──────┐                                            │
│  │background.js│ ──── Telegram Bot API ──► 📱 Your Phone   │
│  │             │ ◄─── Remote Command  ───  send "mark"     │
│  └─────────────┘                                            │
└─────────────────────────────────────────────────────────────┘
         ▲
         │  HTTP / Webhook
┌────────┴────────┐
│   backend/      │
│   server.js     │  ← Node.js server (optional, for polling)
└─────────────────┘
```

### Flow

1. `content.js` is injected into the target college portal (matched by `TARGET_HOST_KEYWORD` in `sharedConfig.js`)
2. A `MutationObserver` watches for any new nodes matching the configured `MODAL_SELECTORS`
3. When a popup appears, the extension scans visible buttons for text matching `BUTTON_TEXT_PATTERN`
4. After a `SCAN_DEBOUNCE_MS` (300ms) debounce, it clicks the button and waits `RECHECK_VISIBLE_MS` (1500ms) to confirm
5. `background.js` calls the Telegram Bot API to send you a notification
6. A `POPUP_COOLDOWN_MS` (60 seconds) lockout prevents repeated triggers for the same popup
7. If you send `mark` from Telegram, the backend server relays the command to `background.js`, which messages `content.js` to trigger the action manually

---

## 📁 Project Structure

```
attendance-alert/
├── backend/
│   └── server.js            # Node.js server — Telegram webhook polling & command relay
│
├── icons/                   # Extension icons (16×16, 48×48, 128×128)
│
├── manifest.json            # Chrome Extension Manifest V3
├── background.js            # Service worker — Telegram API calls, remote command handler
├── content.js               # Injected script — MutationObserver, popup detection, auto-click
├── sharedConfig.js          # ⚙️  Public config: selectors, patterns, timings (committed)
├── config.js                # 🔐 Private credentials: Bot Token, Chat ID (gitignored)
├── config.example.js        # Template for config.js — safe to commit
├── popup.html               # Extension popup UI
├── popup.js                 # Popup logic — status display, settings
├── styles.css               # Popup styling
└── .gitignore               # Ensures config.js is never committed
```

---

## ⚙️ Configuration Reference (`sharedConfig.js`)

```javascript
const SHARED_CONFIG = {
  TARGET_HOST_KEYWORD: "example-website.com",   // Hostname to activate the extension on

  DETECTION: {
    MODAL_SELECTORS: [                           // CSS selectors that match popups/dialogs
      '[role="dialog"]',
      '.modal',
      '.ant-modal',
      '.MuiDialog-root',
      '.ReactModal__Content'
    ],
    BUTTON_TEXT_PATTERN: /mark\s+your\s+attendance/i,   // Regex to identify the target button
    TIMER_PATTERN: /(\d{1,2}:\d{2}|\d+\s*(sec|secs|second|seconds|min|mins|minute|minutes))/i,
    SCAN_DEBOUNCE_MS: 300,       // Wait before scanning after popup appears
    RECHECK_VISIBLE_MS: 1500,   // Re-verify popup is still visible before clicking
    POPUP_COOLDOWN_MS: 60000    // Cooldown between successive alerts (1 minute)
  },

  APPROVAL: { ... }             // Approval flow config (if applicable)
};
```

To adapt the extension to a different portal, only `sharedConfig.js` needs to be edited — no core logic changes required.

---

## 🚀 Setup Instructions

### Prerequisites

- Google Chrome or any Chromium-based browser
- Node.js (for the optional backend server)
- A Telegram account + bot

---

### 1. Clone the Repository

```bash
git clone https://github.com/AbhinavKG27/Attendance-Alert-Extension.git
cd Attendance-Alert-Extension
```

---

### 2. Create Your Telegram Bot

1. Open Telegram → search **[@BotFather](https://t.me/BotFather)**
2. Run `/newbot` and follow the prompts
3. Copy the **Bot Token**
4. Get your **Chat ID** from **[@userinfobot](https://t.me/userinfobot)** or via:

```
https://api.telegram.org/bot<YOUR_TOKEN>/getUpdates
```

---

### 3. Add Your Credentials

Create `config.js` in the project root (it is gitignored — never committed):

```javascript
// config.js  ← DO NOT COMMIT THIS FILE
const CONFIG = {
  TELEGRAM_BOT_TOKEN: "YOUR_BOT_TOKEN_HERE",
  CHAT_ID: "YOUR_CHAT_ID_HERE"
};
```

Use `config.example.js` as the reference template.

---

### 4. Configure the Target Site

Open `sharedConfig.js` and set `TARGET_HOST_KEYWORD` to match your college portal's domain:

```javascript
TARGET_HOST_KEYWORD: "your-college-portal.edu",
```

Adjust `MODAL_SELECTORS` and `BUTTON_TEXT_PATTERN` to match your portal's popup structure if needed.

---

### 5. Load the Extension in Chrome

1. Open Chrome → navigate to `chrome://extensions/`
2. Enable **Developer Mode** (top-right toggle)
3. Click **Load Unpacked**
4. Select the project root folder

The extension icon will appear in your toolbar.

---

### 6. (Optional) Run the Backend Server

The backend enables **remote command execution** from your Telegram:

```bash
cd backend
npm install
node server.js
```

Once running, send `mark` from your Telegram chat to trigger the attendance action remotely from your phone.

---

## 📱 Usage

### Automatic Mode

> Just open your college portal — the extension handles everything.

1. Navigate to your attendance portal
2. When the popup appears, `content.js` detects it within milliseconds
3. The button is clicked automatically after the debounce period
4. You receive a Telegram notification confirming the action

### Remote Mode

> Trigger attendance marking from your phone without even sitting at your computer.

1. Ensure the backend server is running (`node backend/server.js`)
2. Open your college portal in Chrome (extension must be active)
3. Send the message `mark` to your Telegram bot
4. The extension receives the command and executes the action
5. You receive a confirmation notification

---

## 🔒 Security

- All credentials live exclusively in `config.js`, which is listed in `.gitignore`
- Only the `config.example.js` template (with placeholder values) is ever committed
- No API keys, tokens, or chat IDs are exposed in the public repository
- `sharedConfig.js` contains only non-sensitive structural configuration

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Extension Platform | Chrome Extensions — Manifest V3 |
| DOM Monitoring | `MutationObserver` API (native browser) |
| Scripting | Vanilla JavaScript (ES6+) |
| UI | HTML5 + CSS3 |
| Notifications | Telegram Bot API |
| Background Tasks | Chrome Service Worker (`background.js`) |
| Backend Server | Node.js (`backend/server.js`) |

---

## 📈 Roadmap

- [ ] Enable / Disable toggle in popup UI
- [ ] Sound alert on popup detection
- [ ] Event log dashboard (history of triggered actions)
- [ ] Multi-site profiles (switch between portals easily)
- [ ] Chrome Web Store release

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch — `git checkout -b feature/your-feature`
3. Commit your changes — `git commit -m "feat: describe your change"`
4. Push — `git push origin feature/your-feature`
5. Open a Pull Request

---

## 👤 Author

**Abhinav KG**
- GitHub: [@AbhinavKG27](https://github.com/AbhinavKG27)

---

> ⭐ If this saved you from an attendance shortfall, consider starring the repo!