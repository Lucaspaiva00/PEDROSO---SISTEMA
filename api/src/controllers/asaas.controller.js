const AsaasService = require("../services/asaas.service");

class AsaasController {

    async testarConexao(req, res) {

        try {

            const resultado = await AsaasService.testarConexao();

            return res.json({

                sucesso: true,

                dados: resultado

            });

        } catch (erro) {

            console.error(erro.response?.data || erro);

            return res.status(500).json({

                sucesso: false,

                mensagem: "Erro ao conectar com o Asaas.",

                erro: erro.response?.data || erro.message

            });

        }

    }

    async buscarCliente(req, res) {

        try {

            const { cpfCnpj } = req.params;

            const cliente = await AsaasService.buscarClientePorCpfCnpj(
                cpfCnpj
            );

            return res.json({

                sucesso: true,

                dados: cliente

            });

        } catch (erro) {

            console.error(erro.response?.data || erro);

            return res.status(500).json({

                sucesso: false,

                mensagem: "Erro ao buscar cliente.",

                erro: erro.response?.data || erro.message

            });

        }

    }

    async criarCliente(req, res) {

        try {

            const cliente = await AsaasService.criarCliente(
                req.body
            );

            return res.status(201).json({

                sucesso: true,

                dados: cliente

            });

        } catch (erro) {

            console.error(erro.response?.data || erro);

            return res.status(500).json({

                sucesso: false,

                mensagem: "Erro ao criar cliente.",

                erro: erro.response?.data || erro.message

            });

        }

    }

    async criarCobranca(req, res) {

        try {

            const cobranca =
                await AsaasService.criarCobranca(req.body);

            return res.status(201).json({

                sucesso: true,

                dados: cobranca

            });

        } catch (erro) {

            console.error(erro.response?.data || erro);

            return res.status(500).json({

                sucesso: false,

                mensagem: "Erro ao criar cobrança.",

                erro: erro.response?.data || erro.message

            });

        }

    }

    async consultarCobranca(req, res) {

        try {

            const { paymentId } = req.params;

            const cobranca =
                await AsaasService.consultarCobranca(paymentId);

            return res.json({

                sucesso: true,

                dados: cobranca

            });

        } catch (erro) {

            console.error(erro.response?.data || erro);

            return res.status(500).json({

                sucesso: false,

                mensagem: "Erro ao consultar cobrança.",

                erro: erro.response?.data || erro.message

            });

        }

    }

    async obterPix(req, res) {

        try {

            const { paymentId } = req.params;

            const pix =
                await AsaasService.obterPix(paymentId);

            return res.json({

                sucesso: true,

                dados: pix

            });

        } catch (erro) {

            console.error(erro.response?.data || erro);

            return res.status(500).json({

                sucesso: false,

                mensagem: "Erro ao obter PIX.",

                erro: erro.response?.data || erro.message

            });

        }

    }

}

module.exports = new AsaasController();