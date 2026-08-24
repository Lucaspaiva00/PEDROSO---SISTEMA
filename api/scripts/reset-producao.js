require("dotenv").config();

const prisma = require("../src/config/prisma");
const AsaasService = require("../src/services/asaas.service");

const CONFIRMACAO = "APAGAR_DADOS_PEDROSO";
const dryRun = process.argv.includes("--dry-run");

const STATUS_PAGOS = new Set([
    "RECEIVED",
    "CONFIRMED",
    "RECEIVED_IN_CASH"
]);

function msgErro(error) {
    return (
        error?.response?.data?.errors?.map(item => item.description).filter(Boolean).join(" | ") ||
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        String(error)
    );
}

function statusHttp(error) {
    return error?.response?.status || null;
}

async function resumoBanco() {
    const [
        clientes,
        usuariosCliente,
        planos,
        contratos,
        parcelas,
        lances,
        assembleias,
        webhooks,
        logs,
        parcelasAsaas,
        assinaturasAsaas
    ] = await Promise.all([
        prisma.cliente.count(),
        prisma.usuario.count({ where: { role: "CLIENTE" } }),
        prisma.plano.count(),
        prisma.contrato.count(),
        prisma.parcela.count(),
        prisma.lance.count(),
        prisma.assembleia.count(),
        prisma.webhookAsaas.count(),
        prisma.logIntegracaoAsaas.count(),
        prisma.parcela.count({ where: { asaasPaymentId: { not: null } } }),
        prisma.contrato.count({ where: { asaasSubscriptionId: { not: null } } })
    ]);

    return {
        clientes,
        usuariosCliente,
        planos,
        contratos,
        parcelas,
        lances,
        assembleias,
        webhooks,
        logs,
        parcelasAsaas,
        assinaturasAsaas
    };
}

async function coletarAsaas() {
    const parcelas = await prisma.parcela.findMany({
        where: {
            asaasPaymentId: { not: null }
        },
        select: {
            id: true,
            numero: true,
            asaasPaymentId: true,
            status: true,
            contratoId: true,
            contrato: {
                select: {
                    numeroContrato: true,
                    cliente: {
                        select: {
                            nome: true
                        }
                    }
                }
            }
        },
        orderBy: [
            { contratoId: "asc" },
            { numero: "asc" }
        ]
    });

    const contratos = await prisma.contrato.findMany({
        where: {
            asaasSubscriptionId: { not: null }
        },
        select: {
            id: true,
            numeroContrato: true,
            asaasSubscriptionId: true,
            cliente: {
                select: {
                    nome: true
                }
            }
        }
    });

    return { parcelas, contratos };
}

async function removerAssinaturas(contratos) {
    const resultados = [];

    for (const contrato of contratos) {
        const id = contrato.asaasSubscriptionId;

        if (!id) continue;

        if (dryRun) {
            resultados.push({
                id,
                contratoId: contrato.id,
                numeroContrato: contrato.numeroContrato,
                cliente: contrato.cliente?.nome || null,
                acao: "DRY_RUN"
            });
            continue;
        }

        try {
            const resposta = await AsaasService.api.delete(`/subscriptions/${id}`);

            resultados.push({
                id,
                contratoId: contrato.id,
                numeroContrato: contrato.numeroContrato,
                cliente: contrato.cliente?.nome || null,
                removida: resposta?.data?.deleted !== false,
                status: "REMOVIDA"
            });
        } catch (error) {
            if (statusHttp(error) === 404) {
                resultados.push({
                    id,
                    contratoId: contrato.id,
                    numeroContrato: contrato.numeroContrato,
                    cliente: contrato.cliente?.nome || null,
                    status: "JA_NAO_EXISTIA"
                });
                continue;
            }

            resultados.push({
                id,
                contratoId: contrato.id,
                numeroContrato: contrato.numeroContrato,
                cliente: contrato.cliente?.nome || null,
                status: "ERRO",
                erro: msgErro(error)
            });
        }
    }

    return resultados;
}

async function removerCobrancas(parcelas) {
    const resultados = [];

    for (const parcela of parcelas) {
        const paymentId = parcela.asaasPaymentId;

        if (!paymentId) continue;

        try {
            const cobranca = await AsaasService.consultarCobranca(paymentId);
            const status = String(cobranca?.status || "").toUpperCase();

            if (STATUS_PAGOS.has(status)) {
                resultados.push({
                    paymentId,
                    parcelaId: parcela.id,
                    contratoId: parcela.contratoId,
                    cliente: parcela.contrato?.cliente?.nome || null,
                    status: "PAGA_PRESERVADA_NO_ASAAS",
                    asaasStatus: status
                });
                continue;
            }

            if (dryRun) {
                resultados.push({
                    paymentId,
                    parcelaId: parcela.id,
                    contratoId: parcela.contratoId,
                    cliente: parcela.contrato?.cliente?.nome || null,
                    status: "DRY_RUN",
                    asaasStatus: status || null
                });
                continue;
            }

            await AsaasService.removerCobranca(paymentId);

            resultados.push({
                paymentId,
                parcelaId: parcela.id,
                contratoId: parcela.contratoId,
                cliente: parcela.contrato?.cliente?.nome || null,
                status: "REMOVIDA",
                asaasStatus: status || null
            });
        } catch (error) {
            if (statusHttp(error) === 404) {
                resultados.push({
                    paymentId,
                    parcelaId: parcela.id,
                    contratoId: parcela.contratoId,
                    cliente: parcela.contrato?.cliente?.nome || null,
                    status: "JA_NAO_EXISTIA"
                });
                continue;
            }

            resultados.push({
                paymentId,
                parcelaId: parcela.id,
                contratoId: parcela.contratoId,
                cliente: parcela.contrato?.cliente?.nome || null,
                status: "ERRO",
                erro: msgErro(error)
            });
        }
    }

    return resultados;
}

