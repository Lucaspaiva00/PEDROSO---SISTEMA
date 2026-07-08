const API_URL = "http://localhost:3000";

function getToken() {

    return localStorage.getItem("token");

}

function getHeaders() {

    return {

        "Content-Type": "application/json",

        Authorization: `Bearer ${getToken()}`

    };

}

function logout() {

    localStorage.removeItem("token");
    localStorage.removeItem("usuario");

    window.location.href = "login.html";

}

function verificarLogin() {

    const token = getToken();

    if (!token) {

        window.location.href = "login.html";

    }

}