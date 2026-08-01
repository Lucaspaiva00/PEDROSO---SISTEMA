const AssembleiaService = require("../services/assembleia.service");

class AssembleiaController {

    async cadastrar(req, res) {

        try {

            const assembleia = await AssembleiaService.cadastrar(req.body);

            return res.status(201).json({
                sucesso: true,
                mensagem: "Assembleia cadastrada.",
                assembleia
            });

        } catch (error) {

            return res.status(400).json({
                sucesso: false,
                mensagem: error.message
            });

        }

    }

    async listar(req, res) {

        try {

            const assembleias = await AssembleiaService.listar();

            return res.json({
                sucesso: true,
                assembleias
            });

        } catch (error) {

            return res.status(500).json({
                sucesso: false,
                mensagem: error.message
            });

        }

    }

    async abrirLances(req, res) {

        try {

            const assembleia = await AssembleiaService.abrirLances(
                req.params.id
            );

            return res.json({
                sucesso: true,
                mensagem: "Assembleia aberta para lances.",
                assembleia
            });

        } catch (error) {

            return res.status(400).json({
                sucesso: false,
                mensagem: error.message
            });

        }

    }

    async encerrar(req, res) {

        try {

            const assembleia = await AssembleiaService.encerrar(
                req.params.id
            );

            return res.json({
                sucesso: true,
                mensagem: "Assembleia encerrada.",
                assembleia
            });

        } catch (error) {

            return res.status(400).json({
                sucesso: false,
                mensagem: error.message
            });

        }

    }

    async analisar(req, res) {

        try {

            const analise = await AssembleiaService.analisarLances(
                req.params.id
            );

            return res.json({
                sucesso: true,
                ...analise
            });

        } catch (error) {

            return res.status(400).json({
                sucesso: false,
                mensagem: error.message
            });

        }

    }

    async contemplar(req, res) {

        try {

            const resultado = await AssembleiaService.contemplar(
                req.params.id,
                req.params.lanceId
            );

            return res.json(resultado);

        } catch (error) {

            return res.status(400).json({
                sucesso: false,
                mensagem: error.message
            });

        }

    }

    async contemplarMaior(req, res) {

        try {

            const resultado = await AssembleiaService.contemplarMaiorLance(
                req.params.id
            );

            return res.json(resultado);

        } catch (error) {

            return res.status(400).json({
                sucesso: false,
                mensagem: error.message
            });

        }

    }

}

module.exports = new AssembleiaController();
