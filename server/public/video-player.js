document.addEventListener("DOMContentLoaded", () => {
    const urlParams = new URLSearchParams(window.location.search);
    const video = urlParams.get("video");
    if (video) {
        const videoPlayerContainer = document.getElementById("video-player-container");
        videoPlayerContainer.innerHTML = `
            <h2>${video.replace('.mp4', '')}</h2>
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
        flagBtn.addEventListener("click", () => {
            fetch('/api/flag', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ video })
            })
            .then(response => response.json())
            .then(data => {
                console.log("Flagged video: ", data);
            })
            .catch(err => {
                console.error("Error flagging video: ", err);
            });
        });

        const closeBtn = document.getElementById("close-btn");
        closeBtn.addEventListener("click", () => {
            window.close();
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
                window.close();
            })
            .catch(err => {
                console.error("Error deleting video: ", err);
            });
        });
    } else {
        document.getElementById("video-player-container").innerHTML = "<h2>No video found</h2>";
    }
});
