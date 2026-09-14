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
        const validarVinculo = usuario => {
            // Nunca transferir acesso entre clientes apenas porque o e-mail coincide.
            if (usuario.role !== "CLIENTE" || Number(usuario.clienteId) !== Number(cliente.id)) {
                throw new Error("O e-mail informado já pertence a outro usuário. O acesso ao portal precisa ser regularizado em Usuários.");
            }
            return usuario;
        };
        const existente = await UsuarioRepository.findByClienteId(cliente.id);
        if (existente) return validarVinculo(existente);

        const email = String(cliente.email || "").trim();
        if (!email) {
            throw new Error("Informe um e-mail para criar o acesso ao portal do cliente.");
        }
        const porEmail = await UsuarioRepository.findByEmail(email);
        if (porEmail) return validarVinculo(porEmail);

        const cpf = somenteNumeros(cliente.cpfCnpj);
        const senhaCriptografada = await bcrypt.hash(cpf.substring(0, 6), 10);
        try {
            return await UsuarioRepository.create({
                nome: cliente.nome,
                email,
                senha: senhaCriptografada,
                role: "CLIENTE",
                clienteId: cliente.id
            });
        } catch (erro) {
            if (erro.code !== "P2002") throw erro;
            // Outro pedido pode ter criado o mesmo acesso enquanto calculávamos o hash.
            const concorrente = await UsuarioRepository.findByEmail(email);
            if (concorrente) return validarVinculo(concorrente);
            throw erro;
        }
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