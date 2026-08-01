const prisma = require("../config/prisma");
const { somenteNumeros } = require("../utils/cpfCnpj");

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

    async buscarDetalhe(id) {

        return await prisma.cliente.findUnique({

            where: {
                id: Number(id)
            },

            include: {

                contratos: {

                    orderBy: {
                        criadoEm: "desc"
                    },

                    include: {

                        plano: true,

                        lances: {

                            orderBy: {
                                criadoEm: "desc"
                            },

                            include: {
                                assembleia: true
                            }

                        }

                    }

                }

            }

        });

    }

    async buscarPorCpf(cpfCnpj) {

        const cpf = somenteNumeros(cpfCnpj);

        if (!cpf) {
            return null;
        }

        const direto = await prisma.cliente.findUnique({
            where: { cpfCnpj: cpf }
        });

        if (direto) {
            return direto;
        }

        const rows = await prisma.$queryRaw`
            SELECT id
            FROM "Cliente"
            WHERE regexp_replace("cpfCnpj", '[^0-9]', '', 'g') = ${cpf}
            LIMIT 1
        `;

        if (!rows.length) {
            return null;
        }

        return prisma.cliente.findUnique({
            where: { id: rows[0].id }
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