// EcoTrace - Core Application Controller
import { calculateEmissionsMath } from './calculations.js';

// Import Firebase config dynamically
let firebaseConfig = null;
let isFirebaseConnected = false;
let isOfflineMode = false;

// Firebase References
let fbApp = null;
let fbAuth = null;
let fbDb = null;

// App State
const state = {
  user: null, // User info when logged in
  data: {
    calculated: false,
    calculatorInputs: {
      carType: "none",
      carDistance: 0,
      publicDistance: 0,
      flightsShort: 0,
      flightsLong: 0,
      electricity: 300,
      gridCleanliness: "average",
      heatingSource: "none",
      heatingAmount: 50,
      dietType: "meat",
      organicFood: "never",
      foodWaste: "average",
      shoppingClothes: 50,
      shoppingElectronics: 500,
      recycling: "some"
    },
    dailyActionsLog: [], // Array of { date: "YYYY-MM-DD", actions: [...], savedKg: 0.0 }
    targetBudget: 5.0,
    gridElectricityFactor: 0.40,
    unlockedBadges: [], // list of unlocked achievement IDs
    streak: 0,
    lastLoggedDate: ""
  }
};

// Daily actions checklist definition
const AVAILABLE_ACTIONS = [
  { id: "public-transit", title: "Public Transit/Carpool", icon: "🚌", desc: "Used public transit or carpooled instead of driving a solo car.", savings: 5.0 },
  { id: "walk-cycle", title: "Walked or Cycled", icon: "🚲", desc: "Walked or cycled for a short trip under 5km.", savings: 1.2 },
  { id: "plant-meal", title: "Plant-Based Meal", icon: "🥗", desc: "Ate a fully plant-based meal today.", savings: 1.8 },
  { id: "cold-wash", title: "Cold Wash & Line Dry", icon: "👕", desc: "Washed laundry in cold water and line-dried instead of using a dryer.", savings: 0.8 },
  { id: "short-shower", title: "Short Shower (< 5 mins)", icon: "🚿", desc: "Took a short shower (under 5 minutes) to conserve hot water.", savings: 0.6 },
  { id: "unplug-devices", title: "Unplugged Standby / Eco HVAC", icon: "🔌", desc: "Turned off heating/cooling when away and unplugged unused devices.", savings: 1.0 },
  { id: "zero-waste", title: "Zero Waste & Compost", icon: "♻️", desc: "Avoided single-use packaging and composted organic kitchen waste.", savings: 0.5 }
];

// Badge achievements definition
const ALL_BADGES = [
  { id: "calc-badge", title: "Carbon Analyst", icon: "📊", desc: "Calculate your initial carbon footprint." },
  { id: "streak-3", title: "Consistent Cutter", icon: "🔥", desc: "Log daily actions for 3 days in a row." },
  { id: "save-50", title: "Carbon Crusher", icon: "💥", desc: "Save more than 50 kg of CO₂e in cumulative daily actions." },
  { id: "vegan-hero", title: "Plant-Power Champ", icon: "🥦", desc: "Log 5 plant-based meals to minimize food emissions." },
  { id: "transit-hero", title: "Green Commuter", icon: "🚲", desc: "Log walking/cycling or public transit 5 times." },
  { id: "quiz-expert", title: "Climate Intellectual", icon: "🧠", desc: "Score a perfect 5/5 on the Eco Quiz." }
];

// Quiz Questions definition
const QUIZ_QUESTIONS = [
  {
    q: "What is the average annual carbon footprint of an individual in the United States?",
    options: ["~4 Tons CO₂e", "~8 Tons CO₂e", "~15 Tons CO₂e", "~30 Tons CO₂e"],
    answer: 2,
    explanation: "The average American produces around 15 Tons CO₂e annually. The European average is around 6-8 Tons, while the global average is 4.5 Tons. To avert critical warming, the global average needs to drop under 2 Tons per person."
  },
  {
    q: "Which type of diet has the lowest carbon footprint?",
    options: ["Keto diet", "Vegan diet", "Mediterranean diet", "Vegetarian diet"],
    answer: 1,
    explanation: "A vegan diet produces up to 60-70% fewer food emissions than a standard meat-heavy diet, since raising livestock requires vast amounts of land, water, and methane-generating feed."
  },
  {
    q: "How much of global greenhouse gas emissions are contributed by the transport sector?",
    options: ["~5%", "~15%", "~30%", "~50%"],
    answer: 1,
    explanation: "Globally, transportation makes up approximately 14-16% of total emissions. However, in car-heavy countries like the US, it is the largest sector at nearly 28-30%."
  },
  {
    q: "Which household systems or appliances consume the most energy in average homes?",
    options: ["Refrigerators and freezers", "Heating and Cooling (HVAC)", "Lighting fixtures", "Washing machines"],
    answer: 1,
    explanation: "Space heating and cooling makes up over 50% of the average home's utility energy load. Upgrading to insulation or heat pumps is a huge carbon cutter."
  },
  {
    q: "Which travel option has the highest carbon emissions intensity per passenger per kilometer?",
    options: ["Electric passenger train", "Short-haul flight", "Diesel passenger bus", "Solo-driven gasoline SUV"],
    answer: 1,
    explanation: "Short-haul flights (<3 hours) have the highest emissions intensity because the heavy fuel combustion during takeoff and landing is spread over a relatively short distance."
  }
];

// Chart.js instance
let emissionChart = null;

