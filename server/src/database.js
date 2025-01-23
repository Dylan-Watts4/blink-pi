const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcrypt');

const dbPath = path.join(__dirname, 'users.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        password TEXT
    )`);
});

const addUser = (username, password, callback) => {
    db.get('SELECT username FROM users WHERE username = ?', [username], (error, row) => {
        if (error) {
            return callback(error);
        }
        if (row) {
            return callback(null, { success: false, message: 'User already exists' });
        }
        bcrypt.hash(password, 12, (err, hash) => {
            if (err) {
                return callback(err);
            }
            db.run('INSERT INTO users (username, password) VALUES (?, ?)', [username, hash], (err) => {
                if (err) {
                    return callback(err);
                }
                callback(null, { success: true, message: 'User added successfully' });
            })
        });
    });
};

module.exports = {db, addUser};