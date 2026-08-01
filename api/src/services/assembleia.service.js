const AssembleiaRepository = require("../repositories/assembleia.repository");
const LanceRepository = require("../repositories/lance.repository");
const prisma = require("../config/prisma");

class AssembleiaService {

    async cadastrar(dados) {

        if (!dados.grupo?.trim()) {
            throw new Error("Informe o grupo da assembleia.");
        }

        if (!dados.dataAssembleia) {
            throw new Error("Informe a data da assembleia.");
        }

        return AssembleiaRepository.criar({

            grupo: dados.grupo.trim(),

            titulo: dados.titulo?.trim() || null,

            dataAssembleia: new Date(dados.dataAssembleia),

            aceitaLances: Boolean(dados.aceitaLances)

        });

    }

    async listar() {

        const assembleias = await AssembleiaRepository.listar();

        return assembleias.map(item => ({

            id: item.id,
            grupo: item.grupo,
            titulo: item.titulo,
            dataAssembleia: item.dataAssembleia,
            aceitaLances: item.aceitaLances,
            encerrada: item.encerrada,
            totalLances: item._count.lances

        }));

    }

    async abrirLances(id) {

        const assembleia = await AssembleiaRepository.buscarPorId(id);

        if (!assembleia) {
            throw new Error("Assembleia não encontrada.");
        }

        if (assembleia.encerrada) {
            throw new Error("Assembleia já encerrada.");
        }

        return AssembleiaRepository.atualizar(id, {
            aceitaLances: true
        });

    }

    async encerrar(id) {

        const assembleia = await AssembleiaRepository.buscarPorId(id);

        if (!assembleia) {
            throw new Error("Assembleia não encontrada.");
        }

        return AssembleiaRepository.atualizar(id, {
            aceitaLances: false,
            encerrada: true
        });

    }

    async analisarLances(assembleiaId) {

        const assembleia = await AssembleiaRepository.buscarPorId(assembleiaId);

        if (!assembleia) {
            throw new Error("Assembleia não encontrada.");
        }

        const lances = await LanceRepository.listarPorAssembleia(assembleiaId);

        const ranking = lances.map((lance, indice) => ({

            posicao: indice + 1,

            lanceId: lance.id,

            valor: Number(lance.valor),

            status: lance.status,

            criadoEm: lance.criadoEm,

            contratoId: lance.contratoId,

            cota: lance.contrato.cota,

            numeroContrato: lance.contrato.numeroContrato,

            cliente: lance.contrato.cliente.nome

        }));

        const maiorLance = ranking[0] || null;

        return {

            assembleia,

            totalLances: ranking.length,

            maiorLance,

            ranking

        };

    }

    async contemplar(assembleiaId, lanceId) {

        const lance = await LanceRepository.buscarPorId(lanceId);

        if (!lance) {
            throw new Error("Lance não encontrado.");
        }

        if (lance.assembleiaId !== Number(assembleiaId)) {
            throw new Error("Lance não pertence a esta assembleia.");
        }

        if (lance.status !== "REGISTRADO") {
            throw new Error("Este lance já foi processado.");
        }

        if (lance.contrato.status === "CONTEMPLADO") {
            throw new Error("Contrato já contemplado.");
        }

        await prisma.$transaction(async tx => {

            await tx.lance.update({

                where: { id: lance.id },

                data: { status: "VENCEDOR" }

            });

            await tx.lance.updateMany({

                where: {
                    assembleiaId: Number(assembleiaId),
                    id: { not: lance.id },
                    status: "REGISTRADO"
                },

                data: { status: "NAO_CONTEMPLADO" }

            });

            await tx.contrato.update({

                where: { id: lance.contratoId },

                data: { status: "CONTEMPLADO" }

            });

            await tx.assembleia.update({

                where: { id: Number(assembleiaId) },

                data: {
                    aceitaLances: false,
                    encerrada: true
                }

            });

        });

        return {

            sucesso: true,

            mensagem: "Contemplação registrada com sucesso."

        };

    }

    async contemplarMaiorLance(assembleiaId) {

        const analise = await this.analisarLances(assembleiaId);

        if (!analise.maiorLance) {
            throw new Error("Não há lances nesta assembleia.");
        }

        return this.contemplar(
            assembleiaId,
            analise.maiorLance.lanceId
        );

    }

}

module.exports = new AssembleiaService();
