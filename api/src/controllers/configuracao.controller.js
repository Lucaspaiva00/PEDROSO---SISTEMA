const ConfiguracaoService = require("../services/configuracao.service");

class ConfiguracaoController {

    async obter(req, res) {

        try {

            const resultado = await ConfiguracaoService.obter(req.usuario);

            const status = resultado.sucesso ? 200 : 404;

            return res.status(status).json(resultado);

        } catch (error) {

            return res.status(500).json({
                sucesso: false,
                mensagem: error.message
            });

        }

    }

    async salvar(req, res) {

        try {

            const resultado = await ConfiguracaoService.salvar(
                req.usuario,
                req.body
            );

            const status = resultado.sucesso ? 200 : 400;

            return res.status(status).json(resultado);

        } catch (error) {

            return res.status(500).json({
                sucesso: false,
                mensagem: error.message
            });

        }

    }

}

module.exports = new ConfiguracaoController();
