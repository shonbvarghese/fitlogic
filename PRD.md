# Product Requirements Document (PRD)
## FITLOGIC - Smart Health & Fitness Planner

**Document Version:** 1.0  
**Date:** January 18, 2026  
**Project Name:** FITLOGIC (Smart Health Planner)  
**Brand Name:** FITSHARK  

---

## 1. Executive Summary

FITLOGIC is a web-based health and fitness planning application designed to help users track their diet, workouts, and fitness goals. The application provides a comprehensive dashboard for monitoring daily health metrics, meal planning capabilities, and fitness goal customization. It serves as a complete ecosystem for health-conscious individuals looking to optimize their fitness journey.

---

## 2. Vision & Objectives

### Vision
To create an intuitive, user-friendly platform that empowers individuals to take control of their health by combining diet tracking, workout logging, and personalized fitness planning in a single integrated solution.

### Primary Objectives
- Enable users to set and track fitness goals (fat loss, weight gain, muscle building, general fitness)
- Provide daily health metrics tracking and monitoring
- Facilitate meal planning and nutritional management
- Deliver a seamless user experience with interactive dashboards and navigation
- Support data-driven health decisions through comprehensive analytics

---

## 3. Target Audience

- **Primary Users:** Health-conscious individuals aged 18-45 interested in fitness and nutrition
- **Use Cases:** 
  - Gym enthusiasts tracking their progress
  - People following structured meal plans
  - Users monitoring daily calorie intake and expenditure
  - Fitness enthusiasts with specific body composition goals

---

## 4. Key Features

### 4.1 Landing Page & Goal Selection
- **Hero Section:** Marketing-focused landing page introducing FITSHARK brand
- **Navigation:** Links to Home, Programs, About Us, and Contact Us
- **Goal Selection Interface:** Users select from four primary fitness goals:
  - 🔥 Fat Loss
  - 💪 Weight Gain
  - 🏋️‍♂️ Muscle Building
  - ❤️ General Fitness

### 4.2 Dashboard
- **Real-time Health Metrics Display:**
  - Calories consumed vs. daily goal
  - Calories burned through exercise
  - Net calorie calculation
  - Progress visualization with graphical indicators
  - Water intake tracking with daily goals

- **User Profile Management:**
  - Age, weight, height tracking
  - Active fitness goal management
  - Daily calorie goal customization
  - Water intake goal setting

### 4.3 Meal Planner
- **Weekly Meal Planning:** Structured meal plan for all 7 days
- **Meal Categories:** Breakfast, Lunch, Dinner, Snack
- **Meal Management:**
  - View existing meal plans
  - Add/update meals for specific days
  - Drag-and-drop functionality for easy rearrangement
  - Pre-populated sample meals (Oatmeal & Berries, Grilled Chicken Salad, etc.)

### 4.4 Workout Logger
- **Navigation Point:** Available in sidebar for future implementation
- **Intended Functionality:** Track exercises and calories burned

### 4.5 Settings
- **Navigation Point:** Available in sidebar for future implementation
- **Intended Functionality:** User preferences and account management

---

## 5. Technical Architecture

### 5.1 Tech Stack
- **Frontend:** HTML5, CSS3, JavaScript (Vanilla)
- **Backend:** Node.js with Express.js
- **Data Storage:** In-memory data store (currently; replaceable with MongoDB)
- **Styling:** Custom CSS with Google Fonts (Inter, Oswald)
- **Port:** 4000

### 5.2 Project Structure
```
fitlogic/
├── package.json          (Dependencies: Express v4.18.2)
├── server.js             (Express server & API routes)
├── README.md             (Project documentation)
├── public/
│   ├── index.html        (Main HTML template)
│   ├── css/
│   │   └── style.css     (Global styling, dark theme)
│   └── js/
│       └── app.js        (Client-side logic & API calls)
```

### 5.3 API Endpoints

| Endpoint | Method | Purpose | Response |
|----------|--------|---------|----------|
| `/api/dashboard` | GET | Fetch user profile and daily stats | `{profile, stats}` |
| `/api/water/add` | POST | Increment daily water intake | `{waterIntake}` |
| `/api/meals` | GET | Fetch weekly meal plan | Meal plan object |
| `/api/meals` | POST | Update specific meal for a day | `{success, plan}` |

