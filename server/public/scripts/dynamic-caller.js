document.addEventListener("DOMContentLoaded", () => {
    fetchVideos();
    //fetchClipsPerHour();
    document.getElementById("all-videos-btn").addEventListener("click", () => {
        resetFilters();
        fetchVideos();
    });
    document.getElementById("today-videos-btn").addEventListener("click", () => {
        resetFilters();
        const today = new Date().toISOString().split('T')[0];
        currentDay = today;
        fetchVideos(today);
    });
    document.getElementById("flagged-videos-btn").addEventListener("click", () => {
        resetFilters();
        fetchFlaggedVideos();
    });
    document.getElementById("front-camera-btn").addEventListener("click", () => {
        resetFilters();
        currentCamera = 'Front';
        fetchVideos(currentDay, currentPage, videosPerPage, 'Front');
    });
    document.getElementById("back-camera-btn").addEventListener("click", () => {
        resetFilters();
        currentCamera = 'back';
        fetchVideos(currentDay, currentPage, videosPerPage, 'back');
    });
    document.getElementById("prev-page-btn").addEventListener("click", () => {
        changePage(-1);
    });
    document.getElementById("next-page-btn").addEventListener("click", () => {
        changePage(1);
    });
});

let currentPage = 1;
const videosPerPage = 10;
let currentCamera = '';
let currentDay = '';

function clearTitle(title) {
    if (!title) return '';
    title.replace('.mp4', '');
    title.replace('Front', '');
    title.replace('back', '');
    let date = title.split('_')[0];
    let time = title.split('_')[1];
    date = date.replaceAll('-', '/');
    time = time.replaceAll('-', ':');
    title = date + ' ' + time;
    return title;
}

function createVideoElement(video) {
    const videoElement = document.createElement("div");
    videoElement.classList.add("video-wrapper");
    videoElement.innerHTML = `
        <h2 class="video-title">${clearTitle(video.file)}</h2>
        <a href="./video-player.html?video=${video.file}">
            <img src="${video.thumbnailURL}" alt="Thumbnail for ${video.file}" width="320" height="240">
        </a>
    `;

    return videoElement;
}

function fetchVideos(day = '', page = 1, limit = videosPerPage, camera = '') {
    const url = day ? `/api/videos?day=${day}&page=${page}&limit=${limit}&camera=${camera}` : `/api/videos?page=${page}&limit=${limit}&camera=${camera}`;
    fetch(url)
        .then(response => response.json())
        .then(data => {
            const videos = data.videos;
            const videoContainer = document.getElementById("video-container");
            videoContainer.innerHTML = "";
            if (videos.length > 0) {
                videos.forEach(video => {
                    const videoElement = createVideoElement(video);
                    videoContainer.appendChild(videoElement);
                });
            } else {
                videoContainer.innerHTML = "<h2 class='no-video'>No videos found</h2>";
            }
            updatePaginationControls(data.page, data.totalPages);
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

function updatePaginationControls(currentPage, totalPages) {
    document.getElementById("current-page").textContent = `${currentPage} / ${totalPages}`;
    document.getElementById("prev-page-btn").disabled = currentPage === 1;
    document.getElementById("next-page-btn").disabled = currentPage === totalPages;
}

function changePage(delta) {
    currentPage += delta;
    // TODO: defaults to all, need to add support for today and flagged
    fetchVideos(currentDay, currentPage, videosPerPage, currentCamera);
}

function resetFilters() {
    currentCamera = '';
    currentDay = '';
    currentPage = 1;
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