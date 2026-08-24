const prisma = require("../config/prisma");

class DashboardService {
    validarAdmin(usuario) {
        if (!usuario || !["ADMIN", "FUNCIONARIO"].includes(usuario.role)) {
            throw new Error("Acesso restrito ao administrativo.");
        }
    }

    inicioDoMes(data = new Date()) {
        return new Date(data.getFullYear(), data.getMonth(), 1);
    }

    inicioDoProximoMes(data = new Date()) {
        return new Date(data.getFullYear(), data.getMonth() + 1, 1);
    }

    async executivo(usuario) {
        this.validarAdmin(usuario);

        const agora = new Date();
        const inicioMes = this.inicioDoMes(agora);
        const proximoMes = this.inicioDoProximoMes(agora);
        const inicioSeisMeses = new Date(agora.getFullYear(), agora.getMonth() - 5, 1);

        const [
            totalClientes,
            totalContratos,
            statusAgrupados,
            valorCartas,
            parcelasMes,
            parcelasRecebidasSeisMeses,
            parcelasVencidas,
            proximasAssembleias,
            ultimosContratos,
            ultimosPagamentos,
            ultimosLances
        ] = await Promise.all([
            prisma.cliente.count(),
            prisma.contrato.count(),
            prisma.contrato.groupBy({ by: ["status"], _count: { _all: true } }),
            prisma.contrato.aggregate({ _sum: { valorCarta: true } }),
            prisma.parcela.findMany({
                where: {
                    vencimento: { gte: inicioMes, lt: proximoMes },
                    status: { notIn: ["CANCELADA", "ESTORNADA"] }
                },
                select: { valor: true, status: true, pagamentoEm: true, vencimento: true }
            }),
            prisma.parcela.findMany({
                where: {
                    status: "PAGA",
                    pagamentoEm: { gte: inicioSeisMeses }
                },
                select: { valor: true, pagamentoEm: true }
            }),
            prisma.parcela.findMany({
                where: {
                    OR: [
                        { status: "VENCIDA" },
                        { status: "PENDENTE", vencimento: { lt: agora } }
                    ]
                },
                include: {
                    contrato: {
                        include: { cliente: true, plano: true }
                    }
                },
                orderBy: { vencimento: "asc" }
            }),
            prisma.assembleia.findMany({
                where: {
                    encerrada: false,
                    dataAssembleia: { gte: agora }
                },
                orderBy: { dataAssembleia: "asc" },
                take: 5,
                include: { _count: { select: { lances: true } } }
            }),
            prisma.contrato.findMany({
                orderBy: { criadoEm: "desc" },
                take: 5,
                include: { cliente: true, plano: true }
            }),
            prisma.parcela.findMany({
                where: { status: "PAGA", pagamentoEm: { not: null } },
                orderBy: { pagamentoEm: "desc" },
                take: 8,
                include: { contrato: { include: { cliente: true } } }
            }),
            prisma.lance.findMany({
                orderBy: { criadoEm: "desc" },
                take: 8,
                include: { contrato: { include: { cliente: true } }, assembleia: true }
            })
        ]);

        const status = Object.fromEntries(statusAgrupados.map(item => [item.status, item._count._all]));
        const previstoMes = parcelasMes.reduce((soma, p) => soma + Number(p.valor || 0), 0);
        const recebidoMes = parcelasRecebidasSeisMeses
            .filter(p => p.pagamentoEm && new Date(p.pagamentoEm) >= inicioMes && new Date(p.pagamentoEm) < proximoMes)
            .reduce((soma, p) => soma + Number(p.valor || 0), 0);
        const abertoMes = parcelasMes
            .filter(p => p.status !== "PAGA")
            .reduce((soma, p) => soma + Number(p.valor || 0), 0);
        const valorInadimplente = parcelasVencidas.reduce((soma, p) => soma + Number(p.valor || 0), 0);
        const clientesInadimplentes = new Set(parcelasVencidas.map(p => p.contrato.clienteId)).size;
        const taxaInadimplencia = totalClientes > 0
            ? Number(((clientesInadimplentes / totalClientes) * 100).toFixed(1))
            : 0;

        const meses = [];
        for (let i = 5; i >= 0; i -= 1) {
            const d = new Date(agora.getFullYear(), agora.getMonth() - i, 1);
            meses.push({
                chave: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
                label: d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }),
                valor: 0
            });
        }
        const mapa = Object.fromEntries(meses.map(m => [m.chave, m]));
        parcelasRecebidasSeisMeses.forEach(parcela => {
            const d = new Date(parcela.pagamentoEm);
            const chave = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
            if (mapa[chave]) mapa[chave].valor += Number(parcela.valor || 0);
        });

        const atividades = [
            ...ultimosContratos.map(item => ({
                tipo: "CONTRATO",
                titulo: "Novo contrato",
                descricao: `${item.cliente?.nome || "Cliente"} • ${item.numeroContrato || `#${item.id}`}`,
                data: item.criadoEm,
                icone: "file-signature"
            })),
            ...ultimosPagamentos.map(item => ({
                tipo: "PAGAMENTO",
                titulo: "Pagamento confirmado",
                descricao: `${item.contrato?.cliente?.nome || "Cliente"} • Parcela ${item.numero} • R$ ${Number(item.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
                data: item.pagamentoEm,
                icone: "circle-check"
            })),
            ...ultimosLances.map(item => ({
                tipo: "LANCE",
                titulo: item.status === "VENCEDOR" ? "Lance contemplado" : "Lance registrado",
                descricao: `${item.contrato?.cliente?.nome || "Cliente"} • ${Number(item.valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`,
                data: item.criadoEm,
                icone: item.status === "VENCEDOR" ? "trophy" : "gavel"
            }))
        ].sort((a, b) => new Date(b.data) - new Date(a.data)).slice(0, 10);

        return {
            sucesso: true,
            dados: {
                carteira: {
                    clientes: totalClientes,
                    contratos: totalContratos,
                    valorCartas: Number(valorCartas._sum.valorCarta || 0),
                    ativos: status.ATIVO || 0,
                    pausados: status.PAUSADO || 0,
                    contemplados: status.CONTEMPLADO || 0,
                    cancelados: status.CANCELADO || 0,
                    inadimplentes: status.INADIMPLENTE || 0
                },
                financeiro: {
                    previstoMes,
                    recebidoMes,
                    abertoMes,
                    valorInadimplente,
                    clientesInadimplentes,
                    taxaInadimplencia
                },
                recebimentos: meses,
                proximasAssembleias: proximasAssembleias.map(item => ({
                    id: item.id,
                    grupo: item.grupo,
                    titulo: item.titulo,
                    dataAssembleia: item.dataAssembleia,
                    aceitaLances: item.aceitaLances,
                    totalLances: item._count.lances
                })),
                ultimosContratos: ultimosContratos.map(item => ({
                    id: item.id,
                    clienteId: item.clienteId,
                    cliente: item.cliente?.nome,
                    plano: item.plano?.nome,
                    numeroContrato: item.numeroContrato,
                    valorCarta: Number(item.valorCarta),
                    status: item.status,
                    criadoEm: item.criadoEm
                })),
                atividades
            }
        };
    }

    async inadimplentes(usuario) {
        this.validarAdmin(usuario);
        const agora = new Date();

        const parcelas = await prisma.parcela.findMany({
            where: {
                OR: [
                    { status: "VENCIDA" },
                    { status: "PENDENTE", vencimento: { lt: agora } }
                ]
            },
            include: {
                contrato: {
                    include: { cliente: true, plano: true }
                }
            },
            orderBy: { vencimento: "asc" }
        });

        const dados = parcelas.map(parcela => {
            const diasAtraso = Math.max(1, Math.floor((agora - new Date(parcela.vencimento)) / 86400000));
            return {
                parcelaId: parcela.id,
                contratoId: parcela.contratoId,
                clienteId: parcela.contrato.clienteId,
                cliente: parcela.contrato.cliente.nome,
                telefone: parcela.contrato.cliente.telefone,
                numeroContrato: parcela.contrato.numeroContrato,
                grupo: parcela.contrato.grupo,
                cota: parcela.contrato.cota,
                plano: parcela.contrato.plano?.nome,
                numeroParcela: parcela.numero,
                valor: Number(parcela.valor),
                vencimento: parcela.vencimento,
                diasAtraso,
                status: parcela.status,
                boletoUrl: parcela.asaasBankSlipUrl || parcela.asaasInvoiceUrl || null
            };
        });

        return {
            sucesso: true,
            dados,
            resumo: {
                clientes: new Set(dados.map(item => item.clienteId)).size,
                parcelas: dados.length,
                valor: dados.reduce((soma, item) => soma + item.valor, 0)
            }
        };
    }
}

module.exports = new DashboardService();
