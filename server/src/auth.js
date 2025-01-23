const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const {db} = require('./database');

passport.use(new LocalStrategy({
    usernameField: 'username',
    passwordField: 'password'
}, (username, password, done) => {
    console.log("LocalStrategy: ", username, password);
    db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
        if (err) {
            console.log("Database error: ", err);
            return done(err);
        }
        if (!user) {
            console.log("User not found");
            return done(null, false, { message: 'Invalid username or password' });
        }
        bcrypt.compare(password, user.password, (err, res) => {
            if (err) {
                console.log("bcrypt error: ", err);
                return done(err);
            }
            if (res) {
                console.log("User found: ", user);
                return done(null, user);
            } else {
                console.log("Password incorrect");
                return done(null, false, { message: 'Invalid username or password' });
            }
        });
    });
}));

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser((id, done) => {
    db.get('SELECT * FROM users WHERE id = ?', [id], (err, user) => {
        if (err) {
            return done(err);
        }
        done(null, user);
    })
});

module.exports = passport;