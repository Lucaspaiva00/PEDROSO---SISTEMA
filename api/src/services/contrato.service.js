const ContratoRepository = require("../repositories/contrato.repository");
const ClienteRepository = require("../repositories/cliente.repository");
const AuthService = require("./auth.service");
const prisma = require("../config/prisma");

class ContratoService {

    async cadastrar(dados) {

        const cliente = await ClienteRepository.buscarPorId(dados.clienteId);

        if (!cliente) {
            throw new Error("Cliente não encontrado.");
        }

        let plano = null;

        if (dados.planoId) {

            plano = await prisma.plano.findUnique({
                where: {
                    id: Number(dados.planoId)
                }
            });

            if (!plano) {
                throw new Error("Plano não encontrado.");
            }

            dados.tipo = plano.tipo;
            dados.valorCarta = plano.valorCarta;
            dados.valorParcela = plano.valorParcela;
            dados.quantidadeParcelas = plano.quantidadeParcelas;
        }

        const contrato = await ContratoRepository.cadastrar(dados);

        // Cria automaticamente o usuário do portal
        await AuthService.criarUsuarioCliente(cliente);

        return contrato;

    }

    async listar() {

        return await ContratoRepository.listar();

    }

    async buscarPorId(id) {

        const contrato = await ContratoRepository.buscarPorId(id);

        if (!contrato) {

            throw new Error("Contrato não encontrado.");

        }

        return contrato;

    }

    async atualizar(id, dados) {

        await this.buscarPorId(id);

        return await ContratoRepository.atualizar(id, dados);

    }

    async excluir(id) {

        await this.buscarPorId(id);

        return await ContratoRepository.excluir(id);

    }

}

module.exports = new ContratoService();