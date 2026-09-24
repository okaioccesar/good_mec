// Testes da interface em um DOM em memória: sem abrir navegador nem acessar a rede.
// JSDOM é usado somente aqui; nenhum pacote é carregado pelo site.
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { JSDOM, VirtualConsole } = require("jsdom");
const raiz = path.join(__dirname, "..");
const ler = (nome) => fs.readFileSync(path.join(raiz, nome), "utf8");
function app(salvo) {
  const problemas = [];
  const virtualConsole = new VirtualConsole();
  virtualConsole.on("jsdomError", (e) => problemas.push(e.message));
  const dom = new JSDOM(ler("index.html"), { url: "https://goodmec.test/", runScripts: "outside-only", virtualConsole });
  const w = dom.window;
  w.confirm = () => true;
  w.HTMLDialogElement.prototype.showModal = function () { this.setAttribute("open", ""); };
  w.HTMLDialogElement.prototype.close = function () { this.removeAttribute("open"); };
  w.HTMLElement.prototype.scrollIntoView = function () {};
  w.print = () => { w.relatorioImpresso = w.document.querySelector("#impressao").innerHTML; w.dispatchEvent(new w.Event("afterprint")); };
  if (salvo) w.localStorage.setItem("goodmec.v1", salvo);
  w.eval(ler("modelo.js")); w.eval(ler("script.js"));
  const $ = (s) => w.document.querySelector(s);
  const click = (s) => { assert.ok($(s), "Elemento esperado: " + s); $(s).click(); };
  const valor = (s, v) => { assert.ok($(s), "Campo esperado: " + s); $(s).value = v; $(s).dispatchEvent(new w.Event("input", { bubbles: true })); $(s).dispatchEvent(new w.Event("change", { bubbles: true })); };
  const submit = async (s, botao = 'button[type="submit"]') => { const f = $(s); f.dispatchEvent(new w.SubmitEvent("submit", { bubbles: true, cancelable: true, submitter: f.querySelector(botao) })); await new Promise(setImmediate); };
  const state = () => JSON.parse(w.localStorage.getItem("goodmec.v1"));
  const erro = () => $("#erro-modal").hidden ? "" : $("#erro-modal").textContent;
  return { dom, w, $, click, valor, submit, state, erro, problemas, fechar: () => w.close() };
}
async function cadastrar(tela, nome = "Cliente de teste", placa = "ABC1D23", telefone = "11999991234") {
  const { click, valor, submit, erro } = tela;
  click('[data-acao="nova-ordem"]');
  if (tela.$("#modo-cliente").value !== "novo") valor("#modo-cliente", "novo");
  valor('[name="novoNome"]', nome); valor('[name="novoTelefone"]', telefone);
  valor('[name="novoModelo"]', "Honda Fit"); valor('[name="novaPlaca"]', placa);
  valor('[name="problema"]', "Ruído ao frear");
  valor('[name="tecnico"]', "Técnico Teste");
  await submit("#form-ordem");
  assert.equal(erro(), "");
}

