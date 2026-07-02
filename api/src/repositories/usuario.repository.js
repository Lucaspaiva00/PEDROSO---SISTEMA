const prisma = require("../config/prisma");

class UsuarioRepository {

    async findByEmail(email) {

        return await prisma.usuario.findUnique({
            where: {
                email
            }
        });

    }

    async findById(id) {

        return await prisma.usuario.findUnique({
            where: {
                id
            }
        });

    }

    async create(dados) {

        return await prisma.usuario.create({
            data: dados
        });

    }

}

module.exports = new UsuarioRepository();