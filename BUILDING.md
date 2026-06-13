# EcoTrace — Build Journey

## 📖 The Story

I built EcoTrace because most people *want* to live greener but have no idea where their carbon emissions actually come from. They hear "reduce energy consumption" but don't know whether to prioritise transport, diet, or shopping.

**The Goal**: Make carbon footprint tangible, personal, and actionable.

## 🛠️ Technology Decisions

### Frontend: Vanilla HTML/CSS/JavaScript + Tailwind CSS

**Why not React/Vue?**
- Hackathon timeline — ship fast
- No complex state management needed
- Smaller bundle size → faster load
- Tailwind CSS handles styling elegantly

### Backend: Firebase (Auth + Firestore)

**Why Firebase?**
- Serverless — no backend server to manage
- Real-time Firestore sync — multi-device updates instantly
- Free tier — perfect for hackathon
- Built-in Auth — no custom authentication needed
- Firebase Hosting — CDN-backed, auto-HTTPS, one-command deploy

### AI Integration: Claude API

**Why Claude?**
- Best reasoning for personalised insights (not generic "use less energy")
- Structured JSON output prevents hallucination
- Cost-effective token-based pricing

```javascript
// User breakdown: {transport: 50kg, energy: 80kg, diet: 5kg, shopping: 0kg}
// Claude generates 3 specific, personalised tips with impact estimates
// e.g. "Replace 2 car trips/week with bus → saves ~8.5kg CO₂/week"
```

### Visualization: Chart.js

- Lightweight, no extra dependencies
- Doughnut chart for emission breakdown by category
- Interactive tooltips and fully responsive

## 🎨 Design Decisions

### Dark Theme + Glassmorphism

- Reduces eye strain for evening use
- Modern aesthetic aligned with eco/nature vibe
- Glassmorphism conveys "transparency" — fitting for a carbon tracker

```css
.card {
  backdrop-filter: blur(10px);
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.05);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}
```

**Colour Palette**:
- Deep slate (`#0f172a`) — calming, nature-inspired
- Emerald green (`#10b981`) — eco/growth
- Teal (`#14b8a6`) — water, freshness

## 🎮 Gamification Strategy

**Why badges?**
- Humans are motivated by progress and recognition
- Users return to unlock the next badge
- Badge unlocks encourage social sharing

**Badge Design**:
1. Easy wins (first 7 days) → "Week Warrior"
2. Habit building → "Carbon Conscious" (50kg reduction)
3. Lifestyle changes → "Green Plate", "Carbon Cutter"
4. Mastery → "Action Addict" (50 actions)

## 📊 Emission Factors

**Sources**:
- IEA (International Energy Agency): India grid carbon intensity (0.82 kg CO₂/kWh)
- IPCC: Vehicle emissions, fuel factors
- Carbon Trust: Clothing/shopping emissions

**Why India-specific?**
- Indian grid is coal-heavy (higher factor than US/EU)
- Transport patterns differ (more public transit)

## 🎯 Key Learnings

### What Went Well
1. Firebase Firestore real-time sync — seamless multi-device updates
2. Tailwind CSS — rapid styling with consistent design system
3. Claude API for insights — personalised tips feel intelligent, not generic
4. Gamification — badge unlocks are surprisingly motivating
5. Vanilla JS — shipping fast without framework overhead

### Challenges & Solutions

**Challenge: Precise Carbon Calculations**
→ Used India-specific factors from IEA, added source comments

**Challenge: Claude API Prompt Engineering**
→ Fed actual category breakdown + percentages → Claude generates specific tips

**Challenge: Mobile Responsiveness**
→ Chart.js responsive option + Tailwind `sm:` breakpoints

## 🏆 Hackathon Submission

- **GitHub**: https://github.com/abhishayyy/ecotrace
- **Deployed App**: [App URL]
- **LinkedIn Post**: [Post URL]

---

**Questions or Feedback?** Open an issue on GitHub!
