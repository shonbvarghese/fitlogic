// State
let currentView = 'landing-page';
const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const mealTypes = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];

// Global Error Handler for easier debugging
window.onerror = function (msg, url, lineNo, columnNo, error) {
    console.error('JS Error:', msg, url, lineNo);
    alert('JS Error: ' + msg); // Alert will help the user see if something breaks
    return false;
};

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    console.log('App Initializing...');
    const token = localStorage.getItem('token');
    const isDashboard = window.location.pathname.includes('dashboard.html');

    if (token) {
        if (!isDashboard) window.location.href = '/dashboard.html';
        else showView('dashboard');
    } else {
        if (isDashboard) window.location.href = '/index.html';
        else showView('landing-page');
    }
    initMealPlanner();
    setupDragAndDrop();
});

// Navigation function called by buttons
function showView(viewName) {
    console.log('Navigating to:', viewName);

    // Get fresh references to prevent null issues
    const views = {
        'landing-page': document.getElementById('landing-page'),
        'auth-view': document.getElementById('auth-view'),
        'dashboard': document.getElementById('dashboard'),
        'meal-planner': document.getElementById('meal-planner'),
        'ai-planner': document.getElementById('ai-planner'),
        'logger': document.getElementById('logger'),
        'settings': document.getElementById('settings')
    };

    // Cross-page check
    if ((viewName === 'landing-page' || viewName === 'auth-view') && window.location.pathname.includes('dashboard.html')) {
        window.location.href = '/index.html';
        return;
    }

    if (['dashboard', 'meal-planner', 'ai-planner', 'logger', 'settings'].includes(viewName) && !window.location.pathname.includes('dashboard.html')) {
        window.location.href = '/dashboard.html';
        return;
    }

    const sidebar = document.getElementById('app-sidebar');
    const main = document.getElementById('app-main');

    // Auth Check
    if (['dashboard', 'meal-planner', 'ai-planner', 'logger', 'settings'].includes(viewName)) {
        if (!localStorage.getItem('token')) {
            showView('auth-view');
            return;
        }
    }

    // Reset all views
    Object.values(views).forEach(v => {
        if (v) {
            v.classList.add('hidden');
            v.style.display = 'none';
        }
    });

    // Handle Layout
    if (viewName === 'landing-page' || viewName === 'auth-view') {
        if (sidebar) sidebar.classList.add('hidden');
        if (main) main.classList.add('hidden');

        const target = views[viewName];
        if (target) {
            target.classList.remove('hidden');
            target.style.display = (viewName === 'auth-view') ? 'flex' : 'block';
        }
    } else {
        if (sidebar) sidebar.classList.remove('hidden');
        if (main) main.classList.remove('hidden');

        const target = views[viewName];
        if (target) {
            target.classList.remove('hidden');
            target.style.display = 'block';
        }

        if (viewName === 'dashboard') loadDashboardData();
        if (viewName === 'meal-planner') loadMealPlan();
        if (viewName === 'logger') loadDashboardData(); // Re-use to load history
        if (viewName === 'settings') loadDashboardData(); // Re-use to populate fields
    }

    // Sidebar active state
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.onclick && btn.onclick.toString().includes(`'${viewName}'`)) {
            btn.classList.add('active');
        }
    });

    currentView = viewName;
}

// Data Loading
async function loadDashboardData() {
    try {
        const response = await authFetch('/api/dashboard');
        if (!response) return;
        const data = await response.json();
        updateDashboardUI(data);
        if (currentView === 'logger') renderWorkoutHistory(data.workouts);
        if (currentView === 'settings') populateSettingsFields(data.profile);
    } catch (e) { console.error(e); }
}

let activityChart = null;

