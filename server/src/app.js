const express = require('express');
const path = require('path');
const fs = require('fs');
const ping = require('ping');
const https = require('https');

const app = express();
const port = 3000;
const httpsPort = 443;

const videoDir = path.join(__dirname, '../../../../../ftp');
const flaggedDir = path.join(__dirname, '../../../../../flagged');

app.use(express.static(path.join(__dirname, '../public')));
app.use(express.json());

app.get('/api/videos', (req, res) => {
    const day = req.query.day ? new Date(req.query.day) : null;

    fs.readdir(videoDir, (err, files) => {
        if (err) {
            return res.status(500).send('Unable to scan directory: ' + err);
        }
        const videos = files.filter(file => file.endsWith('.mp4'));
        let videosWithStats = videos.map(file => {
            const filePath = path.join(videoDir, file);
            const stats = fs.statSync(filePath);
            return { file, ctime: stats.ctime };
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
        res.json(videosWithStats);
    });
});

app.get('/video/:video', (req, res) => {
    const videoPath = path.join(videoDir, req.params.video);
    res.sendFile(videoPath);
})

app.post('/api/flag', (req, res) => {
    console.log('Flagging video: ', req.body);
    const { video } = req.body;
    const sourcePath = path.join(videoDir, video);
    const destPath = path.join(flaggedDir, video);

    fs.copyFile(sourcePath, destPath, (err) => {
        if (err) {
            console.error('Error flagging video: ', err);
            return res.status(500).json('Error flagging video: ' + err);
        }
        res.json({ message: 'Video flagged' });
    })
});

app.post('/api/delete', (req, res) => {
    console.log('Deleting video: ', req.body);
    const { video } = req.body;
    const videoPath = path.join(videoDir, video);

    fs.unlink(videoPath, (err) => {
        if (err) {
            console.error('Error deleting video: ', err);
            return res.status(500).json('Error deleting video: ' + err);
        }
        res.json({ message: 'Video deleted' });
    });
});

app.get('/api/stats', async (req, res) => {
    const host = "blink-pi.local";
    try {
        const isAlive = await ping.promise.probe(host);
        fs.readdir(videoDir, (err, files) => {
            if (err) {
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
        res.status(500).send('Error collecting stats: ' + error);
    }
});

app.get('/api/clips-per-hour', (req, res) => {
    const now = new Date();
    const past24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    fs.readdir(videoDir, (err, files) => {
        if (err) {
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

const httpsOptions = {
    key: fs.readFileSync('./certs/server.key'),
    cert: fs.readFileSync('./certs/server.cert')
}

https.createServer(httpsOptions, app).listen(httpsPort, '0.0.0.0', () => {
    console.log(`Server is running on https://0.0.0.0:${httpsPort}`);
});

app.listen(port, '0.0.0.0', () => {
    console.log(`Server is running on http://0.0.0.0:${port}`);
});