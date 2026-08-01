const prisma = require("../config/prisma");
const { somenteNumeros } = require("../utils/cpfCnpj");

class UsuarioRepository {

    async findByEmail(email) {

        return await prisma.usuario.findUnique({
            where: {
                email
            }
        });

    }

    async findByCpf(cpfCnpj) {

        const cpf = somenteNumeros(cpfCnpj);

        if (!cpf) {
            return null;
        }

        const direto = await prisma.usuario.findFirst({

            where: {
                cliente: { cpfCnpj: cpf }
            },

            include: { cliente: true }

        });

        if (direto) {
            return direto;
        }

        const rows = await prisma.$queryRaw`
            SELECT u."id" AS id
            FROM "Usuario" u
            INNER JOIN "Cliente" c ON c."id" = u."clienteId"
            WHERE regexp_replace(c."cpfCnpj", '[^0-9]', '', 'g') = ${cpf}
            LIMIT 1
        `;

        if (!rows.length) {
            return null;
        }

        return prisma.usuario.findUnique({

            where: { id: rows[0].id },

            include: { cliente: true }

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

    async update(id, dados) {

        return await prisma.usuario.update({
            where: { id: Number(id) },
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