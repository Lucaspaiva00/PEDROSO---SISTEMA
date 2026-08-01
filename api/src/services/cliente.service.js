const ClienteRepository = require("../repositories/cliente.repository");
const { somenteNumeros } = require("../utils/cpfCnpj");

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

    async buscarDetalhe(id) {

        const cliente = await ClienteRepository.buscarDetalhe(id);

        if (!cliente) {

            return {
                sucesso: false,
                mensagem: "Cliente não encontrado."
            };

        }

        const contratos = cliente.contratos.map(contrato => ({

            id: contrato.id,

            numeroContrato: contrato.numeroContrato,

            grupo: contrato.grupo,

            cota: contrato.cota,

            tipo: contrato.tipo,

            status: contrato.status,

            valorCarta: Number(contrato.valorCarta),

            valorParcela: Number(contrato.valorParcela),

            quantidadeParcelas: contrato.quantidadeParcelas,

            parcelasPagas: contrato.parcelasPagas,

            criadoEm: contrato.criadoEm,

            plano: contrato.plano
                ? {
                    id: contrato.plano.id,
                    nome: contrato.plano.nome
                }
                : null,

            lances: contrato.lances.map(lance => ({

                id: lance.id,

                valor: Number(lance.valor),

                status: lance.status,

                criadoEm: lance.criadoEm,

                assembleia: {
                    id: lance.assembleia.id,
                    grupo: lance.assembleia.grupo,
                    titulo: lance.assembleia.titulo,
                    dataAssembleia: lance.assembleia.dataAssembleia,
                    encerrada: lance.assembleia.encerrada
                }

            }))

        }));

        const { contratos: _, ...dadosCliente } = cliente;

        return {

            sucesso: true,

            cliente: dadosCliente,

            contratos

        };

    }

    async criar(dados) {

        const { nome, email } = dados;
        const cpfCnpj = somenteNumeros(dados.cpfCnpj);

        if (!nome || !cpfCnpj || !email) {

            return {
                sucesso: false,
                mensagem: "Nome, CPF/CNPJ e e-mail são obrigatórios."
            };

        }

        const existente = await ClienteRepository.buscarPorCpf(cpfCnpj);

        if (existente) {

            return {
                sucesso: false,
                mensagem: "CPF/CNPJ já cadastrado."
            };

        }

        const cliente = await ClienteRepository.criar({
            ...dados,
            cpfCnpj
        });

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

        const payload = { ...dados };

        if (payload.cpfCnpj !== undefined) {
            payload.cpfCnpj = somenteNumeros(payload.cpfCnpj);
        }

        const atualizado = await ClienteRepository.editar(id, payload);

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