const UsuarioRepository = require("../repositories/usuario.repository");

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

}

module.exports = new PortalService();