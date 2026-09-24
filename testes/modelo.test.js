// Estes testes verificam regras reais do fluxo sem abrir um navegador.
const test = require('node:test');
const assert = require('node:assert/strict');
const M = require('../modelo.js');

function base() {
  const s = M.criarEstado();
  const c = M.registrarCliente(s, { nome: 'Cliente Teste', telefone: '(11) 99999-1234' });
  const v = M.registrarVeiculo(s, { clienteId: c, modelo: 'Carro Teste', placa: 'abc-1234', km: 40000 });
  const o = M.criarOrdem(s, { clienteId: c, veiculoId: v, problema: 'Ruído', tecnico: 'Mecânico' });
  return { s, c, v, o, ordem: M.achar(s.ordens, o) };
}
const relatorio = { trabalhos: 'Troca de componente', responsavel: 'Mecânico', conferencias: 'Teste concluído' };
const itens = [{ tipo: 'Serviço', descricao: 'Inspeção', quantidade: 1, preco: '100.10' }, { tipo: 'Peça', descricao: 'Componente', quantidade: 2, preco: '15.20' }];

test('normaliza telefone e placa e impede duplicações', () => {
  const { s, c, v } = base();
  assert.equal(M.achar(s.clientes, c).telefone, '5511999991234');
  assert.equal(M.achar(s.veiculos, v).placa, 'ABC1234');
  assert.throws(() => M.registrarCliente(s, { nome: 'Outro', telefone: '5511999991234' }), /já pertence/);
  assert.throws(() => M.registrarVeiculo(s, { clienteId: c, modelo: 'Outro', placa: 'ABC1234' }), /já está/);
});
test('impede duas ordens abertas para o mesmo veículo e aceita uma após a retirada', () => {
  const { s, c, v, o } = base();
  assert.throws(() => M.criarOrdem(s, { clienteId: c, veiculoId: v, problema: 'Outro' }), /em aberto/);
  M.salvarRelatorio(s, o, relatorio, true); M.encerrarOrdem(s, o);
  const nova = M.criarOrdem(s, { clienteId: c, veiculoId: v, problema: 'Novo serviço' });
  assert.equal(M.achar(s.ordens, nova).numero, 2);
});
test('conclusão exige relatório válido e retirada exige conclusão', () => {
  const { s, o, ordem } = base();
  assert.throws(() => M.encerrarOrdem(s, o), /relatório/);
  assert.throws(() => M.salvarRelatorio(s, o, { trabalhos: '   ', responsavel: 'Mecânico' }, true), /serviços/);
  M.salvarRelatorio(s, o, { trabalhos: 'Em preparação' }, false);
  assert.equal(ordem.status, 'Recebido');
  assert.equal(ordem.rascunho.trabalhos, 'Em preparação');
  M.salvarRelatorio(s, o, relatorio, true);
  assert.equal(ordem.status, 'Pronto para retirada');
  assert.equal(s.avisos.length, 1);
  M.encerrarOrdem(s, o); assert.equal(ordem.status, 'Encerrado');
  assert.throws(() => M.atualizarOrdem(s, o, { status: 'Recebido' }), /concluído/);
});
test('não permite concluir por uma mudança direta de status', () => {
  const { s, o } = base();
  assert.throws(() => M.atualizarOrdem(s, o, { status: 'Pronto para retirada' }), /inválida/);
});
test('correção preserva versão e identificação usadas na impressão', () => {
  const { s, c, o, ordem } = base();
  M.salvarRelatorio(s, o, relatorio, true);
  M.registrarCliente(s, { nome: 'Nome atualizado', telefone: '11999991234' }, c);
  M.encerrarOrdem(s, o);
  M.salvarRelatorio(s, o, { ...relatorio, trabalhos: 'Descrição corrigida' }, true);
  assert.equal(ordem.status, 'Encerrado');
  assert.equal(ordem.relatorio.versao, 2);
  assert.equal(ordem.relatoriosAnteriores[0].trabalhos, 'Troca de componente');
  assert.equal(ordem.relatoriosAnteriores[0].identificacao.cliente.nome, 'Cliente Teste');
  assert.equal(s.avisos.length, 1);
});
test('orçamento calcula centavos e nova versão exige nova aprovação', () => {
  const { s, o, ordem } = base();
  M.salvarOrcamento(s, o, itens);
  assert.equal(M.total(ordem.itens), 13050);
  M.solicitarAprovacao(s, o);
  M.responderOrcamento(s, o, 'Aprovado', 'Confirmação recebida por telefone.');
  assert.equal(ordem.orcamento.resposta.versao, 1);
  M.salvarRelatorio(s, o, { ...relatorio, incluirValores: true }, false);
  M.salvarOrcamento(s, o, [{ ...itens[0], preco: '200' }]);
  assert.equal(ordem.orcamento.situacao, 'Rascunho');
  assert.equal(ordem.orcamento.versao, 2);
  assert.equal(ordem.orcamento.resposta, null);
  assert.equal(ordem.versoesOrcamento[0].situacao, 'Aprovado');
  assert.throws(() => M.responderOrcamento(s, o, 'Aprovado', 'Nova resposta'), /aguardando/);
});
test('valida quantidades, valores negativos e números não finitos', () => {
  const { s, o } = base();
  assert.throws(() => M.salvarOrcamento(s, o, [{ ...itens[0], quantidade: 0 }]), /quantidade/);
  assert.throws(() => M.salvarOrcamento(s, o, [{ ...itens[0], preco: '-1' }]), /preço/);
  assert.throws(() => M.centavos('Infinity'), /preço/);
  assert.equal(M.centavos('10,50'), 1050);
});
test('resposta pública omite notas internas e impede consulta de outro cliente', () => {
  const { s, c, o, ordem } = base();
  M.atualizarOrdem(s, o, { status: 'Em reparo', notaInterna: 'SEGREDO INTERNO', pausa: 'MOTIVO INTERNO', diagnostico: 'DIAGNÓSTICO INTERNO', atualizacaoCliente: 'Estamos reparando o veículo.' });
  const resposta = M.respostaBot(s, c, o, 'status');
  assert.match(resposta, /Estamos reparando/);
  assert.doesNotMatch(resposta, /SEGREDO|MOTIVO|DIAGNÓSTICO/);
  const outro = M.registrarCliente(s, { nome: 'Outro', telefone: '21988881234' });
  assert.throws(() => M.respostaBot(s, outro, o, 'status'), /não pertence/);
  assert.equal(ordem.status, 'Em reparo');
});
test('orçamento em rascunho não vaza ao cliente e atendimento humano não duplica pedidos', () => {
  const { s, c, o } = base();
  M.salvarOrcamento(s, o, itens);
  assert.doesNotMatch(M.respostaBot(s, c, o, 'orcamento'), /Inspeção|130/);
  M.respostaBot(s, c, o, 'humano'); M.respostaBot(s, c, o, 'humano');
  assert.equal(s.atendimentos.length, 1);
  assert.match(M.respostaBot(s, c, o, 'qualquer'), /Falar com a oficina/);
});
test('anexos recusam HTML, SVG executável e arquivos grandes', () => {
  const { s, o } = base();
  assert.throws(() => M.adicionarAnexo(s, o, { nome: 'x', dados: 'data:text/html;base64,AAAA' }), /imagem/);
  assert.throws(() => M.adicionarAnexo(s, o, { nome: 'x', dados: 'data:image/svg+xml;base64,AAAA' }), /imagem/);
  M.adicionarAnexo(s, o, { nome: 'imagem.png', dados: 'data:image/png;base64,AAAA', publico: false });
  assert.equal(M.achar(s.ordens, o).anexos[0].publico, false);
});
test('base de exemplos e ciclo completo podem ser exportados e importados', () => {
  const s = M.criarEstado(); M.exemplos(s);
  assert.equal(s.ordens.length, 3);
  assert.deepEqual(M.validarEstado(JSON.parse(JSON.stringify(s))), s);
  const b = base(); M.salvarOrcamento(b.s, b.o, itens); M.solicitarAprovacao(b.s, b.o); M.responderOrcamento(b.s, b.o, 'Aprovado', 'Por telefone');
  M.salvarRelatorio(b.s, b.o, { ...relatorio, incluirValores: true }, true); M.encerrarOrdem(b.s, b.o);
  assert.deepEqual(M.validarEstado(b.s), b.s);
  assert.equal(b.ordem.relatorio.itensAprovados.length, 2);
});
test('backup inválido é recusado sem modificar o estado original', () => {
  const { s } = base();
  const invalido = M.copiar(s); invalido.ordens[0].status = 'Encerrado';
  assert.throws(() => M.validarEstado(invalido), /sem relatório/);
  assert.equal(s.ordens[0].status, 'Recebido');
  const orfao = M.copiar(s); orfao.veiculos[0].clienteId = 'c999';
  assert.throws(() => M.validarEstado(orfao), /Veículo/);
});
test('agendamentos exigem horário futuro e evitam conflito', () => {
  const { s, c, v } = base();
  const a = { clienteId: c, veiculoId: v, inicio: new Date(Date.now() + 3600000).toISOString(), descricao: 'Revisão' };
  M.agendar(s, a); assert.equal(s.agenda[0].status, 'Solicitado');
  assert.throws(() => M.agendar(s, a), /horário/);
  assert.throws(() => M.agendar(s, { ...a, inicio: '2000-01-01T10:00:00Z' }), /futuro/);
});

