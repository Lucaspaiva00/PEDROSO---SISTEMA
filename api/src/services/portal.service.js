const UsuarioRepository = require("../repositories/usuario.repository");

class PortalService {

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
                    contrato.quantidadeParcelas

            }

        };

    }

    async contrato(usuarioLogado) {

        const usuario = await UsuarioRepository.findPortalByUserId(
            usuarioLogado.id
        );

        if (!usuario || !usuario.cliente) {

            return {

                sucesso: false,
                mensagem: "Cliente não encontrado."

            };

        }

        const contrato = usuario.cliente.contratos[0];

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

                tipoConsorcio: contrato.tipoConsorcio,

                valorCartaCredito: Number(contrato.valorCarta),

                valorParcela: Number(contrato.valorParcela),

                quantidadeParcelas: contrato.quantidadeParcelas,

                parcelasPagas,

                parcelasRestantes,

                dataContratacao: contrato.createdAt,

                plano: {

                    nome: contrato.plano?.nome

                }

            }

        };

    }
    async parcelas(usuarioLogado) {

        const usuario = await UsuarioRepository.findPortalByUserId(
            usuarioLogado.id
        );

        if (!usuario || !usuario.cliente) {

            return {

                sucesso: false,
                mensagem: "Cliente não encontrado."

            };

        }

        const contrato = usuario.cliente.contratos[0];

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