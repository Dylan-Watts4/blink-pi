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
});

function fetchVideos(day = '') {
    const url = day ? `/api/videos?day=${day}` : '/api/videos';
    fetch(url)
        .then(response => response.json())
        .then(videos => {
            const videoContainer = document.getElementById("video-container");
            videoContainer.innerHTML = "";
            if (videos.length > 0) {
                videos.forEach(video => {
                    const videoElement = document.createElement("div");
                    videoElement.classList.add("video-wrapper");
                    videoElement.innerHTML = `
                        <h2 class="video-title>${video.file.replace('.mp4', '')}</h2>
                        <a href="./video-player.html?video=${video.file}">
                            <video id="video-${video.file}" width="320" height="240">
                                <source src="/video/${video.file}" type="video/mp4">
                                Your browser does not support the video tag.
                            </video>
                            <canvas id="canvas-${video.file}" width="320" height="240" style="display:none;"></canvas>
                        </a>
                    `;
                    videoContainer.appendChild(videoElement);

                    const videoTag = document.getElementById(`video-${video.file}`);
                    const canvas = document.getElementById(`canvas-${video.file}`);
                    const context = canvas.getContext('2d');

                    videoTag.addEventListener('loadeddata', () => {
                        videoTag.currentTime = 1; // Capture thumbnail at 1 second
                    });

                    videoTag.addEventListener('seeked', () => {
                        context.drawImage(videoTag, 0, 0, canvas.width, canvas.height);
                        const thumbnailDataUrl = canvas.toDataURL('image/png');
                        const img = document.createElement('img');
                        img.src = thumbnailDataUrl;
                        img.width = 320;
                        img.height = 240;
                        videoElement.insertBefore(img, videoTag);
                        videoTag.style.display = 'none';
                    });
                });
            } else {
                videoContainer.innerHTML = "<h2>No videos found</h2>";
            }
        }).catch(err => {
            console.error("Error fetching videos: ", err);
        });
}

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