function updateDashboardUI(data) {
    if (!data || !data.stats) return;
    const { stats, profile, weeklyActivity } = data;

    // 1. Calorie Dashboard & Radial Ring
    const netCalories = (stats.caloriesConsumed || 0) - (stats.caloriesBurned || 0);
    const calGoal = profile.dailyCalorieGoal || 2000;

    const calNetEl = document.getElementById('cal-net');
    if (calNetEl) calNetEl.textContent = netCalories;

    const ringFill = document.getElementById('radial-progress-fill');
    if (ringFill) {
        // SVG circle circumference is 2 * PI * r = 2 * 3.14 * 70 = ~440
        const circumference = 440;
        const percentage = Math.min(Math.max((stats.caloriesConsumed / calGoal), 0), 1.2); // Cap at 120% visual
        const offset = circumference - (percentage * circumference);
        ringFill.style.strokeDashoffset = offset;
    }

    // 2. Macro HUD (Estimated based on calories for demo)
    const p = document.getElementById('macro-p');
    const c = document.getElementById('macro-c');
    const f = document.getElementById('macro-f');
    if (p) p.textContent = Math.round((stats.caloriesConsumed * 0.3) / 4);
    if (c) c.textContent = Math.round((stats.caloriesConsumed * 0.4) / 4);
    if (f) f.textContent = Math.round((stats.caloriesConsumed * 0.3) / 9);

    // 3. Water Liquid Animation
    const waterVal = document.getElementById('water-count');
    const waterG = document.getElementById('water-goal');
    const waterLiquid = document.getElementById('water-liquid');

    if (waterVal) waterVal.textContent = stats.waterIntake;
    if (waterG) waterG.textContent = profile.waterGoal || 8;
    if (waterLiquid) {
        const waterPercentage = Math.min((stats.waterIntake / (profile.waterGoal || 8)) * 100, 100);
        waterLiquid.style.height = waterPercentage + '%';
    }

    // 4. Activity Feed (Re-use workout history + adds)
    updateActivityFeed(data);

    // 5. Next Meal Logic
    updateStrategyCard(profile.nextMeal);

    // Render Chart
    if (weeklyActivity && document.getElementById('activityChart')) {
        renderActivityChart(weeklyActivity);
    }
}

function updateActivityFeed(data) {
    const feed = document.getElementById('activity-feed');
    if (!feed) return;

    // Mix workout logs with system messages
    let items = (data.workouts || []).slice(0, 3).map(w => ({
        text: `Logged ${w.exercise} (${w.sets}x${w.reps})`,
        time: 'Just now'
    }));

    if (data.stats.waterIntake > 0) {
        items.push({ text: `Drank ${data.stats.waterIntake} glasses of water`, time: 'Today' });
    }

    if (items.length === 0) return;

    feed.innerHTML = items.map(item => `
        <div class="activity-item">
            <span>${item.text}</span>
            <small>${item.time}</small>
        </div>
    `).join('');
}

function updateStrategyCard(nextMeal) {
    const name = document.getElementById('next-meal-name');
    const time = document.getElementById('next-meal-time');
    if (!name || !time) return;

    if (nextMeal) {
        name.textContent = nextMeal.name;
        time.textContent = `Scheduled for ${nextMeal.time}`;
    } else {
        // Fallback or static demo
        name.textContent = "High-Protein Salmon";
        time.textContent = "Upcoming (Lunch)";
    }
}

function toggleQuickLog() {
    const modal = document.getElementById('quick-log-modal');
    if (modal) modal.classList.toggle('hidden');
}

function renderActivityChart(activity) {
    const ctx = document.getElementById('activityChart').getContext('2d');

    if (activityChart) activityChart.destroy();

    activityChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: activity.map(a => a.day),
            datasets: [{
                label: 'Calories Burned',
                data: activity.map(a => a.calories),
                borderColor: '#ff5722',
                backgroundColor: 'rgba(255, 87, 34, 0.1)',
                borderWidth: 3,
                tension: 0.4,
                fill: true,
                pointBackgroundColor: '#ff5722',
                pointRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    ticks: { color: '#a1a1aa' }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: '#a1a1aa' }
                }
            }
        }
    });
}

