-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'FUNCIONARIO', 'CLIENTE');

-- CreateEnum
CREATE TYPE "StatusCliente" AS ENUM ('ATIVO', 'INATIVO', 'BLOQUEADO');

-- CreateEnum
CREATE TYPE "TipoConsorcio" AS ENUM ('CARRO', 'MOTO', 'IMOVEL', 'CAMINHAO', 'SERVICO', 'OUTRO');

-- CreateEnum
CREATE TYPE "StatusContrato" AS ENUM ('ATIVO', 'CANCELADO', 'QUITADO', 'CONTEMPLADO', 'INADIMPLENTE');

-- CreateEnum
CREATE TYPE "StatusParcela" AS ENUM ('PENDENTE', 'PAGA', 'VENCIDA', 'CANCELADA', 'ESTORNADA');

-- CreateEnum
CREATE TYPE "MetodoPagamento" AS ENUM ('BOLETO', 'PIX', 'CARTAO');

-- CreateTable
CREATE TABLE "Usuario" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'ADMIN',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "clienteId" INTEGER,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cliente" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "cpfCnpj" TEXT NOT NULL,
    "rg" TEXT,
    "nascimento" TIMESTAMP(3),
    "email" TEXT,
    "telefone" TEXT,
    "cep" TEXT,
    "rua" TEXT,
    "numero" TEXT,
    "bairro" TEXT,
    "cidade" TEXT,
    "estado" TEXT,
    "observacoes" TEXT,
    "status" "StatusCliente" NOT NULL DEFAULT 'ATIVO',
    "asaasCustomerId" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cliente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Plano" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" "TipoConsorcio" NOT NULL,
    "descricao" TEXT,
    "valorCarta" DECIMAL(10,2) NOT NULL,
    "quantidadeParcelas" INTEGER NOT NULL,
    "valorParcela" DECIMAL(10,2) NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "imagemUrl" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Plano_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contrato" (
    "id" SERIAL NOT NULL,
    "clienteId" INTEGER NOT NULL,
    "planoId" INTEGER,
    "numeroContrato" TEXT,
    "administradora" TEXT,
    "grupo" TEXT,
    "cota" TEXT,
    "tipo" "TipoConsorcio" NOT NULL,
    "valorCarta" DECIMAL(10,2) NOT NULL,
    "valorEntrada" DECIMAL(10,2),
    "valorParcela" DECIMAL(10,2) NOT NULL,
    "quantidadeParcelas" INTEGER NOT NULL,
    "parcelasPagas" INTEGER NOT NULL DEFAULT 0,
    "primeiroVencimento" TIMESTAMP(3) NOT NULL,
    "diaVencimento" INTEGER NOT NULL,
    "status" "StatusContrato" NOT NULL DEFAULT 'ATIVO',
    "contratoPdfUrl" TEXT,
    "observacoes" TEXT,
    "asaasSubscriptionId" TEXT,
    "asaasBillingType" "MetodoPagamento" NOT NULL DEFAULT 'BOLETO',
    "asaasStatus" TEXT,
    "sincronizarAsaas" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contrato_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Parcela" (
    "id" SERIAL NOT NULL,
    "contratoId" INTEGER NOT NULL,
    "numero" INTEGER NOT NULL,
    "valor" DECIMAL(10,2) NOT NULL,
    "vencimento" TIMESTAMP(3) NOT NULL,
    "pagamentoEm" TIMESTAMP(3),
    "status" "StatusParcela" NOT NULL DEFAULT 'PENDENTE',
    "asaasPaymentId" TEXT,
    "asaasInvoiceUrl" TEXT,
    "asaasBankSlipUrl" TEXT,
    "asaasPixQrCode" TEXT,
    "asaasPixCopiaCola" TEXT,
    "asaasNossoNumero" TEXT,
    "asaasStatus" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Parcela_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConfiguracaoAsaas" (
    "id" SERIAL NOT NULL,
    "nomeConta" TEXT,
    "apiKey" TEXT NOT NULL,
    "ambiente" TEXT NOT NULL DEFAULT 'SANDBOX',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConfiguracaoAsaas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebhookAsaas" (
    "id" SERIAL NOT NULL,
    "evento" TEXT NOT NULL,
    "paymentId" TEXT,
    "customerId" TEXT,
    "payload" JSONB NOT NULL,
    "processado" BOOLEAN NOT NULL DEFAULT false,
    "erro" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebhookAsaas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LogIntegracaoAsaas" (
    "id" SERIAL NOT NULL,
    "acao" TEXT NOT NULL,
    "entidade" TEXT,
    "entidadeId" INTEGER,
    "sucesso" BOOLEAN NOT NULL DEFAULT false,
    "request" JSONB,
    "response" JSONB,
    "erro" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LogIntegracaoAsaas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Cliente_cpfCnpj_key" ON "Cliente"("cpfCnpj");

-- CreateIndex
CREATE UNIQUE INDEX "Cliente_asaasCustomerId_key" ON "Cliente"("asaasCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "Contrato_asaasSubscriptionId_key" ON "Contrato"("asaasSubscriptionId");

-- CreateIndex
CREATE UNIQUE INDEX "Parcela_asaasPaymentId_key" ON "Parcela"("asaasPaymentId");

-- CreateIndex
CREATE UNIQUE INDEX "Parcela_contratoId_numero_key" ON "Parcela"("contratoId", "numero");

-- AddForeignKey
ALTER TABLE "Usuario" ADD CONSTRAINT "Usuario_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contrato" ADD CONSTRAINT "Contrato_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contrato" ADD CONSTRAINT "Contrato_planoId_fkey" FOREIGN KEY ("planoId") REFERENCES "Plano"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Parcela" ADD CONSTRAINT "Parcela_contratoId_fkey" FOREIGN KEY ("contratoId") REFERENCES "Contrato"("id") ON DELETE CASCADE ON UPDATE CASCADE;
