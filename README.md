# EcoTrace — Carbon Footprint Awareness Platform

Track, understand, and reduce your carbon footprint with AI-powered insights.

## 🌱 Features

- **Carbon Calculator**: Track emissions from transport, energy, diet, and shopping
- **AI-Powered Insights**: Get personalized reduction tips via Claude API
- **Daily Action Logger**: Log green actions and build streaks
- **Gamification**: Unlock badges and earn points
- **Real-Time Sync**: Multi-device synchronization via Firestore
- **Mobile Responsive**: Works on all devices

## 🏗️ Architecture

- **Frontend**: Vanilla HTML/CSS/JavaScript + Tailwind CSS + Chart.js
- **Authentication**: Firebase Auth (email/password)
- **Database**: Firebase Cloud Firestore (real-time sync)
- **AI**: Claude API (Anthropic) for personalized insights
- **Hosting**: Firebase Hosting

## 🚀 Quick Start

### Prerequisites

- Firebase account (free tier available)
- Anthropic API key for Claude integration

### Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/abhishayyy/ecotrace.git
   cd ecotrace
   ```

2. **Configure Firebase**:
   - Go to https://console.firebase.google.com
   - Create a new project (enable Firestore + Authentication)
   - Create `firebase-config.js` from `firebase-config.template.js`
   - Paste your credentials into `firebase-config.js`

3. **Serve locally**:
   ```bash
   python -m http.server 8000
   # or
   npx http-server
   ```
   Open http://localhost:8000

4. **Deploy to Firebase Hosting**:
   ```bash
   npm install -g firebase-tools
   firebase login
   firebase init hosting
   firebase deploy
   ```

## 📊 Emission Factors

| Category | Metric | CO₂ Factor |
|----------|--------|-----------|
| Transport | Car km | 0.171 kg CO₂ |
| Transport | Bus km | 0.089 kg CO₂ |
| Transport | Flight km | 0.255 kg CO₂ |
| Energy | Electricity kWh | 0.82 kg CO₂ |
| Energy | LPG kg | 2.98 kg CO₂ |
| Diet | Meat meal | 3.0 kg CO₂ |
| Diet | Veg meal | 0.5 kg CO₂ |
| Shopping | New clothing item | 8.0 kg CO₂ |

*Factors sourced from IEA, IPCC, and India's grid carbon intensity.*

## 🎮 Gamification

Unlock badges by achieving milestones:

- 🌱 **Carbon Conscious**: Reduce 50kg CO₂ total
- 🔥 **Week Warrior**: Maintain 7-day action streak
- 🥗 **Green Plate**: Log 7 vegetarian meals in a week
- ✂️ **Carbon Cutter**: Achieve 20% week-over-week reduction
- ⭐ **Action Addict**: Complete 50 total green actions

## 🔐 Security

- Firebase credentials are **NOT** stored in Git (see `.gitignore`)
- Use `firebase-config.template.js` as a reference template
- Firestore rules enforce user-level data privacy

## 📦 Files Overview

```
ecotrace/
├── index.html                    # Main app structure
├── app.js                        # Core application logic
├── style.css                     # Dark theme + glassmorphism
├── calculations.js               # Carbon calculation logic
├── firebase-config.template.js   # Config template (no secrets)
├── firebase-config.js            # [IGNORED] Your actual credentials
├── .gitignore                    # Git ignore rules
├── README.md                     # This file
└── BUILDING.md                   # Build journey & learnings
```

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

## 🔗 Links

- **Live Demo**: [Deployed App URL]
- **GitHub Repo**: https://github.com/abhishayyy/ecotrace
- **Build Journey**: See [BUILDING.md](BUILDING.md)

---

**Built with ❤️ for the Hackathon — June 2026**
