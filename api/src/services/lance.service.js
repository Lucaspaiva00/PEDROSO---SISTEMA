const UsuarioRepository = require("../repositories/usuario.repository");
const AssembleiaRepository = require("../repositories/assembleia.repository");
const LanceRepository = require("../repositories/lance.repository");

class LanceService {

    async validarContratoDoCliente(usuarioLogado, contratoId) {

        const usuario = await UsuarioRepository.findPortalByUserId(
            usuarioLogado.id
        );

        if (!usuario?.cliente) {
            throw new Error("Cliente não encontrado.");
        }

        const contrato = usuario.cliente.contratos.find(
            item => item.id === Number(contratoId)
        );

        if (!contrato) {
            throw new Error("Contrato não encontrado.");
        }

        return contrato;

    }

    async situacao(usuarioLogado, contratoId) {

        const contrato = await this.validarContratoDoCliente(
            usuarioLogado,
            contratoId
        );

        if (!contrato.grupo) {
            return {

                sucesso: true,

                dados: {

                    contrato: {
                        id: contrato.id,
                        grupo: contrato.grupo,
                        cota: contrato.cota,
                        status: contrato.status,
                        valorCarta: Number(contrato.valorCarta)
                    },

                    assembleia: null,

                    meuLance: null,

                    ranking: null,

                    podeDarLance: false,

                    motivoBloqueio: "Contrato sem grupo cadastrado."

                }

            };

        }

        const assembleia = await AssembleiaRepository.buscarAbertaPorGrupo(
            contrato.grupo
        );

        if (!assembleia) {

            return {

                sucesso: true,

                dados: {

                    contrato: {
                        id: contrato.id,
                        grupo: contrato.grupo,
                        cota: contrato.cota,
                        status: contrato.status,
                        valorCarta: Number(contrato.valorCarta)
                    },

                    assembleia: null,

                    meuLance: null,

                    ranking: null,

                    podeDarLance: false,

                    motivoBloqueio: "Nenhuma assembleia aberta para este grupo."

                }

            };

        }

        const meuLance = await LanceRepository.buscarPorAssembleiaEContrato(
            assembleia.id,
            contrato.id
        );

        const lances = await LanceRepository.listarPorAssembleia(
            assembleia.id
        );

        const totalLances = lances.length;

        let minhaPosicao = null;

        if (meuLance) {

            const maiores = await LanceRepository.contarMaioresQue(
                assembleia.id,
                meuLance.valor
            );

            minhaPosicao = maiores + 1;

        }

        const podeDarLance =
            contrato.status === "ATIVO" &&
            assembleia.aceitaLances &&
            !assembleia.encerrada &&
            !meuLance;

        let motivoBloqueio = null;

        if (contrato.status !== "ATIVO") {
            motivoBloqueio = "Contrato não está ativo.";
        } else if (meuLance) {
            motivoBloqueio = "Você já registrou um lance nesta assembleia.";
        } else if (!assembleia.aceitaLances || assembleia.encerrada) {
            motivoBloqueio = "Assembleia não aceita lances.";
        }

        return {

            sucesso: true,

            dados: {

                contrato: {
                    id: contrato.id,
                    grupo: contrato.grupo,
                    cota: contrato.cota,
                    status: contrato.status,
                    valorCarta: Number(contrato.valorCarta)
                },

                assembleia: {
                    id: assembleia.id,
                    titulo: assembleia.titulo,
                    dataAssembleia: assembleia.dataAssembleia,
                    aceitaLances: assembleia.aceitaLances,
                    encerrada: assembleia.encerrada
                },

                meuLance: meuLance
                    ? {
                        id: meuLance.id,
                        valor: Number(meuLance.valor),
                        status: meuLance.status,
                        criadoEm: meuLance.criadoEm,
                        posicao: minhaPosicao
                    }
                    : null,

                ranking: {
                    totalLances,
                    maiorValor: lances[0]
                        ? Number(lances[0].valor)
                        : null
                },

                podeDarLance,

                motivoBloqueio

            }

        };

    }

