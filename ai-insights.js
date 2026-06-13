// EcoTrace — AI Insights via Claude API
// Calls the Anthropic Claude API to generate personalized carbon reduction tips.

/**
 * Fetches 3 personalised carbon reduction tips from Claude.
 * @param {Object} breakdown - { transport, energy, food, shopping, total } in Tons CO2e/year
 * @param {string} apiKey - Anthropic API key (stored in firebase-config or settings)
 * @returns {Promise<Array>} - Array of { tip: string, impactKg: number }
 */
export async function getAIInsights(breakdown, apiKey) {
  if (!apiKey) {
    throw new Error("Claude API key is not configured.");
  }

  const highest = getHighestCategory(breakdown);

  const prompt = `You are a sustainability advisor. A user has calculated their annual carbon footprint:
- Transport: ${breakdown.transport.toFixed(2)} tons CO2e/year
- Home Energy: ${breakdown.energy.toFixed(2)} tons CO2e/year
- Diet & Food: ${breakdown.food.toFixed(2)} tons CO2e/year
- Shopping: ${breakdown.shopping.toFixed(2)} tons CO2e/year
- TOTAL: ${breakdown.total.toFixed(2)} tons CO2e/year

Their highest emission category is: ${highest.name} (${highest.value.toFixed(2)} tons).

Generate exactly 3 specific, actionable carbon reduction tips personalised to this person's actual data.
Each tip must be concrete (not generic), mention an estimated kg CO2e saving per week, and target their biggest categories.

Respond ONLY with valid JSON in this format:
[
  { "tip": "Replace 2 car journeys per week with public transit → saves ~8 kg CO2e/week", "impactKg": 8 },
  { "tip": "...", "impactKg": ... },
  { "tip": "...", "impactKg": ... }
]`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json"
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 512,
      messages: [{ role: "user", content: prompt }]
    })
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Claude API error (${response.status}): ${err}`);
  }

  const data = await response.json();
  const text = data.content[0].text.trim();

  // Parse JSON safely
  const jsonStart = text.indexOf("[");
  const jsonEnd = text.lastIndexOf("]") + 1;
  if (jsonStart === -1 || jsonEnd === 0) {
    throw new Error("Claude returned unexpected format.");
  }

  return JSON.parse(text.slice(jsonStart, jsonEnd));
}

/**
 * Returns the category with the highest emissions.
 */
function getHighestCategory(breakdown) {
  const categories = [
    { name: "Transport", value: breakdown.transport },
    { name: "Home Energy", value: breakdown.energy },
    { name: "Diet & Food", value: breakdown.food },
    { name: "Shopping", value: breakdown.shopping }
  ];
  return categories.reduce((max, c) => c.value > max.value ? c : max, categories[0]);
}
