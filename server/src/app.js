const express = require('express');
const path = require('path');
const fs = require('fs');
const ping = require('ping');

const app = express();
const port = 3000;

const videoDir = path.join(__dirname, '../../../../../ftp');

app.use(express.static(path.join(__dirname, '../public')));

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

app.listen(port, '0.0.0.0', () => {
    console.log(`Server is running on http://0.0.0.0:${port}`);
});