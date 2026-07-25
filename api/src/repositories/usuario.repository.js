const prisma = require("../config/prisma");

class UsuarioRepository {

    async findByEmail(email) {

        return await prisma.usuario.findUnique({
            where: {
                email
            }
        });

    }

    async findByCpf(cpfCnpj) {

        return await prisma.usuario.findFirst({

            where: {

                cliente: {

                    cpfCnpj

                }

            },

            include: {

                cliente: true

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

    async findByClienteId(clienteId) {

        return await prisma.usuario.findFirst({

            where: {
                clienteId: Number(clienteId)
            }

        });

    }

    async create(dados) {

        return await prisma.usuario.create({
            data: dados
        });

    }

    async findPortalByUserId(id) {

        return await prisma.usuario.findUnique({

            where: {
                id: Number(id)
            },

            include: {

                cliente: {

                    include: {

                        contratos: {

                            include: {

                                plano: true,

                                parcelas: {

                                    orderBy: {

                                        numero: "asc"

                                    }

                                }

                            }

                        }

                    }

                }

            }

        });

    }



}

module.exports = new UsuarioRepository();