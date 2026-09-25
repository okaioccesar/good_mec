// Testes de integração: iniciam o Java e conversam com a API por HTTP de verdade.
// Node é apenas o cliente de teste; não participa da execução do servidor da oficina.
const test = require("node:test");
const assert = require("node:assert/strict");
const { spawn, spawnSync } = require("node:child_process");
const { once } = require("node:events");
const path = require("node:path");

// No Windows, o comando java pode ser um lançador que abre outro processo.
// Descobrir o executável real permite encerrar exatamente o servidor iniciado pelo teste.
const configuracaoJava = spawnSync("java", ["-XshowSettings:properties", "-version"], {
  encoding: "utf8", windowsHide: true, timeout: 15000
});
if (configuracaoJava.error || configuracaoJava.status !== 0) {
  throw configuracaoJava.error || new Error("Não foi possível localizar o Java: " + configuracaoJava.stderr);
}
const pastaJava = configuracaoJava.stderr.match(/java\.home\s*=\s*(.+)/);
if (!pastaJava) throw new Error("O Java não informou sua pasta de instalação.");
const executavelJava = path.join(pastaJava[1].trim(), "bin", process.platform === "win32" ? "java.exe" : "java");

async function iniciarServidor(t) {
  const classes = path.join(__dirname, "..", "out");
  // A porta 0 pede ao sistema uma porta livre, evitando interferir no IntelliJ.
  const processo = spawn(executavelJava, ["-cp", classes, "br.com.goodmec.Aplicacao", "0"], {
    windowsHide: true, stdio: ["ignore", "pipe", "pipe"]
  });
  t.after(async () => {
    if (processo.exitCode === null && processo.signalCode === null) {
      const fim = once(processo, "exit");
      processo.kill();
      await fim;
    }
  });
  return new Promise((resolve, reject) => {
    let saida = "";
    let erros = "";
    const prazo = setTimeout(() => reject(new Error("O Java não iniciou em 10 segundos. " + erros)), 10000);
    processo.stderr.on("data", (trecho) => { erros += trecho.toString(); });
    processo.on("error", (erro) => { clearTimeout(prazo); reject(erro); });
    processo.on("exit", (codigo) => {
      clearTimeout(prazo);
      reject(new Error("O Java encerrou antes de iniciar: " + codigo + " " + erros));
    });
    processo.stdout.on("data", (trecho) => {
      saida += trecho.toString();
      const endereco = saida.match(/GoodMec API: (http:\/\/127\.0\.0\.1:\d+)/);
      if (endereco) { clearTimeout(prazo); resolve(endereco[1]); }
    });
  });
}

