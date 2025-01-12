document.addEventListener("DOMContentLoaded", () => {
    fetchVideos();
    //fetchClipsPerHour();
    document.getElementById("all-videos-btn").addEventListener("click", () => {
        fetchVideos();
    });
    document.getElementById("today-videos-btn").addEventListener("click", () => {
        const today = new Date().toISOString().split('T')[0];
        fetchVideos(today);
    });
    document.getElementById("flagged-videos-btn").addEventListener("click", () => {
        fetchFlaggedVideos();
    });
    document.getElementById("front-camera-btn").addEventListener("click", () => {
        filterFetchVideos('Front');
    });
    document.getElementById("back-camera-btn").addEventListener("click", () => {
        filterFetchVideos('back');
    });
});

function createVideoElement(video) {
    const videoElement = document.createElement("div");
    videoElement.classList.add("video-wrapper");
    videoElement.innerHTML = `
        <h2 class="video-title">${video.replace('.mp4', '')}</h2>
        <a href="./video-player.html?video=${video}">
            <video id="video-${video}" width="320" height="240">
                <source src="/video/${video}" type="video/mp4">
                Your browser does not support the video tag.
            </video>
            <canvas id="canvas-${video}" width="320" height="240" style="display:none;"></canvas>
        </a>
    `;

    return videoElement;
}

function filterFetchVideos(camera) {
    fetch('/api/videos')
        .then(response => response.json())
        .then(videos => {
            const videoContainer = document.getElementById("video-container");
            videoContainer.innerHTML = "";
            let count = 0;
            if (videos.length > 0) {
                videos.forEach(video => {
                    if (video.file.includes(camera)) {
                        count++;
                        const videoElement = createVideoElement(video.file);
                        videoContainer.appendChild(videoElement);
                    }
                });
            } else {
                videoContainer.innerHTML = "<h2 class='no-video'>No videos found</h2>";
            }
            if (count === 0) {
                videoContainer.innerHTML = "<h2 class='no-video'>No videos found</h2>";
            }
        }).catch(err => {
            console.error("Error fetching videos: ", err);
        });
}

function fetchVideos(day = '') {
    const url = day ? `/api/videos?day=${day}` : '/api/videos';
    fetch(url)
        .then(response => response.json())
        .then(videos => {
            const videoContainer = document.getElementById("video-container");
            videoContainer.innerHTML = "";
            if (videos.length > 0) {
                videos.forEach(video => {
                    const videoElement = createVideoElement(video.file);
                    videoContainer.appendChild(videoElement);
                });
            } else {
                videoContainer.innerHTML = "<h2 class='no-video'>No videos found</h2>";
            }
        }).catch(err => {
            console.error("Error fetching videos: ", err);
        });
}

function fetchFlaggedVideos() {
    fetch("/api/flagged")
        .then(response => response.json())
        .then(flaggedVideos => {
            const videoContainer = document.getElementById("video-container");
            videoContainer.innerHTML = "";
            if (flaggedVideos.length > 0) {
                flaggedVideos.forEach(videoFile => {
                    const videoElement = createVideoElement(videoFile);
                    videoContainer.appendChild(videoElement);
                });
            } else {
                videoContainer.innerHTML = "<h2 class='no-video'>No flagged videos found</h2>";
            }
        }).catch(err => {
            console.error("Error fetching flagged videos: ", err);
        });
}

/*
function fetchClipsPerHour() {
    fetch('/api/clips-per-hour')
        .then(response => response.json())
        .then(clipsPerHour => {
            console.log(clipsPerHour);
            setTimeout(() => {
                const ctx = document.getElementById('clips-per-hour-chart').getContext('2d');
                new Chart(ctx, {
                    type: 'bar',
                    data: {
                        //labels: Array.from({ Length: 24 }, (_, i) => `${i}:00`),
                        datasets: [{
                            label: "Clips Per Hour",
                            data: clipsPerHour,
                            backgroundColor: 'rgba(75, 192, 192, 0.2)',
                            borderColor: 'rgba(75, 192, 192, 1)',
                            borderWidth: 1
                        }]
                    },
                    options: {
                        scales: {
                            y: {
                                beginAtZero: true
                            }
                        }
                    }
                });
            }, 100);
        })
        .catch(err => {
            console.error("Error fetching clips per hour: ", err);
        });
}
*/