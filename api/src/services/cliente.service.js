const ClienteRepository = require("../repositories/cliente.repository");

class ClienteService {

    async listar() {

        const clientes = await ClienteRepository.listar();

        return {
            sucesso: true,
            clientes
        };

    }

    async buscarPorId(id) {

        const cliente = await ClienteRepository.buscarPorId(id);

        if (!cliente) {

            return {
                sucesso: false,
                mensagem: "Cliente não encontrado."
            };

        }

        return {
            sucesso: true,
            cliente
        };

    }

    async criar(dados) {

        const { nome, cpfCnpj } = dados;

        if (!nome || !cpfCnpj) {

            return {
                sucesso: false,
                mensagem: "Nome e CPF/CNPJ são obrigatórios."
            };

        }

        const existente = await ClienteRepository.buscarPorCpf(cpfCnpj);

        if (existente) {

            return {
                sucesso: false,
                mensagem: "CPF/CNPJ já cadastrado."
            };

        }

        const cliente = await ClienteRepository.criar(dados);

        return {
            sucesso: true,
            mensagem: "Cliente cadastrado com sucesso.",
            cliente
        };

    }

    async editar(id, dados) {

        const cliente = await ClienteRepository.buscarPorId(id);

        if (!cliente) {

            return {
                sucesso: false,
                mensagem: "Cliente não encontrado."
            };

        }

        const atualizado = await ClienteRepository.editar(id, dados);

        return {
            sucesso: true,
            mensagem: "Cliente atualizado com sucesso.",
            cliente: atualizado
        };

    }

    async excluir(id) {

        const cliente = await ClienteRepository.buscarPorId(id);

        if (!cliente) {

            return {
                sucesso: false,
                mensagem: "Cliente não encontrado."
            };

        }

        await ClienteRepository.excluir(id);

        return {
            sucesso: true,
            mensagem: "Cliente removido com sucesso."
        };

    }

}

module.exports = new ClienteService();