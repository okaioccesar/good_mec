# GoodMec — guia de uso e estudo

## Como abrir

Abra `index.html` no navegador. O site funciona com arquivos locais: não precisa instalar pacotes, compilar ou iniciar um servidor para usá-lo. HTML, CSS e JavaScript são as únicas tecnologias carregadas pela página.

Na primeira abertura, a base começa vazia. Use **Nova ordem** para cadastrar um atendimento ou **Explorar com exemplos** para carregar três atendimentos fictícios. Os exemplos estão identificados nas ordens.

## O que já funciona

| Área | Recursos |
| --- | --- |
| Visão geral | Quantidade de serviços em andamento, aprovações pendentes, veículos prontos, previsões vencidas e próximos horários. |
| Ordens | Cadastro, busca, filtros, diagnóstico, responsável, previsão, situação, espera por peças e pausa. |
| Clientes e veículos | Cadastro, edição, telefone, e-mail, placa, modelo, ano, quilometragem e histórico por veículo. |
| Orçamento | Itens de serviço e peças, quantidade, valor unitário, total, versões e registro manual da resposta do cliente. |
| Relatório | Rascunho, serviços realizados, materiais utilizados, conferências, recomendações, responsável e retorno. |
| Conclusão | Relatório obrigatório para liberar o veículo; retirada registrada em uma ação separada. |
| Impressão | Relatório pronto para imprimir ou escolher **Salvar como PDF** na janela do navegador. |
| Histórico | Autor, data e descrição das alterações; versões anteriores de relatórios e orçamentos. |
| Anexos | JPG, PNG, WebP e PDF de até 1 MB, no máximo três por ordem; classificação interna ou pública. |
| Agenda | Solicitação, confirmação, atendimento e cancelamento de horários. |
| Retornos | Lembretes locais criados ao recomendar uma data no relatório; registro de acompanhamento feito. |
| Peças | Situação da compra e previsão de chegada dos itens de cada orçamento. |
| Atendimento | Simulação das consultas de status, orçamento e relatório; pedidos de atendimento humano e prévias de notificações. |
| Indicadores | Distribuição das ordens, quantidade concluída, tempo médio até conclusão e valor de orçamentos aprovados. |
| Oficina | Dados usados no relatório, nome do operador e lista da equipe com funções. |
| Dados | Persistência local, exportação e importação de cópias JSON com validação. |

## Fluxo para experimentar

1. Clique em **Nova ordem**. Escolha cadastrar um novo cliente e veículo.
2. Informe nome, telefone com DDD, modelo, placa e problema relatado.
3. Abra a ordem. Preencha o diagnóstico, escolha a situação e escreva uma atualização pública.
4. Salve o andamento. As notas internas ficam separadas da atualização pública.
5. Na aba **Orçamento**, cadastre itens. A quantidade multiplicada pelo preço forma o total.
6. Salve o orçamento e clique em **Solicitar aprovação · prévia**. Nada é enviado pelo WhatsApp.
7. Use **Registrar resposta do cliente** para registrar uma aprovação ou recusa realmente recebida pela oficina.
8. Se o orçamento for alterado, a nova versão volta a rascunho. A aprovação da versão anterior permanece no histórico.
9. Clique em **Concluir serviço**. Você pode salvar um rascunho sem mudar a situação da ordem.
10. Para confirmar a conclusão, preencha os serviços realizados e o responsável. O veículo passa para **Pronto para retirada**.
11. Use **Imprimir / salvar PDF**. Recomendações aparecem separadas do trabalho realizado.
12. Depois da entrega, clique em **Registrar retirada**. A ordem passa para **Encerrado**.
13. Uma correção do relatório gera nova versão. Imprimir uma versão antiga usa a identificação registrada naquela versão.

## Limites desta etapa

- Os dados ficam apenas no navegador e computador usados. Não existe compartilhamento entre computadores.
- O navegador pode bloquear ou limitar o armazenamento. A tela avisa quando a alteração ficou apenas na sessão. Exporte uma cópia antes de fechar nesse caso.
- Se dados antigos estiverem ilegíveis, o sistema os preserva. Em **Oficina e equipe**, use **Baixar dados originais para recuperação**. **Exportar cópia** continua exportando os registros da sessão atual.
- O simulador de WhatsApp não envia mensagens nem verifica identidade. A seleção do cliente representa uma identidade já verificada. A verificação real e a integração serão feitas no servidor.
- As notificações e os lembretes são registros locais. Não são enviados automaticamente e não executam com a página fechada.
- A equipe e o nome do operador organizam o protótipo. Não são autenticação nem autorização reais; os perfis não bloqueiam telas.
- A agenda evita dois atendimentos no mesmo horário inicial. Duração, múltiplos boxes e sobreposição de intervalos são decisões para uma etapa posterior.
- A tela de peças acompanha compras ligadas às ordens. Ainda não é controle contábil de estoque.
- Um orçamento aprovado não representa dinheiro recebido. A plataforma não registra pagamentos nesta etapa.
- O PDF usa a impressão do navegador. Não é um documento fiscal e não há envio automático do arquivo pelo WhatsApp.