// Initialize Application on DOM Load
document.addEventListener("DOMContentLoaded", async () => {
  setupNavigation();
  setupFormStepEvents();
  setupQuizEvents();
  setupDailyActionsEvents();
  setupSettingsEvents();
  
  await checkFirebaseConnection();
});

// ==========================================
// 1. Firebase Initialization & Auth
// ==========================================

async function checkFirebaseConnection() {
  // Try loading credentials
  try {
    const configMod = await import('./firebase-config.js');
    firebaseConfig = configMod.default;
  } catch (e) {
    console.log("No firebase-config.js module found. Looking for browser cache.");
  }

  // Fallback to localStorage configuration
  if (!firebaseConfig || firebaseConfig.apiKey === "YOUR_API_KEY") {
    const cachedConfig = localStorage.getItem('eco_firebase_config');
    if (cachedConfig) {
      try {
        firebaseConfig = JSON.parse(cachedConfig);
      } catch (err) {
        console.error("Local storage Firebase config parsing failed.", err);
      }
    }
  }

  // Show Wizard overlay if still no valid configuration
  if (!firebaseConfig || firebaseConfig.apiKey === "YOUR_API_KEY") {
    document.getElementById("firebase-wizard").classList.remove("hidden");
    setupWizardUI();
  } else {
    // Attempt connecting
    await initializeFirebase(firebaseConfig);
  }
}

async function initializeFirebase(config) {
  try {
    // Import SDKs from Google CDN
    const { initializeApp } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js");
    const { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js");
    const { getFirestore } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");

    fbApp = initializeApp(config);
    fbAuth = getAuth(fbApp);
    fbDb = getFirestore(fbApp);
    isFirebaseConnected = true;
    
    // Hide config wizard if open
    document.getElementById("firebase-wizard").classList.add("hidden");
    
    // Configure Auth state listeners
    onAuthStateChanged(fbAuth, async (user) => {
      if (user) {
        state.user = user;
        isOfflineMode = false;
        
        document.getElementById("auth-overlay").classList.add("hidden");
        document.getElementById("user-display-name").textContent = user.email.split('@')[0];
        document.getElementById("user-sync-status").textContent = "Synced to Cloud";
        document.getElementById("btn-logout").classList.remove("hidden");
        
        // Load settings and inputs
        await loadUserData();
      } else {
        state.user = null;
        if (!isOfflineMode) {
          showAuthOverlay();
        } else {
          loadOfflineData();
        }
      }
    });

    setupAuthForms(signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut);
    populateSettingsFirebaseInputs(config);
    
  } catch (error) {
    console.error("Firebase connection error: ", error);
    alert("Could not connect to Firebase database. Switching to Offline Mode.");
    triggerOfflineMode();
  }
}

function showAuthOverlay() {
  document.getElementById("auth-overlay").classList.remove("hidden");
  document.getElementById("btn-logout").classList.add("hidden");
  document.getElementById("user-display-name").textContent = "Guest";
  document.getElementById("user-sync-status").textContent = "Auth Required";
}

function triggerOfflineMode() {
  isOfflineMode = true;
  document.getElementById("auth-overlay").classList.add("hidden");
  document.getElementById("firebase-wizard").classList.add("hidden");
  document.getElementById("user-display-name").textContent = "Offline User";
  document.getElementById("user-sync-status").textContent = "Offline Mode";
  document.getElementById("btn-logout").classList.add("hidden");
  
  loadOfflineData();
}

function setupWizardUI() {
  const wizard = document.getElementById("firebase-wizard");
  const tabs = wizard.querySelectorAll(".wizard-tab");
  const steps = wizard.querySelectorAll(".step");
  let currentStep = 0;

  // Next Step triggers
  wizard.querySelectorAll(".next-step").forEach(btn => {
    btn.addEventListener("click", () => {
      tabs[currentStep].classList.remove("active");
      steps[currentStep].classList.remove("active");
      currentStep++;
      tabs[currentStep].classList.add("active");
      steps[currentStep].classList.add("active");
    });
  });

  // Prev Step triggers
  wizard.querySelectorAll(".prev-step").forEach(btn => {
    btn.addEventListener("click", () => {
      tabs[currentStep].classList.remove("active");
      steps[currentStep].classList.remove("active");
      currentStep--;
      tabs[currentStep].classList.add("active");
      steps[currentStep].classList.add("active");
    });
  });

  // Bypass setup
  wizard.querySelector(".bypass-wizard").addEventListener("click", () => {
    triggerOfflineMode();
  });

  // Save wizard configuration
  document.getElementById("save-wizard-config").addEventListener("click", async () => {
    const inputArea = document.getElementById("firebase-config-input").value;
    const errorMsg = document.getElementById("wizard-config-error");
    errorMsg.style.display = "none";
    
    try {
      // Extract config JSON block
      let configObj = null;
      if (inputArea.includes("{") && inputArea.includes("}")) {
        const jsonStr = inputArea.substring(inputArea.indexOf("{"), inputArea.lastIndexOf("}") + 1);
        // Clean JS syntax to make parseable JSON
        const cleanJson = jsonStr
          .replace(/([a-zA-Z0-9]+)\s*:/g, '"$1":')
          .replace(/'/g, '"')
          .replace(/,\s*}/g, '}')
          .replace(/,\s*]/g, ']');
        configObj = JSON.parse(cleanJson);
      } else {
        configObj = JSON.parse(inputArea);
      }

      if (!configObj || !configObj.apiKey || !configObj.projectId) {
        throw new Error("Missing critical keys");
      }

      // Save to localStorage
      localStorage.setItem('eco_firebase_config', JSON.stringify(configObj));
      firebaseConfig = configObj;
      
      // Initialize
      await initializeFirebase(firebaseConfig);
      
    } catch (e) {
      console.error(e);
      errorMsg.style.display = "block";
    }
  });
}

