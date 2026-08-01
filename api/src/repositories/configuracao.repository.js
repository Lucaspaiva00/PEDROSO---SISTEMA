const prisma = require("../config/prisma");

const SINGLETON_ID = 1;

class ConfiguracaoRepository {

    async getOrCreate() {

        let config = await prisma.configuracaoSistema.findUnique({
            where: { id: SINGLETON_ID }
        });

        if (!config) {

            config = await prisma.configuracaoSistema.create({
                data: { id: SINGLETON_ID }
            });

        }

        return config;

    }

    async update(dados) {

        await this.getOrCreate();

        return await prisma.configuracaoSistema.update({
            where: { id: SINGLETON_ID },
            data: dados
        });

    }

}

module.exports = new ConfiguracaoRepository();
