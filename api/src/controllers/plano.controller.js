const PlanoService = require("../services/plano.service");

class PlanoController {

    async cadastrar(req, res) {

        try {

            const plano = await PlanoService.cadastrar(req.body);

            return res.status(201).json({
                sucesso: true,
                mensagem: "Plano cadastrado com sucesso.",
                plano
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

            const planos = await PlanoService.listar();

            return res.json({
                sucesso: true,
                planos
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

            const plano = await PlanoService.buscarPorId(req.params.id);

            return res.json({
                sucesso: true,
                plano
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

            const plano = await PlanoService.atualizar(
                req.params.id,
                req.body
            );

            return res.json({
                sucesso: true,
                mensagem: "Plano atualizado com sucesso.",
                plano
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

            await PlanoService.excluir(req.params.id);

            return res.json({
                sucesso: true,
                mensagem: "Plano excluído com sucesso."
            });

        } catch (error) {

            return res.status(400).json({
                sucesso: false,
                mensagem: error.message
            });

        }

    }

}

module.exports = new PlanoController();