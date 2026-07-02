const jwt = require("jsonwebtoken");

const gerarToken = (usuario) => {
    return jwt.sign(
        {
            id: usuario.id,
            role: usuario.role,
            clienteId: usuario.clienteId
        },
        process.env.JWT_SECRET,
        {
            expiresIn: "7d"
        }
    );
};

module.exports = {
    gerarToken
};