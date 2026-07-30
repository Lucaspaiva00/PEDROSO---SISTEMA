const axios = require("axios");
const prisma = require("../config/prisma");

class AsaasService {

    constructor() {

        this.api = axios.create({

            baseURL: process.env.ASAAS_API_URL,

            headers: {

                access_token: process.env.ASAAS_API_KEY,

                "Content-Type": "application/json",

                "User-Agent": "PedrosoConsorcios/1.0"

            },

            timeout: 20000

        });

    }

    /*==========================================================
    TESTAR CONEXÃO
    ==========================================================*/

    async testarConexao() {

        const resposta = await this.api.get(
            "/finance/getCurrentBalance"
        );

        return resposta.data;

    }

    /*==========================================================
    CLIENTES
    ==========================================================*/

    async buscarClientePorCpfCnpj(cpfCnpj) {

        const cpfCnpjLimpo = this.somenteNumeros(cpfCnpj);

        if (!cpfCnpjLimpo) {

            throw new Error(
                "CPF/CNPJ não informado para buscar cliente no Asaas."
            );

        }

        const resposta = await this.api.get("/customers", {

            params: {

                cpfCnpj: cpfCnpjLimpo

            }

        });

        return resposta.data?.data?.[0] || null;

    }

    async criarCliente(cliente) {

        if (!cliente?.nome) {

            throw new Error(
                "Nome do cliente não informado."
            );

        }

        const cpfCnpj = this.somenteNumeros(
            cliente.cpfCnpj
        );

        if (!cpfCnpj) {

            throw new Error(
                "CPF/CNPJ do cliente não informado."
            );

        }

        const dados = {

            name: cliente.nome,

            cpfCnpj,

            email: cliente.email || undefined,

            mobilePhone: cliente.telefone
                ? this.somenteNumeros(cliente.telefone)
                : undefined,

            externalReference: String(cliente.id),

            postalCode: cliente.cep
                ? this.somenteNumeros(cliente.cep)
                : undefined,

            address: cliente.rua || undefined,

            addressNumber: cliente.numero || undefined,

            province: cliente.bairro || undefined

        };

        const resposta = await this.api.post(
            "/customers",
            this.removerCamposVazios(dados)
        );

        return resposta.data;

    }

    async obterOuCriarCliente(cliente) {

        if (cliente.asaasCustomerId) {

            return {

                id: cliente.asaasCustomerId,

                encontradoLocalmente: true

            };

        }

        let clienteAsaas =
            await this.buscarClientePorCpfCnpj(
                cliente.cpfCnpj
            );

        if (!clienteAsaas) {

            clienteAsaas =
                await this.criarCliente(cliente);

        }

        await prisma.cliente.update({

            where: {

                id: Number(cliente.id)

            },

            data: {

                asaasCustomerId: clienteAsaas.id

            }

        });

        return clienteAsaas;

    }

    /*==========================================================
    COBRANÇAS
    ==========================================================*/

    async criarCobranca({

        customerId,

        valor,

        vencimento,

        descricao,

        parcelaId,

        billingType = "BOLETO"

    }) {

        if (!customerId) {

            throw new Error(
                "Cliente Asaas não informado."
            );

        }

        if (!parcelaId) {

            throw new Error(
                "Parcela local não informada."
            );

        }

        const valorNumerico = Number(valor);

        if (
            Number.isNaN(valorNumerico) ||
            valorNumerico <= 0
        ) {

            throw new Error(
                "Valor da cobrança inválido."
            );

        }

        const resposta = await this.api.post(
            "/payments",
            {

                customer: customerId,

                billingType:
                    this.converterMetodoPagamento(
                        billingType
                    ),

                value: valorNumerico,

                dueDate:
                    this.formatarDataAsaas(
                        vencimento
                    ),

                description:
                    descricao ||
                    `Parcela ${parcelaId} - Pedroso Consórcios`,

                externalReference:
                    String(parcelaId)

            }
        );

        return resposta.data;

    }

    async consultarCobranca(paymentId) {

        if (!paymentId) {

            throw new Error(
                "Identificador da cobrança não informado."
            );

        }

        const resposta = await this.api.get(
            `/payments/${paymentId}`
        );

        return resposta.data;

    }

    async obterPix(paymentId) {

        if (!paymentId) {

            throw new Error(
                "Identificador da cobrança não informado."
            );

        }

        const resposta = await this.api.get(
            `/payments/${paymentId}/pixQrCode`
        );

        return resposta.data;

    }

    async tentarObterPix(paymentId) {

        try {

            return await this.obterPix(paymentId);

        } catch (erro) {

            console.warn(
                `PIX não disponível para a cobrança ${paymentId}:`,
                erro.response?.data || erro.message
            );

            return null;

        }

    }

    /*==========================================================
    CRIAR PARCELAS LOCAIS
    ==========================================================*/

