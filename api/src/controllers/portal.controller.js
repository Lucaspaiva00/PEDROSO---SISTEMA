const PortalService = require("../services/portal.service");
const LanceService = require("../services/lance.service");

class PortalController {

    async dashboard(req, res) {

        try {

            const resultado = await PortalService.dashboard(req.usuario);

            return res.status(200).json(resultado);

        } catch (error) {

            return res.status(500).json({

                sucesso: false,
                mensagem: error.message

            });

        }

    }
    async contrato(req, res) {

        const resultado = await PortalService.contrato(
            req.usuario,
            req.query.contratoId
        );

        return res.json(resultado);

    }

    async parcelas(req, res) {

        try {

            const resultado = await PortalService.parcelas(
                req.usuario,
                req.query.contratoId
            );

            return res.json(resultado);

        } catch (erro) {

            console.error(erro);

            return res.status(500).json({

                sucesso: false,

                mensagem: "Erro ao carregar parcelas."

            });

        }

    }

    async contratos(req, res) {

        try {

            const resultado = await PortalService.listarContratos(
                req.usuario
            );

            return res.json(resultado);

        } catch (error) {

            return res.status(400).json({
                sucesso: false,
                mensagem: error.message
            });

        }

    }

    async situacaoLance(req, res) {

        try {

            const resultado = await LanceService.situacao(
                req.usuario,
                req.query.contratoId
            );

            return res.json(resultado);

        } catch (error) {

            return res.status(400).json({
                sucesso: false,
                mensagem: error.message
            });

        }

    }

    async registrarLance(req, res) {

        try {

            const resultado = await LanceService.registrar(
                req.usuario,
                req.body
            );

            return res.status(201).json(resultado);

        } catch (error) {

            return res.status(400).json({
                sucesso: false,
                mensagem: error.message
            });

        }

    }

}

module.exports = new PortalController();