function setupAuthForms(signInFunc, signUpFunc, signOutFunc) {
  const loginForm = document.getElementById("login-form");
  const signupForm = document.getElementById("signup-form");
  const loginTabBtn = document.getElementById("btn-login-tab");
  const signupTabBtn = document.getElementById("btn-signup-tab");
  const loginError = document.getElementById("login-error");
  const signupError = document.getElementById("signup-error");

  // Tab switching
  loginTabBtn.addEventListener("click", () => {
    loginTabBtn.classList.add("active");
    signupTabBtn.classList.remove("active");
    loginForm.classList.add("active");
    signupForm.classList.remove("active");
  });

  signupTabBtn.addEventListener("click", () => {
    signupTabBtn.classList.add("active");
    loginTabBtn.classList.remove("active");
    signupForm.classList.add("active");
    loginForm.classList.remove("active");
  });

  // Offline Bypass
  document.getElementById("btn-offline-mode").addEventListener("click", () => {
    triggerOfflineMode();
  });

  // Login Submit
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    loginError.textContent = "";
    const email = document.getElementById("login-email").value;
    const pass = document.getElementById("login-password").value;

    try {
      await signInFunc(fbAuth, email, pass);
    } catch (error) {
      console.error(error);
      loginError.textContent = getAuthErrorMessage(error.code);
    }
  });

  // Signup Submit
  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    signupError.textContent = "";
    const email = document.getElementById("signup-email").value;
    const pass = document.getElementById("signup-password").value;
    const confirm = document.getElementById("signup-password-confirm").value;

    if (pass !== confirm) {
      signupError.textContent = "Passwords do not match.";
      return;
    }

    try {
      await signUpFunc(fbAuth, email, pass);
    } catch (error) {
      console.error(error);
      signupError.textContent = getAuthErrorMessage(error.code);
    }
  });

  // Logout Trigger
  document.getElementById("btn-logout").addEventListener("click", async () => {
    if (confirm("Are you sure you want to sign out? Your session data remains saved in Firebase.")) {
      try {
        await signOutFunc(fbAuth);
        showAuthOverlay();
      } catch (err) {
        console.error(err);
      }
    }
  });
}

function getAuthErrorMessage(code) {
  switch (code) {
    case 'auth/invalid-email': return 'Invalid email address.';
    case 'auth/user-disabled': return 'This user has been disabled.';
    case 'auth/user-not-found': return 'No user found with this email.';
    case 'auth/wrong-password': return 'Incorrect password.';
    case 'auth/email-already-in-use': return 'An account already exists with this email.';
    case 'auth/weak-password': return 'Password is too weak (min 6 characters).';
    default: return 'Authentication failed. Please check your credentials.';
  }
}

// ==========================================
// 2. Data Synchronization (Firestore & Local)
// ==========================================

async function loadUserData() {
  if (!isFirebaseConnected || !state.user) return;

  try {
    const { doc, getDoc, setDoc } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
    const userDocRef = doc(fbDb, "users", state.user.uid);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
      state.data = userDocSnap.data();
    } else {
      // Check if they have offline local data first and seed it
      const localStoreData = localStorage.getItem("eco_trace_data");
      if (localStoreData) {
        state.data = JSON.parse(localStoreData);
      }
      // Write initial state to cloud
      await setDoc(userDocRef, state.data);
    }

    applyDataToUI();

  } catch (error) {
    console.error("Error loading user from database", error);
    loadOfflineData();
  }
}

async function saveUserData() {
  // Always update local storage as a quick backup
  localStorage.setItem("eco_trace_data", JSON.stringify(state.data));

  if (isFirebaseConnected && state.user) {
    try {
      const { doc, setDoc } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
      const userDocRef = doc(fbDb, "users", state.user.uid);
      await setDoc(userDocRef, state.data);
      document.getElementById("user-sync-status").textContent = "Synced to Cloud";
    } catch (e) {
      console.error("Cloud save failed, cached locally", e);
      document.getElementById("user-sync-status").textContent = "Cached Locally (Offline)";
    }
  }
}

function loadOfflineData() {
  const localStoreData = localStorage.getItem("eco_trace_data");
  if (localStoreData) {
    try {
      state.data = JSON.parse(localStoreData);
    } catch (e) {
      console.error("Local storage parse error: ", e);
    }
  }
  applyDataToUI();
}

function applyDataToUI() {
  // Update header labels
  const userName = state.user ? state.user.email.split('@')[0] : "Guest";
  document.querySelectorAll(".header-user-name").forEach(el => el.textContent = userName);
  
  // Apply Targets settings inputs
  document.getElementById("settings-target-budget").value = state.data.targetBudget;
  document.getElementById("settings-regional-electricity").value = state.data.gridElectricityFactor;
  
  // Populate Calculator Inputs
  populateCalculatorForm(state.data.calculatorInputs);
  
  // Recalculate and update charts
  calculateAndRenderEmissions();
  
  // Build actions list UI
  renderDailyActionsList();
  renderLoggedActionsHistory();
  
  // Render badge systems
  renderAchievements();
}

// ==========================================
// 3. Tab Navigation & Core Shell
// ==========================================

