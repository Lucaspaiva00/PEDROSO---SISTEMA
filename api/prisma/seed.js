require("dotenv").config();

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const PLANOS = [
    {
        nome: "Carta de Crédito R$ 15 mil",
        tipo: "OUTRO",
        descricao:
            "Pequena escolha, grandes conquistas. Ideal para reformar, mobiliar, eletro, moto ou investir no negócio.",
        valorCarta: 15000,
        quantidadeParcelas: 72,
        valorParcela: 255,
        ativo: true,
    },
    {
        nome: "Carta de Crédito R$ 30 mil",
        tipo: "OUTRO",
        descricao:
            "Carro melhor, reforma com qualidade, conforto da casa ou impulsionar o negócio.",
        valorCarta: 30000,
        quantidadeParcelas: 100,
        valorParcela: 367,
        ativo: true,
    },
    {
        nome: "Carta de Crédito R$ 50 mil",
        tipo: "OUTRO",
        descricao:
            "Realize sonhos com mais conforto: carro, reforma, mobiliar a casa ou pequeno negócio.",
        valorCarta: 50000,
        quantidadeParcelas: 100,
        valorParcela: 612.5,
        ativo: true,
    },
    {
        nome: "Carta de Crédito R$ 150 mil",
        tipo: "IMOVEL",
        descricao:
            "Imóvel, construir, investir no negócio ou bens de alto valor — com liberdade para escolher.",
        valorCarta: 150000,
        quantidadeParcelas: 200,
        valorParcela: 915,
        ativo: true,
    },
    {
        nome: "Carta de Crédito R$ 300 mil",
        tipo: "IMOVEL",
        descricao:
            "Para quem pensa grande: imóvel, carro de alto padrão, negócio ou fortalecer patrimônio.",
        valorCarta: 300000,
        quantidadeParcelas: 200,
        valorParcela: 1830,
        ativo: true,
    },
    {
        nome: "Carta de Crédito R$ 450 mil",
        tipo: "IMOVEL",
        descricao:
            "Grandes escolhas e legado: imóvel de alto padrão, expansão do negócio e diversificação de patrimônio.",
        valorCarta: 450000,
        quantidadeParcelas: 200,
        valorParcela: 2745,
        ativo: true,
    },
];

async function upsertPlano(data) {
    const existente = await prisma.plano.findFirst({
        where: { nome: data.nome },
    });

    if (existente) {
        return prisma.plano.update({
            where: { id: existente.id },
            data,
        });
    }

    return prisma.plano.create({ data });
}

async function main() {
    for (const plano of PLANOS) {
        await upsertPlano(plano);
    }

    console.log(`Seed: ${PLANOS.length} planos cadastrados/atualizados.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
