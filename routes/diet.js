const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');

// Initialize Gemini
// Note: We initialize this inside the route or globally if key is present.
// Putting it here assumes key is in process.env when file is loaded, which is fine if dotenv config is early in server.js

// @desc    Generate a 7-day diet plan using Google AI
// @route   POST /api/diet/generate
// @access  Public (or Private if we enforce logic) - Let's make it optional but save if logged in
router.post('/generate', async (req, res) => {
    try {
        const { age, gender, height, weight, goal, activity_level, diet_type, region } = req.body;

        if (!process.env.GEMINI_API_KEY) {
            return res.status(500).json({ message: "Server Error: GEMINI_API_KEY not configured." });
        }

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        // Using exactly 'gemini-flash-latest' which exists in this environment
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

        const prompt = `
        Act as an expert nutritionist. Create a personalized 7-day meal plan based on the following profile:
        - Age: ${age}
        - Gender: ${gender}
        - Height: ${height}cm
        - Weight: ${weight}kg
        - Goal: ${goal}
        - Activity Level: ${activity_level}
        - Diet Preference: ${diet_type}
        - Regional Cuisine Preference: ${region}

        Requirements:
        1. Calculate the estimated daily calorie target for this profile and goal.
        2. Provide a meal plan for Monday through Sunday.
        3. Include 4 meals per day: Breakfast, Lunch, Dinner, Snack.
        4. Meals should be realistic, simple, and align with the cuisine preference.
        5. Return the result STRICTLY as a JSON object with this structure:
        {
            "targetCalories": 2200,
            "plan": {
                 "Monday": { "Breakfast": "Meal Name (~kcal)", "Lunch": "...", "Dinner": "...", "Snack": "..." },
                 ...
            }
        }
        Do not use Markdown formatting (like \`\`\`json). Just the raw JSON string.
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text();

        // Clean up markdown if the model ignores instructions
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();

        const jsonResult = JSON.parse(text);

        // If user is authenticated (via header check manually or if we made this route protected), save it.
        // For this "Public" capable endpoint, we just return it. 
        // If the client sends a token, we could identify user and save.

        // Let's check for user manually to save
        if (req.headers.authorization) {
            // This logic is duplicated from middleware, but allows optional auth
            // Ideally we split into two routes or use a "tryAuth" middleware.
            // For now, let's just return the JSON and let the frontend call a "save" endpoint.
        }

        res.json({
            success: true,
            targetCalories: jsonResult.targetCalories,
            plan: jsonResult.plan
        });

    } catch (error) {
        console.error("AI Generation Error:", error);
        res.status(500).json({ message: "Failed to generate plan. AI service authentication or parsing error." });
    }
});

// @desc    Save meal plan to user profile
// @route   POST /api/diet/save
// @access  Private
router.post('/save', protect, async (req, res) => {
    try {
        const { plan, targetCalories } = req.body;

        const user = await User.findById(req.user._id);

        if (user) {
            user.currentMealPlan = plan;
            user.dailyCalorieGoal = targetCalories;

            // Allow updating stats from the generation form if passed?
            // For now just save the plan.

            await user.save();
            res.json({ success: true, message: "Plan saved to profile" });
        } else {
            res.status(404).json({ message: "User not found" });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