    async registrar(usuarioLogado, dados) {

        const contratoId = Number(dados.contratoId);
        const valor = Number(dados.valor);

        if (!contratoId || Number.isNaN(contratoId)) {
            throw new Error("Informe o contrato.");
        }

        if (!valor || Number.isNaN(valor) || valor <= 0) {
            throw new Error("Informe um valor de lance válido em reais.");
        }

        const contrato = await this.validarContratoDoCliente(
            usuarioLogado,
            contratoId
        );

        if (contrato.status !== "ATIVO") {
            throw new Error("Somente contratos ativos podem dar lance.");
        }

        if (!contrato.grupo) {
            throw new Error("Contrato sem grupo cadastrado.");
        }

        const assembleia = await AssembleiaRepository.buscarAbertaPorGrupo(
            contrato.grupo
        );

        if (!assembleia || !assembleia.aceitaLances || assembleia.encerrada) {
            throw new Error("Não há assembleia aberta para lances neste grupo.");
        }

        const existente = await LanceRepository.buscarPorAssembleiaEContrato(
            assembleia.id,
            contrato.id
        );

        if (existente) {
            throw new Error("Você já registrou um lance nesta assembleia.");
        }

        const lance = await LanceRepository.criar({

            assembleiaId: assembleia.id,

            contratoId: contrato.id,

            valor

        });

        const maiores = await LanceRepository.contarMaioresQue(
            assembleia.id,
            lance.valor
        );

        return {

            sucesso: true,

            mensagem: "Lance registrado. Não é possível alterar ou cancelar.",

            dados: {

                id: lance.id,

                valor: Number(lance.valor),

                status: lance.status,

                posicao: maiores + 1,

                assembleiaId: assembleia.id

            }

        };

    }

    async listarContratos(usuarioLogado) {

        const usuario = await UsuarioRepository.findPortalByUserId(
            usuarioLogado.id
        );

        if (!usuario?.cliente) {
            throw new Error("Cliente não encontrado.");
        }

        return {

            sucesso: true,

            dados: usuario.cliente.contratos.map(contrato => ({

                id: contrato.id,

                grupo: contrato.grupo,

                cota: contrato.cota,

                status: contrato.status,

                tipo: contrato.tipo,

                valorCarta: Number(contrato.valorCarta),

                planoNome: contrato.plano?.nome || null

            }))

        };

    }

    async listarAdmin(filtros = {}) {

        const todos = filtros.todos === true ||
            filtros.todos === "true" ||
            filtros.todos === "1";

        const status = todos
            ? null
            : (filtros.status || "REGISTRADO");

        const lances = await LanceRepository.listarAdmin(status);

        return {

            sucesso: true,

            lances: lances.map(lance => ({

                id: lance.id,

                valor: Number(lance.valor),

                status: lance.status,

                criadoEm: lance.criadoEm,

                assembleia: {
                    id: lance.assembleia.id,
                    grupo: lance.assembleia.grupo,
                    titulo: lance.assembleia.titulo,
                    dataAssembleia: lance.assembleia.dataAssembleia,
                    encerrada: lance.assembleia.encerrada
                },

                contrato: {
                    id: lance.contrato.id,
                    numeroContrato: lance.contrato.numeroContrato,
                    grupo: lance.contrato.grupo,
                    cota: lance.contrato.cota,
                    status: lance.contrato.status,
                    cliente: lance.contrato.cliente?.nome || null,
                    plano: lance.contrato.plano?.nome || null
                }

            }))

        };

    }

    async aprovar(lanceId) {

        const AssembleiaService = require("./assembleia.service");

        const lance = await LanceRepository.buscarPorId(lanceId);

        if (!lance) {
            throw new Error("Lance não encontrado.");
        }

        return AssembleiaService.contemplar(
            lance.assembleiaId,
            lance.id
        );

    }

    async reprovar(lanceId) {

        const prisma = require("../config/prisma");

        const lance = await LanceRepository.buscarPorId(lanceId);

        if (!lance) {
            throw new Error("Lance não encontrado.");
        }

        if (lance.status !== "REGISTRADO") {
            throw new Error("Este lance já foi analisado.");
        }

        if (lance.assembleia.encerrada) {
            throw new Error("Assembleia já encerrada.");
        }

        await prisma.lance.update({

            where: { id: lance.id },

            data: { status: "NAO_CONTEMPLADO" }

        });

        return {

            sucesso: true,

            mensagem: "Lance reprovado."

        };

    }

    async listarPorContrato(contratoId) {

        const prisma = require("../config/prisma");

        const lances = await prisma.lance.findMany({

            where: {
                contratoId: Number(contratoId)
            },

            orderBy: { criadoEm: "desc" },

            include: {
                assembleia: true
            }

        });

        return {

            sucesso: true,

            lances: lances.map(lance => ({

                id: lance.id,

                valor: Number(lance.valor),

                status: lance.status,

                criadoEm: lance.criadoEm,

                assembleia: {
                    id: lance.assembleia.id,
                    grupo: lance.assembleia.grupo,
                    titulo: lance.assembleia.titulo,
                    dataAssembleia: lance.assembleia.dataAssembleia
                }

            }))

        };

    }

}

module.exports = new LanceService();
