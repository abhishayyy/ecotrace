// EcoTrace — Emission Factors Reference
// Sources: IEA (2023), IPCC AR6, Carbon Trust, India CEA Grid Report

export const EMISSION_FACTORS = {
  transport: {
    car: {
      petrol: 0.18,   // kg CO2e / km
      diesel: 0.17,
      hybrid: 0.10,
      electric: 0.05,
      none: 0
    },
    publicTransit: 0.04,     // kg CO2e / km (bus/train mix)
    shortHaulFlight: 0.15,   // kg CO2e / km (economy, radiative forcing included)
    longHaulFlight: 0.11,    // kg CO2e / km (economy, long-haul)
    shortFlightAvgKm: 700,   // average km per short-haul flight
    longFlightAvgKm: 5000    // average km per long-haul flight
  },
  energy: {
    grid: {
      average: 0.40,  // kg CO2e / kWh — India grid mix (CEA 2023)
      coal: 0.75,     // kg CO2e / kWh — coal-dominated grid
      clean: 0.00     // kg CO2e / kWh — 100% renewables
    },
    heating: {
      gas: 1.8,       // kg CO2e / $ bill (proxy factor)
      oil: 2.1,       // kg CO2e / $ bill
      electric: 2.7   // load multiplier (relative to grid)
    }
  },
  diet: {
    // Annual tons CO2e per diet profile (kg/day × 365 → tons)
    profiles: {
      "heavy-meat": 7.2,
      "meat": 5.6,
      "low-meat": 3.8,
      "vegetarian": 3.2,
      "vegan": 2.4
    },
    organicReduction: {
      never: 1.00,
      half: 0.95,
      always: 0.90
    },
    wasteAdjustment: {
      high: 300,     // +300 kg CO2e / year (extra waste decomposition)
      average: 0,
      low: -200      // -200 kg CO2e / year (composting credit)
    }
  },
  shopping: {
    clothing: 0.30,       // kg CO2e / $ spent
    electronics: 0.80,    // kg CO2e / $ spent
    recyclingCredit: {
      none: 0,
      some: -100,   // kg CO2e / year
      full: -250
    }
  }
};

// Indian average for comparison (kg CO2e / week)
export const INDIAN_WEEKLY_AVERAGE_KG = 38;
// Global 1.5°C-compatible budget (tons CO2e / year / person)
export const PARIS_TARGET_TONS = 2.0;