test("API Java sem framework", { timeout: 60000 }, async (t) => {
  const base = await iniciarServidor(t);
  const requisitar = async (rota, opcoes) => {
    const resposta = await fetch(base + rota, { ...opcoes, signal: AbortSignal.timeout(5000) });
    const texto = await resposta.text();
    return { status: resposta.status, headers: resposta.headers, dados: texto ? JSON.parse(texto) : null };
  };
  const cadastrar = (recurso, dados) => requisitar("/api/" + recurso, {
    method: "POST", body: new URLSearchParams(dados)
  });
  let cliente;
  let veiculo;
  let ordem;

  await t.test("saúde, UTF-8, ausência de cache e listas vazias", async () => {
    const resposta = await requisitar("/api/saude");
    assert.equal(resposta.status, 200);
    assert.deepEqual(resposta.dados, { aplicacao: "GoodMec", status: "online", armazenamento: "memoria" });
    assert.match(resposta.headers.get("content-type"), /application\/json; charset=utf-8/);
    assert.equal(resposta.headers.get("cache-control"), "no-store");
    for (const recurso of ["clientes", "veiculos", "ordens"]) {
      assert.deepEqual((await requisitar("/api/" + recurso)).dados, []);
    }
  });

  await t.test("cadastro e consulta do cliente preservam acentos, aspas, barras e emoji", async () => {
    const nome = 'João "Teste" \\ oficina 🔧\nlinha\tcontrole\u0001 fim';
    const resposta = await cadastrar("clientes", { nome, telefone: "(11) 99999-0001", email: "joao@example.test" });
    assert.equal(resposta.status, 201);
    cliente = resposta.dados;
    assert.equal(cliente.nome, nome);
    assert.equal(cliente.telefone, "5511999990001");
    assert.equal(resposta.headers.get("location"), "/api/clientes/" + cliente.id);
    assert.deepEqual((await requisitar(resposta.headers.get("location"))).dados, cliente);
  });

  await t.test("campos inválidos não criam clientes; telefone normalizado não se repete", async () => {
    for (const dados of [
      { nome: " ", telefone: "11999990002" },
      { nome: "Teste", telefone: "123" },
      { nome: "Teste", telefone: "11999990002", email: "email-invalido" },
      { nome: "A".repeat(121), telefone: "11999990002" }
    ]) {
      assert.equal((await cadastrar("clientes", dados)).status, 400);
    }
    assert.equal((await cadastrar("clientes", { nome: "Outro", telefone: "+55 (11) 99999-0001" })).status, 409);
    assert.equal((await requisitar("/api/clientes")).dados.length, 1);
  });

  await t.test("veículo exige cliente existente, placa válida, ano e quilometragem coerentes", async () => {
    const dados = { clienteId: cliente.id, modelo: "Palio", placa: "abc-1d23", km: "1000", ano: "2018" };
    assert.equal((await cadastrar("veiculos", { ...dados, clienteId: "c999" })).status, 404);
    for (const alteracao of [{ placa: "XXX" }, { km: "-1" }, { km: "1.5" }, { km: "10000000" }, { ano: "1899" }, { ano: "9999" }]) {
      assert.equal((await cadastrar("veiculos", { ...dados, ...alteracao })).status, 400);
    }
    assert.deepEqual((await requisitar("/api/veiculos")).dados, []);
    const resposta = await cadastrar("veiculos", dados);
    assert.equal(resposta.status, 201);
    veiculo = resposta.dados;
    assert.equal(veiculo.placa, "ABC1D23");
    assert.equal(veiculo.km, 1000);
    assert.deepEqual((await requisitar(resposta.headers.get("location"))).dados, veiculo);
    assert.equal((await cadastrar("veiculos", { ...dados, placa: "ABC1D23" })).status, 409);
  });

  await t.test("ordem confere vínculo e problema; cliente não escolhe a situação inicial", async () => {
    const outro = await cadastrar("clientes", { nome: "Maria", telefone: "11999990002" });
    const dados = { clienteId: cliente.id, veiculoId: veiculo.id, problema: "Motor com ruído" };
    assert.equal((await cadastrar("ordens", { ...dados, clienteId: outro.dados.id })).status, 400);
    assert.equal((await cadastrar("ordens", { ...dados, veiculoId: "v999" })).status, 404);
    assert.equal((await cadastrar("ordens", { ...dados, problema: "  " })).status, 400);
    assert.equal((await cadastrar("ordens", { ...dados, status: "Encerrado" })).status, 400);
    assert.deepEqual((await requisitar("/api/ordens")).dados, []);
    const resposta = await cadastrar("ordens", dados);
    assert.equal(resposta.status, 201);
    ordem = resposta.dados;
    assert.equal(ordem.status, "Recebido");
    assert.equal(ordem.numero, 1);
    assert.ok(Number.isFinite(Date.parse(ordem.entrada)));
    assert.deepEqual((await requisitar(resposta.headers.get("location"))).dados, ordem);
    assert.equal((await cadastrar("ordens", dados)).status, 409);
    assert.deepEqual((await requisitar("/api/ordens")).dados, [ordem]);
  });

  await t.test("placa antiga, campos opcionais e numeração da segunda ordem", async () => {
    const resposta = await cadastrar("veiculos", { clienteId: cliente.id, modelo: "Gol", placa: "DEF-1234" });
    assert.equal(resposta.status, 201);
    assert.equal(resposta.dados.km, 0);
    assert.equal(resposta.dados.ano, "");
    const nova = await cadastrar("ordens", { clienteId: cliente.id, veiculoId: resposta.dados.id, problema: "Revisão" });
    assert.equal(nova.status, 201);
    assert.equal(nova.dados.numero, 2);
    assert.notEqual(nova.dados.id, ordem.id);
  });

  await t.test("rotas exatas, registros ausentes e métodos não permitidos", async () => {
    for (const rota of ["/", "/api/clientesXYZ", "/api/clientes/", "/api/clientes/c999", "/api/veiculos/v999", "/api/ordens/o999", "/api/clientes/x/y"]) {
      const resposta = await requisitar(rota);
      assert.equal(resposta.status, 404, rota);
      assert.equal(typeof resposta.dados.erro, "string");
    }
    const resposta = await requisitar("/api/clientes", { method: "DELETE" });
    assert.equal(resposta.status, 405);
    assert.equal(resposta.headers.get("allow"), "GET, POST");
    assert.equal((await requisitar("/api/clientes/" + cliente.id, { method: "POST" })).status, 405);
    assert.equal((await requisitar("/api/clientes?nome=Joao")).status, 400);
    const head = await requisitar("/api/saude", { method: "HEAD" });
    assert.equal(head.status, 405);
    assert.equal(head.dados, null);
  });

  await t.test("formulários rejeitam corpo excessivo, campo repetido, desconhecido e codificação inválida", async () => {
    const enviar = (body, tipo = "application/x-www-form-urlencoded") => requisitar("/api/clientes", {
      method: "POST", headers: { "Content-Type": tipo }, body
    });
    assert.equal((await enviar('{"nome":"Teste"}', "application/json")).status, 415);
    assert.equal((await enviar("nome=Teste", "text/plain")).status, 415);
    assert.equal((await enviar("nome=Teste&nome=Outro&telefone=11999990003")).status, 400);
    assert.equal((await enviar("nome=%ZZ&telefone=11999990003")).status, 400);
    assert.equal((await enviar("nome")).status, 400);
    assert.equal((await enviar("nome=Teste&telefone=11999990003&administrador=true")).status, 400);
    assert.equal((await enviar("nome=" + "a".repeat(17000))).status, 413);
    assert.equal((await requisitar("/api/clientes")).dados.length, 2);
  });

  await t.test("origens externas são recusadas sem alterar a base local", async () => {
    const dados = new URLSearchParams({ nome: "Externo", telefone: "11999990003" });
    for (const origem of ["https://externo.example", "null"]) {
      const resposta = await requisitar("/api/clientes", { method: "POST", headers: { Origin: origem }, body: dados });
      assert.equal(resposta.status, 403);
      assert.equal(resposta.headers.get("access-control-allow-origin"), null);
    }
    assert.equal((await requisitar("/api/clientes")).dados.length, 2);
    assert.equal((await requisitar("/api/saude", { headers: { Origin: base } })).status, 200);
  });

  await t.test("outro processo começa vazio: os dados desta etapa são temporários", async (subteste) => {
    const outraBase = await iniciarServidor(subteste);
    const resposta = await fetch(outraBase + "/api/clientes", { signal: AbortSignal.timeout(5000) });
    assert.deepEqual(await resposta.json(), []);
  });
});