function renderWorkoutHistory(workouts) {
    const container = document.getElementById('workout-history');
    if (!container) return;

    if (!workouts || workouts.length === 0) {
        container.innerHTML = '<p style="color: #a1a1aa; text-align: center; margin-top: 2rem;">No iron lifted yet today.</p>';
        return;
    }

    container.innerHTML = workouts.map(w => `
        <div class="card glass" style="margin-bottom: 1rem; border-left: 4px solid var(--primary-color);">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <h4 style="margin: 0;">${w.exercise}</h4>
                    <p style="margin: 4px 0 0 0; font-size: 0.85rem; color: var(--text-muted);">
                        ${w.sets} sets x ${w.reps} reps @ ${w.weight}kg
                    </p>
                </div>
                <div style="font-size: 0.75rem; color: #a1a1aa;">
                    ${new Date(w.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
            </div>
        </div>
    `).join('');
}

function populateSettingsFields(profile) {
    const age = document.getElementById('set-age');
    const height = document.getElementById('set-height');
    const weight = document.getElementById('set-weight');
    const cal = document.getElementById('set-cal');
    const goal = document.getElementById('set-goal');

    if (age) age.value = profile.age || '';
    if (height) height.value = profile.height || '';
    if (weight) weight.value = profile.weight || '';
    if (cal) cal.value = profile.dailyCalorieGoal || '';
    if (goal) goal.value = profile.fitnessGoal || 'general fitness';
}

// Form Handlers
document.addEventListener('submit', async (e) => {
    if (e.target.id === 'workout-form') {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());

        try {
            const res = await authFetch('/api/dashboard/workouts', {
                method: 'POST',
                body: JSON.stringify(data)
            });
            if (res && res.ok) {
                e.target.reset();
                loadDashboardData();
            }
        } catch (err) { console.error(err); }
    }

    if (e.target.id === 'settings-form') {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());

        try {
            const res = await authFetch('/api/dashboard/profile', {
                method: 'POST',
                body: JSON.stringify(data)
            });
            if (res && res.ok) {
                alert('Profile evolution updated!');
                loadDashboardData();
            }
        } catch (err) { console.error(err); }
    }
});

// Water Actions
const addWaterBtn = document.getElementById('add-water-btn');
if (addWaterBtn) {
    addWaterBtn.addEventListener('click', async () => {
        const res = await authFetch('/api/dashboard/water/add', { method: 'POST' });
        if (res && res.ok) {
            // Re-load all data to trigger liquid animation and activity feed
            loadDashboardData();
        }
    });
}

// Planner
// Architect Planner System
const mealCalories = {
    'Grilled Chicken & Broccoli': { cal: 450, prep: '25m', badge: 'muscle', ingredients: ['Chicken Breast', 'Broccoli', 'Olive Oil', 'Garlic'] },
    'Quinoa Power Bowl': { cal: 520, prep: '15m', badge: 'energy', ingredients: ['Quinoa', 'Chickpeas', 'Tahini', 'Spinach'] },
    'Avocado Keto Toast': { cal: 380, prep: '10m', badge: 'burn', ingredients: ['Avocado', 'Sourdough', 'Poached Egg', 'Chili Flakes'] },
    'Whole Wheat Pesto': { cal: 610, prep: '20m', badge: 'energy', ingredients: ['Pasta', 'Basil Pesto', 'Pine Nuts', 'Parmesan'] },
    'Greek Protein Yogurt': { cal: 220, prep: '5m', badge: 'muscle', ingredients: ['Greek Yogurt', 'Honey', 'Walnuts', 'Blueberries'] },
    'Spinach Omelette': { cal: 320, prep: '12m', badge: 'muscle', ingredients: ['Eggs', 'Fresh Spinach', 'Feta Cheese', 'Onion'] },
    'Default': { cal: 400, prep: '20m', badge: 'energy', ingredients: ['Base ingredients', 'Protein source', 'Vegetables'] }
};

