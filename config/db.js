const connectDB = async () => {
    console.log("✅  Using INTERNAL FILE DATABASE.");
    console.log("    (MongoDB is not installed locally, and Cloud is blocked by network).");
    console.log("    Your data is saved safely in 'data/users.json'.");
};

module.exports = connectDB;