function setupNavigation() {
  const navItems = document.querySelectorAll(".nav-item");
  const contentTabs = document.querySelectorAll(".content-tab");

  navItems.forEach(item => {
    item.addEventListener("click", () => {
      const tabName = item.getAttribute("data-tab");
      
      // Update sidebar highlight
      navItems.forEach(nav => nav.classList.remove("active"));
      item.classList.add("active");
      
      // Update shown tab container
      contentTabs.forEach(tab => {
        tab.classList.remove("active");
        if (tab.id === `tab-${tabName}`) {
          tab.classList.add("active");
        }
      });

      // Special resize trigger for Chart.js inside glassmorphic containers
      if (tabName === "dashboard" && emissionChart) {
        emissionChart.resize();
      }
    });
  });
}

// ==========================================
// 4. Carbon Calculator Logic
// ==========================================

function setupFormStepEvents() {
  const form = document.getElementById("calculator-form");
  const stepDivs = form.querySelectorAll(".calc-step");
  const stepBtns = form.querySelectorAll(".calc-tab-btn");
  let activeStep = 0;

  // Horizontal calc tab navigation clicks
  stepBtns.forEach((btn, index) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      switchCalcStep(index);
    });
  });

  // "Next Step" buttons
  form.querySelectorAll(".next-calc-step").forEach(btn => {
    btn.addEventListener("click", () => {
      switchCalcStep(activeStep + 1);
    });
  });

  // "Back Step" buttons
  form.querySelectorAll(".prev-calc-step").forEach(btn => {
    btn.addEventListener("click", () => {
      switchCalcStep(activeStep - 1);
    });
  });

  function switchCalcStep(stepIndex) {
    if (stepIndex < 0 || stepIndex >= stepDivs.length) return;
    
    stepBtns[activeStep].classList.remove("active");
    stepDivs[activeStep].classList.remove("active");
    
    activeStep = stepIndex;
    
    stepBtns[activeStep].classList.add("active");
    stepDivs[activeStep].classList.add("active");
  }

  // Dynamic input triggers (hide distance input if "no car" selected)
  const carTypeSelect = document.getElementById("input-car-type");
  const carDistGroup = document.getElementById("group-car-dist");
  carTypeSelect.addEventListener("change", () => {
    if (carTypeSelect.value === "none") {
      carDistGroup.classList.add("hidden");
    } else {
      carDistGroup.classList.remove("hidden");
    }
  });

  // Heating amount dynamic display
  const heatingSelect = document.getElementById("input-heating-source");
  const heatingBillGroup = document.getElementById("group-heating-amt");
  heatingSelect.addEventListener("change", () => {
    if (heatingSelect.value === "none") {
      heatingBillGroup.classList.add("hidden");
    } else {
      heatingBillGroup.classList.remove("hidden");
    }
  });

  // Form submit calculate
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    // Save input form values to state
    state.data.calculatorInputs = {
      carType: carTypeSelect.value,
      carDistance: parseFloat(document.getElementById("input-car-distance").value) || 0,
      publicDistance: parseFloat(document.getElementById("input-public-distance").value) || 0,
      flightsShort: parseInt(document.getElementById("input-flights-short").value) || 0,
      flightsLong: parseInt(document.getElementById("input-flights-long").value) || 0,
      electricity: parseFloat(document.getElementById("input-electricity").value) || 0,
      gridCleanliness: document.getElementById("input-grid-cleanliness").value,
      heatingSource: heatingSelect.value,
      heatingAmount: parseFloat(document.getElementById("input-heating-amount").value) || 0,
      dietType: document.getElementById("input-diet-type").value,
      organicFood: document.getElementById("input-organic-food").value,
      foodWaste: document.getElementById("input-food-waste").value,
      shoppingClothes: parseFloat(document.getElementById("input-shopping-clothes").value) || 0,
      shoppingElectronics: parseFloat(document.getElementById("input-shopping-electronics").value) || 0,
      recycling: document.getElementById("input-recycling").value
    };

    state.data.calculated = true;
    
    // Check calculations badge achievement
    unlockBadge("calc-badge");

    // Recalculate
    calculateAndRenderEmissions();
    
    // Save updates
    await saveUserData();
    
    // Bounce user to dashboard
    document.querySelector('.nav-item[data-tab="dashboard"]').click();
    
    alert("Carbon emissions calculated and synced successfully!");
  });
}

function populateCalculatorForm(inputs) {
  if (!inputs) return;
  
  document.getElementById("input-car-type").value = inputs.carType || "none";
  document.getElementById("input-car-distance").value = inputs.carDistance || 0;
  document.getElementById("input-public-distance").value = inputs.publicDistance || 0;
  document.getElementById("input-flights-short").value = inputs.flightsShort || 0;
  document.getElementById("input-flights-long").value = inputs.flightsLong || 0;
  document.getElementById("input-electricity").value = inputs.electricity || 300;
  document.getElementById("input-grid-cleanliness").value = inputs.gridCleanliness || "average";
  document.getElementById("input-heating-source").value = inputs.heatingSource || "none";
  document.getElementById("input-heating-amount").value = inputs.heatingAmount || 50;
  document.getElementById("input-diet-type").value = inputs.dietType || "meat";
  document.getElementById("input-organic-food").value = inputs.organicFood || "never";
  document.getElementById("input-food-waste").value = inputs.foodWaste || "average";
  document.getElementById("input-shopping-clothes").value = inputs.shoppingClothes || 50;
  document.getElementById("input-shopping-electronics").value = inputs.shoppingElectronics || 500;
  document.getElementById("input-recycling").value = inputs.recycling || "some";

  // Fire change events to correct hidden fields display
  document.getElementById("input-car-type").dispatchEvent(new Event('change'));
  document.getElementById("input-heating-source").dispatchEvent(new Event('change'));
}

