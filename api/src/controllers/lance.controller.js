const LanceService = require("../services/lance.service");

class LanceController {

    async listar(req, res) {

        try {

            const resultado = await LanceService.listarAdmin({
                status: req.query.status,
                todos: req.query.todos
            });

            return res.json(resultado);

        } catch (error) {

            return res.status(400).json({
                sucesso: false,
                mensagem: error.message
            });

        }

    }

    async listarPorContrato(req, res) {

        try {

            const resultado = await LanceService.listarPorContrato(
                req.params.contratoId
            );

            return res.json(resultado);

        } catch (error) {

            return res.status(400).json({
                sucesso: false,
                mensagem: error.message
            });

        }

    }

    async aprovar(req, res) {

        try {

            const resultado = await LanceService.aprovar(
                req.params.id
            );

            return res.json(resultado);

        } catch (error) {

            return res.status(400).json({
                sucesso: false,
                mensagem: error.message
            });

        }

    }

    async reprovar(req, res) {

        try {

            const resultado = await LanceService.reprovar(
                req.params.id
            );

            return res.json(resultado);

        } catch (error) {

            return res.status(400).json({
                sucesso: false,
                mensagem: error.message
            });

        }

    }

}

module.exports = new LanceController();
