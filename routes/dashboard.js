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
                age: user.age,
                weight: user.weight,
                height: user.height,
                fitnessGoal: user.goal || 'general fitness',
                dailyCalorieGoal: user.dailyCalorieGoal || 2000,
                waterGoal: user.waterGoal
            },
            stats: user.todayStats || {
                caloriesConsumed: 0,
                caloriesBurned: 0,
                waterIntake: 0
            }
        });
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

        // Mark as modified if it's a nested object (important for some drivers, 
        // though our mock handles it differently, let's keep it clean)
        await user.save();

        res.json(user.currentMealPlan);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
