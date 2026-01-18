// Local State
let currentPlanData = null;

// Reuse the 'days' and 'mealTypes' from app.js if they were global, 
// but since we want to be independent or safe:
const dietDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const dietMealTypes = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];

document.getElementById('diet-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    // Collect Data
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Generating...';
    submitBtn.disabled = true;

    try {
        // Use endpoint: /api/diet/generate
        // We use standard fetch here to allow generation before login if desired,
        // but if we want to associate it with user, sending token is better.
        // Let's use authFetch if available (global), else fetch.
        // But since authFetch redirects if not logged in, let's stick to fetch for UNPROTECTED generation,
        // unless we want to force login first.
        // The requirements didn't specify strict flow. Let's try standard fetch.

        const response = await fetch('/api/diet/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (result.success) {
            currentPlanData = { plan: result.plan, targetCalories: result.targetCalories };
            displayDietResult(result);
        } else {
            alert('Failed to generate plan: ' + (result.message || 'Unknown error'));
        }

    } catch (error) {
        console.error('Error generating diet:', error);
        alert('An error occurred. Ensure backend is running and configured.');
    } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
});

function displayDietResult(result) {
    document.getElementById('target-calories').textContent = result.targetCalories;

    // Show results section
    const resultsDiv = document.getElementById('diet-results');
    resultsDiv.classList.remove('hidden');

    // Populate Grid
    const grid = document.getElementById('ai-planner-grid');
    grid.innerHTML = ''; // Clear

    // Header Row (Days)
    const corner = document.createElement('div');
    corner.className = 'grid-header';
    corner.textContent = 'Meal Type';
    grid.appendChild(corner);

    dietDays.forEach(day => {
        const header = document.createElement('div');
        header.className = 'grid-header';
        header.textContent = day.slice(0, 3);
        grid.appendChild(header);
    });

    // Rows
    dietMealTypes.forEach(type => {
        // Row Label
        const label = document.createElement('div');
        label.className = 'meal-type-label';
        label.textContent = type;
        grid.appendChild(label);

        // Slots
        dietDays.forEach(day => {
            const slot = document.createElement('div');
            slot.className = 'meal-slot';
            slot.classList.add('filled'); // Mark as filled for potential styling

            // Get data from the result plan
            if (result.plan[day] && result.plan[day][type]) {
                let mealText = result.plan[day][type];
                // Clean up string object if needed
                if (typeof mealText === 'object') mealText = mealText.name;
                slot.textContent = mealText;
                slot.title = mealText;
            }

            grid.appendChild(slot);
        });
    });

    // Scroll to results
    resultsDiv.scrollIntoView({ behavior: 'smooth' });
}

async function applyToMainPlanner() {
    if (!currentPlanData) return;

    // Save to backend profile
    // This requires authentication.
    try {
        if (typeof authFetch !== 'function') {
            console.error("authFetch not found");
            return;
        }

        const response = await authFetch('/api/diet/save', {
            method: 'POST',
            body: JSON.stringify(currentPlanData)
        });

        if (response && response.ok) {
            alert('Plan saved to your profile!');
            if (typeof showView === 'function') {
                showView('meal-planner');
                // Trigger reload of meal planner
                if (window.loadMealPlan) window.loadMealPlan();
            }
        }
        // If not ok, authFetch handles 401. If 500, we alerting might be good.
    } catch (error) {
        console.error("Error saving plan", error);
        alert("Failed to save plan.");
    }
}
