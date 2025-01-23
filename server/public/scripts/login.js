document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("login-form");
    form.addEventListener("submit", (event) => {
        event.preventDefault();
        const username = document.getElementById("username").value;
        const password = document.getElementById("password").value;
        const hashedPassword = CryptoJS.SHA256(password).toString();

        const data = {
            username,
            password: hashedPassword
        };

        fetch("/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        })
        .then(response => {
            if (!response.ok) {
                return response.json().then(data => { throw new Error(data.message) });
            }
            return response.json();
        })
        .then(data => {
            window.location.href = "/";
        })
        .catch(error => {
            console.error("Error logging in: ", error);
        });
    });
});