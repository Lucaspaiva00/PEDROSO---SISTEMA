const PlanoRepository = require("../repositories/plano.repository");

class PlanoService {

    async cadastrar(dados) {

        return await PlanoRepository.cadastrar(dados);

    }

    async listar() {

        return await PlanoRepository.listar();

    }

    async buscarPorId(id) {

        const plano = await PlanoRepository.buscarPorId(id);

        if (!plano) {

            throw new Error("Plano não encontrado.");

        }

        return plano;

    }

    async atualizar(id, dados) {

        await this.buscarPorId(id);

        return await PlanoRepository.atualizar(id, dados);

    }

    async excluir(id) {

        await this.buscarPorId(id);

        return await PlanoRepository.excluir(id);

    }

}

module.exports = new PlanoService();