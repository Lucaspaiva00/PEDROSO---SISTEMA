const prisma = require("../config/prisma");

class AssembleiaRepository {

    async criar(dados) {

        return prisma.assembleia.create({
            data: dados
        });

    }

    async listar() {

        return prisma.assembleia.findMany({

            orderBy: {
                dataAssembleia: "desc"
            },

            include: {
                _count: {
                    select: {
                        lances: true
                    }
                }
            }

        });

    }

    async buscarPorId(id) {

        return prisma.assembleia.findUnique({

            where: {
                id: Number(id)
            }

        });

    }

    async atualizar(id, dados) {

        return prisma.assembleia.update({

            where: {
                id: Number(id)
            },

            data: dados

        });

    }

    async buscarAbertaPorGrupo(grupo) {

        return prisma.assembleia.findFirst({

            where: {
                grupo: String(grupo),
                aceitaLances: true,
                encerrada: false
            },

            orderBy: {
                dataAssembleia: "desc"
            }

        });

    }

    async buscarNaoEncerradaPorGrupo(grupo) {

        return prisma.assembleia.findFirst({

            where: {
                grupo: String(grupo),
                encerrada: false
            },

            orderBy: {
                dataAssembleia: "desc"
            }

        });

    }

}

module.exports = new AssembleiaRepository();
