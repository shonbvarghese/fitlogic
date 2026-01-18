# Implementation Plan - AI Diet Planner Feature

## Overview
We will add a "Smart Diet Planner" feature to the FITLOGIC app. This feature allows users to input their physiological details and preferences to receive a personalized 7-day meal plan.

## User Flow
1. User navigates to the "Diet Planner" section (accessible via specialized button or sidebar).
2. User fills out a form with:
    - Personal Info: Age, Gender, Height, Weight
    - Preferences: Diet Type (Veg/Non-Veg/Vegan), Region (Indian/Kerala/International)
    - Goals: Fitness Goal, Activity Level
3. User clicks "Generate Plan".
4. App calculates Calorie Target (using BMR/TDEE formulation) if not provided.
5. App generates a 7-day meal plan (Breakfast, Lunch, Dinner, Snack).
6. Result is displayed in a clean, card-based layout.

## Technical Architecture

### Frontend
- **New UI Component**: Diet Planner Form & Result Display.
- **Location**: We will integrate this into the main dashboard or a new `diet.html` page. For seamless integration, adding it to the dashboard or a dedicated tab is best. Let's create a dedicated `diet-planner.html` derived from `index.html` structure.
- **Tech**: HTML5, Vanilla JS, CSS (existing styles).

### Backend
- **Endpoint**: `POST /api/generate-diet`
- **Logic**: 
    - Receive user inputs.
    - Calculate TDEE (Total Daily Energy Expenditure) based on Harris-Benedict equation.
    - Adjust calories based on Goal (e.g., -500 for fat loss).
    - **Generation Logic**: A logic-based generator (simulating the AI) that selects meals from a predefined database based on:
        - `diet_type` (filters out meat for veg)
        - `region` (selects cuisine-specific dishes)
        - `calories` (adjusts portion sizes or meal complexity - simplified for this version)

## Execution Steps

1. **Update `server.js`**:
    - Add logic to calculate calories.
    - Add a "Meal Database" (JSON structure with meals tagged by region/type).
    - Add `/api/generate-diet` endpoint to return a 7-day plan.

2. **Create Frontend Interface**:
    - Create `public/diet.html`.
    - Add the form with proper inputs.
    - Add the "Results" section (initially hidden).

3. **Wire up Logic (`public/js/diet.js`)**:
    - Handle form submission.
    - Fetch from API.
    - Render the returned 7-day plan dynamically.

4. **Styling**:
    - Ensure it matches the "Premium/Dark Mode" aesthetic of FITLOGIC.
