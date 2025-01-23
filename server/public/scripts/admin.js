document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("add-user-form");
    form.addEventListener("submit", (event) => {
        event.preventDefault();
        const username = document.getElementById("username").value;
        const password = document.getElementById("password").value;
        addUser(username, password);
    });
});

function addUser(username, password) {
    const url = "/api/add-user";
    const hashedPassword = CryptoJS.SHA256(password).toString();
    const data = { username, password: hashedPassword };

    fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
    .then(response => {
        if (!response.ok) {
            return response.text().then(text => { throw new Error(text) });
        }
        return response.json();
    })
    .then(data => {
        document.getElementById("response-message").textContent = data.message;
    })
    .catch(error => {
        document.getElementById("response-message").textContent = `Error: ${error.message}`;
    });
}