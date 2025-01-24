document.addEventListener("DOMContentLoaded", () => {
    fetch("/api/stats")
    .then(response => response.json())
    .then(stats => {
        const statsContainer = document.getElementById("blink-stats");
        
        const onlineStatus = document.createElement("p");
        onlineStatus.textContent = `Blink Pi: ${stats.online ? "Online" : "Offline"}`;

        const fileCount = document.createElement("p");
        fileCount.textContent = `File Count: ${stats.fileCount}`;

        const totalSize = document.createElement("p");
        totalSize.textContent = `Total Size: ${(stats.totalSize / (1024 * 1024 * 1024)).toFixed(2)} GB`;

        statsContainer.appendChild(onlineStatus);
        statsContainer.appendChild(fileCount);
        statsContainer.appendChild(totalSize);
    }).catch(err => {
        console.error("Error fetching stats: ", err);
    });
});