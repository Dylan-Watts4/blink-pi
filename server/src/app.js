const express = require('express');
const path = require('path');
const fs = require('fs');
const ping = require('ping');
const https = require('https');
const session = require('express-session');
const flash = require('connect-flash');
const passport = require('./auth');
const { addUser } = require('./database');
const morgan = require('morgan');
const winston = require('winston');
const ffmpeg = require('fluent-ffmpeg');

const app = express();
const port = 3000;
const httpsPort = 443;

ffmpeg.setFfmpegPath('/usr/bin/ffmpeg');
ffmpeg.setFfprobePath('/usr/bin/ffprobe');

const videoDir = path.join(__dirname, '../../../../../media/blink/videos');
const flaggedDir = path.join(__dirname, '../../../../../media/blink/flagged');
const thumbnailDir = path.join(__dirname, '../../../../../media/blink/thumbnail');
const certsDir = '/home/jenga/server/src/certs'

const videosPerPage = 10;

// Configure winston logger
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp(),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
            return JSON.stringify({
                timestamp,
                level,
                message,
                ...meta
            });
        })
    ),
    transports: [
        new winston.transports.File({ filename: '/home/jenga/server/logs/app.log' }),
        new winston.transports.Console()
    ]
});

// Configure morgan to use winston logger
morgan.token('real-ip', (req) => req.realIp);
morgan.token('json', (req, res) => {
    return JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'info',
        message: `${req.method} ${req.url} ${res.statusCode} - ${req.headers['user-agent']} ${res.get('Content-Length') || 0}b sent`,
        ip: req.realIp
    });
});

app.use(morgan(':json', {
    stream: {
        write: (message) => {
            const log = JSON.parse(message);
            logger.info(log.message, { ip: log.ip });
        }
    }
}));

// Trust cloudflare proxy
app.set('trust-proxy', true);

// Middleware for real IP
app.use((req, res, next) => {
    req.realIp = req.headers['cf-connecting-ip'] || req.headers['x-forwarded-for'] || req.ip;
    next();
});

// TEST ------------------------------------
const {transporter, email} = require('./email');

function sendEmailNotification(video) {
    const mailOptions = {
        from: email,
        to: 'query from db',
        subject: 'Blink Video Alert',
        text: `A new video has been uploaded: ${video}`
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            logger.info(`Error sending email: ${error}`, { ip: req.realIp });
            return;
        }
        console.log('Email sent: ' + info.response);
    })
}
// TEST ------------------------------------

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(session({
    secret: 'secret_key',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 7 * 24 * 60 * 60 * 1000 } // 7 days
}));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/login');
}

app.get("/robots.txt", (req, res) => {
    res.sendFile(path.join(__dirname, '../public/robots.txt'));
});

app.post('/login', (req, res, next) => {
    logger.info(`Login attempt: ${req.body.username}`, { ip: req.realIp });
    passport.authenticate('local', (err, user, info) => {
        if (err) {
            logger.error(`Error authenticating user: ${err}`, { ip: req.realIp });
            return res.status(500).json({ message: 'Internal server error' });
        }
        if (!user) {
            logger.warn(`Failed login attempt: ${req.body.username}`, { ip: req.realIp });
            return res.status(401).json({ message: 'Invalid username or password' });
        }
        req.login(user, (err) => {
            if (err) {
                logger.error(`Error logging in: ${err}`, { ip: req.realIp });
                return res.status(500).json({ message: 'Internal server error' });
            }
            logger.info(`Login successful: ${req.body.username}`, { ip: req.realIp });
            return res.json({ success: true, message: 'Login successful' });
        });
    })(req, res, next);
});

app.get('/login', (req, res) => {
    logger.info(`Login page requested`, { ip: req.realIp });
    res.sendFile(path.join(__dirname, '../public/login.html'));
});

app.get('/scripts/login.js', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/scripts/login.js'));
});

app.get('/styles/login.css', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/styles/login.css'));
});

app.get('/favicon.ico', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/favicon.ico'));
});

app.get('/logout', (req, res) => {
    logger.info(`Logout requested from user ${req.user.username}`, { ip: req.realIp });
    req.logout();
    res.redirect('/login');
});

