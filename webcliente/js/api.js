const API_URL_PROD = "https://api.pedrosoconsorcios.com.br";

const host = typeof location !== "undefined" ? location.hostname : "";
const API_URL =
    !host || host === "localhost" || host === "127.0.0.1"
        ? "http://localhost:3000"
        : API_URL_PROD;

function getToken() {
    return localStorage.getItem("token");
}

function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    window.location.href = "login.html";
}

function getHeaders() {
    return {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`
    };
}

function createHttpClient({
    baseUrl = API_URL,
    getToken: getTokenFn = getToken,
    onUnauthorized
} = {}) {
    const base = baseUrl.replace(/\/$/, "");

    async function request(path, options = {}) {
        const {
            method = "GET",
            body,
            auth = true,
            headers: extraHeaders = {}
        } = options;

        const headers = { ...extraHeaders };

        if (body !== undefined && !(body instanceof FormData)) {
            headers["Content-Type"] = headers["Content-Type"] || "application/json";
        }

        if (auth) {
            const token = getTokenFn();

            if (token) {
                headers.Authorization = `Bearer ${token}`;
            }
        }

        const url = path.startsWith("http")
            ? path
            : `${base}/${String(path).replace(/^\//, "")}`;

        const response = await fetch(url, {
            method,
            headers,
            body:
                body === undefined
                    ? undefined
                    : body instanceof FormData || typeof body === "string"
                        ? body
                        : JSON.stringify(body)
        });

        if (response.status === 401 && typeof onUnauthorized === "function") {
            onUnauthorized();
        }

        const text = await response.text();
        const data = text ? JSON.parse(text) : null;

        return { response, data };
    }

    return {
        request,
        get: (path, options) => request(path, { ...options, method: "GET" }),
        post: (path, body, options) => request(path, { ...options, method: "POST", body }),
        put: (path, body, options) => request(path, { ...options, method: "PUT", body }),
        patch: (path, body, options) => request(path, { ...options, method: "PATCH", body }),
        delete: (path, options) => request(path, { ...options, method: "DELETE" })
    };
}

const http = createHttpClient({ onUnauthorized: logout });