// Math logic for carbon calculations is imported from calculations.js

function calculateAndRenderEmissions() {
  const outputs = calculateEmissionsMath(state.data.calculatorInputs, state.data.gridElectricityFactor);
  
  // Calculate total savings from Daily Actions Log
  const totalSavedKg = state.data.dailyActionsLog.reduce((sum, item) => sum + item.savedKg, 0);
  const totalSavedTons = totalSavedKg / 1000;
  
  // Display stats
  const actualFootprint = Math.max(0, outputs.total - totalSavedTons);
  document.getElementById("kpi-carbon-footprint").innerHTML = `${actualFootprint.toFixed(2)} <span class="unit">Tons CO₂e</span>`;
  document.getElementById("kpi-cumulative-saved").textContent = `${totalSavedKg.toFixed(1)} kg total avoided`;
  document.getElementById("kpi-target-budget").innerHTML = `${state.data.targetBudget.toFixed(2)} <span class="unit">Tons CO₂e</span>`;

  // Visual highlights for limits
  const footprintStatusEl = document.getElementById("kpi-carbon-budget-status");
  const progressBarFillEl = document.getElementById("budget-progress-bar");
  
  const budgetRatio = state.data.targetBudget > 0 ? (actualFootprint / state.data.targetBudget) * 100 : 0;
  document.getElementById("budget-progress-ratio").textContent = `${budgetRatio.toFixed(0)}% of annual budget`;
  progressBarFillEl.style.width = `${Math.min(100, budgetRatio)}%`;

  // Adjust style depending on how close they are to target
  progressBarFillEl.className = "progress-bar-fill"; // reset
  if (budgetRatio > 100) {
    footprintStatusEl.textContent = "Over Limit";
    footprintStatusEl.className = "trend danger";
    progressBarFillEl.classList.add("danger");
  } else if (budgetRatio > 80) {
    footprintStatusEl.textContent = "Approaching Limit";
    footprintStatusEl.className = "trend warning";
    progressBarFillEl.classList.add("warning");
  } else {
    footprintStatusEl.textContent = "Below Limit";
    footprintStatusEl.className = "trend success";
  }

  // Update trend comparison text
  const avgUS = 15.0;
  const avgEU = 7.0;
  const vsAvg = ((actualFootprint - avgEU) / avgEU) * 100;
  const compEl = document.getElementById("kpi-carbon-vs-avg");
  
  if (!state.data.calculated) {
    compEl.textContent = "No calculations made yet";
    compEl.className = "trend neutral";
  } else if (vsAvg < 0) {
    compEl.textContent = `${Math.abs(vsAvg).toFixed(0)}% below European Avg`;
    compEl.className = "trend success";
  } else {
    compEl.textContent = `${vsAvg.toFixed(0)}% above European Avg`;
    compEl.className = "trend danger";
  }

  document.getElementById("budget-progress-desc").textContent = state.data.calculated 
    ? `Your calculated annual footprint is ${outputs.total.toFixed(2)} Tons, offset by ${totalSavedTons.toFixed(3)} Tons through daily eco actions.` 
    : "Calculate your footprint to see where you stand against the average target budget.";

  // Render Chart
  updateChart(outputs);
  
  // Render tips/recommendations
  renderRecommendations(outputs);
}

function updateChart(breakdown) {
  const canvas = document.getElementById("emission-pie-chart");
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  
  const data = {
    labels: ['Transportation', 'Energy', 'Diet & Food', 'Shopping & Waste'],
    datasets: [{
      data: [breakdown.transport, breakdown.energy, breakdown.food, breakdown.shopping],
      backgroundColor: [
        '#10b981', // Emerald
        '#14b8a6', // Teal
        '#6366f1', // Indigo
        '#f59e0b'  // Amber
      ],
      borderWidth: 0,
      hoverOffset: 12
    }]
  };
  
  if (emissionChart) {
    emissionChart.data = data;
    emissionChart.update();
  } else {
    emissionChart = new Chart(ctx, {
      type: 'doughnut',
      data: data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: function(context) {
                return ` ${context.label}: ${context.raw.toFixed(2)} Tons CO₂e`;
              }
            }
          }
        },
        cutout: '72%'
      }
    });
  }

  // Render custom legends inside HTML layout
  const legendContainer = document.getElementById('chart-legends-container');
  legendContainer.innerHTML = '';
  
  const total = breakdown.total;
  data.labels.forEach((label, i) => {
    const value = data.datasets[0].data[i];
    const percent = total > 0 ? ((value / total) * 100).toFixed(0) : 0;
    
    const legendItem = document.createElement('div');
    legendItem.className = 'legend-item';
    legendItem.innerHTML = `
      <div class="legend-color" style="background-color: ${data.datasets[0].backgroundColor[i]}"></div>
      <div class="legend-info">
        <span class="legend-name">${label}</span>
        <span class="legend-val">${value.toFixed(2)} Tons (${percent}%)</span>
      </div>
    `;
    legendContainer.appendChild(legendItem);
  });
}

