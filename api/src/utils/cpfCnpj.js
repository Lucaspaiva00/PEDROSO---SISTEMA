function somenteNumeros(valor) {

    return String(valor ?? "").replace(/\D/g, "");

}

module.exports = { somenteNumeros };
