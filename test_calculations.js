// EcoTrace - Calculations Unit Test Suite
import assert from 'assert';
import { calculateEmissionsMath } from './calculations.js';

console.log("==================================================");
console.log("EcoTrace Unit Tests: Carbon Footprint Calculations");
console.log("==================================================");

try {
  // Test Case 1: Low-Emissions Profile (Eco-Warrior)
  // - No car, clean energy, vegan diet, line laundry, 100% recycling
  const profileLow = {
    carType: "none",
    carDistance: 0,
    publicDistance: 500,
    flightsShort: 0,
    flightsLong: 0,
    electricity: 100,
    gridCleanliness: "clean",
    heatingSource: "none",
    heatingAmount: 0,
    dietType: "vegan",
    organicFood: "always",
    foodWaste: "low",
    shoppingClothes: 10,
    shoppingElectronics: 100,
    recycling: "full"
  };

  console.log("\n[Test 1] Running low emissions profile tests...");
  const lowEmissions = calculateEmissionsMath(profileLow, 0.40);
  console.log("  Output Breakdown (Tons CO₂e):", {
    transport: lowEmissions.transport.toFixed(4),
    energy: lowEmissions.energy.toFixed(4),
    food: lowEmissions.food.toFixed(4),
    shopping: lowEmissions.shopping.toFixed(4),
    total: lowEmissions.total.toFixed(4)
  });

  // Verify Transport: (500 km * 0.04 kg/km) = 20 kg = 0.02 Tons
  assert.strictEqual(lowEmissions.transport, 0.02, "Transport calculations failed for low profile");

  // Verify Energy: 100 kWh * 12 * 0.0 (Clean grid) + 0 heating = 0 Tons
  assert.strictEqual(lowEmissions.energy, 0, "Energy calculations failed for low profile");

  // Verify Diet: (2.4 kg/day * 365 days * 0.90 organic multiplier) - 200 kg waste credit = 588.4 kg = 0.5884 Tons
  assert.ok(Math.abs(lowEmissions.food - 0.5884) < 0.0001, `Diet calculation mismatch: expected 0.5884, got ${lowEmissions.food}`);

  // Verify Shopping: ($10 * 12 * 0.30 kg) + ($100 * 0.80 kg) - 250 kg recycling credit = -134 kg. Capped to minimum of 0.05 Tons.
  assert.strictEqual(lowEmissions.shopping, 0.05, "Shopping calculations failed for low profile (under minimum cap)");

  console.log("  ✔ Low emissions profile test passed!");

  // Test Case 2: High-Emissions Profile (Car commuter, coal electricity, heavy meat, flights)
  const profileHigh = {
    carType: "petrol",
    carDistance: 20000,
    publicDistance: 0,
    flightsShort: 5,
    flightsLong: 2,
    electricity: 500,
    gridCleanliness: "coal",
    heatingSource: "gas",
    heatingAmount: 150,
    dietType: "heavy-meat",
    organicFood: "never",
    foodWaste: "high",
    shoppingClothes: 200,
    shoppingElectronics: 2000,
    recycling: "none"
  };

  console.log("\n[Test 2] Running high emissions profile tests...");
  const highEmissions = calculateEmissionsMath(profileHigh, 0.40);
  console.log("  Output Breakdown (Tons CO₂e):", {
    transport: highEmissions.transport.toFixed(4),
    energy: highEmissions.energy.toFixed(4),
    food: highEmissions.food.toFixed(4),
    shopping: highEmissions.shopping.toFixed(4),
    total: highEmissions.total.toFixed(4)
  });

  // Verify Transport: Petrol car (20000 * 0.18 = 3600 kg) + 5 short flights (5 * 700 * 0.15 = 525 kg) + 2 long flights (2 * 5000 * 0.11 = 1100 kg) = 5225 kg = 5.225 Tons
  assert.strictEqual(highEmissions.transport, 5.225, "Transport calculations failed for high profile");

  // Verify Energy: 500 kWh * 12 * 0.75 (coal grid) + Gas heating ($150 * 12 * 1.8 kg) = 4500 kg + 3240 kg = 7740 kg = 7.74 Tons
  assert.strictEqual(highEmissions.energy, 7.74, "Energy calculations failed for high profile");

  // Verify Diet: (7.2 kg/day * 365 days * 1.0 organic mult) + 300 kg waste penalty = 2928 kg = 2.928 Tons
  assert.ok(Math.abs(highEmissions.food - 2.928) < 0.0001, `Diet calculation mismatch: expected 2.928, got ${highEmissions.food}`);

  // Verify Shopping: ($200 * 12 * 0.30 kg) + ($2000 * 0.80 kg) - 0 recycling = 720 kg + 1600 kg = 2320 kg = 2.32 Tons
  assert.strictEqual(highEmissions.shopping, 2.32, "Shopping calculations failed for high profile");

  console.log("  ✔ High emissions profile test passed!");

  console.log("\n==================================================");
  console.log("SUCCESS: All Carbon Footprint Math Unit Tests Passed!");
  console.log("==================================================");

} catch (error) {
  console.error("\n❌ TEST FAILURE:");
  console.error(error.message);
  console.error(error.stack);
  process.exit(1);
}