## Onde está cada parte do código

| Arquivo | O que estudar |
| --- | --- |
| `index.html` | Estrutura das telas, formulários fixos, rótulos, navegação e janela `dialog`. |
| `style.css` | Cores, menu, cartões, formulários, adaptações para celular e impressão. |
| `modelo.js` | Regras dos cadastros, valores, situações, relatórios, cópias e respostas públicas. |
| `script.js` | Eventos, abertura de formulários, apresentação dos dados e armazenamento. |
| `logo.svg` | A identidade visual vetorial com a letra G. |
| `testes/modelo.test.js` | Testes das regras, sem interface. |
| `testes/interface.test.js` | Testes dos formulários em um DOM em memória. |

Os comentários **Etapa** dividem cada arquivo em blocos de leitura. Uma boa ordem de estudo é: HTML, CSS, `criarEstado`, `criarOrdem`, `novaOrdem`, evento `submit` e `renderOrdens`.

## HTML: como ler as novas linhas

| Trecho | Explicação |
| --- | --- |
| `<script src="modelo.js" defer>` | Carrega o arquivo e espera a estrutura HTML ficar pronta antes de executá-lo. Os scripts com `defer` preservam a ordem em que foram declarados. |
| `<aside>` | Agrupa a área lateral da aplicação. |
| `<nav aria-label="...">` | Identifica um grupo de navegação e dá um nome acessível a ele. |
| `data-pagina="ordens"` | Guarda no botão uma informação que o JavaScript lê por `dataset.pagina`. |
| `data-acao="nova-ordem"` | Indica qual ação um botão deve executar. |
| `aria-current="page"` | Identifica a opção de navegação que está ativa. |
| `hidden` | Esconde uma seção. O JavaScript remove ou aplica esse atributo ao trocar de tela. |
| `<section>` | Agrupa um assunto da página. |
| `<label>` | Dá um nome visível e acessível a um campo. |
| `name="telefone"` | É a chave usada para obter o valor do campo com `FormData`. |
| `required` | Solicita ao navegador que impeça um envio comum com o campo vazio. As regras também verificam o conteúdo. |
| `maxlength`, `min`, `max`, `step` | Definem limites de tamanho e intervalos aceitos pelos campos. |
| `<fieldset disabled>` | Desativa um grupo de campos, inclusive sua participação no envio. |
| `<legend>` | Dá um título a um grupo de campos. |
| `<dialog>` | Cria uma janela nativa. `showModal()` a abre; `close()` a fecha. |
| `aria-labelledby` | Associa uma área ao elemento que contém seu título. |
| `role="status"` | Indica uma mensagem de atualização que pode ser anunciada por leitores de tela. |
| `role="alert"` | Indica uma mensagem de erro que precisa de atenção. |
| `role="log"` | Identifica a sequência de mensagens da conversa. |
| `tabindex="-1"` | Permite dar foco pelo código sem criar mais uma parada na navegação normal com Tab. |
| `<noscript>` | Mostra uma orientação se o JavaScript estiver desativado. |

As tags de fechamento encerram os grupos. A indentação mostra quais elementos pertencem a cada grupo. Comentários entre `<!--` e `-->` documentam o código e não aparecem na página.

## CSS: como ler as regras

Uma regra tem um **seletor**, como `.cartao`, seguido de propriedades entre chaves. Cada linha no formato `propriedade: valor;` altera uma característica dos elementos selecionados.

