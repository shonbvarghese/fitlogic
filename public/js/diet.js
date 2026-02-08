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

        if (response.ok && result.success) {
            currentPlanData = { plan: result.plan, targetCalories: result.targetCalories };
            displayDietResult(result);

            // Show cache indicator if applicable
            if (result.cached) {
                const resultsDiv = document.getElementById('diet-results');
                const cacheNotice = document.createElement('div');
                cacheNotice.className = 'cache-notice';
                cacheNotice.innerHTML = '✓ Loaded from cache (saved API quota)';
                cacheNotice.style.cssText = 'background: #d4edda; color: #155724; padding: 10px; border-radius: 5px; margin: 10px 0; text-align: center;';
                resultsDiv.insertBefore(cacheNotice, resultsDiv.firstChild);
            }
        } else if (response.status === 400 && result.error === 'API_KEY_EXPIRED') {
            // Handle expired API key
            alert('🔑 API Key Expired\n\n' +
                (result.message || 'Your Google Gemini API key has expired.') + '\n\n' +
                'Get a new key at: ' + (result.helpUrl || 'https://aistudio.google.com/app/apikey'));
        } else if (response.status === 429) {
            // Handle rate limit specifically
            alert('⚠️ API Quota Exceeded\n\n' +
                (result.message || 'Too many requests. Please try again later.') + '\n\n' +
                (result.retryAfter || 'Wait a few minutes before trying again.'));
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
    grid.innerHTML = '';

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
        const label = document.createElement('div');
        label.className = 'meal-type-label';
        label.textContent = type;
        grid.appendChild(label);

        dietDays.forEach(day => {
            const slot = document.createElement('div');
            slot.className = 'meal-slot filled';

            if (result.plan[day] && result.plan[day][type]) {
                let mealText = result.plan[day][type];
                if (typeof mealText === 'object') mealText = mealText.name;

                // Use default badge logic for AI results
                slot.innerHTML = `
                    <div style="font-weight: 700; margin-bottom: 8px;">${mealText}</div>
                    <div style="font-size: 0.8rem; color: var(--text-muted); line-height: 1.5;">Strategy Insight: High-precision suggestion based on your physiology.</div>
                    <div class="meal-badge badge-energy">AI Strategy</div>
                `;
            } else {
                slot.textContent = 'Empty';
            }

            grid.appendChild(slot);
        });
    });

    resultsDiv.scrollIntoView({ behavior: 'smooth' });
}

async function applyToMainPlanner() {
    if (!currentPlanData) return;

    try {
        const response = await authFetch('/api/diet/save', {
            method: 'POST',
            body: JSON.stringify(currentPlanData)
        });

        if (response && response.ok) {
            alert('Plan precision-engineered to your profile! ✨');
            if (typeof showView === 'function') {
                showView('meal-planner');
                if (window.initMealPlanner) window.initMealPlanner();
            }
        }
    } catch (error) {
        console.error("Error saving plan", error);
        alert("Failed to save plan.");
    }
}
