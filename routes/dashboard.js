const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');

// @desc    Get dashboard data
// @route   GET /api/dashboard
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        const user = req.user; // Set by protect middleware

        // Return structured data for the frontend
        res.json({
            profile: {
                name: user.name,
                email: user.email,
                age: user.age,
                weight: user.weight,
                height: user.height,
                fitnessGoal: user.goal || 'general fitness',
                dailyCalorieGoal: user.dailyCalorieGoal || 2000,
                waterGoal: user.waterGoal || 8,
                nextMeal: { name: 'Grilled Mediterranean Salmon', time: '1:30 PM (Lunch)' }
            },
            stats: user.todayStats || {
                caloriesConsumed: 0,
                caloriesBurned: 0,
                waterIntake: 0
            },
            workouts: user.workouts || [],
            weeklyActivity: user.weeklyActivity || []
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Update profile settings
// @route   POST /api/dashboard/profile
// @access  Private
router.post('/profile', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        const { age, weight, height, goal, dailyCalorieGoal } = req.body;

        if (age) user.age = age;
        if (weight) user.weight = weight;
        if (height) user.height = height;
        if (goal) user.goal = goal;
        if (dailyCalorieGoal) user.dailyCalorieGoal = dailyCalorieGoal;

        await user.save();
        res.json({ success: true, message: 'Settings updated successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Log a workout
// @route   POST /api/dashboard/workouts
// @access  Private
router.post('/workouts', protect, async (req, res) => {
    try {
        const { exercise, sets, reps, weight } = req.body;
        const user = await User.findById(req.user._id);

        if (!user.workouts) user.workouts = [];

        const newWorkout = {
            id: Date.now().toString(),
            exercise,
            sets,
            reps,
            weight,
            date: new Date()
        };

        user.workouts.unshift(newWorkout); // Add to beginning

        // Simple logic: Each set burns some calories? Let's say 50 base for any entry.
        if (!user.todayStats) user.todayStats = { caloriesConsumed: 0, caloriesBurned: 0, waterIntake: 0 };
        user.todayStats.caloriesBurned = (user.todayStats.caloriesBurned || 0) + (sets * 10);

        await user.save();
        res.json({ success: true, workout: newWorkout, caloriesBurned: user.todayStats.caloriesBurned });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Update water intake
// @route   POST /api/water/add
// @access  Private
router.post('/water/add', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (!user.todayStats) user.todayStats = {};

        user.todayStats.waterIntake = (user.todayStats.waterIntake || 0) + 1;

        await user.save();

        res.json({ waterIntake: user.todayStats.waterIntake });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get Meal Plan
// @route   GET /api/dashboard/meals
// @access  Private
router.get('/meals', protect, async (req, res) => {
    res.json(req.user.currentMealPlan || {});
});

// @desc    Update Meal Plan
// @route   POST /api/dashboard/meals
// @access  Private
router.post('/meals', protect, async (req, res) => {
    try {
        const { day, type, meal } = req.body;
        const user = await User.findById(req.user._id);

        if (!user.currentMealPlan) user.currentMealPlan = {};
        if (!user.currentMealPlan[day]) user.currentMealPlan[day] = {};

        user.currentMealPlan[day][type] = meal;

        await user.save();

        res.json(user.currentMealPlan);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