| Propriedade ou seletor | Explicação |
| --- | --- |
| `:root` e `--azul` | Definem variáveis de CSS. `var(--azul)` reutiliza a mesma cor. |
| `* { box-sizing: border-box; }` | Faz a largura dos elementos considerar também a borda e o espaço interno. |
| `[hidden]` | Seleciona elementos que têm o atributo `hidden`. |
| `!important` no `hidden` | Garante que outra regra de layout não torne visível uma tela que deveria estar escondida. |
| `.lateral`, `#conversa` | O ponto seleciona uma classe; o `#` seleciona um ID. |
| `display: flex` | Organiza os filhos em uma direção e facilita alinhá-los. |
| `display: grid` | Organiza os filhos em linhas e colunas. |
| `repeat(2, minmax(0, 1fr))` | Cria duas colunas iguais que podem encolher sem serem forçadas por textos longos. |
| `gap` | Define espaço entre os elementos do layout. |
| `justify-content` | Controla a distribuição dos elementos na direção principal de um layout flexível. |
| `align-items` | Alinha os elementos na direção transversal. |
| `flex-wrap` | Permite que os elementos passem para outra linha quando faltar espaço. |
| `margin` | Define espaço externo. |
| `padding` | Define espaço interno. |
| `padding-inline` | Define os espaços internos nas duas laterais do fluxo de texto. |
| `width`, `height` | Definem largura e altura. |
| `min-width`, `max-width` | Estabelecem os limites da largura. |
| `position: fixed` | Mantém o elemento em uma posição da janela, como o menu no computador. |
| `inset` | Define as distâncias em relação às bordas para um elemento posicionado. |
| `z-index` | Controla a ordem de sobreposição de elementos posicionados. O diálogo nativo ainda usa sua própria camada superior. |
| `border`, `border-radius` | Criam bordas e cantos arredondados. |
| `box-shadow` | Adiciona sombra com deslocamento, desfoque e cor. |
| `color`, `background` | Definem a cor do texto e do fundo. |
| `font-size`, `font-weight` | Definem tamanho e espessura da fonte. |
| `line-height`, `letter-spacing` | Definem o espaço entre linhas e entre letras. |
| `font: inherit` | Faz um campo ou botão usar a fonte do elemento que o contém. |
| `overflow-x: auto` | Permite rolagem horizontal em tabelas ou navegação que não cabem na tela. |
| `overflow-wrap: anywhere` | Permite quebrar uma sequência de texto longa para não ultrapassar sua caixa. |
| `white-space: pre-wrap` | Preserva as quebras de linha digitadas e ainda permite quebras automáticas. |
| `object-fit: contain` | Exibe a imagem inteira dentro da área do anexo. |
| `:hover` | Aplica um estilo quando o ponteiro está sobre o elemento. |
| `:focus-visible`, `outline` | Destacam o controle que está recebendo foco, especialmente ao usar o teclado. |
| `:disabled` | Seleciona um campo ou botão desativado. |
| `::backdrop` | Estiliza o fundo escurecido atrás da janela modal. |
| `@media` | Aplica regras somente em determinadas condições, como largura de tela ou impressão. |
| `@page` | Define tamanho e margens sugeridos para a impressão. |
| `break-inside`, `break-after` | Ajudam a evitar quebras inadequadas de página no relatório impresso. |

## JavaScript: conceitos novos

| Trecho | Explicação |
| --- | --- |
| `const` | Declara uma referência que não será substituída. O conteúdo de um objeto referenciado ainda pode mudar. |
| `let` | Declara uma variável que poderá receber outro valor. |
| `{ nome: "Ana" }` | Cria um objeto com informações relacionadas. |
| `[cliente1, cliente2]` | Cria uma lista, chamada array. |
| `objeto.nome` | Lê uma propriedade do objeto. |
| `function nome(...)` | Declara uma função reutilizável. Os parâmetros recebem valores de quem a chama. |
| `(valor) => ...` | É outra forma de escrever uma função. |
| `return` | Devolve um resultado e encerra aquela execução da função. |
| `if` | Executa um bloco quando a condição é verdadeira. |
| `for ... of` | Percorre cada item de uma lista. |
| `.map()` | Transforma os itens de uma lista em uma nova lista. É usado, por exemplo, para produzir cartões HTML. |
| `.filter()` | Produz uma lista somente com os itens que passam na condição. |
| `.find()` | Encontra o primeiro item que passa na condição. |
| `.some()` | Responde se ao menos um item passa na condição. |
| `.every()` | Responde se todos os itens passam na condição. |
| `.reduce()` | Acumula os itens em um resultado, como o total do orçamento. |
| `.join("")` | Une os textos de uma lista. |
| `...objeto` | Copia propriedades para outro objeto. `...lista` expande os itens de uma lista. |
| `?.` | Só acessa a próxima propriedade se o valor anterior existir. |
| `??` | Usa o valor à direita apenas quando o da esquerda é `null` ou `undefined`. |
| `||` | Usa o valor à direita quando o da esquerda é considerado falso, como texto vazio ou zero. |
| `condicao ? a : b` | Escolhe entre dois valores. |
| `JSON.stringify` | Transforma os dados em texto para salvar ou exportar. |
| `JSON.parse` | Converte texto JSON de volta em dados. Depois, `validarEstado` confere se eles fazem sentido. |
| `localStorage` | Armazena pequenos volumes de texto neste navegador. |
| `try / catch` | Trata um erro e permite mostrar uma mensagem em vez de interromper toda a aplicação. |
| `throw new Error(...)` | Interrompe uma operação inválida com uma mensagem. |
| `async / await` | Permite aguardar operações como ler um arquivo sem bloquear toda a página. |
| `new FormData(form)` | Obtém os valores dos campos ativos do formulário. |
| `Object.fromEntries(...)` | Transforma pares de chave e valor em um objeto. |
| `addEventListener` | Registra o que fazer quando ocorre um evento, como clique, mudança ou envio. |
| `evento.preventDefault()` | Cancela o comportamento padrão, como recarregar a página ao enviar um formulário. |
| `closest(...)` | Procura o elemento correspondente ou um ancestral. Permite saber qual botão foi clicado, mesmo clicando em seu texto interno. |
| `dataset` | Lê os atributos personalizados `data-*`. |
| `innerHTML` | Preenche uma área com marcação HTML. Dados digitados passam pela função `h` antes de entrar nessa marcação. |
| `textContent` | Coloca texto sem interpretá-lo como HTML. |
| `new Blob(...)` | Cria um arquivo em memória. |
| `URL.createObjectURL` | Cria um endereço temporário para baixar esse arquivo; depois ele é liberado com `revokeObjectURL`. |
| `window.print()` | Abre a janela de impressão do navegador. |

