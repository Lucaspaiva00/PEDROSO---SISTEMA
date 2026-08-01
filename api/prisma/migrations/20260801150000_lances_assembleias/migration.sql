-- CreateEnum
CREATE TYPE "StatusLance" AS ENUM ('REGISTRADO', 'VENCEDOR', 'NAO_CONTEMPLADO');

-- CreateTable
CREATE TABLE "Assembleia" (
    "id" SERIAL NOT NULL,
    "grupo" TEXT NOT NULL,
    "titulo" TEXT,
    "dataAssembleia" TIMESTAMP(3) NOT NULL,
    "aceitaLances" BOOLEAN NOT NULL DEFAULT false,
    "encerrada" BOOLEAN NOT NULL DEFAULT false,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Assembleia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lance" (
    "id" SERIAL NOT NULL,
    "assembleiaId" INTEGER NOT NULL,
    "contratoId" INTEGER NOT NULL,
    "valor" DECIMAL(10,2) NOT NULL,
    "status" "StatusLance" NOT NULL DEFAULT 'REGISTRADO',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Lance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Assembleia_grupo_idx" ON "Assembleia"("grupo");

-- CreateIndex
CREATE INDEX "Lance_assembleiaId_valor_idx" ON "Lance"("assembleiaId", "valor" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "Lance_assembleiaId_contratoId_key" ON "Lance"("assembleiaId", "contratoId");

-- AddForeignKey
ALTER TABLE "Lance" ADD CONSTRAINT "Lance_assembleiaId_fkey" FOREIGN KEY ("assembleiaId") REFERENCES "Assembleia"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lance" ADD CONSTRAINT "Lance_contratoId_fkey" FOREIGN KEY ("contratoId") REFERENCES "Contrato"("id") ON DELETE CASCADE ON UPDATE CASCADE;