test("fluxo completo: cadastro, orçamento, aprovação, relatório, impressão e retirada", async () => {
  const t = app();
  try {
    await cadastrar(t);
    assert.equal(t.state().ordens.length, 1);
    t.valor('#form-servico [name="diagnostico"]', "Desgaste identificado.");
    t.valor('#form-servico [name="notaInterna"]', "INFORMAÇÃO INTERNA SECRETA");
    t.valor('#form-servico [name="atualizacaoCliente"]', "Diagnóstico concluído.");
    await t.submit("#form-servico"); assert.equal(t.erro(), "");
    t.click('[data-aba="orcamento"]');
    t.valor('[data-campo="descricao"]', "Mão de obra"); t.valor('[data-campo="preco"]', "150");
    t.click('[data-acao="adicionar-item"]');
    t.valor('.linha-item:nth-child(2) [data-campo="tipo"]', "Peça");
    t.valor('.linha-item:nth-child(2) [data-campo="descricao"]', "Pastilhas");
    t.valor('.linha-item:nth-child(2) [data-campo="preco"]', "200");
    await t.submit("#form-orcamento"); assert.equal(t.erro(), "");
    assert.match(t.$("#total-orcamento").textContent, /350/);
    t.click('[data-acao="solicitar-aprovacao"]');
    t.click('[data-acao="responder-orcamento"]');
    t.valor('[name="observacao"]', "Cliente aprovou por telefone.");
    await t.submit("#form-resposta"); assert.equal(t.erro(), "");
    assert.equal(t.state().ordens[0].orcamento.situacao, "Aprovado");
    t.click('[data-acao="relatorio"]');
    t.valor('[name="trabalhos"]', "Troca das pastilhas");
    t.valor('[name="pecas"]', "Um jogo de pastilhas");
    await t.submit("#form-relatorio", '[value="rascunho"]');
    assert.notEqual(t.state().ordens[0].status, "Pronto para retirada");
    t.click('[data-acao="relatorio"]');
    assert.equal(t.$('[name="trabalhos"]').value, "Troca das pastilhas");
    t.$('[name="incluirValores"]').checked = true;
    await t.submit("#form-relatorio", '[value="concluir"]'); assert.equal(t.erro(), "");
    assert.equal(t.state().ordens[0].status, "Pronto para retirada");
    t.click('[data-acao="imprimir"]');
    assert.match(t.w.relatorioImpresso, /Troca das pastilhas/);
    assert.match(t.w.relatorioImpresso, /350/);
    assert.doesNotMatch(t.w.relatorioImpresso, /INFORMAÇÃO INTERNA SECRETA/);
    assert.equal(t.w.document.body.classList.contains("imprimindo"), false);
    t.click('[data-acao="retirar"]');
    assert.equal(t.state().ordens[0].status, "Encerrado");
    const recarregada = app(t.w.localStorage.getItem("goodmec.v1"));
    assert.equal(recarregada.state().ordens[0].status, "Encerrado");
    recarregada.fechar();
    assert.deepEqual(t.problemas, []);
  } finally { t.fechar(); }
});
test("formulários não aceitam nomes em branco e renderizam texto sem executar HTML", async () => {
  const t = app();
  try {
    await cadastrar(t, '<img src=x onerror="alert(1)">Teste');
    assert.equal(t.$('#modal-corpo img[src="x"]'), null);
    assert.match(t.$("#modal-corpo").textContent, /<img/);
    t.click('[data-acao="fechar-modal"]');
    t.click('[data-pagina="clientes"]');
    assert.equal(t.$('#lista-clientes img[src="x"]'), null);
    t.click('[data-acao="novo-cliente"]');
    t.valor('[name="nome"]', "   "); t.valor('[name="telefone"]', "21999991234");
    await t.submit("#form-cliente");
    assert.match(t.erro(), /nome/);
    assert.equal(t.state().clientes.length, 1);
  } finally { t.fechar(); }
});
test("cada página renderiza com exemplos; filtros e bot respeitam o cliente selecionado", async () => {
  const t = app();
  try {
    t.click('[data-acao="exemplos"]');
    for (const p of ["ordens", "clientes", "agenda", "pecas", "atendimento", "relatorios", "configuracoes", "painel"]) {
      t.click('[data-pagina="' + p + '"]');
      assert.equal(t.$("#pagina-" + p).hidden, false);
    }
    t.click('[data-pagina="ordens"]');
    t.valor("#busca-ordens", "ABC1D23");
    assert.equal(t.w.document.querySelectorAll("#lista-ordens .ordem-cartao").length, 1);
    t.valor("#busca-ordens", "semresultado");
    assert.equal(t.w.document.querySelectorAll("#lista-ordens .ordem-cartao").length, 0);
    t.click('[data-pagina="atendimento"]');
    t.valor("#bot-cliente", t.state().clientes[0].id);
    assert.equal(t.$("#bot-ordem").options.length, 2);
    t.click('[data-bot="status"]');
    assert.match(t.$("#conversa").textContent, /Honda Fit/);
    assert.doesNotMatch(t.$("#conversa").textContent, /Volkswagen/);
    t.click('[data-bot="humano"]'); t.click('[data-bot="humano"]');
    assert.equal(t.state().atendimentos.length, 1);
    t.click('[data-acao="resolver-atendimento"]');
    assert.equal(t.state().atendimentos[0].status, "Resolvido");
    assert.deepEqual(t.problemas, []);
  } finally { t.fechar(); }
});
test("agenda e peças atualizam seus registros; cadastro de equipe preserva configuração em edição", async () => {
  const t = app();
  try {
    t.click('[data-acao="exemplos"]');
    t.click('[data-pagina="agenda"]'); t.click('[data-acao="novo-agendamento"]');
    t.valor('#form-agenda [name="clienteId"]', t.state().clientes[0].id);
    t.valor('#form-agenda [name="veiculoId"]', t.state().veiculos[0].id);
    const futuro = new Date(Date.now() + 86400000);
    const local = new Date(futuro.getTime() - futuro.getTimezoneOffset() * 60000).toISOString().slice(0,16);
    t.valor('[name="inicio"]', local); t.valor('[name="descricao"]', "Revisão");
    await t.submit("#form-agenda"); assert.equal(t.erro(), "");
    t.click('[data-acao="confirmar-agenda"]');
    assert.equal(t.state().agenda[0].status, "Confirmado");
    t.click('[data-pagina="pecas"]'); t.click('[data-acao="editar-compra"]');
    t.valor('[name="compra"]', "Recebida");
    await t.submit("#form-compra"); assert.equal(t.erro(), "");
    assert.ok(t.state().ordens.some((o) => o.itens.some((i) => i.compra === "Recebida")));
    t.click('[data-pagina="configuracoes"]');
    t.valor('#form-config [name="oficina"]', "Oficina em edição");
    t.valor('#form-equipe [name="nome"]', "João");
    await t.submit("#form-equipe");
    assert.equal(t.$('#form-config [name="oficina"]').value, "Oficina em edição");
    await t.submit("#form-config");
    assert.equal(t.state().config.oficina, "Oficina em edição");
    assert.equal(t.state().config.equipe.length, 1);
  } finally { t.fechar(); }
});
test("armazenamento corrompido é preservado e falha de quota não afirma que salvou", async () => {
  const corrupto = app("{inválido");
  try {
    assert.match(corrupto.$("#situacao-dados").textContent, /recuperação/);
    await cadastrar(corrupto);
    assert.equal(corrupto.w.localStorage.getItem("goodmec.v1"), "{inválido");
    assert.match(corrupto.$("#situacao-dados").textContent, /não será salva/);
  } finally { corrupto.fechar(); }
  const cheio = app();
  try {
    cheio.w.Storage.prototype.setItem = () => { throw new Error("QuotaExceeded"); };
    await cadastrar(cheio);
    assert.match(cheio.$("#situacao-dados").textContent, /não foi possível salvar/);
    assert.equal(cheio.$("#modal-titulo").textContent.includes("OS #001"), true);
  } finally { cheio.fechar(); }
});
test("folha CSS é analisada e contém adaptações de tela e impressão", () => {
  const t = app();
  try {
    const style = t.w.document.createElement("style");
    style.textContent = ler("style.css"); t.w.document.head.appendChild(style);
    assert.ok(style.sheet.cssRules.length > 50);
    assert.match(style.textContent, /@media print/);
    assert.match(style.textContent, /@media \(max-width: 520px\)/);
    assert.deepEqual(t.problemas, []);
  } finally { t.fechar(); }
});

test("importação inválida preserva os dados e cópia válida restaura todos os registros", async () => {
  const t = app();
  try {
    t.click('[data-acao="exemplos"]');
    const original = t.w.localStorage.getItem("goodmec.v1");
    const importar = async (texto) => {
      Object.defineProperty(t.$("#arquivo-importacao"), "files", { value: [{ size: texto.length, text: async () => texto }], configurable: true });
      t.$("#arquivo-importacao").dispatchEvent(new t.w.Event("change", { bubbles: true }));
      await new Promise(setImmediate);
    };
    await importar('{"versao":9}');
    assert.match(t.$("#toast").textContent, /mantidos/);
    assert.equal(t.w.localStorage.getItem("goodmec.v1"), original);
    const copia = JSON.parse(original); copia.config.oficina = "Oficina importada";
    t.click('[data-pagina="configuracoes"]');
    t.valor('#form-config [name="oficina"]', "Rascunho antigo");
    await importar(JSON.stringify(copia));
    assert.equal(t.state().config.oficina, "Oficina importada");
    assert.equal(t.$('#form-config [name="oficina"]').value, "Oficina importada");
    assert.equal(t.state().ordens.length, 3);
  } finally { t.fechar(); }
});
