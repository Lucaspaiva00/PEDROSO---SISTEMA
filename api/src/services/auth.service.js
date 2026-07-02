const bcrypt = require("bcrypt");

const UsuarioRepository = require("../repositories/usuario.repository");
const { gerarToken } = require("../config/jwt");

class AuthService {

    async register(dados) {

        const { nome, email, senha, role } = dados;

        if (!nome || !email || !senha) {

            return {
                sucesso: false,
                mensagem: "Preencha todos os campos obrigatórios."
            };

        }

        const usuarioExistente = await UsuarioRepository.findByEmail(email);

        if (usuarioExistente) {

            return {
                sucesso: false,
                mensagem: "Este e-mail já está cadastrado."
            };

        }

        const senhaCriptografada = await bcrypt.hash(senha, 10);

        const usuario = await UsuarioRepository.create({

            nome,

            email,

            senha: senhaCriptografada,

            role

        });

        const token = gerarToken(usuario);

        return {

            sucesso: true,

            mensagem: "Usuário cadastrado com sucesso.",

            token,

            usuario: {

                id: usuario.id,

                nome: usuario.nome,

                email: usuario.email,

                role: usuario.role

            }

        };

    }

    async login(dados) {

        const { email, senha } = dados;

        if (!email || !senha) {

            return {

                sucesso: false,

                mensagem: "Informe o e-mail e a senha."

            };

        }

        const usuario = await UsuarioRepository.findByEmail(email);

        if (!usuario) {

            return {

                sucesso: false,

                mensagem: "Usuário não encontrado."

            };

        }

        if (!usuario.ativo) {

            return {

                sucesso: false,

                mensagem: "Usuário desativado."

            };

        }

        const senhaCorreta = await bcrypt.compare(

            senha,

            usuario.senha

        );

        if (!senhaCorreta) {

            return {

                sucesso: false,

                mensagem: "Senha incorreta."

            };

        }

        const token = gerarToken(usuario);

        return {

            sucesso: true,

            mensagem: "Login realizado com sucesso.",

            token,

            usuario: {

                id: usuario.id,

                nome: usuario.nome,

                email: usuario.email,

                role: usuario.role

            }

        };

    }

}

module.exports = new AuthService();