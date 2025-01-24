document.addEventListener("DOMContentLoaded", async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const video = urlParams.get("video");
    if (video) {
        const videoPlayerContainer = document.getElementById("video-player-container");
        videoPlayerContainer.innerHTML = `
            <h2>${clearTitle(video)}</h2>
            <video width="640" height="480" controls autoplay>
                <source src="/video/${video}" type="video/mp4">
                Your browser does not support the video tag.
            </video>
        `;

        const downloadBtn = document.getElementById("download-btn");
        downloadBtn.addEventListener("click", () => {
            const link = document.createElement("a");
            link.href = `/video/${video}`;
            link.download = video;
            link.click();
        });

        const flagBtn = document.getElementById("flag-btn");
        const isVideoFlagged = await isFlagged(video);
        flagBtn.textContent = isVideoFlagged ? "Unflag" : "Flag";
        flagBtn.addEventListener("click", () => {
            fetch('/api/flag', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ video })
            })
            .then(response => response.json())
            .then(async data => {
                console.log("Flagged video: ", data);
                const isVideoFlagged = await isFlagged(video);
                flagBtn.textContent = isVideoFlagged ? "Unflag" : "Flag";
            })
            .catch(err => {
                console.error("Error flagging video: ", err);
            });
        });

        const closeBtn = document.getElementById("close-btn");
        closeBtn.addEventListener("click", () => {
            window.location.href = "/";
        });

        const deleteBtn = document.getElementById("delete-btn");
        deleteBtn.addEventListener("click", () => {
            fetch('/api/delete', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ video })
            })
            .then(response => response.json())
            .then(data => {
                console.log("Deleted video: ", data);
                window.location.href = "/";
            })
            .catch(err => {
                console.error("Error deleting video: ", err);
            });
        });
    } else {
        document.getElementById("video-player-container").innerHTML = "<h2>No video found</h2>";
    }
});

function clearTitle(title) {
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

async function isFlagged(video) {
    try {
        const response = await fetch(`/api/flagged-video/${video}`);
        const data = await response.json();
        return data.flagged;
    } catch (err) {
        console.error("Error checking flagged video: ", err);
        return false;
    }
}