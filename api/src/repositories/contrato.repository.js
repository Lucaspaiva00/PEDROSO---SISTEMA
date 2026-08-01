const prisma = require("../config/prisma");

class ContratoRepository {

    async cadastrar(dados) {

        return await prisma.contrato.create({

            data: dados,

            include: {

                cliente: true,

                plano: true,

                parcelas: {

                    orderBy: {

                        numero: "asc"

                    }

                }

            }

        });

    }

    async listar() {

        return await prisma.contrato.findMany({

            include: {

                cliente: true,

                plano: true,

                parcelas: {

                    orderBy: {

                        numero: "asc"

                    }

                }

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

                plano: true,

                parcelas: {

                    orderBy: {

                        numero: "asc"

                    }

                }

            }

        });

    }

    async atualizar(id, dados) {
        console.log("Contrato antes do update:", contrato.id);

        const existe = await prisma.contrato.findUnique({
            where: {
                id: contrato.id
            }
        });

        console.log("Existe?", existe);
        return await prisma.contrato.update({

            where: {

                id: Number(id)

            },

            data: dados,

            include: {

                cliente: true,

                plano: true,

                parcelas: {

                    orderBy: {

                        numero: "asc"

                    }

                }

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

    async listarGruposDistintos() {

        const linhas = await prisma.contrato.groupBy({

            by: ["grupo"],

            where: {
                grupo: {
                    not: null
                }
            }

        });

        return linhas
            .map(item => item.grupo?.trim())
            .filter(Boolean)
            .sort((a, b) => a.localeCompare(b, "pt-BR"));

    }

}

module.exports = new ContratoRepository();