---

## 6. User Flow

1. **Landing Page:** User arrives at FITSHARK landing page with branding and CTAs
2. **Goal Selection:** User selects their primary fitness goal from 4 options
3. **Dashboard:** Application transitions to main dashboard with sidebar navigation
4. **Dashboard View:** User sees real-time health metrics (calories, water, progress)
5. **Meal Planner:** User can navigate to meal planning interface to view/edit weekly meals
6. **Additional Features:** Access to Workout Logger and Settings (future implementation)
7. **Logout:** User can exit the application and return to landing page

---

## 7. Data Model

### User Profile Object
```json
{
  "age": 25,
  "weight": 70,          // kg
  "height": 175,         // cm
  "fitnessGoal": "muscle_gain",
  "dailyCalorieGoal": 2200,
  "waterGoal": 8         // glasses
}
```

### Daily Stats Object
```json
{
  "caloriesConsumed": 1850,
  "caloriesBurned": 450,
  "waterIntake": 5
}
```

### Meal Plan Object
```json
{
  "Monday": {
    "Breakfast": "Oatmeal & Berries",
    "Lunch": "Grilled Chicken Salad",
    "Dinner": "Salmon & Quinoa",
    "Snack": "Apple"
  },
  "Tuesday": { ... },
  ...
}
```

---

## 8. Design Specifications

### Color Scheme
- **Primary Color:** #ff5722 (Vibrant Orange)
- **Background (Dark Mode):** #0a0a0a
- **Card Background:** #1a1a1a
- **Text Primary:** #ffffff
- **Text Muted:** #a1a1aa
- **Borders:** #333

### Typography
- **Headings:** Oswald (500, 700 weights)
- **Body:** Inter (300, 400, 600, 700 weights)

### Design Elements
- Glass-morphism effect on cards
- Dark theme with high contrast
- Responsive design for multiple screen sizes
- Icon-based visual indicators for goals
- Progress bars for metric tracking

---

## 9. Current Functionality Status

| Feature | Status | Notes |
|---------|--------|-------|
| Landing Page | ✅ Complete | Hero section, navigation, goal cards |
| Goal Selection | ✅ Complete | 4 goal options with icons |
| Dashboard | ✅ Implemented | Metrics display, profile data |
| Meal Planner | ✅ Implemented | View/edit meals, drag-drop ready |
| Workout Logger | 📋 Navigation Ready | Backend route available, UI pending |
| Settings | 📋 Navigation Ready | Backend route available, UI pending |
| Water Intake Tracking | ✅ Implemented | Add water functionality |
| API Routes | ✅ Implemented | Dashboard, meals, water endpoints |

---

## 10. Future Enhancements

- [ ] Workout logger with exercise database and calorie burn calculations
- [ ] Settings page for account management and preferences
- [ ] Database integration (MongoDB) for persistent data storage
- [ ] User authentication and multi-user support
- [ ] Advanced analytics and progress charts
- [ ] Workout video tutorials and exercise library
- [ ] Mobile app version
- [ ] Social features (friend challenges, community support)
- [ ] Integration with fitness trackers and wearables
- [ ] AI-powered meal and workout recommendations

---

## 11. Success Metrics

- User engagement rate (daily active users)
- Goal completion rate
- Meal plan adherence
- Daily metric tracking frequency
- User retention rate

---

## 12. Dependencies

```json
{
  "express": "^4.18.2"
}
```

### Dev Instructions
- **Start:** `npm start` (runs `node server.js`)
- **Dev Mode:** `npm run dev` (runs with --watch flag for auto-reload)

---

## 13. Deployment Notes

- Application runs on **localhost:4000**
- Static files served from `/public` directory
- Ready for deployment to hosting platforms supporting Node.js
- In-memory storage suitable for development; requires database migration for production

---

## 14. Document History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Jan 18, 2026 | Initial PRD creation based on project structure and implementation |

---

**Document prepared based on existing project files and structure.**
