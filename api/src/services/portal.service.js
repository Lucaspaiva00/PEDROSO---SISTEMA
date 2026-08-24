const UsuarioRepository = require("../repositories/usuario.repository");
const AsaasService = require("./asaas.service");
const prisma = require("../config/prisma");

class PortalService {

    resolverContrato(cliente, contratoId) {

        const contratos = cliente.contratos || [];

        if (!contratos.length) {
            return null;
        }

        if (contratoId != null && contratoId !== "") {
            const id = Number(contratoId);

            if (!Number.isNaN(id)) {
                const encontrado = contratos.find(item => item.id === id);

                if (encontrado) {
                    return encontrado;
                }
            }
        }

        return contratos[0];

    }

    mapearContratoResumo(contrato) {

        const proximaParcela = contrato.parcelas.find(
            parcela => parcela.status === "PENDENTE"
        );

        return {

            id: contrato.id,

            numeroContrato: contrato.numeroContrato,

            grupo: contrato.grupo,

            cota: contrato.cota,

            status: contrato.status,

            tipo: contrato.tipo,

            tipoConsorcio: contrato.tipo,

            valorCarta: Number(contrato.valorCarta),

            valorCartaCredito: Number(contrato.valorCarta),

            valorParcela: Number(contrato.valorParcela),

            quantidadeParcelas: contrato.quantidadeParcelas,

            parcelasPagas: contrato.parcelasPagas,

            parcelasRestantes:
                contrato.quantidadeParcelas - contrato.parcelasPagas,

            planoNome: contrato.plano?.nome || null,

            plano: {
                nome: contrato.plano?.nome
            },

            proximaParcela: proximaParcela
                ? {
                    valor: Number(proximaParcela.valor),
                    vencimento: proximaParcela.vencimento
                }
                : null,

            proximoVencimento: proximaParcela
                ? proximaParcela.vencimento
                : null

        };

    }

    async dashboard(usuarioLogado) {

        const usuario = await UsuarioRepository.findPortalByUserId(
            usuarioLogado.id
        );

        if (!usuario || !usuario.cliente) {

            return {

                sucesso: false,
                mensagem: "Cliente não encontrado."

            };

        }

        const contratosResumo = usuario.cliente.contratos.map(
            contrato => this.mapearContratoResumo(contrato)
        );

        const contrato = usuario.cliente.contratos[0];

        if (!contrato) {

            return {

                sucesso: false,
                mensagem: "Nenhum contrato encontrado."

            };

        }

        const proximaParcela = contrato.parcelas.find(parcela =>
            parcela.status === "PENDENTE"
        );

        return {

            sucesso: true,

            dados: {

                nome: usuario.cliente.nome,

                valorCarta: Number(contrato.valorCarta),

                proximaParcela: proximaParcela
                    ? Number(proximaParcela.valor)
                    : 0,

                proximoVencimento: proximaParcela
                    ? proximaParcela.vencimento
                    : null,

                status: contrato.status,

                grupo: contrato.grupo,

                cota: contrato.cota,

                parcelasPagas: contrato.parcelasPagas,

                parcelasRestantes:
                    contrato.quantidadeParcelas -
                    contrato.parcelasPagas,

                parcelasTotais:
                    contrato.quantidadeParcelas,

                contratos: contratosResumo

            }

        };

    }

    async listarContratos(usuarioLogado) {

        const usuario = await UsuarioRepository.findPortalByUserId(
            usuarioLogado.id
        );

        if (!usuario?.cliente) {

            return {
                sucesso: false,
                mensagem: "Cliente não encontrado."
            };

        }

        return {

            sucesso: true,

            dados: usuario.cliente.contratos.map(contrato =>
                this.mapearContratoResumo(contrato)
            )

        };

    }

    async contrato(usuarioLogado, contratoId) {

        const usuario = await UsuarioRepository.findPortalByUserId(
            usuarioLogado.id
        );

        if (!usuario || !usuario.cliente) {

            return {

                sucesso: false,
                mensagem: "Cliente não encontrado."

            };

        }

        const contrato = this.resolverContrato(
            usuario.cliente,
            contratoId
        );

        if (!contrato) {

            return {

                sucesso: false,
                mensagem: "Nenhum contrato encontrado."

            };

        }

        const parcelasPagas = contrato.parcelasPagas;

        const parcelasRestantes =
            contrato.quantidadeParcelas - parcelasPagas;

        return {

            sucesso: true,

            dados: {

                id: contrato.id,

                numeroContrato: contrato.numeroContrato,

                status: contrato.status,

                grupo: contrato.grupo,

                cota: contrato.cota,

                tipoConsorcio: contrato.tipo,

                valorCartaCredito: Number(contrato.valorCarta),

                valorParcela: Number(contrato.valorParcela),

                quantidadeParcelas: contrato.quantidadeParcelas,

                parcelasPagas,

                parcelasRestantes,

                dataContratacao: contrato.criadoEm,

                pdfUrl: contrato.contratoPdfUrl || null,

                plano: {

                    nome: contrato.plano?.nome

                }

            }

        };

    }
    async parcelas(usuarioLogado, contratoId) {

        const usuario = await UsuarioRepository.findPortalByUserId(
            usuarioLogado.id
        );

        if (!usuario || !usuario.cliente) {

            return {

                sucesso: false,
                mensagem: "Cliente não encontrado."

            };

        }

        const contrato = this.resolverContrato(
            usuario.cliente,
            contratoId
        );

        if (!contrato) {

            return {

                sucesso: false,
                mensagem: "Nenhum contrato encontrado."

            };

        }

        const proximaParcela = contrato.parcelas.find(
            parcela => parcela.status === "PENDENTE"
        );

        return {

            sucesso: true,

            dados: {

                proximaParcela: proximaParcela
                    ? {

                        id: proximaParcela.id,

                        numero: proximaParcela.numero,

                        valor: Number(proximaParcela.valor),

                        vencimento: proximaParcela.vencimento,

                        status: proximaParcela.status,

                        paymentId: proximaParcela.asaasPaymentId,

                        invoiceUrl: proximaParcela.asaasInvoiceUrl,

                        bankSlipUrl: proximaParcela.asaasBankSlipUrl,

                        pixQrCode: proximaParcela.asaasPixQrCode,

                        pixCopiaCola: proximaParcela.asaasPixCopiaCola,

                        pagamentoEm: proximaParcela.pagamentoEm

                    }
                    : null,

                parcelas: contrato.parcelas.map(parcela => ({

                    id: parcela.id,

                    numero: parcela.numero,

                    valor: Number(parcela.valor),

                    vencimento: parcela.vencimento,

                    status: parcela.status,

                    paymentId: parcela.asaasPaymentId,

                    invoiceUrl: parcela.asaasInvoiceUrl,

                    bankSlipUrl: parcela.asaasBankSlipUrl,

                    pixQrCode: parcela.asaasPixQrCode,

                    pixCopiaCola: parcela.asaasPixCopiaCola,

                    pagamentoEm: parcela.pagamentoEm

                }))

            }

        };

    }


