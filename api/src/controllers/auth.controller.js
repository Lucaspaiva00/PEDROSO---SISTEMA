const AuthService = require("../services/auth.service");

class AuthController {

    async register(req, res) {

        try {

            const resultado = await AuthService.register(req.body);

            if (!resultado.sucesso) {

                return res.status(400).json(resultado);

            }

            return res.status(201).json(resultado);

        } catch (error) {

            return res.status(500).json({

                sucesso: false,

                mensagem: error.message

            });

        }

    }

    async login(req, res) {

        try {

            const resultado = await AuthService.login(req.body);

            if (!resultado.sucesso) {

                return res.status(400).json(resultado);

            }

            return res.status(200).json(resultado);

        } catch (error) {

            return res.status(500).json({

                sucesso: false,

                mensagem: error.message

            });

        }

    }

}

module.exports = new AuthController();