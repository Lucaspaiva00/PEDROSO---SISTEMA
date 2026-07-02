const ClienteService = require("../services/cliente.service");

class ClienteController {

    async listar(req, res) {

        try {

            const resultado = await ClienteService.listar(req.query);

            return res.status(200).json(resultado);

        } catch (error) {

            return res.status(500).json({
                sucesso: false,
                mensagem: error.message
            });

        }

    }

    async buscarPorId(req, res) {

        try {

            const resultado = await ClienteService.buscarPorId(req.params.id);

            return res.status(200).json(resultado);

        } catch (error) {

            return res.status(500).json({
                sucesso: false,
                mensagem: error.message
            });

        }

    }

    async criar(req, res) {

        try {

            const resultado = await ClienteService.criar(req.body);

            return res.status(201).json(resultado);

        } catch (error) {

            return res.status(500).json({
                sucesso: false,
                mensagem: error.message
            });

        }

    }

    async editar(req, res) {

        try {

            const resultado = await ClienteService.editar(req.params.id, req.body);

            return res.status(200).json(resultado);

        } catch (error) {

            return res.status(500).json({
                sucesso: false,
                mensagem: error.message
            });

        }

    }

    async excluir(req, res) {

        try {

            const resultado = await ClienteService.excluir(req.params.id);

            return res.status(200).json(resultado);

        } catch (error) {

            return res.status(500).json({
                sucesso: false,
                mensagem: error.message
            });

        }

    }

}

module.exports = new ClienteController();