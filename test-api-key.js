const { GoogleGenerativeAI } = require("@google/generative-ai");

async function testApiKey(apiKey) {
    console.log('Testing API Key:', apiKey.substring(0, 20) + '...');
    console.log('---');

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

        const prompt = "Say 'Hello! API key is working!' in exactly 5 words.";

        console.log('Sending test request to Gemini API...');
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        console.log('✅ SUCCESS! API Key is VALID and WORKING!');
        console.log('---');
        console.log('Response from AI:', text);
        console.log('---');
        return true;

    } catch (error) {
        console.log('❌ FAILED! API Key has issues.');
        console.log('---');
        console.log('Error Status:', error.status);
        console.log('Error Message:', error.message);
        console.log('---');

        if (error.status === 400) {
            console.log('Issue: API key is INVALID or EXPIRED');
            console.log('Solution: Get a new key from https://aistudio.google.com/app/apikey');
        } else if (error.status === 429) {
            console.log('Issue: Rate limit exceeded or quota exhausted');
            console.log('Solution: Wait a few minutes or upgrade your plan');
        } else {
            console.log('Issue: Unknown error');
        }

        return false;
    }
}

// Test the provided API key
const testKey = 'AIzaSyDgNjl1aoLzAWWQkDBemX0lMV0lpY1IATw';
testApiKey(testKey).then(success => {
    process.exit(success ? 0 : 1);
});
