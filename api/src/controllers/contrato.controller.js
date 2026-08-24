const ContratoService = require("../services/contrato.service");
const AsaasService = require("../services/asaas.service");
const prisma = require("../config/prisma");

class ContratoController {

    async cadastrar(req, res) {

        try {

            const contrato = await ContratoService.cadastrar(req.body);

            return res.status(201).json({
                sucesso: true,
                mensagem:
                    contrato.integracaoAsaas?.mensagem ||
                    "Contrato cadastrado com sucesso.",
                contrato
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

            const contratos = await ContratoService.listar();

            return res.json({
                sucesso: true,
                contratos
            });

        } catch (error) {

            return res.status(400).json({
                sucesso: false,
                mensagem: error.message
            });

        }

    }

    async buscarPorId(req, res) {

        try {

            const contrato = await ContratoService.buscarPorId(req.params.id);

            return res.json({
                sucesso: true,
                contrato
            });

        } catch (error) {

            return res.status(404).json({
                sucesso: false,
                mensagem: error.message
            });

        }

    }

    async atualizar(req, res) {

        try {

            const contrato = await ContratoService.atualizar(
                req.params.id,
                req.body
            );

            return res.json({
                sucesso: true,
                mensagem: "Contrato atualizado com sucesso.",
                contrato
            });

        } catch (error) {

            return res.status(400).json({
                sucesso: false,
                mensagem: error.message
            });

        }

    }

    async excluir(req, res) {

        try {

            await ContratoService.excluir(req.params.id);

            return res.json({
                sucesso: true,
                mensagem: "Contrato excluído com sucesso."
            });

        } catch (error) {

            return res.status(400).json({
                sucesso: false,
                mensagem: error.message
            });

        }

    }


    async boletoParcela(req, res) {
        try {
            if (!req.usuario || !["ADMIN", "FUNCIONARIO"].includes(req.usuario.role)) {
                return res.status(403).json({ sucesso: false, mensagem: "Acesso restrito ao administrativo." });
            }

            const contratoId = Number(req.params.id);
            const parcelaId = Number(req.params.parcelaId);

            const parcela = await prisma.parcela.findFirst({
                where: { id: parcelaId, contratoId }
            });

            if (!parcela) {
                return res.status(404).json({ sucesso: false, mensagem: "Parcela não encontrada neste contrato." });
            }

            const boleto = await AsaasService.atualizarDadosCobrancaDaParcela(parcela.id);

            return res.json({ sucesso: true, dados: boleto });
        } catch (error) {
            return res.status(400).json({ sucesso: false, mensagem: error.message });
        }
    }

}

module.exports = new ContratoController();