async function limparBanco() {
    return prisma.$transaction(async tx => {
        const removidos = {};

        removidos.logs = (await tx.logIntegracaoAsaas.deleteMany()).count;
        removidos.webhooks = (await tx.webhookAsaas.deleteMany()).count;
        removidos.lances = (await tx.lance.deleteMany()).count;
        removidos.assembleias = (await tx.assembleia.deleteMany()).count;
        removidos.parcelas = (await tx.parcela.deleteMany()).count;
        removidos.contratos = (await tx.contrato.deleteMany()).count;
        removidos.usuariosCliente = (
            await tx.usuario.deleteMany({
                where: { role: "CLIENTE" }
            })
        ).count;
        removidos.clientes = (await tx.cliente.deleteMany()).count;
        removidos.planos = (await tx.plano.deleteMany()).count;

        // Reinicia IDs somente das tabelas que foram totalmente esvaziadas.
        const tabelas = [
            "LogIntegracaoAsaas",
            "WebhookAsaas",
            "Lance",
            "Assembleia",
            "Parcela",
            "Contrato",
            "Cliente",
            "Plano"
        ];

        for (const tabela of tabelas) {
            await tx.$executeRawUnsafe(`
                SELECT setval(
                    pg_get_serial_sequence('"${tabela}"', 'id'),
                    1,
                    false
                )
            `);
        }

        return removidos;
    });
}

async function main() {
    console.log("\n============================================================");
    console.log(" RESET CONTROLADO - PEDROSO CONSÓRCIOS");
    console.log("============================================================");
    console.log(`Modo: ${dryRun ? "SIMULAÇÃO (nenhum dado será apagado)" : "APAGAMENTO REAL"}`);
    console.log(`Asaas URL: ${process.env.ASAAS_API_URL || "(não configurada)"}`);
    console.log("Preservados: ADMIN/FUNCIONARIO, ConfiguracaoSistema e ConfiguracaoAsaas.");
    console.log("Apagados do banco: clientes, usuários CLIENTE, planos, contratos,");
    console.log("parcelas, lances, assembleias, webhooks e logs de integração.");
    console.log("============================================================\n");

    if (!process.env.DATABASE_URL) {
        throw new Error("DATABASE_URL não está definida.");
    }

    if (!process.env.ASAAS_API_URL || !process.env.ASAAS_API_KEY) {
        throw new Error("ASAAS_API_URL/ASAAS_API_KEY não estão definidas.");
    }

    if (!dryRun && process.env.RESET_CONFIRM !== CONFIRMACAO) {
        throw new Error(
            `Confirmação ausente. Execute com RESET_CONFIRM=${CONFIRMACAO}`
        );
    }

    const antes = await resumoBanco();
    console.log("Dados encontrados no banco:");
    console.table(antes);

    const { parcelas, contratos } = await coletarAsaas();

    console.log(`\nAssinaturas Asaas vinculadas encontradas: ${contratos.length}`);
    console.log(`Cobranças Asaas vinculadas encontradas: ${parcelas.length}`);

    const assinaturas = await removerAssinaturas(contratos);
    const cobrancas = await removerCobrancas(parcelas);

    if (assinaturas.length) {
        console.log("\nResultado das assinaturas Asaas:");
        console.table(assinaturas);
    }

    if (cobrancas.length) {
        console.log("\nResultado das cobranças Asaas:");
        console.table(cobrancas);
    }

    const errosAsaas = [
        ...assinaturas.filter(item => item.status === "ERRO"),
        ...cobrancas.filter(item => item.status === "ERRO")
    ];

    const pagasPreservadas = cobrancas.filter(
        item => item.status === "PAGA_PRESERVADA_NO_ASAAS"
    );

    if (dryRun) {
        console.log("\nSIMULAÇÃO FINALIZADA.");
        console.log("Nenhum dado foi apagado.");
        console.log(
            `Cobranças pagas/confirmadas que seriam preservadas no Asaas: ${pagasPreservadas.length}`
        );
        return;
    }

    if (errosAsaas.length) {
        console.error("\nATENÇÃO: houve erro ao remover itens no Asaas.");
        console.error("O banco NÃO será limpo para evitar perder a referência dessas cobranças.");
        console.table(errosAsaas);
        process.exitCode = 2;
        return;
    }

    const removidos = await limparBanco();

    console.log("\nBanco limpo com sucesso:");
    console.table(removidos);

    const depois = await resumoBanco();
    console.log("\nSituação final do banco:");
    console.table(depois);

    console.log("\n============================================================");
    console.log(" RESET CONCLUÍDO");
    console.log("============================================================");

    if (pagasPreservadas.length) {
        console.log(
            `ATENÇÃO: ${pagasPreservadas.length} cobrança(s) paga(s)/confirmada(s) foram preservadas no Asaas.`
        );
        console.log(
            "Isso é intencional: exclusão de cobrança não substitui estorno/reembolso."
        );
    } else {
        console.log("Todas as cobranças de teste removíveis vinculadas ao sistema foram tratadas.");
    }

    console.log("O sistema ficou sem dados operacionais e pronto para nova alimentação.");
}

main()
    .catch(error => {
        console.error("\nRESET NÃO CONCLUÍDO:");
        console.error(msgErro(error));
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
