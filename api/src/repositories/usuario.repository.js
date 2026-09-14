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

    async recuperarVinculoCliente(usuario, cliente) {
        return prisma.$transaction(async tx => {
            // E-mail de cliente não é único no schema: recusar associação ambígua.
            const clientes = await tx.cliente.findMany({
                where: { email: usuario.email },
                select: { id: true },
                take: 2
            });
            if (clientes.length !== 1 || clientes[0].id !== Number(cliente.id)) return null;

            const resultado = await tx.usuario.updateMany({
                where: {
                    id: usuario.id,
                    email: usuario.email,
                    senha: usuario.senha,
                    role: "CLIENTE",
                    ativo: true,
                    clienteId: null
                },
                data: { clienteId: Number(cliente.id) }
            });
            const atual = await tx.usuario.findUnique({ where: { id: usuario.id } });
            if (resultado.count === 0 &&
                (!atual || atual.clienteId !== Number(cliente.id))) return null;
            if (!atual || atual.role !== "CLIENTE" || !atual.ativo ||
                atual.email !== usuario.email || atual.senha !== usuario.senha) return null;
            return atual;
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

                                },

                                lances: {
                                    orderBy: { criadoEm: "desc" },
                                    include: { assembleia: true }
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