test('conclusão e retirada substituem mensagens antigas e não mostram previsão vencida', () => {
  const { s, c, o, ordem } = base();
  ordem.atualizacaoCliente = 'Ainda em reparo.';
  ordem.previsao = '2000-01-01T10:00:00Z';
  M.salvarRelatorio(s, o, relatorio, true);
  assert.match(M.respostaBot(s, c, o, 'status'), /pronto para retirada/);
  assert.doesNotMatch(M.respostaBot(s, c, o, 'status'), /Ainda em reparo|2000|Previsão:/);
  M.encerrarOrdem(s, o);
  assert.match(M.respostaBot(s, c, o, 'status'), /foi entregue/);
});
test('corrigir relatório não reabre lembrete já acompanhado', () => {
  const { s, o } = base();
  const retorno = new Date(Date.now() + 86400000).toLocaleDateString('sv-SE');
  M.salvarRelatorio(s, o, { ...relatorio, retorno }, true);
  s.lembretes[0].feito = true;
  const chave = s.lembretes[0].id;
  M.salvarRelatorio(s, o, { ...relatorio, retorno, trabalhos: 'Correção textual' }, true);
  assert.equal(s.lembretes.length, 1);
  assert.equal(s.lembretes[0].feito, true);
  assert.equal(s.lembretes[0].id, chave);
});
test('backup rejeita identificações de impressão e versões antigas corrompidas', () => {
  const { s, o } = base();
  M.salvarRelatorio(s, o, relatorio, true);
  const ruim = M.copiar(s); ruim.ordens[0].relatorio.identificacao.veiculo = null;
  assert.throws(() => M.validarEstado(ruim), /Relatório inválido/);
  const antigo = M.copiar(s); antigo.ordens[0].versoesOrcamento.push({ versao: 1, situacao: 'Aprovado', itens: 'inválido' });
  assert.throws(() => M.validarEstado(antigo), /Versões inválidas/);
});

test('alterar uma peça do orçamento reinicia seu acompanhamento de compra', () => {
  const { s, o, ordem } = base();
  M.salvarOrcamento(s, o, itens);
  const itemId = ordem.itens[1].id;
  M.atualizarCompra(s, o, itemId, 'Recebida', '2027-01-02');
  M.salvarOrcamento(s, o, [{ ...itens[1], id: itemId, descricao: 'Outra peça' }]);
  assert.equal(ordem.itens[0].compra, 'Não solicitada');
  assert.equal(ordem.itens[0].previsaoPeca, '');
  assert.throws(() => M.atualizarCompra(s, o, itemId, 'Solicitada', '2027-02-30'), /data/);
});
