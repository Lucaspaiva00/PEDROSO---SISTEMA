const prisma = require("../config/prisma");

class ClienteRepository {

    async listar() {

        return await prisma.cliente.findMany({
            orderBy: {
                nome: "asc"
            }
        });

    }

    async buscarPorId(id) {

        return await prisma.cliente.findUnique({
            where: {
                id: Number(id)
            }
        });

    }

    async buscarPorCpf(cpfCnpj) {

        return await prisma.cliente.findUnique({
            where: {
                cpfCnpj
            }
        });

    }

    async criar(dados) {

        return await prisma.cliente.create({
            data: dados
        });

    }

    async editar(id, dados) {

        return await prisma.cliente.update({
            where: {
                id: Number(id)
            },
            data: dados
        });

    }

    async excluir(id) {

        return await prisma.cliente.delete({
            where: {
                id: Number(id)
            }
        });

    }

}

module.exports = new ClienteRepository();