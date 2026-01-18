const express = require('express');
const path = require('path');
const app = express();
const PORT = 4000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// In-memory data store (replacing MongoDB)
let userProfile = {
    age: 25,
    weight: 70, // kg
    height: 175, // cm
    fitnessGoal: 'muscle_gain',
    dailyCalorieGoal: 2200,
    waterGoal: 8
};

let dailyStats = {
    caloriesConsumed: 1850,
    caloriesBurned: 450,
    waterIntake: 5
};

let mealPlan = {
    'Monday': { 'Breakfast': 'Oatmeal & Berries', 'Lunch': 'Grilled Chicken Salad', 'Dinner': 'Salmon & Quinoa', 'Snack': 'Apple' },
    'Tuesday': { 'Breakfast': 'Eggs & Toast', 'Lunch': 'Turkey Wrap', 'Dinner': 'Vegetable Stir Fry', 'Snack': 'Yogurt' },
    'Wednesday': {},
    'Thursday': {},
    'Friday': {},
    'Saturday': {},
    'Sunday': {}
};

// API Routes

// Get Dashboard Data
app.get('/api/dashboard', (req, res) => {
    res.json({
        profile: userProfile,
        stats: dailyStats
    });
});

// Update Water Intake
app.post('/api/water/add', (req, res) => {
    dailyStats.waterIntake += 1;
    res.json({ waterIntake: dailyStats.waterIntake });
});

// Get Meal Plan
app.get('/api/meals', (req, res) => {
    res.json(mealPlan);
});

// Update Meal Plan
app.post('/api/meals', (req, res) => {
    const { day, type, meal } = req.body;
    if (mealPlan[day]) {
        mealPlan[day][type] = meal;
        res.json({ success: true, plan: mealPlan });
    } else {
        res.status(400).json({ error: 'Invalid day' });
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
