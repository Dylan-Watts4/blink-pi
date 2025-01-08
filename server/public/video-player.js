document.addEventListener("DOMContentLoaded", () => {
    const urlParams = new URLSearchParams(window.location.search);
    const video = urlParams.get("video");
    if (video) {
        const videoPlayerContainer = document.getElementById("video-player-container");
        videoPlayerContainer.innerHTML = `
            <h2>${video}</h2>
            <video width="640" height="480" controls>
                <source src="/video/${video}" type="video/mp4">
                Your browser does not support the video tag.
            </video>
        `;
    } else {
        document.getElementById("video-player-container").innerHTML = "<h2>No video found</h2>";
    }
});