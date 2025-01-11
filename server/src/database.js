const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'users.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        password TEXT
    )`);
});

const addUser = (username, password) => {
    bcrypt.hash(password, 10, (err, hash) => {
        if (err) throw err;
        db.run('INSERT INTO users (username, password) VALUES (?, ?)', [username, hash], (err) => {
            if (err) {
                console.error('Error adding user: ', err);
            } else {
                console.log('User added successfully');
            }
        });
    })
};

module.exports = {db, addUser};