function renderRecommendations(breakdown) {
  const recContainer = document.getElementById("rec-container");
  if (!recContainer) return;
  
  if (!state.data.calculated) {
    recContainer.innerHTML = `<p class="empty-rec">Calculate your carbon footprint first to unlock personalized sustainability recommendations.</p>`;
    return;
  }

  // Formulate recommendations list
  const recs = [];
  
  if (breakdown.transport > 3.0) {
    recs.push({
      icon: "🚗",
      title: "Reduce Travel Loads",
      desc: "Transport is your biggest source. Try hybrid work, switch to train transit for medium distances, or consider an EV."
    });
  }
  if (breakdown.energy > 2.0) {
    recs.push({
      icon: "⚡",
      title: "Optimize Home Insulation",
      desc: "High energy load detected. Swapping to LED lighting and sealing door/window air drafts can shave 15% off emissions."
    });
  }
  if (breakdown.food > 1.8) {
    recs.push({
      icon: "🍔",
      title: "Swap Out Red Meat",
      desc: "Food footprint is high. Simply replacing beef or lamb meals with chicken, fish, or beans twice a week makes a major dent."
    });
  }
  if (breakdown.shopping > 1.0) {
    recs.push({
      icon: "🛍️",
      title: "Buy Circular Goods",
      desc: "Shop secondhand for clothing/furniture, and repair gadgets instead of buying new to lower manufacturing demands."
    });
  }

  // General filler if they are already doing great
  if (recs.length === 0) {
    recs.push({
      icon: "🌟",
      title: "Excellent Footprint Profile",
      desc: "Your emissions are extremely low. Focus on maintaining habits and sharing tips with friends!"
    });
  }

  recContainer.innerHTML = recs.slice(0, 2).map(r => `
    <div class="rec-item">
      <span class="rec-icon">${r.icon}</span>
      <div class="rec-details">
        <h4>${r.title}</h4>
        <p>${r.desc}</p>
      </div>
    </div>
  `).join('');
}

// ==========================================
// 5. Daily Actions & Offsets Tracker
// ==========================================

// Today's checked actions list
let todayCheckedActions = [];

function setupDailyActionsEvents() {
  const container = document.getElementById("actions-list-container");
  const saveBtn = document.getElementById("btn-save-actions");

  // Date indicator display
  const options = { weekday: 'long', month: 'long', day: 'numeric' };
  document.getElementById("actions-date-today").textContent = new Date().toLocaleDateString("en-US", options);

  // Click on action checkbox card
  container.addEventListener("click", (e) => {
    const actionCard = e.target.closest(".action-item");
    if (!actionCard) return;

    const actionId = actionCard.getAttribute("data-action-id");
    const index = todayCheckedActions.indexOf(actionId);

    if (index === -1) {
      todayCheckedActions.push(actionId);
      actionCard.classList.add("checked");
    } else {
      todayCheckedActions.splice(index, 1);
      actionCard.classList.remove("checked");
    }

    updateTodaySavingsCounter();
  });

  // Log savings submit
  saveBtn.addEventListener("click", async () => {
    if (todayCheckedActions.length === 0) {
      alert("Please check at least one daily sustainable action to log.");
      return;
    }

    const todayString = new Date().toISOString().split('T')[0];
    const totalTodaySaved = todayCheckedActions.reduce((sum, actionId) => {
      const act = AVAILABLE_ACTIONS.find(a => a.id === actionId);
      return sum + (act ? act.savings : 0);
    }, 0);

    // Save logged day to logs list
    const logIndex = state.data.dailyActionsLog.findIndex(log => log.date === todayString);
    if (logIndex !== -1) {
      // Overwrite today's previous entry
      state.data.dailyActionsLog[logIndex] = {
        date: todayString,
        actions: [...todayCheckedActions],
        savedKg: totalTodaySaved
      };
    } else {
      // Add new entry
      state.data.dailyActionsLog.push({
        date: todayString,
        actions: [...todayCheckedActions],
        savedKg: totalTodaySaved
      });
    }

    // Evaluate Gamification Streaks
    updateStreakOnSubmit(todayString);
    
    // Evaluate Gamification Badges
    evaluateDailyActionAchievements();

    // Recalculate dashboard totals
    calculateAndRenderEmissions();
    
    // Refresh history
    renderLoggedActionsHistory();
    
    // Save
    await saveUserData();
    
    alert(`Successfully logged ${totalTodaySaved.toFixed(1)} kg CO₂e saved today!`);
    
    // Clear selections
    todayCheckedActions = [];
    renderDailyActionsList();
    updateTodaySavingsCounter();
  });
}

function updateTodaySavingsCounter() {
  const sumSaved = todayCheckedActions.reduce((sum, id) => {
    const act = AVAILABLE_ACTIONS.find(a => a.id === id);
    return sum + (act ? act.savings : 0);
  }, 0);

  document.getElementById("today-avoided-count").textContent = `${sumSaved.toFixed(1)} kg CO₂e`;
  document.getElementById("kpi-carbon-avoided").innerHTML = `${sumSaved.toFixed(1)} <span class="unit">kg CO₂e</span>`;
}

function renderDailyActionsList() {
  const container = document.getElementById("actions-list-container");
  if (!container) return;

  const todayString = new Date().toISOString().split('T')[0];
  
  // Check if today was already logged to load values
  const alreadyLogged = state.data.dailyActionsLog.find(log => log.date === todayString);
  const currentlyChecked = alreadyLogged ? alreadyLogged.actions : todayCheckedActions;
  
  container.innerHTML = AVAILABLE_ACTIONS.map(action => {
    const isChecked = currentlyChecked.includes(action.id);
    return `
      <div class="action-item ${isChecked ? 'checked' : ''}" data-action-id="${action.id}">
        <span class="action-icon">${action.icon}</span>
        <div class="action-info">
          <span class="action-title">${action.title}</span>
          <span class="action-savings">-${action.savings.toFixed(1)} kg CO₂e</span>
        </div>
        <div class="action-checkbox">✓</div>
      </div>
    `;
  }).join('');
}

