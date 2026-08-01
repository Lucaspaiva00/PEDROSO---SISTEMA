const bcrypt = require("bcrypt");

const ConfiguracaoRepository = require("../repositories/configuracao.repository");
const UsuarioRepository = require("../repositories/usuario.repository");

function mapConfiguracao(config, usuario) {

    return {
        nomeEmpresa: config.nomeEmpresa || "",
        cnpj: config.cnpj || "",
        telefone: config.telefone || "",
        whatsapp: config.whatsapp || "",
        email: config.email || "",
        cep: config.cep || "",
        rua: config.rua || "",
        numero: config.numero || "",
        bairro: config.bairro || "",
        cidade: config.cidade || "",
        estado: config.estado || "",
        gerarParcelas: config.gerarParcelas,
        sincronizarCobrancas: config.sincronizarCobrancas,
        administradoraPadrao: config.administradoraPadrao || "",
        formaPagamentoPadrao: config.formaPagamentoPadrao || "BOLETO",
        nomeUsuario: usuario?.nome || "",
        emailUsuario: usuario?.email || ""
    };

}

class ConfiguracaoService {

    async obter(usuarioToken) {

        const config = await ConfiguracaoRepository.getOrCreate();

        const usuario = await UsuarioRepository.findById(usuarioToken.id);

        if (!usuario) {

            return {
                sucesso: false,
                mensagem: "Usuário não encontrado."
            };

        }

        return {
            sucesso: true,
            configuracao: mapConfiguracao(config, usuario)
        };

    }

    async salvar(usuarioToken, body) {

        const usuario = await UsuarioRepository.findById(usuarioToken.id);

        if (!usuario) {

            return {
                sucesso: false,
                mensagem: "Usuário não encontrado."
            };

        }

        const {
            nomeUsuario,
            emailUsuario,
            senhaAtual,
            novaSenha,
            ...configFields
        } = body;

        await ConfiguracaoRepository.update({
            nomeEmpresa: configFields.nomeEmpresa || null,
            cnpj: configFields.cnpj || null,
            telefone: configFields.telefone || null,
            whatsapp: configFields.whatsapp || null,
            email: configFields.email || null,
            cep: configFields.cep || null,
            rua: configFields.rua || null,
            numero: configFields.numero || null,
            bairro: configFields.bairro || null,
            cidade: configFields.cidade || null,
            estado: configFields.estado || null,
            gerarParcelas: Boolean(configFields.gerarParcelas),
            sincronizarCobrancas: Boolean(configFields.sincronizarCobrancas),
            administradoraPadrao: configFields.administradoraPadrao || null,
            formaPagamentoPadrao:
                configFields.formaPagamentoPadrao || "BOLETO"
        });

        const dadosUsuario = {};

        if (nomeUsuario !== undefined && nomeUsuario !== usuario.nome) {
            dadosUsuario.nome = nomeUsuario;
        }

        if (emailUsuario !== undefined && emailUsuario !== usuario.email) {

            const outro = await UsuarioRepository.findByEmail(emailUsuario);

            if (outro && outro.id !== usuario.id) {

                return {
                    sucesso: false,
                    mensagem: "Este e-mail já está cadastrado."
                };

            }

            dadosUsuario.email = emailUsuario;

        }

        if (novaSenha) {

            if (!senhaAtual) {

                return {
                    sucesso: false,
                    mensagem: "Informe a senha atual para alterar a senha."
                };

            }

            const senhaCorreta = await bcrypt.compare(
                senhaAtual,
                usuario.senha
            );

            if (!senhaCorreta) {

                return {
                    sucesso: false,
                    mensagem: "Senha atual incorreta."
                };

            }

            dadosUsuario.senha = await bcrypt.hash(novaSenha, 10);

        }

        if (Object.keys(dadosUsuario).length > 0) {

            await UsuarioRepository.update(usuario.id, dadosUsuario);

        }

        return {
            sucesso: true,
            mensagem: "Configurações salvas com sucesso."
        };

    }

}

module.exports = new ConfiguracaoService();
