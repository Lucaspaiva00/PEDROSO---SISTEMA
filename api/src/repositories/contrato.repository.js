const prisma = require("../config/prisma");

class ContratoRepository {

    async cadastrar(dados) {

        return await prisma.contrato.create({
            data: dados,
            include: {
                cliente: true,
                plano: true
            }
        });

    }

    async listar() {

        return await prisma.contrato.findMany({
            include: {
                cliente: true,
                plano: true
            },
            orderBy: {
                criadoEm: "desc"
            }
        });

    }

    async buscarPorId(id) {

        return await prisma.contrato.findUnique({
            where: {
                id: Number(id)
            },
            include: {
                cliente: true,
                plano: true
            }
        });

    }

    async atualizar(id, dados) {

        return await prisma.contrato.update({
            where: {
                id: Number(id)
            },
            data: dados,
            include: {
                cliente: true,
                plano: true
            }
        });

    }

    async excluir(id) {

        return await prisma.contrato.delete({
            where: {
                id: Number(id)
            }
        });

    }

}

module.exports = new ContratoRepository();