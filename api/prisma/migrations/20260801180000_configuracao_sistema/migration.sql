-- CreateTable
CREATE TABLE "ConfiguracaoSistema" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "nomeEmpresa" TEXT,
    "cnpj" TEXT,
    "telefone" TEXT,
    "whatsapp" TEXT,
    "email" TEXT,
    "cep" TEXT,
    "rua" TEXT,
    "numero" TEXT,
    "bairro" TEXT,
    "cidade" TEXT,
    "estado" TEXT,
    "gerarParcelas" BOOLEAN NOT NULL DEFAULT true,
    "sincronizarCobrancas" BOOLEAN NOT NULL DEFAULT true,
    "administradoraPadrao" TEXT,
    "formaPagamentoPadrao" TEXT NOT NULL DEFAULT 'BOLETO',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConfiguracaoSistema_pkey" PRIMARY KEY ("id")
);