    async garantirParcelasLocais(contratoId) {

        const contrato = await prisma.contrato.findUnique({

            where: {

                id: Number(contratoId)

            },

            include: {

                parcelas: {

                    orderBy: {

                        numero: "asc"

                    }

                }

            }

        });

        if (!contrato) {

            throw new Error(
                "Contrato não encontrado para gerar parcelas."
            );

        }

        if (contrato.parcelas.length > 0) {

            return contrato.parcelas;

        }

        const quantidadeParcelas =
            Number(contrato.quantidadeParcelas);

        if (
            !quantidadeParcelas ||
            quantidadeParcelas <= 0
        ) {

            throw new Error(
                "Quantidade de parcelas inválida."
            );

        }

        if (!contrato.primeiroVencimento) {

            throw new Error(
                "Primeiro vencimento não informado."
            );

        }

        const parcelas = [];

        for (
            let numero = 1;
            numero <= quantidadeParcelas;
            numero++
        ) {

            const vencimento =
                this.adicionarMesesAoVencimento(

                    contrato.primeiroVencimento,

                    numero - 1,

                    contrato.diaVencimento

                );

            const parcelaPaga =
                numero <= Number(
                    contrato.parcelasPagas || 0
                );

            parcelas.push({

                contratoId: contrato.id,

                numero,

                valor: contrato.valorParcela,

                vencimento,

                status: parcelaPaga
                    ? "PAGA"
                    : "PENDENTE"

            });

        }

        await prisma.parcela.createMany({

            data: parcelas,

            skipDuplicates: true

        });

        return await prisma.parcela.findMany({

            where: {

                contratoId: contrato.id

            },

            orderBy: {

                numero: "asc"

            }

        });

    }

    /*==========================================================
    SINCRONIZAR CONTRATO
    ==========================================================*/

