// EcoTrace — Badge Unlock Logic

/**
 * All badge definitions. Each badge has:
 *  - id: unique string key
 *  - title, icon, desc: display fields
 *  - check(state): returns true if badge should be unlocked
 */
export const ALL_BADGES = [
  {
    id: "calc-badge",
    title: "Carbon Analyst",
    icon: "📊",
    desc: "Calculate your initial carbon footprint.",
    check: (state) => state.data.calculated === true
  },
  {
    id: "streak-3",
    title: "Consistent Cutter",
    icon: "🔥",
    desc: "Log daily actions for 3 days in a row.",
    check: (state) => state.data.streak >= 3
  },
  {
    id: "save-50",
    title: "Carbon Crusher",
    icon: "💥",
    desc: "Save more than 50 kg CO₂e in cumulative daily actions.",
    check: (state) => {
      const total = (state.data.dailyActionsLog || [])
        .reduce((sum, entry) => sum + (entry.savedKg || 0), 0);
      return total >= 50;
    }
  },
  {
    id: "vegan-hero",
    title: "Plant-Power Champ",
    icon: "🥦",
    desc: "Log 5 plant-based meals across your action history.",
    check: (state) => {
      const count = (state.data.dailyActionsLog || [])
        .filter(entry => entry.actions && entry.actions.includes("plant-meal"))
        .length;
      return count >= 5;
    }
  },
  {
    id: "transit-hero",
    title: "Green Commuter",
    icon: "🚲",
    desc: "Log walking/cycling or public transit 5 times.",
    check: (state) => {
      const count = (state.data.dailyActionsLog || [])
        .filter(entry => entry.actions &&
          (entry.actions.includes("public-transit") || entry.actions.includes("walk-cycle")))
        .length;
      return count >= 5;
    }
  },
  {
    id: "quiz-expert",
    title: "Climate Intellectual",
    icon: "🧠",
    desc: "Score a perfect 5/5 on the Eco Quiz.",
    check: (state) => state.data.quizPerfectScore === true
  }
];

/**
 * Checks all badges against current state and returns newly unlocked badge IDs.
 * @param {Object} state - App state
 * @returns {string[]} - Array of newly unlocked badge IDs
 */
export function checkBadgeUnlocks(state) {
  const alreadyUnlocked = new Set(state.data.unlockedBadges || []);
  const newUnlocks = [];

  for (const badge of ALL_BADGES) {
    if (!alreadyUnlocked.has(badge.id) && badge.check(state)) {
      newUnlocks.push(badge.id);
    }
  }

  return newUnlocks;
}
