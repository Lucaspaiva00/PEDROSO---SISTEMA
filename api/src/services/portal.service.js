const UsuarioRepository = require("../repositories/usuario.repository");
const AsaasService = require("./asaas.service");
const prisma = require("../config/prisma");

class PortalService {
    resolverContrato(cliente, contratoId) {
        const contratos = cliente.contratos || [];
        if (!contratos.length) return null;

        if (contratoId != null && contratoId !== "") {
            const id = Number(contratoId);
            if (!Number.isNaN(id)) {
                const encontrado = contratos.find(item => item.id === id);
                if (encontrado) return encontrado;
            }
        }

        return contratos[0];
    }

    metricasContrato(contrato) {
        const parcelas = contrato.parcelas || [];
        const pagas = parcelas.filter(p => p.status === "PAGA");
        const emAberto = parcelas.filter(p => ["PENDENTE", "VENCIDA"].includes(p.status));
        const atrasadas = parcelas.filter(p => p.status === "VENCIDA" || (p.status === "PENDENTE" && new Date(p.vencimento) < new Date()));
        const parcelasPagas = Math.max(Number(contrato.parcelasPagas || 0), pagas.length);
        const totalPago = pagas.reduce((soma, p) => soma + Number(p.valor || 0), 0);
        const saldoParcelas = emAberto.reduce((soma, p) => soma + Number(p.valor || 0), 0);
        const valorEmAtraso = atrasadas.reduce((soma, p) => soma + Number(p.valor || 0), 0);
        const percentual = contrato.quantidadeParcelas > 0
            ? Math.min(100, Math.round((parcelasPagas / contrato.quantidadeParcelas) * 100))
            : 0;

        const proximaParcela = parcelas
            .filter(p => p.status === "PENDENTE")
            .sort((a, b) => new Date(a.vencimento) - new Date(b.vencimento))[0] || null;

        return {
            parcelasPagas,
            parcelasRestantes: Math.max(0, contrato.quantidadeParcelas - parcelasPagas),
            totalPago,
            saldoParcelas,
            valorEmAtraso,
            parcelasAtrasadas: atrasadas.length,
            percentual,
            proximaParcela
        };
    }

    mapearContratoResumo(contrato) {
        const metricas = this.metricasContrato(contrato);
        return {
            id: contrato.id,
            numeroContrato: contrato.numeroContrato,
            grupo: contrato.grupo,
            cota: contrato.cota,
            status: contrato.status,
            tipo: contrato.tipo,
            tipoConsorcio: contrato.tipo,
            valorCarta: Number(contrato.valorCarta),
            valorCartaCredito: Number(contrato.valorCarta),
            valorParcela: Number(contrato.valorParcela),
            quantidadeParcelas: contrato.quantidadeParcelas,
            parcelasPagas: metricas.parcelasPagas,
            parcelasRestantes: metricas.parcelasRestantes,
            totalPago: metricas.totalPago,
            saldoParcelas: metricas.saldoParcelas,
            valorEmAtraso: metricas.valorEmAtraso,
            percentual: metricas.percentual,
            planoNome: contrato.plano?.nome || null,
            plano: { nome: contrato.plano?.nome },
            proximaParcela: metricas.proximaParcela
                ? {
                    id: metricas.proximaParcela.id,
                    valor: Number(metricas.proximaParcela.valor),
                    vencimento: metricas.proximaParcela.vencimento
                }
                : null,
            proximoVencimento: metricas.proximaParcela?.vencimento || null
        };
    }

    async proximaAssembleia(contrato) {
        if (!contrato?.grupo) return null;

        const agora = new Date();
        let assembleia = await prisma.assembleia.findFirst({
            where: {
                grupo: String(contrato.grupo),
                encerrada: false,
                dataAssembleia: { gte: agora }
            },
            orderBy: { dataAssembleia: "asc" }
        });

        if (!assembleia) {
            assembleia = await prisma.assembleia.findFirst({
                where: {
                    grupo: String(contrato.grupo),
                    encerrada: false,
                    aceitaLances: true
                },
                orderBy: { dataAssembleia: "desc" }
            });
        }

        return assembleia
            ? {
                id: assembleia.id,
                titulo: assembleia.titulo,
                grupo: assembleia.grupo,
                dataAssembleia: assembleia.dataAssembleia,
                aceitaLances: assembleia.aceitaLances
            }
            : null;
    }

