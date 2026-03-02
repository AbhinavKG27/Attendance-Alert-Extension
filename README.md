# 📋 Attendance Alert Extension

A Chrome browser extension that monitors attendance pop-ups on your college/university portal and instantly sends you a Telegram notification — so you never miss an attendance alert, even when you're away from the tab.

---

## ✨ Features

- 🔍 Automatically detects attendance pop-ups on your portal
- 📲 Sends real-time alerts to your Telegram account or group
- 🧩 Lightweight and runs silently in the background
- ⚡ Works as a Chrome Manifest V3 extension

---

## 🗂️ Project Structure

```
Attendance-Alert-Extension/
├── icons/              # Extension icons
├── background.js       # Service worker — handles Telegram API calls
├── content.js          # Injected into the page to detect attendance pop-ups
├── manifest.json       # Chrome Extension manifest (MV3)
├── popup.html          # Extension popup UI
├── popup.js            # Popup logic
├── styles.css          # Popup styling
├── config.js           # ⚠️ YOU MUST CREATE THIS (see setup below)
└── .gitignore
```

---

## 🚀 Setup & Installation

### 1. Clone the Repository

```bash
git clone https://github.com/AbhinavKG27/Attendance-Alert-Extension.git
cd Attendance-Alert-Extension
```

### 2. Create a Telegram Bot

1. Open Telegram and search for **@BotFather**
2. Send `/newbot` and follow the prompts
3. Copy the **Bot Token** you receive
4. Start a chat with your bot, then visit:
   ```
   https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates
   ```
5. Send a message to your bot and refresh the URL — copy your **Chat ID** from the response

### 3. Create `config.js` ⚠️

In the root of the project, create a file called **`config.js`** and add the following:

```js
const CONFIG = {
  TELEGRAM_BOT_TOKEN: "YOUR_REAL_TOKEN_HERE",
  CHAT_ID: "YOUR_CHAT_ID"
};
```

> **⚠️ Important:** Never commit `config.js` to a public repository. It is already listed in `.gitignore` to keep your credentials safe.

### 4. Load the Extension in Chrome

1. Open Chrome and go to `chrome://extensions/`
2. Enable **Developer Mode** (toggle in the top-right corner)
3. Click **"Load unpacked"**
4. Select the `Attendance-Alert-Extension` folder
5. The extension is now active! 🎉

---

## 🔧 How It Works

| File | Role |
|------|------|
| `content.js` | Runs on your college portal page, watches for attendance-related pop-ups using DOM observation |
| `background.js` | Receives messages from `content.js` and calls the Telegram Bot API to send you a notification |
| `popup.html / popup.js` | A small UI accessible from the extension icon in your toolbar |
| `config.js` | Stores your Telegram credentials securely (not tracked by git) |

---

## 🛡️ Security Notes

- Your `config.js` file containing the bot token and chat ID is excluded from version control via `.gitignore`
- Never share your bot token publicly — anyone with it can send messages through your bot
- Consider restricting your bot using Telegram's privacy settings

---

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Open an [issue](https://github.com/AbhinavKG27/Attendance-Alert-Extension/issues) for bugs or feature requests
- Submit a pull request with improvements

---

## 📄 License

This project is open source. Feel free to use and modify it for personal use.

---

## 👤 Author

**Abhinav KG**  
[GitHub @AbhinavKG27](https://github.com/AbhinavKG27)