function renderLoggedActionsHistory() {
  const container = document.getElementById("logged-history-container");
  if (!container) return;

  const logs = state.data.dailyActionsLog;
  if (!logs || logs.length === 0) {
    container.innerHTML = `<p class="empty-history">No logged activity yet. Mark your daily habits and click "Log Today's Savings" above to build a list.</p>`;
    return;
  }

  // Sort by date descending
  const sortedLogs = [...logs].sort((a, b) => b.date.localeCompare(a.date));

  container.innerHTML = sortedLogs.map(log => {
    const formattedDate = new Date(log.date + 'T00:00:00').toLocaleDateString("en-US", {
      month: 'short', day: 'numeric', year: 'numeric'
    });
    return `
      <div class="history-item">
        <div>
          <span class="history-date">${formattedDate}</span>
          <span class="history-count">(${log.actions.length} action${log.actions.length > 1 ? 's' : ''})</span>
        </div>
        <span class="history-amount">-${log.savedKg.toFixed(1)} kg CO₂e</span>
      </div>
    `;
  }).join('');
}

function updateStreakOnSubmit(todayString) {
  const lastLogged = state.data.lastLoggedDate;
  
  if (!lastLogged) {
    state.data.streak = 1;
  } else {
    const lastDate = new Date(lastLogged + 'T00:00:00');
    const todayDate = new Date(todayString + 'T00:00:00');
    
    // Diff in days
    const diffTime = Math.abs(todayDate - lastDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      state.data.streak += 1;
    } else if (diffDays > 1) {
      state.data.streak = 1; // reset streak
    }
    // if diffDays === 0, user re-logged today, so keep same streak
  }
  
  state.data.lastLoggedDate = todayString;
  document.getElementById("dash-streak").textContent = state.data.streak;
}

// ==========================================
// 6. Educational Quiz Module
// ==========================================

let quizCurrentIndex = 0;
let quizScore = 0;

function setupQuizEvents() {
  const startBtn = document.getElementById("btn-start-quiz");
  const restartBtn = document.getElementById("btn-restart-quiz");
  const nextBtn = document.getElementById("btn-next-quiz-q");

  startBtn.addEventListener("click", startQuiz);
  restartBtn.addEventListener("click", startQuiz);
  nextBtn.addEventListener("click", advanceQuiz);
}

function startQuiz() {
  quizCurrentIndex = 0;
  quizScore = 0;
  
  document.getElementById("quiz-intro").classList.add("hidden");
  document.getElementById("quiz-results").classList.add("hidden");
  document.getElementById("quiz-question-box").classList.remove("hidden");
  
  displayQuizQuestion();
}

function displayQuizQuestion() {
  const qObj = QUIZ_QUESTIONS[quizCurrentIndex];
  
  // Update progress headers
  document.getElementById("quiz-q-indicator").textContent = `Question ${quizCurrentIndex + 1} of ${QUIZ_QUESTIONS.length}`;
  document.getElementById("quiz-score-indicator").textContent = `Score: ${quizScore}`;
  
  const pct = ((quizCurrentIndex + 1) / QUIZ_QUESTIONS.length) * 100;
  document.getElementById("quiz-progress-fill").style.width = `${pct}%`;

  // Update question
  document.getElementById("quiz-question-text").textContent = qObj.q;

  // Clear feedback
  document.getElementById("quiz-feedback-box").classList.add("hidden");
  document.getElementById("quiz-feedback-box").className = "quiz-feedback-box hidden";

  // Render option buttons
  const optList = document.getElementById("quiz-options-list");
  optList.innerHTML = qObj.options.map((opt, idx) => `
    <button class="quiz-opt-btn" data-index="${idx}">${opt}</button>
  `).join('');

  // Attach button clicks
  optList.querySelectorAll(".quiz-opt-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      selectQuizOption(parseInt(btn.getAttribute("data-index")));
    });
  });
}

function selectQuizOption(selectedIndex) {
  const qObj = QUIZ_QUESTIONS[quizCurrentIndex];
  const buttons = document.querySelectorAll(".quiz-opt-btn");
  
  // Disable options
  buttons.forEach(btn => btn.disabled = true);

  const fbBox = document.getElementById("quiz-feedback-box");
  const fbTitle = document.getElementById("quiz-feedback-title");
  const fbText = document.getElementById("quiz-feedback-text");
  
  if (selectedIndex === qObj.answer) {
    quizScore++;
    buttons[selectedIndex].classList.add("correct");
    fbBox.classList.add("correct-indicator");
    fbTitle.textContent = "Correct Answer!";
    document.getElementById("quiz-feedback-icon").textContent = "✓";
  } else {
    buttons[selectedIndex].classList.add("wrong");
    buttons[qObj.answer].classList.add("correct"); // show correct answer
    fbBox.classList.add("wrong-indicator");
    fbTitle.textContent = "Incorrect Answer";
    document.getElementById("quiz-feedback-icon").textContent = "✗";
  }

  // Update explanation
  fbText.textContent = qObj.explanation;
  fbBox.classList.remove("hidden");
  
  // Real-time update score banner
  document.getElementById("quiz-score-indicator").textContent = `Score: ${quizScore}`;
}

