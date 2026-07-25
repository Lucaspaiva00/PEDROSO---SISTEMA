const PortalService = require("../services/portal.service");

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

        const resultado = await PortalService.contrato(req.usuario);

        return res.json(resultado);

    }

    async parcelas(req, res) {

        try {

            const resultado = await PortalService.parcelas(
                req.usuario
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

}

module.exports = new PortalController();