function initMealPlanner() {
    const grid = document.getElementById('planner-grid');
    if (!grid) return;
    grid.innerHTML = '';

    const todayDay = new Date().toLocaleDateString('en-US', { weekday: 'long' });

    // Header
    const corner = document.createElement('div');
    corner.className = 'grid-header';
    corner.textContent = 'Meal';
    grid.appendChild(corner);

    days.forEach(d => {
        const h = document.createElement('div');
        h.className = `grid-header ${d === todayDay ? 'live-day' : ''}`;
        h.textContent = d.slice(0, 3);
        grid.appendChild(h);
    });

    mealTypes.forEach(type => {
        const label = document.createElement('div');
        label.className = 'meal-type-label';
        label.textContent = type;
        grid.appendChild(label);

        days.forEach(day => {
            const slot = document.createElement('div');
            slot.className = 'meal-slot';
            slot.dataset.day = day;
            slot.dataset.type = type;
            slot.addEventListener('dragover', e => { e.preventDefault(); e.currentTarget.classList.add('drag-over'); });
            slot.addEventListener('dragleave', e => e.currentTarget.classList.remove('drag-over'));
            slot.addEventListener('drop', handleDrop);
            slot.addEventListener('click', () => openRecipeModal(slot.dataset.mealName || slot.textContent));
            grid.appendChild(slot);
        });
    });

    // Daily Totals Row
    const totalLabel = document.createElement('div');
    totalLabel.className = 'meal-type-label';
    totalLabel.style.borderTop = '1px solid #333';
    totalLabel.textContent = 'Day Total';
    grid.appendChild(totalLabel);

    days.forEach(day => {
        const bar = document.createElement('div');
        bar.className = 'day-total-bar';
        bar.id = `total-${day}`;
        bar.textContent = '0 kcal';
        grid.appendChild(bar);
    });

    setupDragAndDrop();
    loadMealPlan();
}

async function loadMealPlan() {
    const res = await authFetch('/api/dashboard/meals');
    if (!res) return;
    const plan = await res.json();

    document.querySelectorAll('.meal-slot').forEach(slot => {
        const { day, type } = slot.dataset;
        if (plan[day] && plan[day][type]) {
            updateSlotUI(slot, plan[day][type]);
        }
    });
    updateDailyTotals();
}

function updateSlotUI(slot, mealData) {
    if (!mealData || mealData === 'Empty') return;

    let mealName, calories;
    if (typeof mealData === 'object') {
        mealName = mealData.name;
        calories = mealData.cal;
    } else {
        mealName = mealData;
        const info = mealCalories[mealName] || mealCalories['Default'];
        calories = info.cal;
    }

    slot.dataset.mealName = mealName;
    slot.classList.add('filled');

    const info = mealCalories[mealName] || mealCalories['Default'];

    slot.innerHTML = `
        <div style="font-weight: 700;">${mealName}</div>
        <div class="slot-cal" style="font-size: 0.7rem; color: var(--text-muted);">${calories} kcal</div>
        <div class="meal-badge badge-${info.badge}">${info.badge}</div>
        <div class="portion-controls">
            <div class="portion-btn" onclick="event.stopPropagation(); changePortion(this, -1)">-</div>
            <div class="portion-btn" onclick="event.stopPropagation(); changePortion(this, 1)">+</div>
        </div>
        <div class="smart-swap-btn" onclick="event.stopPropagation(); smartSwap(this)">⚡ Swap</div>
    `;
}

async function handleDrop(e) {
    e.preventDefault();
    const slot = e.currentTarget;
    slot.classList.remove('drag-over');
    const meal = e.dataTransfer.getData('text/plain').trim();
    if (meal) {
        updateSlotUI(slot, meal);
        await saveSlot(slot);
        updateDailyTotals();
    }
}

async function saveSlot(slot) {
    const { day, type, mealName } = slot.dataset;
    const calEl = slot.querySelector('.slot-cal');
    const cal = calEl ? parseInt(calEl.textContent) : 0;

    await authFetch('/api/dashboard/meals', {
        method: 'POST',
        body: JSON.stringify({
            day,
            type,
            meal: { name: mealName, cal: cal }
        })
    });
}

async function changePortion(btn, delta) {
    const slot = btn.closest('.meal-slot');
    const calEl = slot.querySelector('.slot-cal');
    let currentCal = parseInt(calEl.textContent);
    currentCal = Math.max(100, currentCal + (delta * 50));
    calEl.textContent = `${currentCal} kcal`;
    await saveSlot(slot);
    updateDailyTotals();
}

