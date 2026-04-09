<p align="center">
  <img src="Utils/Kisan Dost.png" alt="Kisan Dost Logo" width="150">
</p>

<h1 align="center">🌾 Kisan Dost — Smart Farming Advisory</h1>

<p align="center">
  <strong>AI-Powered, Offline-First Progressive Web App for Indian Farmers</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Gemini_AI-Powered-4285f4?style=for-the-badge&logo=google&logoColor=white" alt="Gemini AI">
  <img src="https://img.shields.io/badge/PWA-Offline_First-2D6A4F?style=for-the-badge&logo=pwa&logoColor=white" alt="PWA">
  <img src="https://img.shields.io/badge/Languages-4-F4A261?style=for-the-badge" alt="Multilingual">
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="License">
</p>

---

## 📋 Overview

**Kisan Dost** is a lightweight, offline-first Progressive Web App (PWA) designed for Indian farmers. It combines real-time weather data, Google Gemini AI-powered crop advisory, **offline voice assistance powered by WebML**, and a **custom FastAPI Crop Disease backend** — all accessible in **Hindi, Marathi, Bangla, and English**.

> 🎯 Built for low-bandwidth, rural environments — features an Auth-First flow and works seamlessly offline.

---

## ✨ Features

### 🌤️ Weather Intelligence
- **Real-time weather** via OpenWeatherMap API
- **5-day forecast** with farming-specific insights
- Temperature, humidity, wind speed, and rain probability
- Offline caching with stale-while-revalidate strategy

### 🤖 Gemini AI Advisory
- **Daily Actionable Insights** powered by Google Gemini 2.5 Flash
- AI analyzes real-time weather data + user context
- Returns specific, practical farming advice (e.g., *"Based on 32°C temp and low humidity, increase water by 20% today"*)
- Smart caching to minimize API calls

### 🎙️ Offline Voice Assistant
- **Hindi/Marathi/Bangla/English** voice input via **Transformers.js (Offline Whisper Model)**
- Processes speech entirely in-browser, zero data leaves your device
- Sends transcribed queries to AI and reads responses aloud
- Full conversation history in the AI tab

### 🌿 AI Crop Disease Scanner (FastAPI Backend)
- **Camera capture** or **photo upload** for plant disease detection
- Deep integration with a dedicated **FastAPI Python Backend**
- Uses **EfficientNetB4** for precise computer-vision crop analysis
- Returns: crop identification, disease name, severity, symptoms, treatment (organic + chemical), and prevention tips
- Clean "Diagnostic Card" with confidence scores

### 🏛️ Government Schemes
- PM-KISAN, PMFBY, KCC information
- Eligibility details and direct links
- Available in all supported languages

### 🌐 Multilingual Support
| Language | Code |
|----------|------|
| हिंदी (Hindi) | `hi` |
| मराठी (Marathi) | `mr` |
| বাংলা (Bengali) | `bn` |
| English | `en` |

### 📱 PWA Features
- **Offline-first** — works without internet
- **Installable** — add to home screen
- **Background sync** — auto-refreshes weather when connectivity returns
- **Service Worker** caching with TTL enforcement
- **Push notification** support (placeholder)

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Vanilla HTML5, CSS3, JavaScript (ES6+), PWA |
| **Backend** | FastAPI, Python, Uvicorn |
| **AI (Chat)** | Google Gemini 2.5 Flash API |
| **AI (Computer Vision)**| TensorFlow, EfficientNetB4 |
| **Speech (STT)** | Transformers.js (Xenova/whisper-tiny) |
| **Storage** | IndexedDB + localStorage |
| **PWA** | Service Worker, Web App Manifest |
| **Fonts** | Google Fonts (Inter) |
| **Design** | Glassmorphism, CSS Custom Properties |

---

## 📁 Project Structure

```
Kisan_Dost/
├── index.html              # Main Auth-First SPA shell
├── manifest.json           # PWA manifest
├── backend/
│   ├── app.py              # FastAPI Web Server
│   ├── model.py            # TF/Keras model inference
│   └── requirements.txt    # Python dependencies
├── css/
│   └── styles.css          # Glassmorphism design system
├── js/
│   ├── auth.js             # Authentication logic
│   ├── db.js               # IndexedDB wrapper
│   ├── i18n.js             # Internationalization
│   ├── weather.js          # OpenWeatherMap integration
│   ├── gemini.js           # Gemini AI service
│   ├── speech.js           # Whisper Offline STT + TTS
│   ├── crop-disease.js     # Camera scanner backend bridge
│   └── app.js              # Main app controller
├── lang/
│   ├── en.json, hi.json... # Translations
└── Utils/
    └── Kisan Dost.png      # App logo
```

---

## 🚀 Getting Started

### Prerequisites
- Any modern web browser (Chrome, Edge, Firefox)
- Node.js (optional, for local server)

### Run Locally

```bash
# Clone the repository
git clone https://github.com/Badal00043/Kisan_Dost.git
cd Kisan_Dost

# 1. Start the Backend
cd backend
pip install -r requirements.txt
python -m uvicorn app:app --host 0.0.0.0 --port 8000

# 2. Serve the Frontend
cd ..
python -m http.server 3000

# Open in browser: http://localhost:3000
```

### API Keys

The app uses two APIs (already configured):

| API | Purpose | Key Location |
|-----|---------|-------------|
| **OpenWeatherMap** | Weather data & forecasts | `js/weather.js` → `API_KEY` |
| **Google Gemini** | AI advisory, voice, crop scanner | `js/gemini.js` → `API_KEY` |

---

## 📱 App Screens

| Home | AI Advisory | Crop Scanner | Voice Assistant |
|------|------------|--------------|-----------------|
| Weather + Action Items | Gemini AI Insights | Camera/Upload Disease Detection | Hindi Voice Q&A |

---

## 🔧 Configuration

### Change Weather API Key
```javascript
// js/weather.js (line 10)
const API_KEY = 'your_openweathermap_api_key';
```

### Change Gemini API Key
```javascript
// js/gemini.js (line 7)
const API_KEY = 'your_gemini_api_key';
```

### Add a New Language
1. Create `lang/xx.json` with all translation keys
2. Add language code to `I18n.SUPPORTED` array in `js/i18n.js`
3. Add BCP-47 mapping in `js/speech.js` → `LANG_MAP`

---

## 🌍 Deployment

### GitHub Pages
```bash
# Push to main branch — enable Pages in repo settings
git push origin main
```

### Vercel / Netlify
Simply connect the GitHub repo — zero config needed for static sites.

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---

## 👨‍💻 Author

**Badal Kumar**
- GitHub: [@Badal00043](https://github.com/Badal00043)

---

<p align="center">
  Made with ❤️ for Indian Farmers 🇮🇳
</p>
