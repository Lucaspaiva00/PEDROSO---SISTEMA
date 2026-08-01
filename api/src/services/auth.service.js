const bcrypt = require("bcrypt");

const UsuarioRepository = require("../repositories/usuario.repository");
const ClienteRepository = require("../repositories/cliente.repository");
const { gerarToken } = require("../config/jwt");
const { somenteNumeros } = require("../utils/cpfCnpj");

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

    async criarUsuarioCliente(cliente) {

        const usuarioExistente = await UsuarioRepository.findByClienteId(cliente.id);

        if (usuarioExistente) {

            return usuarioExistente;

        }

        const cpf = somenteNumeros(cliente.cpfCnpj);

        const senhaInicial = cpf.substring(0, 6);

        const senhaCriptografada = await bcrypt.hash(senhaInicial, 10);

        const usuario = await UsuarioRepository.create({

            nome: cliente.nome,

            email: cliente.email,

            senha: senhaCriptografada,

            role: "CLIENTE",

            clienteId: cliente.id

        });

        return usuario;

    }

    async login(dados) {

        const { login, senha } = dados;

        if (!login || !senha) {

            return {

                sucesso: false,

                mensagem: "Informe o login e a senha."

            };

        }

        let usuario;

        if (login.includes("@")) {

            usuario = await UsuarioRepository.findByEmail(login);

        } else {

            const cpf = somenteNumeros(login);

            usuario = await UsuarioRepository.findByCpf(cpf);

            if (!usuario) {

                const cliente = await ClienteRepository.buscarPorCpf(cpf);

                if (cliente) {
                    usuario = await this.criarUsuarioCliente(cliente);
                }

            }

        }

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