function advanceQuiz() {
  quizCurrentIndex++;
  
  if (quizCurrentIndex < QUIZ_QUESTIONS.length) {
    displayQuizQuestion();
  } else {
    showQuizResults();
  }
}

async function showQuizResults() {
  document.getElementById("quiz-question-box").classList.add("hidden");
  document.getElementById("quiz-results").classList.remove("hidden");

  document.getElementById("quiz-final-score").textContent = quizScore;
  document.getElementById("quiz-max-score").textContent = QUIZ_QUESTIONS.length;

  const descEl = document.getElementById("quiz-final-desc");
  const iconEl = document.getElementById("quiz-results-icon");

  if (quizScore === QUIZ_QUESTIONS.length) {
    iconEl.textContent = "🏆";
    descEl.innerHTML = "Perfect score! You are officially a <strong>Sustainability Expert</strong>. You have unlocked the <strong>Climate Intellectual</strong> badge.";
    
    // Unlock perfect score badge
    unlockBadge("quiz-expert");
    await saveUserData();
    renderAchievements();
  } else if (quizScore >= 3) {
    iconEl.textContent = "🌟";
    descEl.textContent = "Great job! You have a solid grasp on sustainability facts. Try again to get a perfect score and unlock the badge!";
  } else {
    iconEl.textContent = "📖";
    descEl.textContent = "Climate literacy is a journey. Retake the quiz and check the explanations to learn more!";
  }
}

// ==========================================
// 7. Gamification & Achievements
// ==========================================

function renderAchievements() {
  const container = document.getElementById("badges-grid-container");
  if (!container) return;

  container.innerHTML = ALL_BADGES.map(badge => {
    const isUnlocked = state.data.unlockedBadges.includes(badge.id);
    return `
      <div class="card glass-panel badge-card ${isUnlocked ? 'unlocked' : ''}">
        <div class="badge-lock-overlay">🔒</div>
        <div class="badge-art-container">${badge.icon}</div>
        <h3>${badge.title}</h3>
        <p class="badge-req">${badge.desc}</p>
      </div>
    `;
  }).join('');
}

function unlockBadge(badgeId) {
  if (!state.data.unlockedBadges.includes(badgeId)) {
    state.data.unlockedBadges.push(badgeId);
  }
}

function evaluateDailyActionAchievements() {
  const logs = state.data.dailyActionsLog;
  
  // 1. Accumulate carbon saved
  const totalSavedKg = logs.reduce((sum, item) => sum + item.savedKg, 0);
  if (totalSavedKg >= 50.0) {
    unlockBadge("save-50");
  }

  // 2. Streak 3 days
  if (state.data.streak >= 3) {
    unlockBadge("streak-3");
  }

  // 3. Plant meal hero (logged plant-meal 5 times)
  let plantMealCount = 0;
  let transitCount = 0;

  logs.forEach(log => {
    if (log.actions.includes("plant-meal")) plantMealCount++;
    if (log.actions.includes("public-transit") || log.actions.includes("walk-cycle")) transitCount++;
  });

  if (plantMealCount >= 5) {
    unlockBadge("vegan-hero");
  }
  if (transitCount >= 5) {
    unlockBadge("transit-hero");
  }
}

// ==========================================
// 8. Settings Config
// ==========================================

function setupSettingsEvents() {
  // Settings Target Save
  document.getElementById("btn-save-settings-targets").addEventListener("click", async () => {
    const targetInput = parseFloat(document.getElementById("settings-target-budget").value) || 5.0;
    const electricityInput = parseFloat(document.getElementById("settings-regional-electricity").value) || 0.40;

    state.data.targetBudget = targetInput;
    state.data.gridElectricityFactor = electricityInput;

    calculateAndRenderEmissions();
    await saveUserData();

    alert("Settings targets successfully saved!");
  });

  // Settings Save Firebase
  document.getElementById("btn-save-settings-firebase").addEventListener("click", async () => {
    const apiKey = document.getElementById("settings-firebase-apiKey").value.trim();
    const projectId = document.getElementById("settings-firebase-projectId").value.trim();
    const authDomain = document.getElementById("settings-firebase-authDomain").value.trim();

    if (!apiKey || !projectId) {
      alert("Please fill in at least API Key and Project ID to connect.");
      return;
    }

    const newConfig = {
      apiKey,
      projectId,
      authDomain: authDomain || `${projectId}.firebaseapp.com`,
      storageBucket: `${projectId}.appspot.com`
    };

    localStorage.setItem('eco_firebase_config', JSON.stringify(newConfig));
    firebaseConfig = newConfig;

    alert("Saving credentials. App will reload to connect.");
    window.location.reload();
  });

  // Settings Disconnect
  document.getElementById("btn-disconnect-firebase").addEventListener("click", () => {
    if (confirm("Disconnect authentication and clear credentials? App will run in Offline Mode.")) {
      localStorage.removeItem('eco_firebase_config');
      localStorage.removeItem('eco_trace_data'); // clear local cached data to let user log in fresh
      window.location.reload();
    }
  });
}

function populateSettingsFirebaseInputs(config) {
  document.getElementById("settings-firebase-apiKey").value = config.apiKey || "";
  document.getElementById("settings-firebase-projectId").value = config.projectId || "";
  document.getElementById("settings-firebase-authDomain").value = config.authDomain || "";
}
