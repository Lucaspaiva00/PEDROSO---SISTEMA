const axios = require("axios");

class AsaasService {
    async testarConexao() {

        const resposta = await this.api.get(
            "/finance/getCurrentBalance"
        );

        return resposta.data;

    }

    constructor() {

        this.api = axios.create({

            baseURL: process.env.ASAAS_API_URL,

            headers: {

                access_token: process.env.ASAAS_API_KEY,

                "Content-Type": "application/json",

                "User-Agent": "PedrosoConsorcios/1.0"

            },

            timeout: 15000

        });

    }

    async buscarClientePorCpfCnpj(cpfCnpj) {

        const cpfCnpjLimpo = String(cpfCnpj).replace(/\D/g, "");

        const resposta = await this.api.get("/customers", {

            params: {
                cpfCnpj: cpfCnpjLimpo
            }

        });

        return resposta.data?.data?.[0] || null;

    }

    async criarCliente(cliente) {

        const resposta = await this.api.post("/customers", {

            name: cliente.nome,

            cpfCnpj: String(cliente.cpfCnpj).replace(/\D/g, ""),

            email: cliente.email || undefined,

            mobilePhone: cliente.telefone
                ? String(cliente.telefone).replace(/\D/g, "")
                : undefined,

            externalReference: String(cliente.id)

        });

        return resposta.data;

    }

    async obterOuCriarCliente(cliente) {

        const clienteExistente =
            await this.buscarClientePorCpfCnpj(cliente.cpfCnpj);

        if (clienteExistente) {

            return clienteExistente;

        }

        return await this.criarCliente(cliente);

    }

    async criarCobranca({

        customerId,

        valor,

        vencimento,

        descricao,

        parcelaId

    }) {

        const resposta = await this.api.post("/payments", {

            customer: customerId,

            billingType: "UNDEFINED",

            value: Number(valor),

            dueDate: this.formatarDataAsaas(vencimento),

            description: descricao,

            externalReference: String(parcelaId)

        });

        return resposta.data;

    }

    async consultarCobranca(paymentId) {

        const resposta = await this.api.get(
            `/payments/${paymentId}`
        );

        return resposta.data;

    }

    async obterPix(paymentId) {

        const resposta = await this.api.get(
            `/payments/${paymentId}/pixQrCode`
        );

        return resposta.data;

    }

    formatarDataAsaas(data) {

        const dataConvertida = new Date(data);

        if (Number.isNaN(dataConvertida.getTime())) {

            throw new Error("Data de vencimento inválida.");

        }

        return dataConvertida.toISOString().split("T")[0];

    }

}

module.exports = new AsaasService();