    montarTimeline(contrato) {
        const eventos = [];

        eventos.push({
            tipo: "CONTRATO",
            titulo: "Contrato iniciado",
            descricao: `Consórcio ${contrato.numeroContrato || `#${contrato.id}`} iniciado.`,
            data: contrato.criadoEm,
            icone: "file-contract"
        });

        (contrato.parcelas || [])
            .filter(parcela => parcela.status === "PAGA")
            .forEach(parcela => eventos.push({
                tipo: "PAGAMENTO",
                titulo: `Parcela ${parcela.numero} paga`,
                descricao: `Pagamento de R$ ${Number(parcela.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })} confirmado.`,
                data: parcela.pagamentoEm || parcela.atualizadoEm,
                icone: "circle-check"
            }));

        (contrato.lances || []).forEach(lance => {
            const mapa = {
                REGISTRADO: "Lance enviado",
                VENCEDOR: "Lance contemplado",
                NAO_CONTEMPLADO: "Lance não contemplado"
            };
            eventos.push({
                tipo: "LANCE",
                titulo: mapa[lance.status] || "Lance registrado",
                descricao: `${Number(lance.valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}${lance.assembleia?.titulo ? ` • ${lance.assembleia.titulo}` : ""}`,
                data: lance.criadoEm,
                icone: lance.status === "VENCEDOR" ? "trophy" : "gavel"
            });
        });

        if (contrato.status !== "ATIVO") {
            const titulos = {
                PAUSADO: "Contrato pausado",
                CANCELADO: "Contrato cancelado",
                QUITADO: "Contrato quitado",
                CONTEMPLADO: "Cota contemplada",
                INADIMPLENTE: "Contrato com pendência"
            };
            eventos.push({
                tipo: "STATUS",
                titulo: titulos[contrato.status] || `Status: ${contrato.status}`,
                descricao: "Situação atual do contrato.",
                data: contrato.atualizadoEm,
                icone: contrato.status === "CONTEMPLADO" ? "award" : "circle-info"
            });
        }

        return eventos
            .filter(item => item.data)
            .sort((a, b) => new Date(b.data) - new Date(a.data))
            .slice(0, 20);
    }

    montarContemplacao(contrato) {
        if (contrato.status !== "CONTEMPLADO") return null;
        return {
            titulo: "Parabéns, sua cota foi contemplada!",
            etapas: [
                { nome: "Cota contemplada", concluida: true },
                { nome: "Enviar documentos", concluida: false },
                { nome: "Análise documental", concluida: false },
                { nome: "Aprovação", concluida: false },
                { nome: "Liberação da carta", concluida: false },
                { nome: "Compra do bem", concluida: false }
            ]
        };
    }

    async dashboard(usuarioLogado) {
        const usuario = await UsuarioRepository.findPortalByUserId(usuarioLogado.id);
        if (!usuario?.cliente) return { sucesso: false, mensagem: "Cliente não encontrado." };

        const contratosResumo = usuario.cliente.contratos.map(contrato => this.mapearContratoResumo(contrato));
        const contrato = usuario.cliente.contratos[0];
        if (!contrato) return { sucesso: false, mensagem: "Nenhum contrato encontrado." };

        const metricas = this.metricasContrato(contrato);
        const assembleia = await this.proximaAssembleia(contrato);
        const ultimoLance = (contrato.lances || [])[0] || null;

        return {
            sucesso: true,
            dados: {
                nome: usuario.cliente.nome,
                valorCarta: Number(contrato.valorCarta),
                proximaParcela: metricas.proximaParcela ? Number(metricas.proximaParcela.valor) : 0,
                proximoVencimento: metricas.proximaParcela?.vencimento || null,
                status: contrato.status,
                grupo: contrato.grupo,
                cota: contrato.cota,
                parcelasPagas: metricas.parcelasPagas,
                parcelasRestantes: metricas.parcelasRestantes,
                parcelasTotais: contrato.quantidadeParcelas,
                percentual: metricas.percentual,
                totalPago: metricas.totalPago,
                saldoRestante: metricas.saldoParcelas,
                valorEmAtraso: metricas.valorEmAtraso,
                parcelasAtrasadas: metricas.parcelasAtrasadas,
                proximaAssembleia: assembleia,
                ultimoLance: ultimoLance
                    ? { valor: Number(ultimoLance.valor), status: ultimoLance.status, criadoEm: ultimoLance.criadoEm }
                    : null,
                contratos: contratosResumo
            }
        };
    }

    async listarContratos(usuarioLogado) {
        const usuario = await UsuarioRepository.findPortalByUserId(usuarioLogado.id);
        if (!usuario?.cliente) return { sucesso: false, mensagem: "Cliente não encontrado." };
        return { sucesso: true, dados: usuario.cliente.contratos.map(c => this.mapearContratoResumo(c)) };
    }

