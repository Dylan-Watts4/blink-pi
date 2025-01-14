const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const {db} = require('./database');

passport.use(new LocalStrategy((username, password, done) => {
    db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
        if (err) {
            return done(err);
        }
        if (!user) {
            return done(null, false, { message: 'Incorrect username or password.' });
        }
        bcrypt.compare(password, user.password, (err, res) => {
            if (res) {
                return done(null, user);
            } else {
                return done(null, false, { message: 'Incorrect username or password.' });
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