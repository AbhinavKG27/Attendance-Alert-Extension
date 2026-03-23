# 🎯 Smart Popup Automation Extension (Chrome)

A powerful Chrome Extension that detects dynamic popup events on web applications and performs automated actions such as clicking buttons and sending real-time mobile alerts.

---

## 🚀 Features

* 🔍 Real-time popup detection using DOM MutationObserver
* 🤖 Automatic action (e.g., button click) when target popup appears
* 📱 Instant mobile notifications via Telegram Bot
* 📡 Remote control: trigger actions from your phone
* 🛡️ Anti-spam protection with cooldown system
* ⚙️ Config-driven architecture (easy to customize)
* 🌐 Works across multiple websites (configurable)

---

## 🧠 How It Works

1. The extension monitors the webpage DOM in real-time
2. When a popup or UI element containing specific keywords appears
3. It detects visible elements and identifies actionable buttons
4. Automatically performs the action (like clicking a button)
5. Sends an alert to your mobile via Telegram

Additionally:

* You can send commands (e.g., `mark`) from your phone
* The extension will execute actions remotely on your browser

---

## 🛠️ Tech Stack

* JavaScript (Vanilla)
* Chrome Extension (Manifest V3)
* DOM MutationObserver API
* Telegram Bot API
* HTML & CSS (UI)

---

## 📁 Project Structure

```
attendance-alert/
├── manifest.json
├── background.js
├── content.js
├── sharedConfig.js       # Public configuration (site, keywords)
├── config.js             # Private credentials (ignored)
├── config.example.js     # Template for setup
├── popup.html
├── popup.js
├── icons/
└── .gitignore
```

---

## ⚙️ Setup Instructions

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/attendance-alert.git
cd attendance-alert
```

---

### 2️⃣ Add Your Telegram Credentials

Create a file:

```
config.js
```

Paste:

```javascript
const CONFIG = {
  TELEGRAM_BOT_TOKEN: "YOUR_BOT_TOKEN",
  CHAT_ID: "YOUR_CHAT_ID"
};
```

⚠️ This file is ignored by Git and should NOT be shared.

---

### 3️⃣ Load Extension in Chrome

1. Open Chrome
2. Go to:

```
chrome://extensions/
```

3. Enable **Developer Mode**
4. Click **Load Unpacked**
5. Select your project folder

---

## 📱 Telegram Bot Setup

1. Open Telegram → search **@BotFather**
2. Create a bot using `/newbot`
3. Copy the Bot Token
4. Send a message to your bot
5. Get your Chat ID using:

```
https://api.telegram.org/bot<TOKEN>/getUpdates
```

---

## 🎮 Usage

### Automatic Mode

* When a popup with configured keywords appears
* The extension automatically performs the action
* You receive a mobile alert

### Remote Mode

Send a message from your phone:

```
mark
```

➡️ The extension will trigger the action remotely
➡️ You receive confirmation

---

## 🔒 Security

* Sensitive data stored in `config.js`
* `config.js` excluded via `.gitignore`
* No API keys exposed in public repository

---

## ⚙️ Customization

Edit `sharedConfig.js`:

```javascript
const SHARED_CONFIG = {
  TARGET_SITE: "example.com",
  KEYWORDS: ["keyword1", "keyword2"]
};
```

You can:

* Change target website
* Modify detection keywords
* Reuse extension for different platforms

---

## 📈 Future Enhancements

* 🔘 Enable/Disable toggle
* 🔊 Sound alert system
* 📊 Event logs dashboard
* 🌐 Multi-site support
* 🧩 Chrome Web Store publishing

---

## 👨‍💻 Author

Developed as a real-world automation tool demonstrating:

* Event-driven architecture
* Browser automation
* API integration
* Remote command execution

---

## ⭐ Support

If you found this project useful, consider giving it a ⭐ on GitHub!
