const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DATA_DIR = path.join(__dirname, '../data');
const DATA_FILE = path.join(DATA_DIR, 'users.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR);
}

// Helper: Read Users
const getUsers = () => {
    if (!fs.existsSync(DATA_FILE)) {
        fs.writeFileSync(DATA_FILE, JSON.stringify([]));
        return [];
    }
    try {
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        return data ? JSON.parse(data) : [];
    } catch (err) {
        return [];
    }
};

// Helper: Write Users
const saveUsers = (users) => {
    fs.writeFileSync(DATA_FILE, JSON.stringify(users, null, 2));
};

class LocalUser {
    constructor(data) {
        Object.assign(this, data);
        if (!this._id) this._id = Date.now().toString();
        if (!this.currentMealPlan) this.currentMealPlan = {};
        if (!this.todayStats) this.todayStats = {
            caloriesConsumed: 0,
            caloriesBurned: 0,
            waterIntake: 0,
            date: new Date()
        };
        // Normalize
        if (!this.goal) this.goal = 'general fitness';
    }

    static async findOne(query) {
        const users = getUsers();
        const user = users.find(u => u.email === query.email);
        return user ? new LocalUser(user) : null;
    }

    static async findById(id) {
        const users = getUsers();
        const user = users.find(u => u._id === id);
        return user ? new LocalUser(user) : null;
    }

    static async create(data) {
        const users = getUsers();

        // Check duplicate
        if (users.find(u => u.email === data.email)) {
            throw new Error('User already exists');
        }

        const newUser = new LocalUser(data);

        // Hash Password
        const salt = await bcrypt.genSalt(10);
        newUser.password = await bcrypt.hash(data.password, salt);

        users.push(newUser);
        saveUsers(users);
        return newUser;
    }

    async matchPassword(enteredPassword) {
        return await bcrypt.compare(enteredPassword, this.password);
    }

    async save() {
        const users = getUsers();
        const index = users.findIndex(u => u._id === this._id);

        if (index !== -1) {
            users[index] = this;
            saveUsers(users);
        }
        return this;
    }
}

module.exports = LocalUser;