    async contrato(usuarioLogado, contratoId) {
        const usuario = await UsuarioRepository.findPortalByUserId(usuarioLogado.id);
        if (!usuario?.cliente) return { sucesso: false, mensagem: "Cliente não encontrado." };

        const contrato = this.resolverContrato(usuario.cliente, contratoId);
        if (!contrato) return { sucesso: false, mensagem: "Nenhum contrato encontrado." };

        const metricas = this.metricasContrato(contrato);
        const assembleia = await this.proximaAssembleia(contrato);

        return {
            sucesso: true,
            dados: {
                id: contrato.id,
                numeroContrato: contrato.numeroContrato,
                status: contrato.status,
                grupo: contrato.grupo,
                cota: contrato.cota,
                tipoConsorcio: contrato.tipo,
                valorCartaCredito: Number(contrato.valorCarta),
                valorParcela: Number(contrato.valorParcela),
                quantidadeParcelas: contrato.quantidadeParcelas,
                parcelasPagas: metricas.parcelasPagas,
                parcelasRestantes: metricas.parcelasRestantes,
                percentual: metricas.percentual,
                totalPago: metricas.totalPago,
                saldoRestante: metricas.saldoParcelas,
                valorEmAtraso: metricas.valorEmAtraso,
                dataContratacao: contrato.criadoEm,
                pdfUrl: contrato.contratoPdfUrl || null,
                proximaAssembleia: assembleia,
                timeline: this.montarTimeline(contrato),
                contemplacao: this.montarContemplacao(contrato),
                plano: { nome: contrato.plano?.nome }
            }
        };
    }

    async parcelas(usuarioLogado, contratoId) {
        const usuario = await UsuarioRepository.findPortalByUserId(usuarioLogado.id);
        if (!usuario?.cliente) return { sucesso: false, mensagem: "Cliente não encontrado." };

        const contrato = this.resolverContrato(usuario.cliente, contratoId);
        if (!contrato) return { sucesso: false, mensagem: "Nenhum contrato encontrado." };

        const metricas = this.metricasContrato(contrato);
        const mapParcela = parcela => ({
            id: parcela.id,
            numero: parcela.numero,
            valor: Number(parcela.valor),
            vencimento: parcela.vencimento,
            status: parcela.status,
            paymentId: parcela.asaasPaymentId,
            invoiceUrl: parcela.asaasInvoiceUrl,
            bankSlipUrl: parcela.asaasBankSlipUrl,
            pixQrCode: parcela.asaasPixQrCode,
            pixCopiaCola: parcela.asaasPixCopiaCola,
            pagamentoEm: parcela.pagamentoEm
        });

        return {
            sucesso: true,
            dados: {
                contrato: { id: contrato.id, status: contrato.status, numeroContrato: contrato.numeroContrato },
                resumo: {
                    totalPago: metricas.totalPago,
                    saldoRestante: metricas.saldoParcelas,
                    valorEmAtraso: metricas.valorEmAtraso,
                    parcelasAtrasadas: metricas.parcelasAtrasadas
                },
                proximaParcela: metricas.proximaParcela ? mapParcela(metricas.proximaParcela) : null,
                parcelas: contrato.parcelas.map(mapParcela)
            }
        };
    }

    async documentos(usuarioLogado, contratoId) {
        const usuario = await UsuarioRepository.findPortalByUserId(usuarioLogado.id);
        if (!usuario?.cliente) throw new Error("Cliente não encontrado.");

        const contrato = this.resolverContrato(usuario.cliente, contratoId);
        if (!contrato) throw new Error("Contrato não encontrado.");

        const documentos = [];
        if (contrato.contratoPdfUrl) {
            documentos.push({
                tipo: "CONTRATO",
                titulo: `Contrato ${contrato.numeroContrato || `#${contrato.id}`}`,
                descricao: "Contrato do consórcio",
                url: contrato.contratoPdfUrl,
                data: contrato.criadoEm,
                icone: "file-pdf"
            });
        }

        contrato.parcelas.forEach(parcela => {
            const url = parcela.asaasBankSlipUrl || parcela.asaasInvoiceUrl || null;
            const podeBoleto = ["PENDENTE", "VENCIDA"].includes(parcela.status);
            const comprovanteDisponivel = parcela.status === "PAGA" && Boolean(parcela.asaasInvoiceUrl);

            if (podeBoleto || comprovanteDisponivel) {
                documentos.push({
                    tipo: parcela.status === "PAGA" ? "COMPROVANTE" : "BOLETO",
                    titulo: `${parcela.status === "PAGA" ? "Pagamento" : "Boleto"} • Parcela ${parcela.numero}`,
                    descricao: `${Number(parcela.valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} • venc. ${new Date(parcela.vencimento).toLocaleDateString("pt-BR")}`,
                    url,
                    parcelaId: parcela.id,
                    status: parcela.status,
                    data: parcela.pagamentoEm || parcela.vencimento,
                    icone: parcela.status === "PAGA" ? "receipt" : "barcode"
                });
            }
        });

        return {
            sucesso: true,
            dados: {
                contrato: { id: contrato.id, numeroContrato: contrato.numeroContrato, grupo: contrato.grupo, cota: contrato.cota },
                documentos: documentos.sort((a, b) => new Date(b.data) - new Date(a.data))
            }
        };
    }

