const ContratoRepository = require("../repositories/contrato.repository");

const ClienteRepository = require("../repositories/cliente.repository");

const AuthService = require("./auth.service");

const AsaasService = require("./asaas.service");

const prisma = require("../config/prisma");

class ContratoService {
  async cadastrar(dados) {
    const cliente = await ClienteRepository.buscarPorId(dados.clienteId);

    if (!cliente) {
      throw new Error("Cliente não encontrado.");
    }

    let plano = null;

    if (dados.planoId) {
      plano = await prisma.plano.findUnique({
        where: {
          id: Number(dados.planoId),
        },
      });

      if (!plano) {
        throw new Error("Plano não encontrado.");
      }

      dados.tipo = plano.tipo;

      dados.valorCarta = plano.valorCarta;

      dados.valorParcela = plano.valorParcela;

      dados.quantidadeParcelas = plano.quantidadeParcelas;
    }

    const dadosContrato = {
      ...dados,

      clienteId: Number(dados.clienteId),

      planoId: dados.planoId ? Number(dados.planoId) : null,

      valorEntrada:
        dados.valorEntrada !== undefined &&
        dados.valorEntrada !== null &&
        dados.valorEntrada !== ""
          ? Number(dados.valorEntrada)
          : null,

      primeiroVencimento: new Date(dados.primeiroVencimento),

      diaVencimento: Number(dados.diaVencimento),

      parcelasPagas: Number(dados.parcelasPagas || 0),

      sincronizarAsaas: dados.sincronizarAsaas !== false,
    };

    const contrato = await ContratoRepository.cadastrar(dadosContrato);

    await AuthService.criarUsuarioCliente(cliente);

    let integracaoAsaas = null;

    try {
      /*
            As parcelas locais são necessárias mesmo
            quando a sincronização do Asaas estiver
            desativada.
            */

      await AsaasService.garantirParcelasLocais(contrato.id);

      if (contrato.sincronizarAsaas) {
        integracaoAsaas =
          await AsaasService.agendarSincronizacaoContrato(contrato.id);
      } else {
        integracaoAsaas = {
          sucesso: true,

          ignorado: true,

          mensagem: "Contrato criado sem sincronização com o Asaas.",
        };
      }
    } catch (erro) {
      console.log(erro);
      console.error(
        "Contrato criado, mas houve erro na integração com o Asaas:",
        erro.response?.data || erro.message,
      );

      integracaoAsaas = {
        sucesso: false,

        mensagem:
          "Contrato criado, mas não foi possível concluir a integração com o Asaas.",

        erro: AsaasService.obterMensagemErro(erro),
      };
    }

    const contratoAtualizado = await ContratoRepository.buscarPorId(
      contrato.id,
    );

    return {
      ...contratoAtualizado,

      integracaoAsaas,
    };
  }

  async listar() {
    return await ContratoRepository.listar();
  }

  async buscarPorId(id) {
    const contrato = await ContratoRepository.buscarPorId(id);

    if (!contrato) {
      throw new Error("Contrato não encontrado.");
    }

    return contrato;
  }

  async atualizar(id, dados) {
    const contratoAtual = await this.buscarPorId(id);

    const dadosAtualizacao = {
      ...dados,
    };

    if (dados.clienteId) {
      dadosAtualizacao.clienteId = Number(dados.clienteId);
    }

    if (dados.planoId !== undefined) {
      dadosAtualizacao.planoId = dados.planoId ? Number(dados.planoId) : null;
    }

    if (dados.primeiroVencimento) {
      dadosAtualizacao.primeiroVencimento = new Date(dados.primeiroVencimento);
    }

    if (dados.diaVencimento !== undefined) {
      dadosAtualizacao.diaVencimento = Number(dados.diaVencimento);
    }

    if (dados.parcelasPagas !== undefined) {
      dadosAtualizacao.parcelasPagas = Number(dados.parcelasPagas);
    }

    if (dados.planoId) {
      const plano = await prisma.plano.findUnique({
        where: {
          id: Number(dados.planoId),
        },
      });

      if (!plano) {
        throw new Error("Plano não encontrado.");
      }

      dadosAtualizacao.tipo = plano.tipo;

      dadosAtualizacao.valorCarta = plano.valorCarta;

      dadosAtualizacao.valorParcela = plano.valorParcela;

      dadosAtualizacao.quantidadeParcelas = plano.quantidadeParcelas;
    }

    const contrato = await ContratoRepository.atualizar(
      contratoAtual.id,
      dadosAtualizacao,
    );

    return contrato;
  }

  async excluir(id) {
    await this.buscarPorId(id);

    return await ContratoRepository.excluir(id);
  }
}

module.exports = new ContratoService();
