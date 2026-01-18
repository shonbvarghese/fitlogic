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
        'ai-planner': document.getElementById('ai-planner')
    };

    // Cross-page check
    if ((viewName === 'landing-page' || viewName === 'auth-view') && window.location.pathname.includes('dashboard.html')) {
        window.location.href = '/index.html';
        return;
    }

    if (['dashboard', 'meal-planner', 'ai-planner'].includes(viewName) && !window.location.pathname.includes('dashboard.html')) {
        window.location.href = '/dashboard.html';
        return;
    }

    const sidebar = document.getElementById('app-sidebar');
    const main = document.getElementById('app-main');

    // Auth Check
    if (['dashboard', 'meal-planner', 'ai-planner'].includes(viewName)) {
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
    }

    // Sidebar active state
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.textContent.toLowerCase().includes(viewName.split('-')[0])) {
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
    } catch (e) { console.error(e); }
}

function updateDashboardUI(data) {
    if (!data || !data.stats) return;
    const { stats, profile } = data;

    const calCons = document.getElementById('cal-consumed');
    const calGoal = document.getElementById('cal-goal');
    const calBurn = document.getElementById('cal-burned');
    const calNet = document.getElementById('cal-net');

    if (calCons) calCons.textContent = stats.caloriesConsumed;
    if (calGoal) calGoal.textContent = profile.dailyCalorieGoal || 2000;
    if (calBurn) calBurn.textContent = stats.caloriesBurned;
    if (calNet) calNet.textContent = stats.caloriesConsumed - stats.caloriesBurned;

    const prog = document.getElementById('cal-progress');
    if (prog) {
        const percentage = Math.min((stats.caloriesConsumed / (profile.dailyCalorieGoal || 2000)) * 100, 100);
        prog.style.width = percentage + '%';
    }

    const waterVal = document.getElementById('water-count');
    const waterG = document.getElementById('water-goal');
    if (waterVal) waterVal.textContent = stats.waterIntake;
    if (waterG) waterG.textContent = profile.waterGoal || 8;
}

// Water Actions
const addWaterBtn = document.getElementById('add-water-btn');
if (addWaterBtn) {
    addWaterBtn.addEventListener('click', async () => {
        const res = await authFetch('/api/dashboard/water/add', { method: 'POST' });
        if (res) {
            const data = await res.json();
            const w = document.getElementById('water-count');
            if (w) w.textContent = data.waterIntake;
        }
    });
}

// Planner
function initMealPlanner() {
    const grid = document.getElementById('planner-grid');
    if (!grid) return;
    grid.innerHTML = '';

    // Header
    const corner = document.createElement('div');
    corner.className = 'grid-header';
    corner.textContent = 'Meal';
    grid.appendChild(corner);

    days.forEach(d => {
        const h = document.createElement('div');
        h.className = 'grid-header';
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
            grid.appendChild(slot);
        });
    });
}

async function loadMealPlan() {
    const res = await authFetch('/api/dashboard/meals');
    if (!res) return;
    const plan = await res.json();
    document.querySelectorAll('.meal-slot').forEach(slot => {
        const { day, type } = slot.dataset;
        if (plan[day] && plan[day][type]) {
            slot.textContent = plan[day][type];
            slot.classList.add('filled');
        }
    });
}

async function handleDrop(e) {
    e.preventDefault();
    const slot = e.currentTarget;
    slot.classList.remove('drag-over');
    const meal = e.dataTransfer.getData('text/plain');
    if (meal) {
        slot.textContent = meal;
        const { day, type } = slot.dataset;
        await authFetch('/api/dashboard/meals', {
            method: 'POST',
            body: JSON.stringify({ day, type, meal })
        });
    }
}

function setupDragAndDrop() {
    document.querySelectorAll('.fav-item').forEach(item => {
        item.addEventListener('dragstart', e => {
            e.dataTransfer.setData('text/plain', e.target.textContent);
        });
    });
}

function logout() {
    localStorage.clear();
    location.reload();
}