    async validarContratoDoCliente(usuarioLogado, contratoId) {

        const usuario = await UsuarioRepository.findPortalByUserId(usuarioLogado.id);

        if (!usuario?.cliente) {
            throw new Error("Cliente não encontrado.");
        }

        const contrato = usuario.cliente.contratos.find(
            item => item.id === Number(contratoId)
        );

        if (!contrato) {
            throw new Error("Contrato não encontrado para este cliente.");
        }

        return contrato;

    }

    async alterarSituacaoContrato(usuarioLogado, contratoId, acao) {

        const contrato = await this.validarContratoDoCliente(usuarioLogado, contratoId);
        const acaoNormalizada = String(acao || "").toLowerCase();

        if (acaoNormalizada === "pausar") {
            if (contrato.status !== "ATIVO" && contrato.status !== "INADIMPLENTE") {
                throw new Error("Somente contratos ativos podem ser pausados.");
            }

            const integracao = await AsaasService.interromperCobrancasContrato(
                contrato.id,
                { cancelarParcelas: false }
            );

            const atualizado = await prisma.contrato.update({
                where: { id: contrato.id },
                data: { status: "PAUSADO", asaasStatus: "PAUSADO" }
            });

            return {
                sucesso: true,
                mensagem: integracao.sucesso
                    ? "Contrato pausado com sucesso. As cobranças em aberto foram interrompidas."
                    : "Contrato pausado, mas uma ou mais cobranças do Asaas precisam de conferência pelo administrador.",
                dados: { id: atualizado.id, status: atualizado.status },
                integracaoAsaas: integracao
            };
        }

        if (acaoNormalizada === "reativar") {
            if (contrato.status !== "PAUSADO") {
                throw new Error("Somente contratos pausados podem ser reativados.");
            }

            const atualizado = await prisma.contrato.update({
                where: { id: contrato.id },
                data: { status: "ATIVO", asaasStatus: "REATIVANDO" }
            });

            let integracao = null;
            if (atualizado.sincronizarAsaas) {
                integracao = await AsaasService.sincronizarContrato(atualizado.id);
            }

            return {
                sucesso: true,
                mensagem: "Contrato reativado com sucesso.",
                dados: { id: atualizado.id, status: "ATIVO" },
                integracaoAsaas: integracao
            };
        }

        if (acaoNormalizada === "cancelar") {
            if (["CANCELADO", "QUITADO"].includes(contrato.status)) {
                throw new Error("Este contrato não pode ser cancelado no status atual.");
            }

            const integracao = await AsaasService.interromperCobrancasContrato(
                contrato.id,
                { cancelarParcelas: true }
            );

            const atualizado = await prisma.contrato.update({
                where: { id: contrato.id },
                data: { status: "CANCELADO", asaasStatus: "CANCELADO" }
            });

            return {
                sucesso: true,
                mensagem: integracao.sucesso
                    ? "Contrato cancelado com sucesso. As cobranças em aberto foram canceladas."
                    : "Contrato cancelado, mas uma ou mais cobranças do Asaas precisam de conferência pelo administrador.",
                dados: { id: atualizado.id, status: atualizado.status },
                integracaoAsaas: integracao
            };
        }

        throw new Error("Ação inválida para o contrato.");

    }

    async boleto(usuarioLogado, parcelaId) {

        const usuario = await UsuarioRepository.findPortalByUserId(usuarioLogado.id);

        if (!usuario?.cliente) {
            throw new Error("Cliente não encontrado.");
        }

        const parcela = usuario.cliente.contratos
            .flatMap(contrato => contrato.parcelas || [])
            .find(item => item.id === Number(parcelaId));

        if (!parcela) {
            throw new Error("Parcela não encontrada para este cliente.");
        }

        const boleto = await AsaasService.atualizarDadosCobrancaDaParcela(parcela.id);

        return { sucesso: true, dados: boleto };

    }

}

module.exports = new PortalService();