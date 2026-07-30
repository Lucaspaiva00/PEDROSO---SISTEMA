const express = require("express");

const router = express.Router();

const AsaasController = require("../controllers/asaas.controller");

// Teste da conexão
router.get(
    "/teste",
    AsaasController.testarConexao
);

// Buscar cliente por CPF/CNPJ
router.get(
    "/clientes/:cpfCnpj",
    AsaasController.buscarCliente
);

// Criar cliente
router.post(
    "/clientes",
    AsaasController.criarCliente
);

// Criar cobrança
router.post(
    "/cobrancas",
    AsaasController.criarCobranca
);

// Consultar cobrança
router.get(
    "/cobrancas/:paymentId",
    AsaasController.consultarCobranca
);

// Buscar PIX da cobrança
router.get(
    "/cobrancas/:paymentId/pix",
    AsaasController.obterPix
);

module.exports = router;