app.get('/', ensureAuthenticated, (req, res) => {
    logger.info(`Home page requested from user ${req.user.username}`, { ip: req.realIp });
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.use(ensureAuthenticated, express.static(path.join(__dirname, '../public')));
app.get('/api/videos', ensureAuthenticated, (req, res) => {
    logger.info(`API videos requested from user ${req.user.username}`, { ip: req.realIp });
    const day = req.query.day ? new Date(req.query.day) : null;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || videosPerPage;
    const camera = req.query.camera || '';

    fs.readdir(videoDir, (err, files) => {
        if (err) {
            logger.error(`Error scanning directory: ${err}`, { ip: req.realIp });
            return res.status(500).send('Unable to scan directory: ' + err);
        }
        let videos = files.filter(file => file.endsWith('.mp4'));

        if (camera) {
            videos = videos.filter(file => file.includes(camera));
        }

        let videosWithStats = videos.map(file => {
            const filePath = path.join(videoDir, file);
            const stats = fs.statSync(filePath);
            const thumbnailURL = `/thumbnail/${file.replace('.mp4','')}-thumbnail.png`;
            return { file, ctime: stats.ctime, thumbnailURL };
        });

        if (day) {
            const startOfDay = new Date(day).setHours(0, 0, 0, 0);
            const endOfDay = new Date(day).setHours(23, 59, 59, 999);
            videosWithStats = videosWithStats.filter(video => {
                const ctime = new Date(video.ctime);
                return ctime >= startOfDay && ctime <= endOfDay;
            });
        }

        videosWithStats.sort((a, b) => b.ctime - a.ctime);

        // Page
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;
        const paginatedVideos = videosWithStats.slice(startIndex, endIndex);

        // Generate thumbnails if they don't exist
        const generateThumbnailsPromises = paginatedVideos.map(video => {
            return new Promise((resolve, reject) => {
                const videoPath = path.join(videoDir, video.file);
                generateThumbnail(video.file, thumbnailDir, (err) => {
                    if (err) {
                        logger.error(`Error generating thumbnail: ${err}`, { ip: req.realIp });
                        return reject(err);
                    }
                    resolve();
                })
            });
        });

        Promise.all(generateThumbnailsPromises)
        .then(() => {
            res.json({
                page,
                limit,
                total: videosWithStats.length,
                totalPages: Math.ceil(videosWithStats.length / limit),
                videos: paginatedVideos
            });
        })
        .catch(err => {
            res.status(500).send(`Error generating thumbnails: ${err}`)
        });
    });
});

function generateThumbnail(video, thumbnailPath, callback) {
    const thumbnailFilePath = path.join(thumbnailPath, `${video.replace('.mp4','')}-thumbnail.png`);
    fs.access(thumbnailFilePath, fs.constants.F_OK, (err) => {
        if (!err) {
            return callback(null);
        }
        ffmpeg(path.join(videoDir, video))
            .screenshots({
                count: 1,
                folder: thumbnailPath,
                filename: '%b-thumbnail.png',
                size: '320x240'
            })
            .on('end', () => {
                callback(null);
            })
            .on('error', (err) => {
                callback(err);
            });
    });
}

app.get('/thumbnail/:video', ensureAuthenticated, (req, res) => {
    const thumbnailPath = path.join(thumbnailDir, `${req.params.video}`);
    res.sendFile(thumbnailPath);
});

app.get('/video/:video', ensureAuthenticated, (req, res) => {
    const videoPath = path.join(videoDir, req.params.video);
    res.sendFile(videoPath);
})

app.get('/api/flagged', ensureAuthenticated, (req, res) => {
    fs.readdir(flaggedDir, (err, files) => {
        if (err) {
            logger.error(`Error scanning directory: ${err}`, { ip: req.realIp });
            return res.status(500).send('Unable to scan directory: ' + err);
        }
        const flaggedVideos = files.filter(file => file.endsWith('.mp4')).map(file => {
            const thumbnailURL = `/thumbnail/${file.replace('.mp4', '')}-thumbnail.png`;
            return { file, thumbnailURL };
        });
        res.json(flaggedVideos);
    });
});

app.get('/api/flagged-video/:video', ensureAuthenticated, (req, res) => {
    const video = req.params.video;
    const videoPath = path.join(flaggedDir, video);

    fs.access(videoPath, fs.constants.F_OK, (err) => {
        if (err) {
            return res.json({ flagged: false });
        }
        return res.json({ flagged: true });
    });
});

app.post('/api/flag', ensureAuthenticated, (req, res) => {
    logger.info(`Flag video requested from user ${req.user.username}`, { ip: req.realIp });
    const { video } = req.body;
    const sourcePath = path.join(videoDir, video);
    const destPath = path.join(flaggedDir, video);

    fs.access(destPath, fs.constants.F_OK, (err) => {
        if (!err) {
            fs.unlink(destPath, (err) => {
                if (err) {
                    logger.error(`Error unflagging video: ${err}`, { ip: req.realIp });
                    return res.status(500).json('Error unflagging video: ' + err);
                }
                res.json({ message: 'Video unflagged' });
            });
        } else {
            fs.copyFile(sourcePath, destPath, (err) => {
                if (err) {
                    logger.error(`Error flagging video: ${err}`, { ip: req.realIp });
                    return res.status(500).json('Error flagging video: ' + err);
                }
                res.json({ message: 'Video flagged' });
            });
        }
    });
});

app.post('/api/delete', ensureAuthenticated, (req, res) => {
    logger.info(`Delete video requested from user ${req.user.username}`, { ip: req.realIp });
    const { video } = req.body;
    const videoPath = path.join(videoDir, video);
    const thumbnailPath = path.join(thumbnailDir, `${video.replace('.mp4', '')}-thumbnail.png`);

    fs.access(thumbnailPath, fs.constants.F_OK, (err) => {
        if (!err) {
            fs.unlink(thumbnailPath, (err) => {
                if (err) {
                    logger.error(`Error deleting thumbnail: ${err}`, { ip: req.realIp });
                    return res.status(500).json(`Error deleting thumbnail: ${err}`);
                }
                deleteVideo();
            });
        } else {
            deleteVideo();
        }
    });

    function deleteVideo() {
        fs.unlink(videoPath, (err) => {
            if (err) {
                logger.error(`Error deleting video: ${err}`, { ip: req.realIp });
                return res.status(500).json(`Error deleting video: ${err}`);
            }
            res.json({ message: "Video deleted" });
        });
    }
});

app.get('/api/stats', ensureAuthenticated, async (req, res) => {
    const host = "blink-pi.local";
    try {
        const isAlive = await ping.promise.probe(host);
        fs.readdir(videoDir, (err, files) => {
            if (err) {
                logger.error(`Error scanning directory: ${err}`, { ip: req.realIp });
                return res.status(500).send('Unable to scan directory: ' + err);
            }
            const videos = files.filter(file => file.endsWith('.mp4'));
            const totalSize = videos.reduce((acc, file) => {
                const filePath = path.join(videoDir, file);
                const stats = fs.statSync(filePath);
                return acc + stats.size;
            }, 0);
            res.json({
                online: isAlive.alive,
                fileCount: videos.length,
                totalSize: totalSize
            });
        });
    } catch (error) {
        logger.error(`Error collecting stats: ${error}`, { ip: req.realIp });
        res.status(500).send('Error collecting stats: ' + error);
    }
});

app.get('/api/clips-per-hour', ensureAuthenticated, (req, res) => {
    const now = new Date();
    const past24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    fs.readdir(videoDir, (err, files) => {
        if (err) {
            logger.error(`Error scanning directory: ${err}`, { ip: req.realIp });
            return res.status(500).send('Unable to scan directory: ' + err);
        }
        const videos = files.filter(file => file.endsWith('.mp4'));
        const clipsPerHour = Array(24).fill(0);

        videos.forEach(file => {
            const filePath = path.join(videoDir, file);
            const stats = fs.statSync(filePath);
            const ctime = new Date(stats.ctime);
            if (ctime >= past24Hours && ctime <= now) {
                const hour = ctime.getHours();
                clipsPerHour[hour]++;
            }
        });
        res.json(clipsPerHour);
    });
});

app.post('/api/add-user', ensureAuthenticated, (req, res) => {
    logger.warn(`New user added: ${req.body.username}`, { ip: req.realIp });
    const { username, password } = req.body;
    addUser(username, password, (error, result) => {
        if (error) {
            logger.error(`Error adding user: ${error}`, { ip: req.realIp });
            return res.status(500).json({ success: false, message: 'Internal server error' });
        }
        res.json(result);
    })
})

const httpsOptions = {
    key: fs.readFileSync(path.join(certsDir, 'server.key')),
    cert: fs.readFileSync(path.join(certsDir, 'server.cert'))
}

https.createServer(httpsOptions, app).listen(httpsPort, '0.0.0.0', () => {
    console.log(`Server is running on https://0.0.0.0:${httpsPort}`);
});

app.listen(port, '0.0.0.0', () => {
    console.log(`Server is running on http://0.0.0.0:${port}`);
});