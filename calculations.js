// EcoTrace - Carbon Emissions Calculation Engine

/**
 * Calculates carbon emissions in Tons CO2e per year based on inputs.
 * @param {Object} inputs - The user inputs from the calculator form
 * @param {number} gridElectricityFactor - Regional electricity factor in kg CO2e / kWh
 * @returns {Object} - Breakdown of emissions (transport, energy, food, shopping, total)
 */
export function calculateEmissionsMath(inputs, gridElectricityFactor = 0.40) {
  // 1. Transportation Category
  let carFactor = 0;
  switch (inputs.carType) {
    case "petrol": carFactor = 0.18; break;
    case "diesel": carFactor = 0.17; break;
    case "hybrid": carFactor = 0.10; break;
    case "electric": carFactor = 0.05; break;
    default: carFactor = 0;
  }
  const carCO2 = (inputs.carDistance * carFactor);
  const transitCO2 = (inputs.publicDistance * 0.04);
  const shortFlightCO2 = (inputs.flightsShort * 700 * 0.15); // Average 700 km per flight
  const longFlightCO2 = (inputs.flightsLong * 5000 * 0.11); // Average 5000 km per flight
  const transportTotalTons = (carCO2 + transitCO2 + shortFlightCO2 + longFlightCO2) / 1000;

  // 2. Household Energy Category
  let gridFactor = gridElectricityFactor; // base factor
  if (inputs.gridCleanliness === "coal") gridFactor = 0.75;
  else if (inputs.gridCleanliness === "clean") gridFactor = 0.00;
  
  const electricityCO2 = inputs.electricity * 12 * gridFactor; // monthly to annual
  
  let heatingCO2 = 0;
  switch (inputs.heatingSource) {
    case "gas": 
      heatingCO2 = inputs.heatingAmount * 12 * 1.8; // $1 bill = ~1.8 kg
      break;
    case "oil": 
      heatingCO2 = inputs.heatingAmount * 12 * 2.1; // $1 bill = ~2.1 kg
      break;
    case "electric": 
      heatingCO2 = inputs.heatingAmount * 12 * 2.7 * gridFactor; // electricity relative load
      break;
  }
  const energyTotalTons = (electricityCO2 + heatingCO2) / 1000;

  // 3. Diet Category
  let dietBase = 5.6; // average
  switch (inputs.dietType) {
    case "heavy-meat": dietBase = 7.2; break;
    case "low-meat": dietBase = 3.8; break;
    case "vegetarian": dietBase = 3.2; break;
    case "vegan": dietBase = 2.4; break;
  }
  let dietCO2 = dietBase * 365; // annual
  
  let organicMult = 1.0;
  if (inputs.organicFood === "half") organicMult = 0.95;
  else if (inputs.organicFood === "always") organicMult = 0.90;
  
  let wasteAdd = 0;
  if (inputs.foodWaste === "high") wasteAdd = 300; // +300 kg CO2
  else if (inputs.foodWaste === "low") wasteAdd = -200; // -200 kg CO2 (Compost)
  
  const dietTotalTons = ((dietCO2 * organicMult) + wasteAdd) / 1000;

  // 4. Shopping & General Waste
  const clothesCO2 = inputs.shoppingClothes * 12 * 0.30;
  const electronicsCO2 = inputs.shoppingElectronics * 0.80;
  
  let recyclingCredit = 0;
  if (inputs.recycling === "some") recyclingCredit = -100;
  else if (inputs.recycling === "full") recyclingCredit = -250;
  
  const shoppingTotalTons = Math.max(0.05, (clothesCO2 + electronicsCO2 + recyclingCredit) / 1000);

  const totalEmissionsTons = transportTotalTons + energyTotalTons + dietTotalTons + shoppingTotalTons;

  return {
    transport: transportTotalTons,
    energy: energyTotalTons,
    food: dietTotalTons,
    shopping: shoppingTotalTons,
    total: totalEmissionsTons
  };
}
