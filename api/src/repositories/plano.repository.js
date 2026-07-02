const prisma = require("../config/prisma");

class PlanoRepository {

    async cadastrar(dados) {

        return await prisma.plano.create({
            data: dados
        });

    }

    async listar() {

        return await prisma.plano.findMany({
            orderBy: {
                valorCarta: "asc"
            }
        });

    }

    async buscarPorId(id) {

        return await prisma.plano.findUnique({
            where: {
                id: Number(id)
            }
        });

    }

    async atualizar(id, dados) {

        return await prisma.plano.update({
            where: {
                id: Number(id)
            },
            data: dados
        });

    }

    async excluir(id) {

        return await prisma.plano.delete({
            where: {
                id: Number(id)
            }
        });

    }

}

module.exports = new PlanoRepository();