    async sincronizarContrato(contratoId) {

        const contrato = await prisma.contrato.findUnique({

            where: {

                id: Number(contratoId)

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

        if (!contrato) {

            throw new Error(
                "Contrato não encontrado para sincronização."
            );

        }

        if (!contrato.sincronizarAsaas) {

            return {

                sucesso: true,

                ignorado: true,

                mensagem:
                    "Sincronização com o Asaas desativada neste contrato."

            };

        }

        const clienteAsaas =
            await this.obterOuCriarCliente(
                contrato.cliente
            );

        const parcelas =
            await this.garantirParcelasLocais(
                contrato.id
            );

        const resultados = [];

        for (const parcela of parcelas) {

            if (parcela.status === "PAGA") {

                resultados.push({

                    parcelaId: parcela.id,

                    numero: parcela.numero,

                    sucesso: true,

                    ignorada: true,

                    motivo:
                        "Parcela já marcada como paga."

                });

                continue;

            }

            if (parcela.asaasPaymentId) {

                resultados.push({

                    parcelaId: parcela.id,

                    numero: parcela.numero,

                    sucesso: true,

                    ignorada: true,

                    motivo:
                        "Parcela já sincronizada.",

                    paymentId:
                        parcela.asaasPaymentId

                });

                continue;

            }

            try {

                const cobranca =
                    await this.criarCobranca({

                        customerId:
                            clienteAsaas.id,

                        valor:
                            parcela.valor,

                        vencimento:
                            parcela.vencimento,

                        descricao:
                            this.montarDescricaoCobranca(
                                contrato,
                                parcela
                            ),

                        parcelaId:
                            parcela.id,

                        billingType:
                            contrato.asaasBillingType

                    });

                const pix =
                    await this.tentarObterPix(
                        cobranca.id
                    );

                await prisma.parcela.update({

                    where: {

                        id: parcela.id

                    },

                    data: {

                        asaasPaymentId:
                            cobranca.id,

                        asaasInvoiceUrl:
                            cobranca.invoiceUrl ||
                            null,

                        asaasBankSlipUrl:
                            cobranca.bankSlipUrl ||
                            null,

                        asaasPixQrCode:
                            pix?.encodedImage ||
                            null,

                        asaasPixCopiaCola:
                            pix?.payload ||
                            null,

                        asaasNossoNumero:
                            cobranca.nossoNumero ||
                            null,

                        asaasStatus:
                            cobranca.status ||
                            null

                    }

                });

                resultados.push({

                    parcelaId: parcela.id,

                    numero: parcela.numero,

                    sucesso: true,

                    paymentId: cobranca.id

                });

                await this.registrarLog({

                    acao:
                        "CRIAR_COBRANCA",

                    entidade:
                        "PARCELA",

                    entidadeId:
                        parcela.id,

                    sucesso: true,

                    request: {

                        contratoId:
                            contrato.id,

                        customerId:
                            clienteAsaas.id

                    },

                    response: {

                        paymentId:
                            cobranca.id,

                        status:
                            cobranca.status

                    }

                });

            } catch (erro) {

                const erroTratado =
                    this.obterMensagemErro(erro);

                resultados.push({

                    parcelaId: parcela.id,

                    numero: parcela.numero,

                    sucesso: false,

                    erro: erroTratado

                });

                await this.registrarLog({

                    acao:
                        "CRIAR_COBRANCA",

                    entidade:
                        "PARCELA",

                    entidadeId:
                        parcela.id,

                    sucesso: false,

                    request: {

                        contratoId:
                            contrato.id,

                        customerId:
                            clienteAsaas.id

                    },

                    erro: erroTratado

                });

            }

        }

        const quantidadeSucesso =
            resultados.filter(
                item => item.sucesso
            ).length;

        const quantidadeErros =
            resultados.filter(
                item => !item.sucesso
            ).length;

        const statusSincronizacao =
            quantidadeErros === 0
                ? "SINCRONIZADO"
                : "SINCRONIZADO_PARCIALMENTE";

        await prisma.contrato.update({

            where: {

                id: contrato.id

            },

            data: {

                asaasStatus:
                    statusSincronizacao

            }

        });

        return {

            sucesso: quantidadeErros === 0,

            contratoId: contrato.id,

            clienteAsaasId:
                clienteAsaas.id,

            total: resultados.length,

            sincronizadas:
                quantidadeSucesso,

            erros:
                quantidadeErros,

            resultados

        };

    }

    /*==========================================================
    UTILITÁRIOS
    ==========================================================*/

    montarDescricaoCobranca(
        contrato,
        parcela
    ) {

        const numeroContrato =
            contrato.numeroContrato
                ? ` - Contrato ${contrato.numeroContrato}`
                : "";

        return (
            `Parcela ${parcela.numero}/${contrato.quantidadeParcelas}` +
            numeroContrato +
            " - Pedroso Consórcios"
        );

    }

    converterMetodoPagamento(metodo) {

        const metodoNormalizado =
            String(metodo || "BOLETO")
                .toUpperCase();

        switch (metodoNormalizado) {

            case "PIX":
                return "PIX";

            case "CARTAO":
            case "CREDIT_CARD":
                return "CREDIT_CARD";

            case "UNDEFINED":
                return "UNDEFINED";

            case "BOLETO":
            default:
                return "BOLETO";

        }

    }

    formatarDataAsaas(data) {

        const dataConvertida =
            new Date(data);

        if (
            Number.isNaN(
                dataConvertida.getTime()
            )
        ) {

            throw new Error(
                "Data de vencimento inválida."
            );

        }

        const ano =
            dataConvertida.getUTCFullYear();

        const mes =
            String(
                dataConvertida.getUTCMonth() + 1
            ).padStart(2, "0");

        const dia =
            String(
                dataConvertida.getUTCDate()
            ).padStart(2, "0");

        return `${ano}-${mes}-${dia}`;

    }

    adicionarMesesAoVencimento(
        primeiroVencimento,
        meses,
        diaVencimento
    ) {

        const dataBase =
            new Date(primeiroVencimento);

        const ano =
            dataBase.getUTCFullYear();

        const mes =
            dataBase.getUTCMonth() +
            Number(meses);

        const diaDesejado =
            Number(diaVencimento) ||
            dataBase.getUTCDate();

        const ultimoDiaDoMes =
            new Date(
                Date.UTC(
                    ano,
                    mes + 1,
                    0
                )
            ).getUTCDate();

        const dia =
            Math.min(
                diaDesejado,
                ultimoDiaDoMes
            );

        return new Date(
            Date.UTC(
                ano,
                mes,
                dia,
                12,
                0,
                0
            )
        );

    }

    somenteNumeros(valor) {

        return String(valor || "")
            .replace(/\D/g, "");

    }

    removerCamposVazios(objeto) {

        return Object.fromEntries(

            Object.entries(objeto).filter(
                ([, valor]) =>
                    valor !== undefined &&
                    valor !== null &&
                    valor !== ""
            )

        );

    }

    obterMensagemErro(erro) {

        const errosAsaas =
            erro.response?.data?.errors;

        if (
            Array.isArray(errosAsaas) &&
            errosAsaas.length > 0
        ) {

            return errosAsaas
                .map(item =>
                    item.description ||
                    item.code
                )
                .join(" | ");

        }

        return (
            erro.response?.data?.message ||
            erro.message ||
            "Erro desconhecido na integração com o Asaas."
        );

    }

    async registrarLog({

        acao,

        entidade = null,

        entidadeId = null,

        sucesso,

        request = null,

        response = null,

        erro = null

    }) {

        try {

            await prisma.logIntegracaoAsaas.create({

                data: {

                    acao,

                    entidade,

                    entidadeId,

                    sucesso,

                    request,

                    response,

                    erro

                }

            });

        } catch (erroLog) {

            console.error(
                "Erro ao registrar log da integração:",
                erroLog.message
            );

        }

    }

}

module.exports = new AsaasService();