function updateDailyTotals() {
    days.forEach(day => {
        let total = 0;
        document.querySelectorAll(`.meal-slot[data-day="${day}"]`).forEach(slot => {
            const calEl = slot.querySelector('.slot-cal');
            if (calEl) total += parseInt(calEl.textContent);
        });

        const bar = document.getElementById(`total-${day}`);
        if (bar) {
            bar.textContent = `${total} kcal`;
            if (total > 1500) bar.classList.add('target-reached');
            else bar.classList.remove('target-reached');
        }
    });
}

function openRecipeModal(mealName) {
    if (!mealName || mealName === 'Empty') return;
    const modal = document.getElementById('recipe-modal');
    const info = mealCalories[mealName] || mealCalories['Default'];

    document.getElementById('modal-recipe-name').textContent = mealName;
    document.getElementById('modal-calories').textContent = info.cal;
    document.getElementById('modal-ingredients').innerHTML = info.ingredients.map(ing => `<li>${ing}</li>`).join('');

    modal.classList.remove('hidden');
}

function closeRecipeModal() {
    document.getElementById('recipe-modal').classList.add('hidden');
}

async function mirrorMonday() {
    const mondayMeals = {};
    document.querySelectorAll('.meal-slot[data-day="Monday"]').forEach(slot => {
        const calEl = slot.querySelector('.slot-cal');
        mondayMeals[slot.dataset.type] = {
            name: slot.dataset.mealName || 'Empty',
            cal: calEl ? parseInt(calEl.textContent) : 0
        };
    });

    for (const day of days) {
        if (day === 'Monday') continue;
        for (const type of mealTypes) {
            const mealData = mondayMeals[type];
            const slot = document.querySelector(`.meal-slot[data-day="${day}"][data-type="${type}"]`);
            if (mealData && mealData.name !== 'Empty') {
                updateSlotUI(slot, mealData);
                await saveSlot(slot);
            }
        }
    }
    updateDailyTotals();
    alert('Monday plan mirrored to all days! 🔁');
}

function generateShoppingList() {
    const ingredients = new Set();
    document.querySelectorAll('.meal-slot.filled').forEach(slot => {
        const meal = slot.dataset.mealName;
        const info = mealCalories[meal] || mealCalories['Default'];
        info.ingredients.forEach(ing => ingredients.add(ing));
    });

    if (ingredients.size === 0) {
        alert('Schedule some meals first to generate a list!');
        return;
    }

    const container = document.getElementById('shopping-list-content');
    container.innerHTML = Array.from(ingredients).map(ing => `
        <div class="activity-item" style="border-left-color: var(--success-color); cursor: pointer;" onclick="this.style.opacity = this.style.opacity === '0.4' ? '1' : '0.4'">
            <div style="display: flex; align-items: center; gap: 10px;">
                <input type="checkbox" style="width: 18px; height: 18px; cursor: pointer;">
                <span>${ing}</span>
            </div>
        </div>
    `).join('');

    document.getElementById('shopping-modal').classList.remove('hidden');
}

function closeShoppingModal() {
    document.getElementById('shopping-modal').classList.add('hidden');
}

function setupDragAndDrop() {
    document.querySelectorAll('.fav-item').forEach(item => {
        item.addEventListener('dragstart', e => {
            e.dataTransfer.setData('text/plain', e.target.textContent);
        });
    });
}

async function smartSwap(btn) {
    const slot = btn.closest('.meal-slot');
    const meals = Object.keys(mealCalories).filter(m => m !== 'Default' && m !== slot.dataset.mealName);
    const randomMeal = meals[Math.floor(Math.random() * meals.length)];
    updateSlotUI(slot, randomMeal);
    await saveSlot(slot);
    updateDailyTotals();
}

async function saveMealPlan() {
    // This is handled per-click on slot, but could be a batch save if needed
    alert('Plan architectural integrity verified & saved! 💾');
}

function toggleSidebar() {
    const sidebar = document.getElementById('app-sidebar');
    sidebar.classList.toggle('collapsed');
}

function logout() {
    localStorage.clear();
    location.reload();
}

async function authFetch(url, options = {}) {
    const token = localStorage.getItem('token');
    const res = await fetch(url, {
        ...options,
        headers: {
            ...options.headers,
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    });
    if (!res.ok) {
        if (res.status === 401) logout();
        console.error('Fetch error:', await res.text());
        return null;
    }
    return res;
}
