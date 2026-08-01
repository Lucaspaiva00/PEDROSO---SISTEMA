// Local/LAN dev → localhost API; deployed frontend on pedrosoconsorcios.com.br → prod API.
const API_URL_DEV = "http://localhost:3000";
const API_URL_PROD = "https://api.pedrosoconsorcios.com.br";
const PROD_FRONTEND_HOST_SUFFIXES = ["pedrosoconsorcios.com.br"];

function isPrivateIpv4(host) {
    const m = /^(\d+)\.(\d+)\.(\d+)\.(\d+)$/.exec(host);
    if (!m) return false;
    const a = +m[1];
    const b = +m[2];
    if (a === 10) return true;
    if (a === 192 && b === 168) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    return false;
}

function isDevHost(host) {
    if (!host) return true;
    if (host === "localhost" || host === "127.0.0.1" || host === "::1") return true;
    if (host.endsWith(".local")) return true;
    if (isPrivateIpv4(host)) return true;
    return false;
}

function shouldUseProdApi(host) {
    if (isDevHost(host)) return false;
    if (host.startsWith("api.")) return false;
    return PROD_FRONTEND_HOST_SUFFIXES.some(
        (s) => host === s || host.endsWith("." + s)
    );
}

function resolveApiUrl() {
    // localStorage.setItem('API_URL_OVERRIDE', 'https://...') forces API base URL
    try {
        const override = localStorage.getItem("API_URL_OVERRIDE");
        if (override) return override.replace(/\/$/, "");
    } catch (_) {}
    if (typeof location !== "undefined" && location.protocol === "file:") {
        return API_URL_DEV;
    }
    const host = typeof location !== "undefined" ? location.hostname : "";
    return shouldUseProdApi(host) ? API_URL_PROD : API_URL_DEV;
}

const API_URL = resolveApiUrl();

function getToken() {
    return localStorage.getItem("token");
}

function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    window.location.href = "login.html";
}

function verificarLogin() {
    if (!getToken()) {
        window.location.href = "login.html";
    }
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
