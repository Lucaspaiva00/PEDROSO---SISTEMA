const prisma = require("../config/prisma");

class LanceRepository {

    async criar(dados) {

        return prisma.lance.create({
            data: dados
        });

    }

    async buscarPorAssembleiaEContrato(assembleiaId, contratoId) {

        return prisma.lance.findUnique({

            where: {
                assembleiaId_contratoId: {
                    assembleiaId: Number(assembleiaId),
                    contratoId: Number(contratoId)
                }
            }

        });

    }

    async listarPorAssembleia(assembleiaId) {

        return prisma.lance.findMany({

            where: {
                assembleiaId: Number(assembleiaId)
            },

            orderBy: [
                { valor: "desc" },
                { criadoEm: "asc" }
            ],

            include: {

                contrato: {

                    include: {
                        cliente: true
                    }

                }

            }

        });

    }

    async contarMaioresQue(assembleiaId, valor) {

        return prisma.lance.count({

            where: {
                assembleiaId: Number(assembleiaId),
                valor: {
                    gt: valor
                }
            }

        });

    }

    async buscarPorId(id) {

        return prisma.lance.findUnique({

            where: {
                id: Number(id)
            },

            include: {
                assembleia: true,
                contrato: {
                    include: {
                        cliente: true,
                        plano: true
                    }
                }
            }

        });

    }

    async listarAdmin(status) {

        const where = {};

        if (status) {
            where.status = status;
        }

        return prisma.lance.findMany({

            where,

            orderBy: [
                { criadoEm: "desc" }
            ],

            include: {

                assembleia: true,

                contrato: {

                    include: {
                        cliente: true,
                        plano: true
                    }

                }

            }

        });

    }

}

module.exports = new LanceRepository();
