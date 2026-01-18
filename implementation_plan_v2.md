# Implementation Plan Phase 2: Full Stack Upgrade & AI Integration

## Goals
1.  **Architecture**: Refactor into a modular MVC-style architecture.
2.  **Database**: Migrate from in-memory to MongoDB (Mongoose).
3.  **Authentication**: Implement User Login/Register (JWT + bcrypt).
4.  **AI Integration**: Replace mock diet generator with Google AI Studio (Gemini) API.
5.  **Environment**: Secure configuration using `.env`.

## New Directory Structure
```
fitlogic/
├── config/
│   └── db.js              # MongoDB Connection
├── models/
│   └── User.js            # User Schema (Profile + MealPlan)
├── routes/
│   ├── auth.js            # /api/auth/register, /api/auth/login
│   └── diet.js            # /api/diet/generate (Google AI)
├── public/
│   ├── js/
│   │   ├── auth.js        # Frontend Auth Logic
│   │   └── ...
├── .env                   # Secrets
├── server.js              # Main Entry (Refactored)
└── ...
```

## Step-by-Step Execution

### 1. Setup & Dependencies
- Install: `mongoose`, `dotenv`, `bcryptjs`, `jsonwebtoken`, `@google/generative-ai`, `cors` (optional but good).
- Create `.env` file with placeholders.

### 2. Database & Models
- **`config/db.js`**: Async connection to MongoDB.
- **`models/User.js`**:
    - Fields: name, email, password, age, height, weight, goal, mealPlan (Object).
    - Methods: Password hashing hooks.

### 3. Google AI Integration
- Refactor Diet Generator to use `GoogleGenerativeAI`.
- Prompt Engineering:
    - Input: JSON of user stats.
    - Output: JSON structure of the weekly meal plan.
    - Model: `gemini-1.5-flash` (fast & cheap) or `gemini-pro`.

### 4. Authentication Endpoints
- **POST /api/auth/register**: Create user, return token.
- **POST /api/auth/login**: Validate, return token.
- **Middleware**: `authMiddleware` to protect `/api/user` and diet saving routes.

### 5. Frontend Updates
- **Login/Register UI**: Add a new view in `index.html`.
- **Auth Logic**:
    - Store JWT in `localStorage`.
    - Check token on load -> Redirect to Dashboard or Login.
- **API Calls**: Include `Authorization: Bearer <token>` header.

## Instructions for User
- You will need to add your `MONGO_URI` and `GEMINI_API_KEY` to the `.env` file after generation.