    async validarContratoDoCliente(usuarioLogado, contratoId) {
        const usuario = await UsuarioRepository.findPortalByUserId(usuarioLogado.id);
        if (!usuario?.cliente) throw new Error("Cliente não encontrado.");
        const contrato = usuario.cliente.contratos.find(item => item.id === Number(contratoId));
        if (!contrato) throw new Error("Contrato não encontrado para este cliente.");
        return contrato;
    }

    async alterarSituacaoContrato(usuarioLogado, contratoId, acao) {
        const contrato = await this.validarContratoDoCliente(usuarioLogado, contratoId);
        const acaoNormalizada = String(acao || "").toLowerCase();

        if (acaoNormalizada === "pausar") {
            if (!["ATIVO", "INADIMPLENTE"].includes(contrato.status)) {
                throw new Error("Somente contratos ativos podem ser pausados.");
            }
            const integracao = await AsaasService.interromperCobrancasContrato(contrato.id, { cancelarParcelas: false });
            const atualizado = await prisma.contrato.update({
                where: { id: contrato.id },
                data: { status: "PAUSADO", asaasStatus: "PAUSADO" }
            });
            return {
                sucesso: true,
                mensagem: integracao.sucesso
                    ? "Contrato pausado com sucesso. As cobranças em aberto foram interrompidas."
                    : "Contrato pausado, mas uma ou mais cobranças do Asaas precisam de conferência pelo administrador.",
                dados: { id: atualizado.id, status: atualizado.status },
                integracaoAsaas: integracao
            };
        }

        if (acaoNormalizada === "reativar") {
            if (contrato.status !== "PAUSADO") throw new Error("Somente contratos pausados podem ser reativados.");
            const atualizado = await prisma.contrato.update({
                where: { id: contrato.id },
                data: { status: "ATIVO", asaasStatus: "REATIVANDO" }
            });
            let integracao = null;
            if (atualizado.sincronizarAsaas) integracao = await AsaasService.sincronizarContrato(atualizado.id);
            return {
                sucesso: true,
                mensagem: "Contrato reativado com sucesso.",
                dados: { id: atualizado.id, status: "ATIVO" },
                integracaoAsaas: integracao
            };
        }

        if (acaoNormalizada === "cancelar") {
            if (["CANCELADO", "QUITADO"].includes(contrato.status)) {
                throw new Error("Este contrato não pode ser cancelado no status atual.");
            }
            const integracao = await AsaasService.interromperCobrancasContrato(contrato.id, { cancelarParcelas: true });
            const atualizado = await prisma.contrato.update({
                where: { id: contrato.id },
                data: { status: "CANCELADO", asaasStatus: "CANCELADO" }
            });
            return {
                sucesso: true,
                mensagem: integracao.sucesso
                    ? "Contrato cancelado com sucesso. As cobranças em aberto foram canceladas."
                    : "Contrato cancelado, mas uma ou mais cobranças do Asaas precisam de conferência pelo administrador.",
                dados: { id: atualizado.id, status: atualizado.status },
                integracaoAsaas: integracao
            };
        }

        throw new Error("Ação inválida para o contrato.");
    }

    async boleto(usuarioLogado, parcelaId) {
        const usuario = await UsuarioRepository.findPortalByUserId(usuarioLogado.id);
        if (!usuario?.cliente) throw new Error("Cliente não encontrado.");
        const parcela = usuario.cliente.contratos
            .flatMap(contrato => contrato.parcelas || [])
            .find(item => item.id === Number(parcelaId));
        if (!parcela) throw new Error("Parcela não encontrada para este cliente.");
        const boleto = await AsaasService.atualizarDadosCobrancaDaParcela(parcela.id);
        return { sucesso: true, dados: boleto };
    }
}

module.exports = new PortalService();
