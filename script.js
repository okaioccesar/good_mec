/* GoodMec — interface em JavaScript puro.
   Leia por etapas: utilidades → telas → formulários → eventos.
   modelo.js contém as regras; este arquivo transforma os dados em elementos HTML. */
"use strict";
const M = window.GoodMec;
const CHAVE = "goodmec.v1";
const $ = (seletor) => document.querySelector(seletor);
let estado = M.criarEstado();
let backupIlegivel = "";
let pagina = "painel";
let conversa = [];
let temporizadorToast;
let dadosNaoSalvos = false;

// Etapa 1: ler a base local. Um arquivo corrompido nunca é sobrescrito automaticamente.
try {
  const salvo = localStorage.getItem(CHAVE);
  if (salvo) {
    try { estado = M.validarEstado(JSON.parse(salvo)); }
    catch (erro) { backupIlegivel = salvo; $("#situacao-dados").textContent = "Não foi possível ler os dados salvos. Exporte a cópia de recuperação em Oficina e equipe. Esta sessão não será salva."; }
  }
} catch (erro) { $("#situacao-dados").textContent = "O navegador bloqueou o armazenamento. Exporte seus dados antes de sair."; }

// Etapa 2: funções pequenas, reutilizadas pelas telas.
function h(valor) {
  // Escapar os caracteres impede que um texto digitado seja interpretado como HTML.
  return String(valor ?? "").replace(/[&<>"']/g, (caractere) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[caractere]));
}
const dinheiro = (valor) => (valor / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const data = (valor, hora = true) => !valor ? "Não informada" : new Date(valor.length === 10 ? valor + "T12:00:00" : valor).toLocaleString("pt-BR", hora ? { dateStyle: "short", timeStyle: "short" } : { dateStyle: "short" });
const numero = (ordem) => String(ordem.numero).padStart(3, "0");
const cliente = (chave) => M.achar(estado.clientes, chave);
const veiculo = (chave) => M.achar(estado.veiculos, chave);
const ordem = (chave) => M.achar(estado.ordens, chave);
const encerrada = (o) => ["Pronto para retirada", "Encerrado"].includes(o.status);
const atrasada = (o) => !encerrada(o) && o.previsao && Date.parse(o.previsao) < Date.now();
const textoBusca = (valor) => String(valor).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const localData = (valor) => { if (!valor) return ""; const d = new Date(valor); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16); };
const opcoes = (valores, selecionado) => valores.map((v) => `<option value="${h(v)}" ${v === selecionado ? "selected" : ""}>${h(v)}</option>`).join("");
const botao = (rotulo, acao, chave = "", classe = "secundario") => `<button type="button" class="${classe}" data-acao="${acao}" data-id="${h(chave)}">${h(rotulo)}</button>`;
function selo(situacao) {
  const cor = ["Pronto para retirada", "Aprovado", "Recebida", "Confirmado", "Resolvido", "Atendido"].includes(situacao) ? "verde" : ["Aguardando aprovação", "Solicitada", "Solicitado", "Pendente"].includes(situacao) ? "amarelo" : ["Recusado", "Cancelado"].includes(situacao) ? "vermelho" : "";
  return `<span class="selo ${cor}">${h(situacao)}</span>`;
}
const vazio = (titulo, descricao, acao = "") => `<div class="vazio"><span class="vazio-icone" aria-hidden="true">＋</span><h3>${h(titulo)}</h3><p>${h(descricao)}</p>${acao}</div>`;
const campo = (rotulo, nome, valor = "", tipo = "text", extra = "") => `<label>${h(rotulo)}<input name="${nome}" type="${tipo}" value="${h(valor)}" ${extra}></label>`;
const area = (rotulo, nome, valor = "", extra = "") => `<label>${h(rotulo)}<textarea name="${nome}" rows="3" ${extra}>${h(valor)}</textarea></label>`;
const textoLongo = (valor) => `<p class="preservar">${h(valor || "Não informado.")}</p>`;
function toast(mensagem, erro = false) {
  clearTimeout(temporizadorToast);
  $("#toast").textContent = mensagem;
  $("#toast").classList.toggle("toast-erro", erro);
  $("#toast").hidden = false;
  temporizadorToast = setTimeout(() => { $("#toast").hidden = true; }, 5000);
}
function falhar(erro) {
  if ($("#modal").open) { $("#erro-modal").textContent = erro.message; $("#erro-modal").hidden = false; $("#erro-modal").scrollIntoView({ block: "nearest" }); }
  else toast(erro.message, true);
}
function guardar() {
  try {
    if (backupIlegivel) throw new Error("recuperação");
    localStorage.setItem(CHAVE, JSON.stringify(estado));
    dadosNaoSalvos = false;
    $("#situacao-dados").textContent = "Salvo neste navegador • Exporte uma cópia em Oficina e equipe.";
    $("#situacao-dados").parentElement.classList.remove("nao-salvo");
    return true;
  } catch (erro) {
    dadosNaoSalvos = true;
    $("#situacao-dados").textContent = backupIlegivel ? "Dados antigos precisam de recuperação. Esta sessão não será salva; exporte a cópia em Oficina e equipe." : "Alterações apenas nesta sessão: não foi possível salvar. Exporte uma cópia antes de fechar a página.";
    $("#situacao-dados").parentElement.classList.add("nao-salvo");
    return false;
  }
}
function alterar(funcao, mensagem) {
  // Trabalhar em uma cópia evita alterações pela metade quando uma validação falha.
  const copia = M.copiar(estado);
  const resultado = funcao(copia);
  estado = copia;
  const salvo = guardar();
  renderizar();
  toast(salvo ? mensagem : mensagem + " Exporte uma cópia: o navegador não salvou.", !salvo);
  return resultado;
}
function confirmarSaida() {
  return $("#modal").dataset.sujo !== "sim" || confirm("Há alterações não salvas nesta janela. Deseja descartá-las?");
}
function abrir(titulo, conteudo, subtitulo = "GOODMEC", larga = false) {
  if ($("#modal").open && !confirmarSaida()) return false;
  $("#modal-titulo").textContent = titulo;
  $("#modal-subtitulo").textContent = subtitulo;
  $("#modal-corpo").innerHTML = conteudo;
  $("#erro-modal").hidden = true;
  $("#modal").dataset.sujo = "";
  $("#modal").classList.toggle("modal-larga", larga);
  if (!$("#modal").open) $("#modal").showModal();
  $("#modal-titulo").focus();
  return true;
}
function fechar() {
  if (confirmarSaida()) { $("#modal").close(); $("#modal").dataset.sujo = ""; }
}
function salvoModal() { $("#modal").dataset.sujo = ""; $("#modal").close(); }
const rodapeForm = (texto = "Salvar") => `<div class="rodape-form">${botao("Cancelar", "fechar-modal")}<button type="submit" class="primario">${h(texto)}</button></div>`;
const TITULOS = { painel: "Visão geral", ordens: "Ordens de serviço", clientes: "Clientes e veículos", agenda: "Agenda e retornos", pecas: "Peças e compras", atendimento: "Atendimento", relatorios: "Indicadores", configuracoes: "Oficina e equipe" };
function navegar(destino) {
  pagina = TITULOS[destino] ? destino : "painel";
  document.querySelectorAll(".pagina").forEach((secao) => { secao.hidden = secao.id !== "pagina-" + pagina; });
  document.querySelectorAll("[data-pagina]").forEach((b) => { if (b.dataset.pagina === pagina) b.setAttribute("aria-current", "page"); else b.removeAttribute("aria-current"); });
  $("#titulo-pagina").textContent = TITULOS[pagina];
  document.title = "GoodMec | " + TITULOS[pagina];
  renderizar();
}

// Etapa 3: visões gerais. As métricas sempre são calculadas a partir das ordens atuais.
function metricas() {
  return [
    ["Em andamento", estado.ordens.filter((o) => !encerrada(o)).length, "Serviços em aberto"],
    ["Aguardando aprovação", estado.ordens.filter((o) => o.orcamento.situacao === "Aguardando aprovação" && !encerrada(o)).length, "Orçamentos pendentes"],
    ["Prontos para retirada", estado.ordens.filter((o) => o.status === "Pronto para retirada").length, "Veículos liberados"],
    ["Previsão vencida", estado.ordens.filter(atrasada).length, "Atendimentos para revisar"]
  ].map((m, i) => `<article class="metrica metrica-${i}"><p>${m[0]}</p><strong>${m[1]}</strong><span>${m[2]}</span></article>`).join("");
}
function cartaoOrdem(o, compacto = false) {
  const c = cliente(o.clienteId), v = veiculo(o.veiculoId);
  return `<article class="ordem-cartao"><div class="entre"><span class="codigo">OS #${numero(o)} ${o.demonstracao ? "· EXEMPLO" : ""}</span>${selo(o.status)}</div>
    <h3>${h(v.modelo)}</h3><p class="placa">${h(v.placa)} <span>· ${h(c.nome)}</span></p>
    ${compacto ? "" : `<p class="resumo-problema">${h(o.problema)}</p>`}
    <div class="detalhe-pequeno"><span>Responsável</span><strong>${h(o.tecnico || "A definir")}</strong></div>
    <div class="detalhe-pequeno"><span>Previsão</span><strong class="${atrasada(o) ? "texto-alerta" : ""}">${o.previsao ? data(o.previsao) : "A confirmar"}</strong></div>
    <div class="entre fim-cartao"><div>${o.esperaPeca ? '<span class="selo amarelo">Aguardando peça</span>' : ""}${o.pausa ? '<span class="selo amarelo">Em pausa</span>' : ""}</div>${botao("Abrir ordem →", "abrir-ordem", o.id, "botao-link")}</div></article>`;
}
function renderPainel() {
  const abertas = estado.ordens.filter((o) => o.status !== "Encerrado");
  const proximos = estado.agenda.filter((a) => ["Solicitado", "Confirmado"].includes(a.status)).sort((a,b) => a.inicio.localeCompare(b.inicio)).slice(0, 3);
  $("#painel-conteudo").innerHTML = `<div class="boas-vindas"><div><p class="sobretitulo">CADA SERVIÇO TEM SEU PRÓXIMO PASSO</p><h2>Mais organização.<br>Mais tempo para a oficina.</h2><p>O dia começa aqui. Veja o que precisa da sua atenção.</p></div><div class="marca-g" aria-hidden="true">G<span>GOODMEC</span></div></div>
    <div class="metricas">${metricas()}</div>
    <div class="cabecalho-secao"><div><h2>Na oficina agora</h2><p>Atualize o andamento e mantenha o cliente informado.</p></div>${botao("Ver todas as ordens →", "ir-ordens", "", "botao-link")}</div>
    ${abertas.length ? `<div class="grade-ordens">${abertas.slice(0, 4).map((o) => cartaoOrdem(o, true)).join("")}</div>` : vazio("Sua oficina começa por aqui", "Cadastre um atendimento ou explore o fluxo com dados fictícios.", botao("Cadastrar primeira ordem", "nova-ordem", "", "primario") + (!estado.clientes.length ? botao("Explorar com exemplos", "exemplos") : ""))}
    <div class="duas-colunas espaco-topo"><section class="cartao"><div class="entre"><h3>Próximos atendimentos</h3>${botao("Abrir agenda", "ir-agenda", "", "botao-link")}</div>${proximos.length ? proximos.map((a) => `<div class="linha-registro"><strong>${h(veiculo(a.veiculoId).modelo)}</strong><p>${data(a.inicio)} · ${h(cliente(a.clienteId).nome)}</p>${selo(a.status)}</div>`).join("") : '<p class="texto-suave">Os próximos horários agendados aparecerão aqui.</p>'}</section>
    <section class="cartao destaque"><p class="sobretitulo">ATENDIMENTO CONECTADO</p><h3>Uma resposta rápida faz diferença.</h3><p>Teste como o cliente poderá consultar o serviço. O simulador lê as atualizações públicas da ordem.</p>${botao("Experimentar o atendimento →", "ir-atendimento", "", "secundario")}</section></div>`;
}
function renderOrdens() {
  const busca = textoBusca($("#busca-ordens").value), status = $("#filtro-status").value, atencao = $("#filtro-atencao").value;
  const lista = estado.ordens.filter((o) => {
    const c = cliente(o.clienteId), v = veiculo(o.veiculoId);
    return textoBusca(numero(o) + " " + c.nome + " " + v.modelo + " " + v.placa).includes(busca) &&
      (!status || o.status === status) && (!atencao || (atencao === "atraso" && atrasada(o)) || (atencao === "peca" && o.esperaPeca) || (atencao === "aprovacao" && o.orcamento.situacao === "Aguardando aprovação"));
  });
  $("#contagem-ordens").textContent = lista.length + (lista.length === 1 ? " ordem encontrada" : " ordens encontradas");
  $("#lista-ordens").innerHTML = lista.length ? lista.map((o) => cartaoOrdem(o)).join("") : vazio("Nenhuma ordem por aqui", "Cadastre um atendimento ou ajuste os filtros.", botao("Nova ordem", "nova-ordem", "", "primario"));
}
function renderClientes() {
  const busca = textoBusca($("#busca-clientes").value);
  const lista = estado.clientes.filter((c) => textoBusca(c.nome + " " + c.telefone + " " + estado.veiculos.filter((v) => v.clienteId === c.id).map((v) => v.modelo + " " + v.placa).join(" ")).includes(busca));
  $("#lista-clientes").innerHTML = lista.length ? lista.map((c) => {
    const carros = estado.veiculos.filter((v) => v.clienteId === c.id);
    return `<article class="cartao"><div class="entre"><div class="pessoa"><span class="avatar">${h(c.nome.slice(0,1).toUpperCase())}</span><div><h3>${h(c.nome)}</h3><p>${h(c.telefone)}</p></div></div>${botao("Editar", "editar-cliente", c.id, "botao-link")}</div><p class="texto-suave">${h(c.email || "E-mail não informado")}</p>
      ${carros.map((v) => `<div class="veiculo-linha"><div><strong>${h(v.modelo)}</strong><p>${h(v.placa)} · ${v.km.toLocaleString("pt-BR")} km</p></div><div class="acoes">${botao("Histórico", "historico-veiculo", v.id, "botao-link")}${botao("Editar", "editar-veiculo", v.id, "botao-link")}</div></div>`).join("") || '<p class="texto-suave">Nenhum veículo cadastrado.</p>'}
      ${botao("+ Adicionar veículo", "novo-veiculo", c.id, "secundario")}</article>`;
  }).join("") : vazio("Clientes e veículos, juntos", "Comece pelo cadastro do cliente e depois adicione seus veículos.", botao("Cadastrar cliente", "novo-cliente", "", "primario"));
}
function renderAgenda() {
  const lista = [...estado.agenda].sort((a,b) => a.inicio.localeCompare(b.inicio));
  $("#lista-agenda").innerHTML = lista.length ? lista.map((a) => `<div class="linha-registro"><div class="entre"><strong>${data(a.inicio)}</strong>${selo(a.status)}</div><p>${h(cliente(a.clienteId).nome)} · ${h(veiculo(a.veiculoId).modelo)}</p><p>${h(a.descricao)}</p><div class="acoes">${a.status === "Solicitado" ? botao("Confirmar horário", "confirmar-agenda", a.id) : ""}${a.status === "Confirmado" ? botao("Marcar atendido", "atender-agenda", a.id) : ""}${["Solicitado", "Confirmado"].includes(a.status) ? botao("Cancelar horário", "cancelar-agenda", a.id, "botao-link perigo") : ""}</div></div>`).join("") : '<p class="texto-suave">Nenhum horário agendado.</p>';
  $("#lista-lembretes").innerHTML = estado.lembretes.length ? [...estado.lembretes].sort((a,b) => a.data.localeCompare(b.data)).map((l) => `<div class="linha-registro"><div class="entre"><strong>${data(l.data, false)}</strong>${selo(l.feito ? "Resolvido" : "Pendente")}</div><p>${h(cliente(l.clienteId).nome)} · ${h(veiculo(l.veiculoId).modelo)}</p><p>${h(l.mensagem)}</p>${!l.feito ? botao("Marcar acompanhamento feito", "resolver-lembrete", l.id) : ""}</div>`).join("") : '<p class="texto-suave">Nenhum retorno recomendado.</p>';
}
function renderPecas() {
  const linhas = estado.ordens.flatMap((o) => o.itens.filter((i) => i.tipo === "Peça").map((item) => ({ o, item })));
  $("#lista-pecas").innerHTML = linhas.length ? `<div class="tabela-container"><table><caption class="sr-only">Peças incluídas nos orçamentos</caption><thead><tr><th>Peça / veículo</th><th>Quantidade</th><th>Compra</th><th>Chegada prevista</th><th>Ação</th></tr></thead><tbody>${linhas.map(({o,item}) => `<tr><td><strong>${h(item.descricao)}</strong><small>OS #${numero(o)} · ${h(veiculo(o.veiculoId).modelo)}</small></td><td>${item.quantidade}</td><td>${selo(item.compra)}</td><td>${item.previsaoPeca ? data(item.previsaoPeca, false) : "A confirmar"}</td><td>${o.status !== "Encerrado" ? `<button type="button" class="secundario" data-acao="editar-compra" data-id="${h(o.id)}" data-item="${h(item.id)}">Atualizar</button>` : "Ordem encerrada"}</td></tr>`).join("")}</tbody></table></div>` : vazio("Tudo pronto para acompanhar suas peças", "Adicione itens do tipo Peça no orçamento de uma ordem.", botao("Abrir ordens", "ir-ordens", "", "primario"));
}
function renderIndicadores() {
  const concluidas = estado.ordens.filter((o) => o.concluidoEm);
  const horas = concluidas.length ? concluidas.reduce((s, o) => s + (Date.parse(o.concluidoEm) - Date.parse(o.entrada)) / 3600000, 0) / concluidas.length : 0;
  const aprovado = estado.ordens.filter((o) => o.orcamento.situacao === "Aprovado").reduce((s,o) => s + M.total(o.itens), 0);
  $("#indicadores-conteudo").innerHTML = `<div class="cabecalho-secao"><div><h2>Entenda o ritmo da oficina.</h2><p>Indicadores calculados com todos os registros desta base local.</p></div></div><div class="metricas">${metricas()}</div>
    <div class="duas-colunas"><section class="cartao"><h3>Distribuição dos serviços</h3><div class="barras">${M.STATUS.map((s) => { const qtd = estado.ordens.filter((o) => o.status === s).length; return `<div><div class="entre"><span>${h(s)}</span><strong>${qtd}</strong></div><progress max="${Math.max(estado.ordens.length, 1)}" value="${qtd}" aria-label="${h(s)}"></progress></div>`; }).join("")}</div></section>
    <section class="cartao"><h3>Resultados do atendimento</h3><dl class="numeros"><dt>Serviços concluídos</dt><dd>${concluidas.length}</dd><dt>Tempo médio até a conclusão</dt><dd>${concluidas.length ? horas.toLocaleString("pt-BR", { maximumFractionDigits: 1 }) + " h" : "—"}</dd><dt>Orçamentos aprovados</dt><dd>${dinheiro(aprovado)}</dd><dt>Pedidos de atendimento pendentes</dt><dd>${estado.atendimentos.filter((a) => a.status === "Pendente").length}</dd></dl><p class="texto-suave">O valor aprovado representa orçamentos, não pagamentos recebidos. Os tempos são corridos, sem desconto de fins de semana.</p></section></div>`;
}
function renderConfiguracoes() {
  $("#recuperar-originais").hidden = !backupIlegivel;
  if ($("#form-config").dataset.sujo !== "sim") Object.entries(estado.config).forEach(([nome, valor]) => { const input = $("#form-config").elements.namedItem(nome); if (input) input.value = valor; });
  $("#lista-equipe").innerHTML = estado.config.equipe.length ? estado.config.equipe.map((p) => `<div class="entre linha-registro"><strong>${h(p.nome)}</strong>${selo(p.perfil)}</div>`).join("") : '<p class="texto-suave">Adicione os nomes para atribuir os serviços.</p>';
}
function renderizar() {
  ({ painel: renderPainel, ordens: renderOrdens, clientes: renderClientes, agenda: renderAgenda, pecas: renderPecas, atendimento: renderAtendimento, relatorios: renderIndicadores, configuracoes: renderConfiguracoes })[pagina]();
}


// Etapa 4: formulários de cadastro. O atributo name liga cada campo ao FormData.
function selectClientes(nome, selecionado = "") {
  return `<select name="${nome}" required><option value="">Selecione um cliente</option>${estado.clientes.map((c) => `<option value="${h(c.id)}" ${c.id === selecionado ? "selected" : ""}>${h(c.nome)} · ${h(c.telefone)}</option>`).join("")}</select>`;
}
function opcoesVeiculos(clienteId, selecionado = "") {
  return '<option value="">Selecione um veículo</option>' + estado.veiculos.filter((v) => v.clienteId === clienteId).map((v) => `<option value="${h(v.id)}" ${v.id === selecionado ? "selected" : ""}>${h(v.modelo)} · ${h(v.placa)}</option>`).join("");
}
function campoTecnico(valor = "") {
  return `<label>Responsável pelo serviço<input name="tecnico" list="nomes-equipe" value="${h(valor)}" maxlength="80"><datalist id="nomes-equipe">${estado.config.equipe.map((p) => `<option value="${h(p.nome)}"></option>`).join("")}</datalist></label>`;
}
function novoCliente(chave = "") {
  const c = chave ? cliente(chave) : {};
  abrir(chave ? "Editar cliente" : "Cadastrar cliente", `<form id="form-cliente" data-id="${h(chave)}">${campo("Nome completo", "nome", c.nome, "text", 'required maxlength="100"')}${campo("WhatsApp com DDD", "telefone", c.telefone, "tel", 'required maxlength="20" placeholder="(11) 99999-9999"')}${campo("E-mail (opcional)", "email", c.email, "email", 'maxlength="150"')}${rodapeForm("Salvar cliente")}</form>`, "CLIENTES E VEÍCULOS");
}
function novoVeiculo(clienteId = "", chave = "") {
  if (!estado.clientes.length) { toast("Cadastre um cliente antes de adicionar seu veículo."); novoCliente(); return; }
  const v = chave ? veiculo(chave) : {};
  abrir(chave ? "Editar veículo" : "Cadastrar veículo", `<form id="form-veiculo" data-id="${h(chave)}"><label>Proprietário${selectClientes("clienteId", v.clienteId || clienteId)}</label>${campo("Modelo do veículo", "modelo", v.modelo, "text", 'required maxlength="100" placeholder="Ex.: Honda Fit 1.5"')}<div class="grade-formulario">${campo("Placa", "placa", v.placa, "text", 'required maxlength="8" placeholder="ABC1D23"')}${campo("Ano (opcional)", "ano", v.ano, "number", 'min="1900" max="' + (new Date().getFullYear() + 1) + '"')}${campo("Quilometragem", "km", v.km || 0, "number", 'min="0" max="9999999" step="1" required')}</div>${rodapeForm("Salvar veículo")}</form>`, "CLIENTES E VEÍCULOS");
  if (chave && $("#form-veiculo")) $("#form-veiculo [name=clienteId]").disabled = true;
}
function novaOrdem() {
  const novo = !estado.clientes.length;
  abrir("Abrir ordem de serviço", `<form id="form-ordem">
    <p class="texto-suave">Registre a entrada do veículo. O atendimento começará como Recebido.</p>
    <label>Como deseja cadastrar?<select id="modo-cliente"><option value="existente" ${!novo ? "selected" : ""}>Usar cliente e veículo cadastrados</option><option value="novo" ${novo ? "selected" : ""}>Cadastrar novo cliente e veículo</option></select></label>
    <fieldset id="cliente-existente" ${novo ? "hidden disabled" : ""}><legend>Cliente e veículo</legend><label>Cliente${selectClientes("clienteId")}</label><label>Veículo<select name="veiculoId" required>${opcoesVeiculos("")}</select></label><p class="texto-suave">Para adicionar um veículo a um cliente existente, use Clientes e veículos.</p></fieldset>
    <fieldset id="cliente-novo" ${novo ? "" : "hidden disabled"}><legend>Primeiro atendimento</legend><div class="grade-formulario">
      ${campo("Nome do cliente", "novoNome", "", "text", 'required maxlength="100"')}${campo("WhatsApp com DDD", "novoTelefone", "", "tel", 'required maxlength="20"')}
      ${campo("Veículo / modelo", "novoModelo", "", "text", 'required maxlength="100"')}${campo("Placa", "novaPlaca", "", "text", 'required maxlength="8" placeholder="ABC1D23"')}
      ${campo("Quilometragem", "novoKm", 0, "number", 'min="0" max="9999999" step="1" required')}
    </div></fieldset>
    ${area("Problema relatado pelo cliente", "problema", "", 'required maxlength="3000"')}
    <div class="grade-formulario">${campoTecnico()}${campo("Previsão de conclusão (opcional)", "previsao", "", "datetime-local")}</div>
    ${rodapeForm("Abrir atendimento")}</form>`, "RECEPÇÃO", true);
}
function novoAgendamento() {
  if (!estado.veiculos.length) { toast("Cadastre um cliente e seu veículo primeiro."); navegar("clientes"); return; }
  abrir("Agendar atendimento", `<form id="form-agenda"><label>Cliente${selectClientes("clienteId")}</label><label>Veículo<select name="veiculoId" required>${opcoesVeiculos("")}</select></label>${campo("Data e horário", "inicio", "", "datetime-local", 'required min="' + localData(new Date().toISOString()) + '"')}${area("Motivo do atendimento", "descricao", "", 'required maxlength="1000"')}<p class="texto-suave">O horário será registrado como solicitado. A oficina confirma depois.</p>${rodapeForm("Registrar solicitação")}</form>`, "AGENDA");
}
function historicoVeiculo(chave) {
  const v = veiculo(chave), registros = estado.ordens.filter((o) => o.veiculoId === chave);
  abrir(v.modelo + " · " + v.placa, `<p>${h(cliente(v.clienteId).nome)} · ${v.km.toLocaleString("pt-BR")} km</p>${registros.length ? registros.map((o) => `<div class="linha-registro"><div class="entre"><strong>OS #${numero(o)}</strong>${selo(o.status)}</div><p>${data(o.entrada)} · ${h(o.problema)}</p>${botao("Abrir atendimento", "abrir-ordem", o.id)}</div>`).join("") : '<p class="texto-suave">Nenhum atendimento para este veículo.</p>'}`, "HISTÓRICO DO VEÍCULO");
}

// Etapa 5: detalhes da ordem. Cada botão abre uma parte do mesmo registro.
function servicoOrdem(o) {
  const bloqueado = encerrada(o);
  return `<form id="form-servico" data-id="${h(o.id)}"><div class="nota"><strong>Problema relatado</strong>${textoLongo(o.problema)}</div>
    <fieldset ${bloqueado ? "disabled" : ""}><legend>Andamento do serviço</legend>
      <div class="grade-formulario"><label>Situação<select name="status">${opcoes(bloqueado ? [o.status] : M.ETAPAS, o.status)}</select></label>${campoTecnico(o.tecnico)}${campo("Previsão de conclusão", "previsao", localData(o.previsao), "datetime-local")}</div>
      <label class="check"><input type="checkbox" name="esperaPeca" ${o.esperaPeca ? "checked" : ""}> Aguardando peça</label>
      ${campo("Motivo de pausa (opcional e interno)", "pausa", o.pausa, "text", 'maxlength="300"')}
      ${area("Diagnóstico da oficina", "diagnostico", o.diagnostico, 'maxlength="3000"')}
      ${area("Atualização que o cliente pode consultar", "atualizacaoCliente", o.atualizacaoCliente, 'maxlength="2000" placeholder="Ex.: A peça chegou e iniciamos a montagem."')}
      ${area("Notas internas da equipe", "notaInterna", o.notaInterna, 'maxlength="3000"')}
    </fieldset>
    <p class="texto-suave">O simulador usa a atualização ao cliente. Notas internas e motivos de pausa não são expostos.</p>
    ${!bloqueado ? '<div class="rodape-form"><button type="submit" class="primario">Salvar andamento</button></div>' : '<p class="nota">Serviço concluído. As correções do trabalho realizado ficam no relatório, com histórico de versões.</p>'}
    </form>`;
}
function linhaOrcamento(item = {}) {
  return `<div class="linha-item" data-id="${h(item.id || "")}"><label>Tipo<select data-campo="tipo">${opcoes(["Serviço", "Peça"], item.tipo || "Serviço")}</select></label><label>Descrição<input data-campo="descricao" value="${h(item.descricao || "")}" maxlength="200" required></label><label>Quantidade<input data-campo="quantidade" type="number" value="${item.quantidade || 1}" min="0.01" max="9999" step="0.01" required></label><label>Unitário (R$)<input data-campo="preco" type="number" value="${((item.unitario || 0) / 100).toFixed(2)}" min="0" max="10000000" step="0.01" required></label><button type="button" class="remover" data-acao="remover-item" aria-label="Remover item do orçamento">×</button></div>`;
}
function orcamentoOrdem(o) {
  return `<div class="entre"><p>Versão ${o.orcamento.versao || "ainda não salva"}</p>${selo(o.orcamento.situacao)}</div>
    <form id="form-orcamento" data-id="${h(o.id)}"><fieldset ${encerrada(o) ? "disabled" : ""}><legend>Serviços e peças previstos</legend><div id="linhas-orcamento">${(o.itens.length ? o.itens : [{}]).map(linhaOrcamento).join("")}</div>
    ${!encerrada(o) ? botao("+ Adicionar item", "adicionar-item") : ""}<div class="total-orcamento">Total estimado <strong id="total-orcamento">${dinheiro(M.total(o.itens))}</strong></div></fieldset>
    ${!encerrada(o) ? '<p class="texto-suave">Salvar cria uma nova versão e exige nova aprovação do cliente.</p><button type="submit" class="primario">Salvar orçamento</button>' : ""}</form>
    <div class="acoes espaco-topo">${o.orcamento.situacao === "Rascunho" && o.itens.length && !encerrada(o) ? botao("Solicitar aprovação · prévia", "solicitar-aprovacao", o.id) : ""}${o.orcamento.situacao === "Aguardando aprovação" && !encerrada(o) ? botao("Registrar resposta do cliente", "responder-orcamento", o.id) : ""}</div>
    ${o.orcamento.resposta ? `<div class="nota espaco-topo"><strong>Resposta registrada em ${data(o.orcamento.resposta.quando)}</strong><p>${h(o.orcamento.resposta.observacao)} · ${h(o.orcamento.resposta.autor)}</p></div>` : ""}
    ${o.versoesOrcamento.length ? `<details class="espaco-topo"><summary>Versões anteriores (${o.versoesOrcamento.length})</summary>${o.versoesOrcamento.map((v) => `<div class="linha-registro">v${h(v.versao)} · ${h(v.situacao)} · ${dinheiro(M.total(v.itens || []))}<ul>${(v.itens || []).map((i) => `<li>${h(i.descricao)} · ${h(i.quantidade)} × ${dinheiro(i.unitario)}</li>`).join("")}</ul></div>`).join("")}</details>` : ""}`;
}
function relatorioOrdem(o) {
  if (!o.relatorio) return vazio("O registro do trabalho realizado", "Preencha aos poucos e salve um rascunho. Ao confirmar a conclusão, o veículo ficará pronto para retirada.", botao(o.rascunho ? "Continuar rascunho" : "Preencher relatório", "relatorio", o.id, "primario"));
  const r = o.relatorio;
  return `<div class="entre"><span class="selo verde">Relatório v${r.versao}</span><span class="texto-suave">${data(r.quando)}</span></div><h3 class="espaco-topo">Serviços realizados</h3>${textoLongo(r.trabalhos)}<h3>Peças e materiais utilizados</h3>${textoLongo(r.pecas)}<h3>Conferências finais</h3>${textoLongo(r.conferencias)}<h3>Recomendações para depois</h3>${textoLongo(r.recomendacoes)}<p><strong>Responsável:</strong> ${h(r.responsavel)}</p>
    <div class="acoes">${botao("Imprimir / salvar PDF", "imprimir", o.id, "primario")}${botao("Corrigir relatório", "relatorio", o.id)}${o.status === "Pronto para retirada" ? botao("Registrar retirada", "retirar", o.id) : ""}</div>
    ${o.relatoriosAnteriores.length ? `<details class="espaco-topo"><summary>Consultar versões anteriores</summary>${o.relatoriosAnteriores.map((a) => `<div class="linha-registro"><strong>Versão ${a.versao} · ${data(a.quando)}</strong>${textoLongo(a.trabalhos)}${textoLongo(a.recomendacoes)}<button type="button" class="secundario" data-acao="imprimir" data-id="${h(o.id)}" data-versao="${a.versao}">Imprimir esta versão</button></div>`).join("")}</details>` : ""}`;
}
function anexosOrdem(o) {
  return `<p class="texto-suave">Até três arquivos por ordem, com no máximo 1 MB cada. JPG, PNG, WebP ou PDF.</p>
    <form id="form-anexo" data-id="${h(o.id)}"><label>Arquivo<input name="arquivo" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" required></label><label class="check"><input type="checkbox" name="publico"> Disponibilizar este arquivo ao cliente</label><button type="submit" class="secundario">Adicionar anexo</button></form>
    <div class="grade-anexos">${o.anexos.map((a) => `<div class="anexo">${a.dados.startsWith("data:image") ? `<img src="${h(a.dados)}" alt="${h(a.nome)}">` : '<div class="arquivo-pdf">PDF</div>'}<strong>${h(a.nome)}</strong><span class="selo">${a.publico ? "Visível ao cliente" : "Interno"}</span><a class="botao-link" href="${h(a.dados)}" download="${h(a.nome)}">Baixar arquivo</a><button type="button" class="botao-link perigo" data-acao="remover-anexo" data-id="${h(o.id)}" data-item="${h(a.id)}">Remover</button></div>`).join("")}</div>`;
}
function abrirOrdem(chave, aba = "servico") {
  const o = ordem(chave), v = veiculo(o.veiculoId);
  const abas = { servico: "Atendimento", orcamento: "Orçamento", relatorio: "Relatório", anexos: "Anexos", historico: "Histórico" };
  const conteudos = { servico: () => servicoOrdem(o), orcamento: () => orcamentoOrdem(o), relatorio: () => relatorioOrdem(o), anexos: () => anexosOrdem(o), historico: () => `<ol class="historico">${[...o.historico].reverse().map((e) => `<li><strong>${h(e.acao)}</strong><p>${data(e.quando)} · ${h(e.autor)}</p></li>`).join("")}</ol>` };
  const abriu = abrir("OS #" + numero(o) + " · " + v.modelo, `<div class="entre resumo-ordem"><p>${h(cliente(o.clienteId).nome)} · ${h(v.placa)}<br><small>Entrada: ${data(o.entrada)}</small></p>${selo(o.status)}</div>
    <div class="acoes">${!encerrada(o) ? botao("Concluir serviço", "relatorio", o.id, "primario") : ""}${o.status === "Pronto para retirada" ? botao("Registrar retirada", "retirar", o.id, "primario") : ""}${o.relatorio ? botao("Imprimir relatório", "imprimir", o.id) : ""}</div>
    <nav class="abas" aria-label="Seções da ordem">${Object.entries(abas).map(([key,titulo]) => `<button type="button" data-acao="aba-ordem" data-id="${h(o.id)}" data-aba="${key}" aria-pressed="${aba === key}">${titulo}</button>`).join("")}</nav>${conteudos[aba]()}`, "DETALHES DO ATENDIMENTO", true);
  return abriu;
}
function formularioRelatorio(chave) {
  const o = ordem(chave), r = o.relatorio || o.rascunho || {};
  abrir(o.relatorio ? "Corrigir relatório" : "Concluir serviço", `<form id="form-relatorio" data-id="${h(o.id)}">
    <div class="nota"><strong>OS #${numero(o)} · ${h(veiculo(o.veiculoId).modelo)}</strong><p>${h(cliente(o.clienteId).nome)} · ${h(veiculo(o.veiculoId).placa)}</p><p>${o.relatorio ? "A correção cria uma nova versão e preserva a anterior." : "Ao confirmar, o veículo ficará pronto para retirada. Você também pode salvar um rascunho."}</p></div>
    ${area("Serviços efetivamente realizados *", "trabalhos", r.trabalhos, 'required maxlength="6000" placeholder="Descreva cada serviço em uma linha."')}
    ${area("Peças e materiais utilizados", "pecas", r.pecas, 'maxlength="4000" placeholder="Informe somente o que foi utilizado, com quantidades."')}
    ${area("Conferências e testes finais", "conferencias", r.conferencias, 'maxlength="3000"')}
    ${area("Recomendações e pendências para o cliente", "recomendacoes", r.recomendacoes, 'maxlength="4000"')}
    <div class="grade-formulario">${campo("Responsável pelo serviço *", "responsavel", r.responsavel || o.tecnico, "text", 'required maxlength="80"')}${campo("Retorno recomendado (opcional)", "retorno", r.retorno, "date", 'min="' + (r.retorno && r.retorno < new Date().toLocaleDateString("sv-SE") ? r.retorno : new Date().toLocaleDateString("sv-SE")) + '"')}</div>
    <label class="check"><input type="checkbox" name="incluirValores" ${r.incluirValores ? "checked" : ""} ${o.orcamento.situacao !== "Aprovado" ? "disabled" : ""}> Incluir valores do orçamento aprovado no relatório</label>
    <div class="rodape-form">${botao("Voltar", "voltar-ordem", o.id)}${!o.relatorio ? '<button type="submit" name="modo" value="rascunho" formnovalidate class="secundario">Salvar rascunho</button>' : ""}<button type="submit" name="modo" value="concluir" class="primario">${o.relatorio ? "Salvar nova versão" : "Confirmar conclusão"}</button></div>
    </form>`, "RELATÓRIO DE SERVIÇO", true);
}
function responderOrcamento(chave) {
  const o = ordem(chave);
  abrir("Registrar resposta do cliente", `<form id="form-resposta" data-id="${h(chave)}"><p class="nota">Registro manual da resposta recebida pela oficina. Esta ação não envia mensagens e não representa uma aprovação automática.</p><p>OS #${numero(o)} · Orçamento v${o.orcamento.versao} · ${dinheiro(M.total(o.itens))}</p><label>Resposta<select name="resposta"><option>Aprovado</option><option>Recusado</option></select></label>${area("Como a resposta foi recebida?", "observacao", "", 'required maxlength="1000" placeholder="Ex.: Cliente aprovou por telefone às 10h."')}${rodapeForm("Registrar resposta")}</form>`, "ORÇAMENTO");
}
function editarCompra(chave, itemId) {
  const item = M.achar(ordem(chave).itens, itemId);
  abrir("Acompanhar peça", `<form id="form-compra" data-id="${h(chave)}" data-item="${h(itemId)}"><h3>${h(item.descricao)}</h3><label>Situação da compra<select name="compra">${opcoes(M.COMPRAS, item.compra)}</select></label>${campo("Chegada prevista", "previsaoPeca", item.previsaoPeca, "date")}${rodapeForm("Salvar acompanhamento")}</form>`, "PEÇAS E COMPRAS");
}
function atualizarTotal() {
  const linhas = [...document.querySelectorAll(".linha-item")];
  const soma = linhas.reduce((valor, linha) => { const q = Number(linha.querySelector('[data-campo="quantidade"]').value), p = Number(linha.querySelector('[data-campo="preco"]').value); return valor + (Number.isFinite(q * p) ? Math.round(q * Math.round(p * 100)) : 0); }, 0);
  if ($("#total-orcamento")) $("#total-orcamento").textContent = dinheiro(soma);
}


// Etapa 6: atendimento simulado. O cliente escolhido representa uma identidade já verificada.
function renderAtendimento() {
  const anterior = $("#bot-cliente").value;
  $("#bot-cliente").innerHTML = '<option value="">Selecione um cliente</option>' + estado.clientes.map((c) => `<option value="${h(c.id)}">${h(c.nome)}</option>`).join("");
  $("#bot-cliente").value = estado.clientes.some((c) => c.id === anterior) ? anterior : "";
  preencherOrdensBot();
  renderConversa();
  $("#lista-atendimentos").innerHTML = estado.atendimentos.length ? estado.atendimentos.map((a) => `<div class="linha-registro"><div class="entre"><strong>${h(cliente(a.clienteId).nome)}</strong>${selo(a.status)}</div><p>OS #${numero(ordem(a.ordemId))} · ${data(a.quando)}</p>${a.status === "Pendente" ? botao("Marcar atendido", "resolver-atendimento", a.id) : ""}</div>`).join("") : '<p class="texto-suave">Os pedidos feitos no simulador aparecerão aqui.</p>';
  $("#lista-avisos").innerHTML = estado.avisos.length ? estado.avisos.slice(0, 20).map((a) => `<div class="linha-registro"><div class="entre"><strong>${h(cliente(a.clienteId).nome)}</strong><span class="selo">Não enviado</span></div><p>${h(a.mensagem)}</p><small>${data(a.quando)} · OS #${numero(ordem(a.ordemId))}</small></div>`).join("") : '<p class="texto-suave">Prévias serão criadas ao solicitar aprovação ou concluir um serviço.</p>';
}
function preencherOrdensBot() {
  const anterior = $("#bot-ordem").value, chave = $("#bot-cliente").value;
  const lista = estado.ordens.filter((o) => o.clienteId === chave);
  $("#bot-ordem").innerHTML = '<option value="">Selecione um atendimento</option>' + lista.map((o) => `<option value="${h(o.id)}">OS #${numero(o)} · ${h(veiculo(o.veiculoId).modelo)} · ${h(o.status)}</option>`).join("");
  if (lista.some((o) => o.id === anterior)) $("#bot-ordem").value = anterior;
  else if (lista.length === 1) $("#bot-ordem").value = lista[0].id;
  $("#bot-anexos").innerHTML = "";
}
function renderConversa() {
  $("#conversa").innerHTML = conversa.length ? conversa.map((m) => `<div class="balao ${m.tipo}"><small>${m.tipo === "cliente" ? "Cliente simulado" : "Assistente GoodMec"}</small><p>${h(m.texto)}</p></div>`).join("") : '<div class="inicio-chat"><span class="avatar">G</span><h3>Olá! Como posso ajudar?</h3><p>Escolha um cliente e um atendimento para testar as consultas.</p></div>';
  $("#conversa").scrollTop = $("#conversa").scrollHeight;
}
function enviarBot(assunto, mensagem) {
  const clienteId = $("#bot-cliente").value, ordemId = $("#bot-ordem").value;
  if (!clienteId || !ordemId) { toast("Selecione um cliente e uma ordem de serviço.", true); return; }
  let resposta;
  if (assunto === "humano") alterar((s) => { resposta = M.respostaBot(s, clienteId, ordemId, assunto); }, "Pedido adicionado à fila local.");
  else resposta = M.respostaBot(estado, clienteId, ordemId, assunto);
  conversa.push({ tipo: "cliente", texto: mensagem }, { tipo: "bot", texto: resposta });
  conversa = conversa.slice(-60);
  renderConversa();
  const anexos = ordem(ordemId).anexos.filter((a) => a.publico);
  $("#bot-anexos").innerHTML = anexos.length ? `<p class="texto-suave">Arquivos compartilhados pela oficina:</p>${anexos.map((a) => `<a class="botao-link" href="${h(a.dados)}" download="${h(a.nome)}">${h(a.nome)}</a>`).join(" · ")}` : "";
}
function assuntoMensagem(mensagem) {
  const t = textoBusca(mensagem);
  if (/atendente|pessoa|humano|falar|agendar/.test(t)) return "humano";
  if (/orcamento|preco|valor/.test(t)) return "orcamento";
  if (/relatorio|feito|realizado/.test(t)) return "relatorio";
  if (/status|situacao|andamento|pronto|carro|veiculo/.test(t)) return "status";
  return "outro";
}

// Etapa 7: impressão e cópias. Os arquivos são gerados neste computador.
function imprimirRelatorio(chave, versao) {
  const o = ordem(chave);
  const r = versao ? [o.relatorio, ...o.relatoriosAnteriores].find((item) => item?.versao === Number(versao)) : o.relatorio;
  if (!r) throw new Error("Conclua o relatório antes de imprimir.");
  const identidade = r.identificacao || { oficina: estado.config.oficina, telefone: estado.config.telefone, endereco: estado.config.endereco, cliente: cliente(o.clienteId), veiculo: veiculo(o.veiculoId), problema: o.problema, diagnostico: o.diagnostico, entrada: o.entrada, numero: o.numero };
  const bloco = (titulo, conteudo) => `<section><h2>${titulo}</h2>${textoLongo(conteudo)}</section>`;
  $("#impressao").innerHTML = `<header class="print-cabecalho"><div><div class="print-marca"><span>G</span>${h(identidade.oficina)}</div><p>${h(identidade.telefone)}<br>${h(identidade.endereco)}</p></div><div><h1>Relatório de serviço</h1><p>OS #${String(identidade.numero).padStart(3,"0")} · Versão ${r.versao}<br>${data(r.quando)}</p></div></header>
    <div class="print-dados"><p><strong>Cliente</strong><br>${h(identidade.cliente.nome)}<br>${h(identidade.cliente.telefone)}</p><p><strong>Veículo</strong><br>${h(identidade.veiculo.modelo)} · ${h(identidade.veiculo.placa)}<br>${identidade.veiculo.km.toLocaleString("pt-BR")} km</p><p><strong>Atendimento</strong><br>Entrada: ${data(identidade.entrada)}<br>Responsável: ${h(r.responsavel)}</p></div>
    ${bloco("Problema relatado", identidade.problema)}${bloco("Diagnóstico", identidade.diagnostico)}${bloco("Serviços realizados", r.trabalhos)}${bloco("Peças e materiais utilizados", r.pecas)}${bloco("Conferências finais", r.conferencias)}${bloco("Recomendações e pendências", r.recomendacoes)}
    ${r.retorno ? `<p><strong>Retorno recomendado:</strong> ${data(r.retorno, false)}</p>` : ""}
    ${r.incluirValores && r.itensAprovados?.length ? `<section><h2>Referência: orçamento aprovado</h2><table><thead><tr><th>Descrição</th><th>Qtd.</th><th>Total</th></tr></thead><tbody>${r.itensAprovados.map((i) => `<tr><td>${h(i.descricao)}</td><td>${i.quantidade}</td><td>${dinheiro(Math.round(i.quantidade * i.unitario))}</td></tr>`).join("")}</tbody></table><p><strong>Total aprovado: ${dinheiro(M.total(r.itensAprovados))}</strong></p></section>` : ""}
    <footer>Relatório de serviço · ${h(identidade.oficina)} · Documento emitido pela oficina. Recomendações não representam serviços executados.</footer>`;
  $("#impressao").hidden = false;
  document.body.classList.add("imprimindo");
  window.print();
}
function baixarArquivo(nome, conteudo, tipo) {
  const arquivo = new Blob([conteudo], { type: tipo });
  const url = URL.createObjectURL(arquivo);
  const link = document.createElement("a");
  link.href = url; link.download = nome; document.body.appendChild(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function exportar() {
  baixarArquivo("goodmec-" + new Date().toISOString().slice(0,10) + ".json", JSON.stringify(estado, null, 2), "application/json");
  toast("Cópia dos dados desta sessão gerada.");
}
async function importar(arquivo) {
  if (!arquivo) return;
  if (arquivo.size > 20 * 1024 * 1024) throw new Error("A cópia deve ter no máximo 20 MB.");
  let candidato;
  try { candidato = M.validarEstado(JSON.parse(await arquivo.text())); }
  catch (erro) { throw new Error("Não foi possível importar. " + erro.message + " Os dados atuais foram mantidos."); }
  if (!confirm("Importar " + candidato.clientes.length + " clientes e " + candidato.ordens.length + " ordens? Isso substituirá os dados atuais. Exporte sua cópia antes, se necessário.")) return;
  estado = candidato; backupIlegivel = ""; conversa = [];
  $("#form-config").dataset.sujo = "";
  const salvo = guardar();
  renderizar();
  toast(salvo ? "Cópia importada com sucesso." : "Dados carregados apenas nesta sessão; o navegador não conseguiu salvar.", !salvo);
}
function lerArquivo(arquivo) {
  return new Promise((resolve, reject) => {
    const leitor = new FileReader();
    leitor.onload = () => resolve(leitor.result);
    leitor.onerror = () => reject(new Error("Não foi possível ler o arquivo."));
    leitor.readAsDataURL(arquivo);
  });
}

// Etapa 8: eventos. Um ouvinte no documento atende os botões criados dinamicamente.
document.addEventListener("click", (evento) => {
  const b = evento.target.closest("button");
  if (!b) return;
  try {
    if (b.dataset.pagina) { location.hash = b.dataset.pagina; navegar(b.dataset.pagina); return; }
    if (b.dataset.bot) { enviarBot(b.dataset.bot, b.textContent.trim()); return; }
    const acao = b.dataset.acao, chave = b.dataset.id;
    if (!acao) return;
    if (acao.startsWith("ir-")) { location.hash = acao.slice(3); navegar(acao.slice(3)); return; }
    if (acao === "fechar-modal") fechar();
    if (acao === "nova-ordem") novaOrdem();
    if (acao === "novo-cliente") novoCliente();
    if (acao === "editar-cliente") novoCliente(chave);
    if (acao === "novo-veiculo") novoVeiculo(chave);
    if (acao === "editar-veiculo") novoVeiculo("", chave);
    if (acao === "historico-veiculo") historicoVeiculo(chave);
    if (acao === "novo-agendamento") novoAgendamento();
    if (acao === "abrir-ordem") abrirOrdem(chave);
    if (acao === "aba-ordem") abrirOrdem(chave, b.dataset.aba);
    if (acao === "voltar-ordem") abrirOrdem(chave, "relatorio");
    if (acao === "relatorio") formularioRelatorio(chave);
    if (acao === "imprimir") imprimirRelatorio(chave, b.dataset.versao);
    if (acao === "exemplos") alterar(M.exemplos, "Exemplos fictícios adicionados. As ordens estão identificadas como EXEMPLO.");
    if (acao === "adicionar-item") { $("#linhas-orcamento").insertAdjacentHTML("beforeend", linhaOrcamento()); $("#modal").dataset.sujo = "sim"; atualizarTotal(); }
    if (acao === "remover-item") { b.closest(".linha-item").remove(); $("#modal").dataset.sujo = "sim"; atualizarTotal(); }
    if (acao === "solicitar-aprovacao") {
      if (!confirmarSaida()) return;
      alterar((s) => M.solicitarAprovacao(s, chave), "Prévia de solicitação criada. Nenhuma mensagem foi enviada.");
      $("#modal").dataset.sujo = ""; abrirOrdem(chave, "orcamento");
    }
    if (acao === "responder-orcamento") responderOrcamento(chave);
    if (acao === "editar-compra") editarCompra(chave, b.dataset.item);
    if (acao === "retirar" && confirm("Confirmar que o veículo já foi entregue ao cliente?")) {
      alterar((s) => M.encerrarOrdem(s, chave), "Retirada registrada e ordem encerrada.");
      $("#modal").dataset.sujo = ""; abrirOrdem(chave, "relatorio");
    }
    if (acao === "remover-anexo" && confirm("Remover este anexo da ordem?")) {
      alterar((s) => { const o = M.achar(s.ordens, chave); o.anexos = o.anexos.filter((a) => a.id !== b.dataset.item); M.historico(s, o, "Anexo removido."); }, "Anexo removido.");
      $("#modal").dataset.sujo = ""; abrirOrdem(chave, "anexos");
    }
    if (["confirmar-agenda", "atender-agenda", "cancelar-agenda"].includes(acao)) {
      if (acao === "cancelar-agenda" && !confirm("Cancelar este horário? Ele permanecerá no histórico da agenda.")) return;
      alterar((s) => { M.achar(s.agenda, chave).status = { "confirmar-agenda": "Confirmado", "atender-agenda": "Atendido", "cancelar-agenda": "Cancelado" }[acao]; }, "Agendamento atualizado.");
    }
    if (acao === "resolver-lembrete") alterar((s) => { M.achar(s.lembretes, chave).feito = true; }, "Acompanhamento registrado.");
    if (acao === "resolver-atendimento") alterar((s) => { M.achar(s.atendimentos, chave).status = "Resolvido"; }, "Atendimento marcado como resolvido.");
    if (acao === "exportar") exportar();
    if (acao === "exportar-recuperacao" && backupIlegivel) baixarArquivo("goodmec-recuperacao.json", backupIlegivel, "application/json");
    if (acao === "importar") $("#arquivo-importacao").click();
  } catch (erro) { falhar(erro); }
});

document.addEventListener("input", (evento) => {
  const campo = evento.target;
  if (campo.closest("#modal")) $("#modal").dataset.sujo = "sim";
  if (campo.closest("#form-config")) $("#form-config").dataset.sujo = "sim";
  if (campo.closest(".linha-item")) atualizarTotal();
  if (campo.id === "busca-ordens") renderOrdens();
  if (campo.id === "busca-clientes") renderClientes();
});
document.addEventListener("change", async (evento) => {
  const campo = evento.target;
  try {
    if (campo.closest("#modal")) $("#modal").dataset.sujo = "sim";
    if (campo.id === "modo-cliente") {
      const novo = campo.value === "novo";
      $("#cliente-novo").hidden = !novo; $("#cliente-novo").disabled = !novo;
      $("#cliente-existente").hidden = novo; $("#cliente-existente").disabled = novo;
    }
    if (campo.name === "clienteId" && ["form-ordem", "form-agenda"].includes(campo.form?.id)) campo.form.querySelector('[name="veiculoId"]').innerHTML = opcoesVeiculos(campo.value);
    if (["filtro-status", "filtro-atencao"].includes(campo.id)) renderOrdens();
    if (campo.id === "bot-cliente") { conversa = []; preencherOrdensBot(); renderConversa(); }
    if (campo.id === "bot-ordem") { conversa = []; $("#bot-anexos").innerHTML = ""; renderConversa(); }
    if (campo.id === "arquivo-importacao") { await importar(campo.files[0]); campo.value = ""; }
  } catch (erro) { falhar(erro); if (campo.id === "arquivo-importacao") campo.value = ""; }
});

document.addEventListener("submit", async (evento) => {
  evento.preventDefault();
  const form = evento.target, dados = Object.fromEntries(new FormData(form)), chave = form.dataset.id;
  try {
    if (form.id === "form-cliente") {
      alterar((s) => M.registrarCliente(s, dados, chave), "Cliente salvo.");
      salvoModal(); navegar("clientes");
    }
    if (form.id === "form-veiculo") {
      if (chave) dados.clienteId = veiculo(chave).clienteId;
      alterar((s) => M.registrarVeiculo(s, dados, chave), "Veículo salvo.");
      salvoModal(); navegar("clientes");
    }
    if (form.id === "form-ordem") {
      const modoNovo = $("#modo-cliente").value === "novo";
      const chaveNova = alterar((s) => {
        if (modoNovo) {
          dados.clienteId = M.registrarCliente(s, { nome: dados.novoNome, telefone: dados.novoTelefone });
          dados.veiculoId = M.registrarVeiculo(s, { clienteId: dados.clienteId, modelo: dados.novoModelo, placa: dados.novaPlaca, km: dados.novoKm });
        }
        if (dados.previsao) dados.previsao = new Date(dados.previsao).toISOString();
        return M.criarOrdem(s, dados);
      }, "Ordem de serviço aberta.");
      salvoModal(); navegar("ordens"); abrirOrdem(chaveNova);
    }
    if (form.id === "form-servico") {
      dados.esperaPeca = dados.esperaPeca === "on";
      if (dados.previsao) dados.previsao = new Date(dados.previsao).toISOString();
      alterar((s) => M.atualizarOrdem(s, chave, dados), "Andamento atualizado.");
      $("#modal").dataset.sujo = ""; abrirOrdem(chave, "servico");
    }
    if (form.id === "form-orcamento") {
      const linhas = [...form.querySelectorAll(".linha-item")].map((linha) => ({ id: linha.dataset.id, ...Object.fromEntries([...linha.querySelectorAll("[data-campo]")].map((input) => [input.dataset.campo, input.value])) }));
      alterar((s) => M.salvarOrcamento(s, chave, linhas), "Nova versão do orçamento salva.");
      $("#modal").dataset.sujo = ""; abrirOrdem(chave, "orcamento");
    }
    if (form.id === "form-resposta") {
      alterar((s) => M.responderOrcamento(s, chave, dados.resposta, dados.observacao), "Resposta do cliente registrada.");
      salvoModal(); abrirOrdem(chave, "orcamento");
    }
    if (form.id === "form-relatorio") {
      const concluir = evento.submitter?.value !== "rascunho";
      dados.incluirValores = dados.incluirValores === "on";
      alterar((s) => M.salvarRelatorio(s, chave, dados, concluir), concluir ? "Relatório salvo. Situação da ordem atualizada." : "Rascunho salvo.");
      salvoModal(); abrirOrdem(chave, "relatorio");
    }
    if (form.id === "form-compra") {
      alterar((s) => M.atualizarCompra(s, chave, form.dataset.item, dados.compra, dados.previsaoPeca), "Acompanhamento da peça atualizado.");
      salvoModal();
    }
    if (form.id === "form-agenda") {
      dados.inicio = new Date(dados.inicio).toISOString();
      alterar((s) => M.agendar(s, dados), "Solicitação de horário registrada.");
      salvoModal(); navegar("agenda");
    }
    if (form.id === "form-anexo") {
      const arquivo = form.elements.arquivo.files[0], publico = dados.publico === "on";
      if (!arquivo || arquivo.size > 1024 * 1024 || !["image/jpeg", "image/png", "image/webp", "application/pdf"].includes(arquivo.type)) throw new Error("Use JPG, PNG, WebP ou PDF de até 1 MB.");
      const submit = form.querySelector('button[type="submit"]');
      submit.disabled = true; submit.textContent = "Adicionando...";
      try {
        const conteudo = await lerArquivo(arquivo);
        alterar((s) => M.adicionarAnexo(s, chave, { nome: arquivo.name, dados: conteudo, publico }), "Anexo adicionado.");
        if ($("#form-anexo") === form) { $("#modal").dataset.sujo = ""; abrirOrdem(chave, "anexos"); }
      } finally { submit.disabled = false; submit.textContent = "Adicionar anexo"; }
    }
    if (form.id === "form-config") {
      if (!dados.oficina.trim() || !dados.operador.trim()) throw new Error("Preencha o nome da oficina e de quem está operando.");
      alterar((s) => { for (const nome of ["oficina", "telefone", "endereco", "operador"]) s.config[nome] = dados[nome].trim(); }, "Informações da oficina salvas.");
      form.dataset.sujo = "";
    }
    if (form.id === "form-equipe") {
      if (!dados.nome.trim()) throw new Error("Informe o nome da pessoa.");
      alterar((s) => { if (s.config.equipe.some((p) => textoBusca(p.nome) === textoBusca(dados.nome.trim()))) throw new Error("Este nome já está na equipe."); s.config.equipe.push({ nome: dados.nome.trim(), perfil: dados.perfil }); }, "Pessoa adicionada à equipe.");
      form.reset();
    }
    if (form.id === "form-bot") { enviarBot(assuntoMensagem(dadosMensagem()), dadosMensagem()); form.reset(); }
  } catch (erro) { falhar(erro); }
});
function dadosMensagem() { return $("#bot-texto").value.trim(); }

// Etapa 9: iniciar a tela e os atalhos nativos do navegador.
$("#modal").addEventListener("cancel", (evento) => { evento.preventDefault(); fechar(); });
window.addEventListener("afterprint", () => { $("#impressao").hidden = true; document.body.classList.remove("imprimindo"); });
window.addEventListener("hashchange", () => navegar(location.hash.slice(1)));
window.addEventListener("beforeunload", (evento) => {
  if (dadosNaoSalvos || $("#modal").dataset.sujo === "sim" || $("#form-config").dataset.sujo === "sim") { evento.preventDefault(); evento.returnValue = ""; }
});
$("#filtro-status").insertAdjacentHTML("beforeend", opcoes(M.STATUS, ""));
$("#data-hoje").textContent = new Date().toLocaleDateString("pt-BR", { day: "numeric", month: "long" });
navegar(location.hash.slice(1) || "painel");
