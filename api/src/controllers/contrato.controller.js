const ContratoService = require("../services/contrato.service");

class ContratoController {

    async cadastrar(req, res) {

        try {

            const contrato = await ContratoService.cadastrar(req.body);

            return res.status(201).json({
                sucesso: true,
                mensagem:
                    contrato.integracaoAsaas?.mensagem ||
                    "Contrato cadastrado com sucesso.",
                contrato
            });

        } catch (error) {

            return res.status(400).json({
                sucesso: false,
                mensagem: error.message
            });

        }

    }

    async listar(req, res) {

        try {

            const contratos = await ContratoService.listar();

            return res.json({
                sucesso: true,
                contratos
            });

        } catch (error) {

            return res.status(400).json({
                sucesso: false,
                mensagem: error.message
            });

        }

    }

    async buscarPorId(req, res) {

        try {

            const contrato = await ContratoService.buscarPorId(req.params.id);

            return res.json({
                sucesso: true,
                contrato
            });

        } catch (error) {

            return res.status(404).json({
                sucesso: false,
                mensagem: error.message
            });

        }

    }

    async atualizar(req, res) {

        try {

            const contrato = await ContratoService.atualizar(
                req.params.id,
                req.body
            );

            return res.json({
                sucesso: true,
                mensagem: "Contrato atualizado com sucesso.",
                contrato
            });

        } catch (error) {

            return res.status(400).json({
                sucesso: false,
                mensagem: error.message
            });

        }

    }

    async excluir(req, res) {

        try {

            await ContratoService.excluir(req.params.id);

            return res.json({
                sucesso: true,
                mensagem: "Contrato excluído com sucesso."
            });

        } catch (error) {

            return res.status(400).json({
                sucesso: false,
                mensagem: error.message
            });

        }

    }

}

module.exports = new ContratoController();