// State
let currentView = 'landing-page';
const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const mealTypes = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];

// DOM Elements
const views = {
    'landing-page': document.getElementById('landing-page'),
    dashboard: document.getElementById('dashboard'),
    'meal-planner': document.getElementById('meal-planner')
};

const appSidebar = document.getElementById('app-sidebar');
const appMain = document.getElementById('app-main');

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    // Initially show landing page, hide app interface
    showView('landing-page');
    initMealPlanner();
    setupDragAndDrop();
});

// Navigation
function showView(viewName) {
    // Handle App vs Landing Page Layout
    if (viewName === 'landing-page') {
        appSidebar.classList.add('hidden');
        appMain.classList.add('hidden');
        views['landing-page'].classList.remove('hidden');
    } else {
        appSidebar.classList.remove('hidden');
        appMain.classList.remove('hidden');
        views['landing-page'].classList.add('hidden');
        
        // Hide all app views first
        Object.keys(views).forEach(key => {
            if (key !== 'landing-page') views[key].classList.add('hidden');
        });
        
        // Show specific app view
        views[viewName].classList.remove('hidden');
        
        // Load data
        if (viewName === 'dashboard') loadDashboardData();
        if (viewName === 'meal-planner') loadMealPlan();
    }

    // Update Sidebar Active State
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.textContent.toLowerCase().replace(' ', '-') === viewName) {
            btn.classList.add('active');
        }
    });
}

function scrollToGoals() {
    document.getElementById('goal-selection').scrollIntoView({ behavior: 'smooth' });
}

function selectGoal(goal) {
    console.log('Selected Goal:', goal);
    // Here you would typically save the goal to the backend
    // For now, we just transition to the dashboard
    showView('dashboard');
}

function logout() {
    showView('landing-page');
}

// Dashboard Logic
async function loadDashboardData() {
    try {
        const response = await fetch('/api/dashboard');
        const data = await response.json();
        
        updateDashboardUI(data);
    } catch (error) {
        console.error('Error loading dashboard:', error);
    }
}

function updateDashboardUI(data) {
    const { stats, profile } = data;

    // Calories
    document.getElementById('cal-consumed').textContent = stats.caloriesConsumed;
    document.getElementById('cal-goal').textContent = profile.dailyCalorieGoal;
    document.getElementById('cal-burned').textContent = stats.caloriesBurned;
    document.getElementById('cal-net').textContent = stats.caloriesConsumed - stats.caloriesBurned;

    // Progress Bar
    const percentage = Math.min((stats.caloriesConsumed / profile.dailyCalorieGoal) * 100, 100);
    document.getElementById('cal-progress').style.width = `${percentage}%`;

    // Water
    document.getElementById('water-count').textContent = stats.waterIntake;
    document.getElementById('water-goal').textContent = profile.waterGoal;
}

// Water Button
document.getElementById('add-water-btn').addEventListener('click', async () => {
    try {
        const response = await fetch('/api/water/add', { method: 'POST' });
        const data = await response.json();
        document.getElementById('water-count').textContent = data.waterIntake;
    } catch (error) {
        console.error('Error adding water:', error);
    }
});

// Meal Planner Logic
function initMealPlanner() {
    const grid = document.getElementById('planner-grid');
    grid.innerHTML = ''; // Clear

    // Header Row (Days)
    const corner = document.createElement('div');
    corner.className = 'grid-header';
    corner.textContent = 'Meal Type';
    grid.appendChild(corner);

    days.forEach(day => {
        const header = document.createElement('div');
        header.className = 'grid-header';
        header.textContent = day.slice(0, 3);
        grid.appendChild(header);
    });

    // Rows
    mealTypes.forEach(type => {
        // Row Label
        const label = document.createElement('div');
        label.className = 'meal-type-label';
        label.textContent = type;
        grid.appendChild(label);

        // Slots
        days.forEach(day => {
            const slot = document.createElement('div');
            slot.className = 'meal-slot';
            slot.dataset.day = day;
            slot.dataset.type = type;
            
            // Allow Drop
            slot.addEventListener('dragover', handleDragOver);
            slot.addEventListener('dragleave', handleDragLeave);
            slot.addEventListener('drop', handleDrop);

            grid.appendChild(slot);
        });
    });
}

async function loadMealPlan() {
    try {
        const response = await fetch('/api/meals');
        const plan = await response.json();
        
        // Populate slots
        document.querySelectorAll('.meal-slot').forEach(slot => {
            const day = slot.dataset.day;
            const type = slot.dataset.type;
            
            if (plan[day] && plan[day][type]) {
                slot.textContent = plan[day][type];
                slot.classList.add('filled');
            } else {
                slot.textContent = '';
                slot.classList.remove('filled');
            }
        });
    } catch (error) {
        console.error('Error loading meal plan:', error);
    }
}

// Drag and Drop Logic
let draggedItem = null;

function setupDragAndDrop() {
    document.querySelectorAll('.fav-item').forEach(item => {
        item.addEventListener('dragstart', (e) => {
            draggedItem = e.target.textContent;
            e.dataTransfer.setData('text/plain', draggedItem);
            e.target.style.opacity = '0.5';
        });

        item.addEventListener('dragend', (e) => {
            e.target.style.opacity = '1';
            draggedItem = null;
        });
    });
}

function handleDragOver(e) {
    e.preventDefault();
    e.currentTarget.classList.add('drag-over');
}

function handleDragLeave(e) {
    e.currentTarget.classList.remove('drag-over');
}

async function handleDrop(e) {
    e.preventDefault();
    const slot = e.currentTarget;
    slot.classList.remove('drag-over');
    
    const mealName = e.dataTransfer.getData('text/plain');
    
    if (mealName) {
        // Optimistic UI Update
        slot.textContent = mealName;
        
        // API Call
        const day = slot.dataset.day;
        const type = slot.dataset.type;
        
        try {
            await fetch('/api/meals', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ day, type, meal: mealName })
            });
        } catch (error) {
            console.error('Error saving meal:', error);
            slot.textContent = 'Error'; // Revert or show error
        }
    }
}
