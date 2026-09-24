/* GoodMec — regras e dados do protótipo.
   Este arquivo não desenha a tela. Suas funções recebem o estado e alteram os dados.
   Separar as regras da interface facilita o estudo, os testes e o futuro back end. */
(function (global) {
  "use strict";

  // Constantes são listas de valores aceitos em todos os formulários.
  const ETAPAS = ["Recebido", "Em diagnóstico", "Aguardando aprovação", "Em reparo", "Em conferência"];
  const STATUS = [...ETAPAS, "Pronto para retirada", "Encerrado"];
  const COMPRAS = ["Não solicitada", "Solicitada", "Recebida"];
  const agora = () => new Date().toISOString();
  const copiar = (valor) => JSON.parse(JSON.stringify(valor));
  const exigir = (condicao, mensagem) => { if (!condicao) throw new Error(mensagem); };
  const texto = (valor) => String(valor ?? "").trim();
  const dataDiaValida = (valor) => /^\d{4}-\d{2}-\d{2}$/.test(valor) && Number.isFinite(Date.parse(valor + "T00:00:00Z")) && new Date(valor + "T00:00:00Z").toISOString().slice(0, 10) === valor;
  const obrigatorio = (valor, nome) => { const resultado = texto(valor); exigir(resultado, "Preencha " + nome + "."); return resultado; };
  const id = (estado, tipo) => tipo + (++estado.contador);
  const achar = (lista, chave) => { const item = lista.find((registro) => registro.id === chave); exigir(item, "Registro não encontrado."); return item; };
  const autor = (estado) => estado.config.operador || "Equipe GoodMec";

  function criarEstado() {
    return {
      versao: 1, contador: 0,
      config: { oficina: "GoodMec", telefone: "", endereco: "", operador: "Equipe GoodMec", equipe: [] },
      clientes: [], veiculos: [], ordens: [], agenda: [], lembretes: [], avisos: [], atendimentos: []
    };
  }

  // Telefones brasileiros são guardados com DDI; placas ficam sem espaço ou hífen.
  function telefone(valor) {
    let numero = texto(valor).replace(/\D/g, "");
    if (numero.length === 10 || numero.length === 11) numero = "55" + numero;
    exigir(/^55\d{10,11}$/.test(numero), "Informe um telefone brasileiro com DDD (10 ou 11 dígitos)." );
    return numero;
  }
  function placa(valor) {
    const resultado = texto(valor).toUpperCase().replace(/[\s-]/g, "");
    exigir(/^[A-Z]{3}\d[A-Z0-9]\d{2}$/.test(resultado), "Informe uma placa válida, como ABC1D23 ou ABC1234.");
    return resultado;
  }
  function registrarCliente(estado, dados, chave) {
    const nome = obrigatorio(dados.nome, "o nome do cliente");
    const numero = telefone(dados.telefone);
    exigir(!estado.clientes.some((c) => c.telefone === numero && c.id !== chave), "Este telefone já pertence a um cliente cadastrado.");
    if (chave) Object.assign(achar(estado.clientes, chave), { nome, telefone: numero, email: texto(dados.email) });
    else { chave = id(estado, "c"); estado.clientes.push({ id: chave, nome, telefone: numero, email: texto(dados.email) }); }
    return chave;
  }
  function registrarVeiculo(estado, dados, chave) {
    achar(estado.clientes, dados.clienteId);
    const identificacao = placa(dados.placa);
    exigir(!estado.veiculos.some((v) => v.placa === identificacao && v.id !== chave), "Esta placa já está cadastrada.");
    const km = Number(dados.km || 0);
    exigir(Number.isInteger(km) && km >= 0 && km <= 9999999, "A quilometragem precisa ser um número inteiro positivo ou zero.");
    const ano = texto(dados.ano);
    exigir(!ano || (/^\d{4}$/.test(ano) && Number(ano) >= 1900 && Number(ano) <= new Date().getFullYear() + 1), "Confira o ano do veículo.");
    const valores = { clienteId: dados.clienteId, modelo: obrigatorio(dados.modelo, "o modelo do veículo"), placa: identificacao, km, ano };
    if (chave) {
      const existente = achar(estado.veiculos, chave);
      exigir(existente.clienteId === dados.clienteId, "A alteração de proprietário ficará para uma etapa futura.");
      Object.assign(existente, valores);
    } else { chave = id(estado, "v"); estado.veiculos.push({ id: chave, ...valores }); }
    return chave;
  }
  function historico(estado, ordem, acao) {
    ordem.atualizadoEm = agora();
    ordem.historico.push({ quando: ordem.atualizadoEm, autor: autor(estado), acao });
  }
  function aviso(estado, ordem, mensagem) {
    estado.avisos.unshift({ id: id(estado, "n"), clienteId: ordem.clienteId, ordemId: ordem.id, quando: agora(), mensagem });
  }
  function criarOrdem(estado, dados) {
    const cliente = achar(estado.clientes, dados.clienteId);
    const veiculo = achar(estado.veiculos, dados.veiculoId);
    exigir(veiculo.clienteId === cliente.id, "Escolha um veículo deste cliente.");
    exigir(!estado.ordens.some((o) => o.veiculoId === veiculo.id && o.status !== "Encerrado"), "Este veículo já possui uma ordem em aberto.");
    const ordem = {
      id: id(estado, "o"), numero: Math.max(0, ...estado.ordens.map((o) => o.numero)) + 1,
      clienteId: cliente.id, veiculoId: veiculo.id, problema: obrigatorio(dados.problema, "o problema relatado"),
      tecnico: texto(dados.tecnico), previsao: texto(dados.previsao), entrada: agora(), atualizadoEm: agora(),
      status: "Recebido", esperaPeca: false, pausa: "", diagnostico: "", notaInterna: "", atualizacaoCliente: "",
      itens: [], orcamento: { versao: 0, situacao: "Rascunho", resposta: null }, versoesOrcamento: [],
      relatorio: null, rascunho: null, relatoriosAnteriores: [], anexos: [], historico: []
    };
    exigir(!ordem.previsao || Number.isFinite(Date.parse(ordem.previsao)), "Confira a previsão de entrega.");
    historico(estado, ordem, "Ordem aberta.");
    estado.ordens.unshift(ordem);
    return ordem.id;
  }
  function atualizarOrdem(estado, chave, dados) {
    const ordem = achar(estado.ordens, chave);
    exigir(!["Pronto para retirada", "Encerrado"].includes(ordem.status), "O serviço já foi concluído. Use a correção do relatório.");
    exigir(ETAPAS.includes(dados.status), "Situação inválida.");
    exigir(!dados.previsao || Number.isFinite(Date.parse(dados.previsao)), "Confira a previsão de entrega.");
    const anterior = ordem.status;
    Object.assign(ordem, { status: dados.status, tecnico: texto(dados.tecnico), previsao: texto(dados.previsao),
      esperaPeca: Boolean(dados.esperaPeca), pausa: texto(dados.pausa), diagnostico: texto(dados.diagnostico),
      notaInterna: texto(dados.notaInterna), atualizacaoCliente: texto(dados.atualizacaoCliente) });
    historico(estado, ordem, anterior === ordem.status ? "Informações do atendimento atualizadas." : anterior + " → " + ordem.status + ".");
  }
  // Valores monetários usam centavos inteiros para evitar erros como 0,1 + 0,2.
  function centavos(valor) {
    const numero = Number(String(valor).replace(",", "."));
    exigir(Number.isFinite(numero) && numero >= 0 && numero <= 10000000, "Informe um preço válido, maior ou igual a zero.");
    return Math.round(numero * 100);
  }
  const total = (itens) => itens.reduce((soma, item) => soma + Math.round(item.quantidade * item.unitario), 0);
  function salvarOrcamento(estado, chave, linhas) {
    const ordem = achar(estado.ordens, chave);
    exigir(!["Pronto para retirada", "Encerrado"].includes(ordem.status), "O orçamento fica fechado após a conclusão do serviço.");
    exigir(linhas.length > 0 && linhas.length <= 100, "Adicione pelo menos um item ao orçamento (máximo de 100).");
    const itens = linhas.map((linha) => {
      const quantidade = Number(linha.quantidade);
      exigir(Number.isFinite(quantidade) && quantidade > 0 && quantidade <= 9999, "Confira a quantidade de cada item.");
      exigir(["Serviço", "Peça"].includes(linha.tipo), "Tipo de item inválido.");
      const anterior = ordem.itens.find((item) => item.id === linha.id);
      const descricao = obrigatorio(linha.descricao, "a descrição de cada item");
      const mesmaPeca = anterior && anterior.tipo === linha.tipo && anterior.descricao === descricao && anterior.quantidade === quantidade;
      return { id: anterior ? anterior.id : id(estado, "i"), tipo: linha.tipo,
        descricao, quantidade,
        unitario: centavos(linha.preco), compra: mesmaPeca ? anterior.compra : "Não solicitada", previsaoPeca: mesmaPeca ? anterior.previsaoPeca : "" };
    });
    if (ordem.orcamento.versao) ordem.versoesOrcamento.push({ ...copiar(ordem.orcamento), itens: copiar(ordem.itens) });
    ordem.itens = itens;
    ordem.orcamento = { versao: ordem.orcamento.versao + 1, situacao: "Rascunho", resposta: null };
    historico(estado, ordem, "Orçamento versão " + ordem.orcamento.versao + " salvo. Uma nova versão exige nova aprovação.");
  }
  function solicitarAprovacao(estado, chave) {
    const ordem = achar(estado.ordens, chave);
    exigir(ETAPAS.includes(ordem.status) && ordem.itens.length && ordem.orcamento.situacao === "Rascunho", "Salve um orçamento em rascunho para solicitar aprovação.");
    ordem.orcamento.situacao = "Aguardando aprovação";
    ordem.status = "Aguardando aprovação";
    historico(estado, ordem, "Orçamento disponibilizado para aprovação (prévia local).");
    aviso(estado, ordem, "Seu orçamento está disponível para avaliação. Entre em contato com a oficina para aprovar os serviços.");
  }
  function responderOrcamento(estado, chave, resposta, observacao) {
    const ordem = achar(estado.ordens, chave);
    exigir(ordem.orcamento.situacao === "Aguardando aprovação", "Este orçamento não está aguardando uma resposta.");
    exigir(["Aprovado", "Recusado"].includes(resposta), "Resposta inválida.");
    ordem.orcamento.situacao = resposta;
    ordem.orcamento.resposta = { quando: agora(), autor: autor(estado), observacao: obrigatorio(observacao, "como a resposta do cliente foi recebida"), versao: ordem.orcamento.versao };
    historico(estado, ordem, "Resposta registrada: orçamento v" + ordem.orcamento.versao + " " + resposta.toLowerCase() + ".");
  }
  function atualizarCompra(estado, chave, itemId, compra, previsao) {
    const ordem = achar(estado.ordens, chave);
    const item = achar(ordem.itens, itemId);
    exigir(ordem.status !== "Encerrado" && item.tipo === "Peça" && COMPRAS.includes(compra), "Não foi possível atualizar esta peça.");
    exigir(!previsao || dataDiaValida(previsao), "Confira a data de chegada da peça.");
    item.compra = compra;
    item.previsaoPeca = previsao || "";
    historico(estado, ordem, "Peça " + item.descricao + ": " + compra + ".");
  }
  function salvarRelatorio(estado, chave, dados, concluir) {
    const ordem = achar(estado.ordens, chave);
    const relatorio = { trabalhos: texto(dados.trabalhos), pecas: texto(dados.pecas), conferencias: texto(dados.conferencias),
      recomendacoes: texto(dados.recomendacoes), responsavel: texto(dados.responsavel), retorno: texto(dados.retorno),
      incluirValores: Boolean(dados.incluirValores) && ordem.orcamento.situacao === "Aprovado" };
    if (!concluir) { exigir(!ordem.relatorio, "Um relatório concluído deve ser corrigido como nova versão."); ordem.rascunho = relatorio; historico(estado, ordem, "Rascunho do relatório salvo."); return; }
    obrigatorio(relatorio.trabalhos, "os serviços realizados");
    obrigatorio(relatorio.responsavel, "o responsável pelo serviço");
    exigir(!relatorio.retorno || (dataDiaValida(relatorio.retorno) && (relatorio.retorno === ordem.relatorio?.retorno || relatorio.retorno >= new Date().toLocaleDateString("sv-SE"))), "Escolha uma data futura ou de hoje para o retorno.");
    if (ordem.relatorio) ordem.relatoriosAnteriores.push(copiar(ordem.relatorio));
    relatorio.versao = (ordem.relatorio?.versao || 0) + 1;
    relatorio.quando = agora();
    relatorio.autor = autor(estado);
    relatorio.itensAprovados = relatorio.incluirValores ? copiar(ordem.itens) : [];
    relatorio.identificacao = { oficina: estado.config.oficina, telefone: estado.config.telefone, endereco: estado.config.endereco,
      cliente: copiar(achar(estado.clientes, ordem.clienteId)), veiculo: copiar(achar(estado.veiculos, ordem.veiculoId)),
      problema: ordem.problema, diagnostico: ordem.diagnostico, entrada: ordem.entrada, numero: ordem.numero };
    ordem.relatorio = relatorio;
    ordem.rascunho = null;
    ordem.concluidoEm = ordem.concluidoEm || relatorio.quando;
    if (ordem.status !== "Encerrado") {
      ordem.status = "Pronto para retirada";
      ordem.atualizacaoCliente = "Serviço concluído. O veículo está pronto para retirada.";
    }
    ordem.esperaPeca = false;
    ordem.pausa = "";
    historico(estado, ordem, "Relatório v" + relatorio.versao + (relatorio.versao === 1 ? " finalizado. Veículo pronto para retirada." : " corrigido. Versão anterior preservada."));
    if (relatorio.versao === 1) aviso(estado, ordem, "O serviço foi concluído e seu veículo está pronto para retirada. O relatório de serviço já está disponível.");
    // Um lembrete pertence à ordem. Corrigir o relatório atualiza esse lembrete.
    const lembreteAnterior = estado.lembretes.find((l) => l.ordemId === chave && l.data === relatorio.retorno);
    estado.lembretes = estado.lembretes.filter((l) => l.ordemId !== chave);
    if (relatorio.retorno) estado.lembretes.push({ id: lembreteAnterior?.id || id(estado, "l"), ordemId: chave, clienteId: ordem.clienteId, veiculoId: ordem.veiculoId,
      data: relatorio.retorno, mensagem: relatorio.recomendacoes || "Retorno para acompanhamento do serviço.", feito: lembreteAnterior?.feito || false });
  }
  function encerrarOrdem(estado, chave) {
    const ordem = achar(estado.ordens, chave);
    exigir(ordem.status === "Pronto para retirada" && ordem.relatorio, "Conclua o relatório antes de registrar a retirada.");
    ordem.status = "Encerrado";
    ordem.retiradoEm = agora();
    ordem.atualizacaoCliente = "O veículo foi entregue e o atendimento está encerrado.";
    historico(estado, ordem, "Retirada do veículo registrada. Ordem encerrada.");
  }
  function agendar(estado, dados) {
    const veiculo = achar(estado.veiculos, dados.veiculoId);
    exigir(veiculo.clienteId === dados.clienteId, "Confira o cliente e o veículo.");
    exigir(Number.isFinite(Date.parse(dados.inicio)) && Date.parse(dados.inicio) > Date.now(), "Escolha um horário futuro.");
    exigir(!estado.agenda.some((a) => Date.parse(a.inicio) === Date.parse(dados.inicio) && a.status !== "Cancelado"), "Já existe um agendamento neste horário.");
    estado.agenda.push({ id: id(estado, "a"), clienteId: dados.clienteId, veiculoId: dados.veiculoId, inicio: dados.inicio,
      descricao: obrigatorio(dados.descricao, "o motivo do agendamento"), status: "Solicitado" });
  }
  function adicionarAnexo(estado, chave, anexo) {
    const ordem = achar(estado.ordens, chave);
    exigir(ordem.anexos.length < 3, "Este protótipo aceita até três anexos por ordem.");
    exigir(/^data:(image\/(png|jpeg|webp)|application\/pdf);base64,[A-Za-z0-9+/=]+$/.test(anexo.dados) && anexo.dados.length <= 1400000, "Use uma imagem JPG, PNG, WebP ou PDF de até 1 MB.");
    ordem.anexos.push({ id: id(estado, "f"), nome: texto(anexo.nome), dados: anexo.dados, publico: Boolean(anexo.publico) });
    historico(estado, ordem, "Anexo adicionado: " + texto(anexo.nome) + (anexo.publico ? " (visível ao cliente)." : " (interno)."));
  }
  // A resposta do bot usa somente dados destinados ao cliente.
  function respostaBot(estado, clienteId, ordemId, assunto) {
    achar(estado.clientes, clienteId);
    const ordem = achar(estado.ordens, ordemId);
    exigir(ordem.clienteId === clienteId, "Esta ordem não pertence ao cliente selecionado.");
    const veiculo = achar(estado.veiculos, ordem.veiculoId);
    const data = (valor) => new Date(valor).toLocaleString("pt-BR");
    const prazo = ordem.status === "Encerrado" ? "Retirada: " + data(ordem.retiradoEm) + "." : ordem.status === "Pronto para retirada" ? "Conclusão: " + data(ordem.concluidoEm) + "." : "Previsão: " + (ordem.previsao ? data(ordem.previsao) + " (estimativa sujeita a alteração)." : "a confirmar com a oficina.");
    if (assunto === "status") return "Ordem " + String(ordem.numero).padStart(3, "0") + " • " + veiculo.modelo + "\nSituação: " + ordem.status +
      (ordem.esperaPeca ? "\nAguardando peça." : "") + (ordem.pausa ? "\nO atendimento está temporariamente em pausa. Fale com a oficina para saber mais." : "") +
      "\n" + (ordem.atualizacaoCliente || "Ainda não há uma atualização detalhada da oficina.") +
      "\n" + prazo +
      "\nÚltima atualização: " + data(ordem.atualizadoEm) + ".";
    if (assunto === "orcamento") {
      if (ordem.orcamento.situacao === "Rascunho") return "O orçamento ainda está em preparação. Fale com a oficina para mais informações.";
      const dinheiro = (valor) => (valor / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
      return "Orçamento v" + ordem.orcamento.versao + " — " + ordem.orcamento.situacao + "\n" + ordem.itens.map((i) => i.quantidade + " × " + i.descricao + ": " + dinheiro(Math.round(i.quantidade * i.unitario))).join("\n") + "\nTotal: " + dinheiro(total(ordem.itens)) + ".";
    }
    if (assunto === "relatorio") return ordem.relatorio ? "Serviços realizados: " + ordem.relatorio.trabalhos + "\nPeças utilizadas: " + (ordem.relatorio.pecas || "Não informadas") + "\nConferência: " + (ordem.relatorio.conferencias || "Não informada") + "\nRecomendações: " + (ordem.relatorio.recomendacoes || "Nenhuma registrada") : "O relatório ainda não foi concluído.";
    if (assunto === "humano") {
      if (!estado.atendimentos.some((a) => a.clienteId === clienteId && a.ordemId === ordemId && a.status === "Pendente")) estado.atendimentos.unshift({ id: id(estado, "h"), clienteId, ordemId, quando: agora(), status: "Pendente" });
      return "Pedido de atendimento registrado na fila local da oficina. Nesta demonstração, nenhuma mensagem é enviada pelo WhatsApp.";
    }
    return "Posso consultar a situação, o orçamento ou o relatório. Para outras dúvidas, escolha Falar com a oficina.";
  }

  // Importações são validadas antes de substituir os dados atuais.
  function validarEstado(dado) {
    exigir(dado && dado.versao === 1 && Number.isSafeInteger(dado.contador) && dado.contador >= 0 && dado.contador < 1000000000, "Formato de backup incompatível.");
    const colecoes = ["clientes", "veiculos", "ordens", "agenda", "lembretes", "avisos", "atendimentos"];
    for (const nome of colecoes) exigir(Array.isArray(dado[nome]) && dado[nome].length <= 10000, "Coleção inválida no backup: " + nome);
    exigir(dado.config && ["oficina", "telefone", "endereco", "operador"].every((k) => typeof dado.config[k] === "string") && Array.isArray(dado.config.equipe), "Configuração inválida.");
    exigir(dado.config.equipe.every((p) => typeof p.nome === "string" && ["Administrador", "Atendimento", "Mecânico"].includes(p.perfil)), "Equipe inválida.");
    const ids = new Set();
    for (const nome of colecoes) for (const registro of dado[nome]) {
      exigir(registro && typeof registro.id === "string" && /^[a-z]\d+$/.test(registro.id) && !ids.has(registro.id), "Identificador duplicado ou inválido.");
      exigir(Number(registro.id.slice(1)) <= dado.contador, "Contador inválido no backup."); ids.add(registro.id);
    }
    const temCliente = (chave) => dado.clientes.some((c) => c.id === chave);
    const temVeiculo = (chave, clienteId) => dado.veiculos.some((v) => v.id === chave && v.clienteId === clienteId);
    for (const c of dado.clientes) exigir(typeof c.nome === "string" && c.nome.trim() && /^55\d{10,11}$/.test(c.telefone) && typeof c.email === "string", "Cliente inválido.");
    exigir(new Set(dado.clientes.map((c) => c.telefone)).size === dado.clientes.length, "Telefones duplicados no backup.");
    for (const v of dado.veiculos) exigir(temCliente(v.clienteId) && typeof v.modelo === "string" && /^[A-Z]{3}\d[A-Z0-9]\d{2}$/.test(v.placa) && Number.isInteger(v.km) && v.km >= 0 && typeof v.ano === "string", "Veículo inválido.");
    exigir(new Set(dado.veiculos.map((v) => v.placa)).size === dado.veiculos.length, "Placas duplicadas no backup.");
    const relatorioValido = (r) => r && ["trabalhos", "pecas", "conferencias", "recomendacoes", "responsavel", "retorno"].every((k) => typeof r[k] === "string") && typeof r.incluirValores === "boolean";
    const itemValido = (i) => i && typeof i.id === "string" && typeof i.descricao === "string" && ["Serviço", "Peça"].includes(i.tipo) && Number.isFinite(i.quantidade) && i.quantidade > 0 && i.quantidade <= 9999 && Number.isSafeInteger(i.unitario) && i.unitario >= 0 && i.unitario <= 1000000000 && COMPRAS.includes(i.compra) && typeof i.previsaoPeca === "string";
    const orcamentoValido = (v) => v && Number.isInteger(v.versao) && v.versao >= 0 && ["Rascunho", "Aguardando aprovação", "Aprovado", "Recusado"].includes(v.situacao) && (!["Aprovado", "Recusado"].includes(v.situacao) || (v.resposta && v.resposta.versao === v.versao && typeof v.resposta.autor === "string" && typeof v.resposta.observacao === "string" && Number.isFinite(Date.parse(v.resposta.quando))));
    const relatorioFinalValido = (r) => {
      const i = r?.identificacao;
      return relatorioValido(r) && r.trabalhos.trim() && r.responsavel.trim() && Number.isInteger(r.versao) && r.versao > 0 && Number.isFinite(Date.parse(r.quando)) && typeof r.autor === "string" &&
        Array.isArray(r.itensAprovados) && r.itensAprovados.every(itemValido) && i && ["oficina", "telefone", "endereco", "problema", "diagnostico"].every((k) => typeof i[k] === "string") &&
        Number.isInteger(i.numero) && Number.isFinite(Date.parse(i.entrada)) && i.cliente && typeof i.cliente.nome === "string" && typeof i.cliente.telefone === "string" &&
        i.veiculo && typeof i.veiculo.modelo === "string" && typeof i.veiculo.placa === "string" && Number.isInteger(i.veiculo.km) && i.veiculo.km >= 0;
    };
    for (const o of dado.ordens) {
      exigir(temCliente(o.clienteId) && temVeiculo(o.veiculoId, o.clienteId) && STATUS.includes(o.status) && Number.isSafeInteger(o.numero) && o.numero > 0, "Ordem inválida.");
      exigir(["problema", "tecnico", "previsao", "diagnostico", "notaInterna", "atualizacaoCliente", "pausa"].every((k) => typeof o[k] === "string") && typeof o.esperaPeca === "boolean", "Campos da ordem inválidos.");
      exigir(Number.isFinite(Date.parse(o.entrada)) && Number.isFinite(Date.parse(o.atualizadoEm)) && (!o.previsao || Number.isFinite(Date.parse(o.previsao))), "Datas da ordem inválidas.");
      exigir(Array.isArray(o.itens) && o.itens.length <= 100 && o.itens.every(itemValido), "Itens de orçamento inválidos.");
      exigir(orcamentoValido(o.orcamento), "Orçamento inválido.");
      exigir(Array.isArray(o.historico) && o.historico.every((h) => typeof h.acao === "string" && typeof h.autor === "string" && Number.isFinite(Date.parse(h.quando))), "Histórico inválido.");
      exigir(Array.isArray(o.versoesOrcamento) && o.versoesOrcamento.every((v) => orcamentoValido(v) && Array.isArray(v.itens) && v.itens.every(itemValido)) && Array.isArray(o.relatoriosAnteriores) && o.relatoriosAnteriores.every(relatorioFinalValido), "Versões inválidas.");
      exigir(!o.rascunho || relatorioValido(o.rascunho), "Rascunho inválido.");
      exigir(!o.relatorio || relatorioFinalValido(o.relatorio), "Relatório inválido.");
      exigir(!["Pronto para retirada", "Encerrado"].includes(o.status) || o.relatorio, "Ordem concluída sem relatório.");
      exigir(!o.relatorio || (Number.isFinite(Date.parse(o.concluidoEm)) && Date.parse(o.concluidoEm) >= Date.parse(o.entrada)), "Data de conclusão inválida.");
      exigir(o.status !== "Encerrado" || Number.isFinite(Date.parse(o.retiradoEm)), "Data de retirada inválida.");
      exigir(Array.isArray(o.anexos) && o.anexos.length <= 3 && o.anexos.every((a) => typeof a.id === "string" && typeof a.nome === "string" && typeof a.publico === "boolean" && typeof a.dados === "string" && a.dados.length <= 1400000 && /^data:(image\/(png|jpeg|webp)|application\/pdf);base64,[A-Za-z0-9+/=]+$/.test(a.dados)), "Anexo inválido.");
      for (const registro of [...o.itens, ...o.anexos]) {
        exigir(/^[if]\d+$/.test(registro.id) && !ids.has(registro.id) && Number(registro.id.slice(1)) <= dado.contador, "Identificador interno inválido.");
        ids.add(registro.id);
      }
    }
    exigir(new Set(dado.ordens.map((o) => o.numero)).size === dado.ordens.length, "Números de ordem duplicados.");
    const veiculosEmAtendimento = dado.ordens.filter((o) => o.status !== "Encerrado").map((o) => o.veiculoId);
    exigir(new Set(veiculosEmAtendimento).size === veiculosEmAtendimento.length, "Veículo com mais de uma ordem aberta.");
    for (const a of dado.agenda) exigir(temVeiculo(a.veiculoId, a.clienteId) && Number.isFinite(Date.parse(a.inicio)) && typeof a.descricao === "string" && ["Solicitado", "Confirmado", "Atendido", "Cancelado"].includes(a.status), "Agendamento inválido.");
    for (const l of dado.lembretes) exigir(temVeiculo(l.veiculoId, l.clienteId) && /^\d{4}-\d{2}-\d{2}$/.test(l.data) && typeof l.mensagem === "string" && typeof l.feito === "boolean", "Lembrete inválido.");
    for (const a of [...dado.avisos, ...dado.atendimentos]) exigir(temCliente(a.clienteId) && dado.ordens.some((o) => o.id === a.ordemId && o.clienteId === a.clienteId) && Number.isFinite(Date.parse(a.quando)), "Atendimento ou aviso inválido.");
    exigir(dado.avisos.every((a) => typeof a.mensagem === "string") && dado.atendimentos.every((a) => ["Pendente", "Resolvido"].includes(a.status)), "Conteúdo de atendimento inválido.");
    return copiar(dado);
  }

  // Dados fictícios são carregados somente quando a pessoa escolhe explorar a demonstração.
  function exemplos(estado) {
    exigir(!estado.clientes.length && !estado.ordens.length, "Os exemplos só podem ser carregados em uma base vazia.");
    const dados = [["Marina Silva", "11900000001", "Honda Fit", "ABC1D23", "Ruído ao frear"], ["Carlos Lima", "11900000002", "Volkswagen Gol", "DEF4G56", "Revisão e troca de óleo"], ["Ana Costa", "11900000003", "Chevrolet Onix", "HIJ7K89", "Verificação do ar-condicionado"]];
    dados.forEach((d, indice) => {
      const clienteId = registrarCliente(estado, { nome: d[0], telefone: d[1] });
      const veiculoId = registrarVeiculo(estado, { clienteId, modelo: d[2], placa: d[3], ano: "2020", km: 45000 + indice * 10000 });
      const chave = criarOrdem(estado, { clienteId, veiculoId, problema: d[4], tecnico: "Equipe GoodMec", previsao: new Date(Date.now() + 86400000).toISOString() });
      const ordem = achar(estado.ordens, chave);
      ordem.demonstracao = true;
      ordem.status = indice === 0 ? "Em diagnóstico" : "Em reparo";
      ordem.atualizacaoCliente = indice === 0 ? "Estamos realizando a inspeção do sistema de freios." : "O serviço está em andamento.";
      salvarOrcamento(estado, chave, [{ tipo: "Serviço", descricao: "Mão de obra", quantidade: 1, preco: 180 }, { tipo: "Peça", descricao: indice === 0 ? "Pastilhas de freio" : "Materiais de revisão", quantidade: 1, preco: 240 }]);
      if (indice === 0) solicitarAprovacao(estado, chave);
      if (indice === 1) { ordem.esperaPeca = true; ordem.itens[1].compra = "Solicitada"; }
      if (indice === 2) salvarRelatorio(estado, chave, { trabalhos: "Inspeção e limpeza do sistema de ar-condicionado.", pecas: "Filtro de cabine.", conferencias: "Funcionamento e temperatura de saída conferidos.", responsavel: "Equipe GoodMec", recomendacoes: "Reavaliar o filtro na próxima revisão." }, true);
    });
  }
  const API = { ETAPAS, STATUS, COMPRAS, criarEstado, validarEstado, registrarCliente, registrarVeiculo, criarOrdem, atualizarOrdem,
    salvarOrcamento, solicitarAprovacao, responderOrcamento, atualizarCompra, salvarRelatorio, encerrarOrdem, agendar, adicionarAnexo,
    respostaBot, total, centavos, exemplos, achar, historico, copiar };
  if (typeof module !== "undefined" && module.exports) module.exports = API; // Permite testar as mesmas regras com Node.js.
  else global.GoodMec = API; // Disponibiliza as regras aos outros scripts da página.
})(typeof window !== "undefined" ? window : globalThis);