## Um fluxo explicado linha por linha

Considere a função `alterar`, que está em `script.js`:

```javascript
function alterar(funcao, mensagem) {
  const copia = M.copiar(estado);
  const resultado = funcao(copia);
  estado = copia;
  const salvo = guardar();
  renderizar();
  toast(salvo ? mensagem : mensagem + " Exporte uma cópia: o navegador não salvou.", !salvo);
  return resultado;
}
```

1. `function alterar(...)` recebe a operação desejada e a mensagem que será mostrada.
2. `M.copiar(estado)` cria uma cópia dos registros atuais.
3. `funcao(copia)` aplica a operação nessa cópia. Se ocorrer um erro de validação, a execução para e os registros anteriores permanecem intactos.
4. `estado = copia` adota a cópia após uma operação válida.
5. `guardar()` tenta salvar no navegador e informa se conseguiu.
6. `renderizar()` redesenha a tela atual com os dados novos.
7. `toast(...)` mostra sucesso ou a informação de que ainda falta exportar os dados. `!salvo` é verdadeiro quando o salvamento falhou.
8. `return resultado` devolve o resultado da operação, como o ID da ordem criada.
9. A última chave encerra a função.

Este trecho aparece no envio de um orçamento:

```javascript
alterar((s) => M.salvarOrcamento(s, chave, linhas), "Nova versão do orçamento salva.");
```

`s` é a cópia de estado recebida pela função. `chave` identifica a ordem. `linhas` contém os itens preenchidos. A regra `salvarOrcamento` valida os números, preserva a versão anterior, salva a nova e limpa a aprovação anterior.

## Regras importantes do modelo

- `criarEstado`: descreve o formato completo dos registros.
- `registrarCliente`: valida nome e telefone e evita repetir um telefone.
- `registrarVeiculo`: valida placa, ano e quilometragem e associa o veículo a um cliente.
- `criarOrdem`: liga cliente e veículo, gera o número e inicia a situação como Recebido.
- `atualizarOrdem`: altera o andamento e registra o histórico. Não permite pular o relatório para concluir.
- `centavos` e `total`: calculam valores monetários usando centavos inteiros.
- `salvarOrcamento`: cria uma versão nova e exige aprovação específica dessa versão.
- `responderOrcamento`: registra a resposta, a versão, o operador e a data.
- `salvarRelatorio`: salva um rascunho ou confirma a conclusão. A versão final guarda uma cópia dos dados usados na impressão.
- `encerrarOrdem`: exige que o veículo já esteja pronto para retirada.
- `respostaBot`: verifica a associação entre cliente e ordem antes de montar uma resposta pública.
- `validarEstado`: confere uma cópia importada antes que ela substitua os dados atuais.

## Testes

Para usar o site, não é necessário Node.js. Para executar os testes, com Node instalado:

```text
npm ci
npm test
```

O pacote **jsdom** fica somente em `devDependencies`. Ele cria uma representação da página em memória para testar cliques, formulários, armazenamento e conteúdo. Não é um framework do front end e não é carregado no navegador do usuário.

Os testes cobrem cadastro, duplicações, orçamento, aprovação por versão, rascunho, conclusão, retirada, impressão, privacidade das notas, anexos, importação, quota de armazenamento e consultas do simulador.

Esses testes não medem a aparência renderizada. A conferência visual em diferentes navegadores, tamanhos de tela e no PDF impresso ainda deve ser feita com a página aberta.

## O que será responsabilidade do back end

Persistência compartilhada, autenticação, autorização por função, identidade verificada do cliente, envio real pelo WhatsApp, tarefas agendadas e armazenamento de arquivos no servidor. As mesmas validações precisarão existir no servidor: JavaScript executado no navegador não é uma barreira de segurança.
