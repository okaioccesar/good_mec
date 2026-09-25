# GoodMec — explicação do projeto, do HTML ao Java

Este guia acompanha o código revisado em 25/09/2026. Explica as escolhas, a sintaxe, os fluxos e os limites da implementação. Os exemplos marcados como simplificados servem para estudo; os arquivos de código continuam sendo a referência do comportamento executado.

## 1. O problema que orientou o projeto

A oficina recebe informações pelo WhatsApp e registra trabalhos em papel. O sistema organiza cliente, veículo, problema relatado, andamento, orçamento e trabalho realizado. A consulta do cliente depende de a oficina registrar informações atualizadas; um chatbot sozinho não resolve a ausência de registros.

A ideia do relatório levou a uma regra central: concluir um serviço exige registrar o trabalho realizado e o responsável. Depois disso, o veículo fica pronto para retirada. A entrega ao cliente é uma ação separada.

Hoje existem duas partes independentes:

| Parte | Onde executa | Onde guarda dados | Alcance atual |
| --- | --- | --- | --- |
| Front end | Navegador | Memória da página e `localStorage` | Fluxo da oficina, relatórios, agenda, anexos e simulador. |
| Back end | Processo Java | Listas na memória do processo | Cadastro e consulta de clientes, veículos e ordens iniciais. |

O front end ainda não chama a API Java. Os cadastros de uma parte não aparecem na outra. Reiniciar o Java apaga seus cadastros; recarregar a página normalmente recupera o que foi salvo no navegador, se o armazenamento estiver disponível.

## 2. O papel de cada arquivo

| Arquivo ou pasta | Responsabilidade |
| --- | --- |
| `index.html` | Estrutura fixa: navegação, seções, alguns formulários e espaços que o JavaScript preenche. |
| `style.css` | Aparência, dimensões, distribuição dos elementos, teclado, telas menores e impressão. |
| `modelo.js` | Dados e regras da oficina. Não procura elementos na página. |
| `script.js` | Liga cliques e formulários às regras; desenha os dados e salva a base local. |
| `logo.svg` | Desenho vetorial da marca, com a letra G. |
| `testes/` | Testes das regras JavaScript e da interface em memória. |
| `package.json` | Comando de testes e dependência de desenvolvimento. |
| `package-lock.json` | Registro das versões e da árvore de dependências instaladas. |
| `node_modules/` | Código instalado pelo npm para os testes. |
| `backend/src/` | Código-fonte Java. |
| `backend/out/` | Classes Java compiladas; podem ser geradas novamente. |
| `backend/testes/` | Testes que iniciam o Java e fazem solicitações HTTP reais. |
| `backend/executar.ps1` | Atalho PowerShell para compilar, executar ou testar o Java. |
| `.gitignore` | Padrões de arquivos que não devem entrar em novos registros do Git. |
| `.git/` | Metadados e histórico local do Git. |
| `.idea/` | Configurações locais do IntelliJ. |
| `README.md` e guias | Documentação de uso, desenvolvimento e estudo. |

HTML, CSS e JavaScript têm responsabilidades diferentes, mas trabalham juntos. A ordem de serviço não está inteira escrita no HTML: o JavaScript lê os dados e monta seus cartões e formulários.

## 3. HTML: como a estrutura foi montada

### 3.1 As primeiras linhas

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="theme-color" content="#142d48">
  <title>GoodMec | Gestão da oficina</title>
  <link rel="stylesheet" href="style.css">
  <script src="modelo.js" defer></script>
  <script src="script.js" defer></script>
</head>
```

- `<!DOCTYPE html>` faz o navegador interpretar o documento em modo de padrões HTML.
- `<html>` inicia o elemento que contém a página. `lang="pt-BR"` informa o idioma a leitores de tela e outras ferramentas; não traduz o conteúdo automaticamente.
- `<head>` guarda informações sobre o documento e referências aos arquivos usados.
- `charset="UTF-8"` define a codificação e permite representar os textos em português corretamente.
- `viewport` ajusta a área de visualização em dispositivos móveis. Ele trabalha junto com as regras responsivas do CSS.
- `theme-color` sugere uma cor para a interface dos navegadores que oferecem esse recurso.
- `<title>` define o título da aba. O JavaScript o atualiza quando a seção muda.
- `<link>` carrega o CSS. `rel` identifica a relação; `href` informa o arquivo.
- Cada `<script>` carrega um JavaScript. `defer` faz sua execução esperar a análise do HTML e preserva a ordem desses scripts.
- `modelo.js` precisa executar antes de `script.js`, pois o segundo usa `window.GoodMec`, criado pelo primeiro.

Um caminho como `style.css` é relativo à pasta do HTML. Mover apenas o HTML e deixar seus arquivos para trás quebra essas referências.

### 3.2 Tags com significado

Usamos `aside` para a área lateral, `nav` para navegação, `header` para o topo, `main` para o conteúdo principal, `section` para grupos de conteúdo e `footer` para o rodapé. Isso ajuda a compreender a estrutura pelo código e pelas tecnologias assistivas.

`div` continua útil para agrupamentos sem um significado próprio, como uma grade ou linha de ações. `h1`, `h2` e `h3` estabelecem níveis de títulos. O tamanho visual desses títulos é definido no CSS.

`id` identifica um elemento específico; `class` agrupa elementos que compartilham estilos ou comportamento. Por exemplo, há várias seções com classe `pagina`, mas apenas uma com ID `pagina-ordens`.

### 3.3 Uma página com várias seções

Trecho simplificado da seção de ordens:

```html
<section id="pagina-ordens" class="pagina" hidden>
  <div id="lista-ordens"></div>
</section>
```

`hidden` indica que a seção deve ficar escondida. Ao navegar, o JavaScript remove esse estado da seção escolhida e aplica às demais. `lista-ordens` começa vazia e recebe os cartões gerados a partir dos dados.

O projeto funciona como uma interface de página única, feita manualmente. Não há React, um roteador de framework ou um HTML separado para cada tela. O trecho `#ordens` da URL, chamado fragmento ou hash, ajuda a representar a seção atual.

### 3.4 Botões que carregam instruções

```html
<button type="button" data-acao="nova-ordem">+ Nova ordem</button>
```

- `button` fornece comportamento nativo de botão, inclusive para teclado.
- `type="button"` evita que o botão envie acidentalmente um formulário.
- `data-acao` é um atributo personalizado. O navegador o disponibiliza em `botao.dataset.acao`.
- O texto entre as tags é o rótulo visível.

Também usamos `data-pagina`, `data-id`, `data-item`, `data-aba`, `data-bot` e `data-campo`. Eles informam destino, registro ou ação. Esses atributos são dados de interface, não permissões de acesso.

### 3.5 Formulários: o significado de cada atributo

```html
<label>Nome da oficina
  <input name="oficina" required maxlength="80">
</label>
```

O `label` informa o que deve ser preenchido e, por envolver o campo, fica associado a ele. `name` é a chave usada ao coletar os dados: o valor digitado chegará como `dados.oficina`. `required` ativa a verificação nativa de preenchimento. `maxlength` limita a quantidade de caracteres digitados.

Outros recursos usados:

| Recurso | Aplicação |
| --- | --- |
| `type="email"` | Verificação básica de formato pelo navegador. Não confirma que o endereço existe. |
| `type="tel"` | Indica um telefone e pode adaptar o teclado móvel. A regra brasileira está no JavaScript. |
| `type="number"`, `min`, `max`, `step` | Orientam valores e incrementos numéricos. |
| `type="date"` | Data sem horário, usada em retorno e previsão de peça. |
| `type="datetime-local"` | Data e horário locais, usados em agenda e previsão do serviço. |
| `textarea` | Texto de várias linhas, como diagnóstico e trabalhos realizados. |
| `select` e `option` | Lista de escolhas. |
| `fieldset` e `legend` | Agrupam campos relacionados e identificam o grupo. |
| `disabled` | Desativa interação e retira o campo da coleta normal de `FormData`. |
| `checked` | Define se uma caixa de seleção começa marcada. |
| `datalist` | Oferece sugestões de técnicos, mantendo a possibilidade de digitar outro nome. |
| `accept` | Orienta a seleção de arquivos. Outras verificações também são necessárias. |
| `formnovalidate` | No botão de rascunho, permite enviar sem exigir os campos da conclusão. |

Um cuidado decisivo: os campos do modo de cadastro que não está sendo usado ficam **escondidos e desativados**. Só esconder não retira campos obrigatórios da validação nem da coleta de dados.

Outro cuidado: quando editamos um veículo, o proprietário fica desativado. Como esse campo não entra no `FormData`, o JavaScript recupera o `clienteId` original antes de salvar.

### 3.6 A janela compartilhada

Existe um único `<dialog id="modal">`. Seu título e corpo são substituídos para mostrar cadastro, orçamento, relatório ou detalhes da ordem. `showModal()` abre a janela modal nativa e `close()` a fecha.

Isso evita duplicar várias janelas parecidas. O CSS de `dialog::backdrop` escurece o fundo. O título recebe foco por JavaScript; `tabindex="-1"` permite esse foco sem colocá-lo na sequência normal da tecla Tab. O evento `cancel`, relacionado ao Escape, passa pela verificação de alterações não salvas.

### 3.7 Acessibilidade que já aparece no código

O link “Pular para o conteúdo” permite chegar ao `main` pelo teclado. `:focus-visible` destaca o elemento em foco. A classe `sr-only` mantém textos úteis às tecnologias assistivas sem ocupar espaço visual.

`aria-current="page"` identifica a navegação ativa. `aria-label` nomeia regiões e botões como o de fechar. `aria-labelledby` liga o modal ao seu título. `role="alert"` sinaliza erros; `role="status"` identifica mensagens de resultado; `role="log"` e `aria-live="polite"` ajudam a anunciar alterações da conversa.

Essas escolhas dão suporte à acessibilidade, mas não equivalem a uma auditoria completa com teclado e leitores de tela. As abas da ordem são botões com `aria-pressed`; não implementam um componente completo com todas as interações de um padrão ARIA de tabs.

`noscript` mostra uma orientação quando o JavaScript está desativado.

## 4. CSS: as decisões por trás da aparência

### 4.1 Como ler uma regra

```css
.cartao {
  padding: 25px;
  background: white;
  border-radius: 13px;
}
```

`.cartao` é o seletor: procura elementos com essa classe. As chaves delimitam as declarações. `padding` cria espaço interno, `background` define o fundo e `border-radius` arredonda os cantos. Cada declaração possui propriedade, dois-pontos, valor e ponto e vírgula.

`#modal` procura um ID, `button` procura uma tag, `[hidden]` procura um atributo e `.lateral nav button` procura botões dentro da navegação da lateral. Seletores separados por vírgula compartilham declarações. `:hover` e `:focus-visible` representam estados; `::backdrop` representa uma parte especial do modal.

### 4.2 Um tema centralizado

As variáveis em `:root` são propriedades personalizadas de CSS:

```css
:root {
  --azul: #142d48;
  --laranja: #f7ae3b;
  --fundo: #f4f6f8;
}
```

`var(--azul)` recupera uma delas. A paleta usa azul na estrutura, laranja nas ações de destaque e superfícies claras para os registros. Bordas, textos suaves e sombras discretas ajudam a separar informações sem transformar cada bloco em um destaque.

O benefício prático é alterar várias áreas por uma variável. Algumas cores ainda aparecem diretamente no arquivo, e a logo SVG possui sua própria cor; mudar `--laranja` não altera automaticamente todas elas.

### 4.3 Tamanho previsível e conteúdo que não estoura

`* { box-sizing: border-box; }` faz largura e altura declaradas incluírem borda e preenchimento. Em um elemento de 200 px, aumentar o padding não acrescenta esse espaço por fora dos 200 px declarados.

`min-width: 0`, `overflow-wrap: anywhere` e `minmax(0, 1fr)` ajudam a evitar que textos compridos empurrem a grade para fora da tela. `overflow-x: auto` permite rolagem de tabelas quando elas não cabem.

`[hidden] { display: none !important; }` impede que regras de layout como `display: grid` façam reaparecer um elemento marcado como escondido. Esse é um uso localizado de `!important` para uma regra de estado.

### 4.4 Flexbox e Grid

Flexbox organiza principalmente linhas ou colunas: barra superior, grupos de botões, identificação de cliente e rodapé. `justify-content: space-between` distribui o espaço; `align-items: center` alinha os itens no eixo transversal; `gap` cria intervalos; `flex-wrap` permite quebrar a linha.

Grid organiza as grades de cartões, métricas, formulários e anexos:

```css
.metricas {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}
```

- `display: grid` ativa a grade.
- `repeat(4, ...)` cria quatro colunas com a mesma definição.
- `1fr` representa uma parte do espaço disponível depois dos intervalos e demais restrições.
- `minmax(0, 1fr)` permite que a coluna encolha, inclusive quando há conteúdo comprido.
- `gap` separa as células sem exigir margens individuais.

`grid-column: 1 / -1` faz um elemento ocupar todas as colunas, como o estado vazio de uma lista.

### 4.5 Lateral fixa e conteúdo deslocado

Em telas grandes, `.lateral` usa `position: fixed` e largura de 244 px. `.aplicacao` tem `margin-left: 244px` para deixar esse espaço livre. Se mudar uma medida, é necessário revisar a outra.

Dentro da lateral, `display: flex` e `flex-direction: column` organizam os elementos verticalmente. `margin-top: auto` empurra o rodapé para baixo quando sobra espaço.

O conteúdo principal tem largura máxima de 1500 px e margens automáticas, evitando linhas exageradamente largas em monitores grandes.

### 4.6 Componentes visuais reaproveitados

| Classes | Uso |
| --- | --- |
| `cartao`, `ordem-cartao` | Superfícies com padding, borda, arredondamento e sombra. |
| `primario`, `secundario`, `botao-link` | Hierarquia visual das ações. |
| `selo`, `verde`, `amarelo`, `vermelho` | Texto e cor para situações e resultados. |
| `grade-ordens`, `grade-clientes`, `duas-colunas` | Distribuição dos cartões. |
| `acoes`, `entre`, `pilha` | Grupos horizontais, itens separados e grupos verticais. |
| `vazio` | Orientação quando ainda não há registros ou o filtro não encontrou resultados. |
| `nota`, `erro`, `toast` | Informação contextual, falha e confirmação temporária. |
| `preservar` | Mantém quebras de linha do texto digitado com `white-space: pre-wrap`. |

O `G` grande do painel é um elemento HTML estilizado: rotação de -6 graus, sombra deslocada e tipografia. Ele não carrega outra imagem.

### 4.7 Responsividade real do arquivo

O CSS começa pelo layout de telas grandes e faz adaptações com `max-width`:

| Largura | Mudanças principais |
| --- | --- |
| Até 1180 px | Lateral menor, métricas em duas colunas, algumas áreas em uma coluna. |
| Até 800 px | Lateral vira bloco no topo, navegação rola horizontalmente, cartões de ordens ficam em uma coluna. |
| Até 520 px | Formulários em uma coluna, espaçamentos menores, itens do orçamento reorganizados, marca decorativa escondida. |

Em 500 px, as três media queries se aplicam; as regras se combinam pela cascata. Regras posteriores prevalecem quando têm a mesma especificidade e disputam a mesma propriedade. Não criamos um segundo site para celular.

`vw` e `vh` se relacionam à largura e altura da janela. `calc(100vw - 32px)` limita o modal, deixando espaço nas laterais. `max-height: 90vh` limita sua altura. `px` é usado na interface; `pt` e `mm`, no relatório impresso.

### 4.8 Controles, conversa e impressão

Os campos herdam a fonte do documento. Textareas só podem ser redimensionadas verticalmente. Checkboxes usam `accent-color`. Botões desativados mudam cursor e opacidade. `touch-action: manipulation` orienta gestos em controles, enquanto o foco por teclado continua visível.

A conversa tem altura limitada e rolagem vertical. O balão do cliente usa `margin-left: auto` para ficar à direita. `object-fit: contain` mostra a imagem anexada dentro de sua área sem cortá-la.

Indicadores usam o elemento nativo `progress`, sem biblioteca de gráficos. O JavaScript fornece os números; o CSS define sua aparência.

Para impressão, `@page` sugere A4 com 15 mm de margem. `@media print` apresenta somente a área de relatório quando o corpo está marcado como `imprimindo`. `break-inside: avoid` tenta evitar divisões em linhas de tabela e blocos de identificação; `break-after: avoid` tenta manter títulos junto ao conteúdo. A paginação final também depende do navegador e da impressora.

## 5. A logo SVG

SVG descreve formas e textos, em vez de guardar uma grade fixa de pixels. Por isso pode ser ampliado mantendo a definição das formas.

| Trecho | Significado |
| --- | --- |
| `xmlns` | Identifica o formato SVG. |
| `viewBox="0 0 300 72"` | Define o sistema interno de coordenadas e a proporção do desenho. |
| `role="img"`, `aria-labelledby` e `title` | Fornecem uma identificação acessível no SVG. |
| `rect` | Desenha o quadrado laranja. |
| `x`, `y`, `width`, `height` | Posicionam e dimensionam a forma. |
| `rx="14"` | Arredonda os cantos. |
| `fill` | Escolhe a cor de preenchimento. |
| `text` com `G` | Desenha a letra dentro do quadrado. |
| `text-anchor="middle"` | Centraliza o texto horizontalmente em relação à coordenada x. |
| Segundo `text` | Desenha o nome GoodMec ao lado. |

A palavra usa uma fonte disponível no computador; não foi convertida em curvas. A logo tem letras brancas e foi pensada para o fundo azul. No HTML que a carrega como imagem, `alt="GoodMec"` fornece a descrição.

## 6. JavaScript: conceitos que aparecem no projeto

Não usar framework ainda permite usar recursos modernos da própria linguagem. Estes são os mais presentes:

| Sintaxe | Explicação |
| --- | --- |
| `const` | A referência não pode ser reatribuída; um objeto apontado por ela ainda pode mudar. |
| `let` | A variável pode receber outro valor. |
| `{ nome: "Ana" }` | Objeto com propriedade e valor. |
| `[a, b]` | Array, uma lista ordenada. |
| `function ...` | Define uma função; os parâmetros recebem entradas. |
| `(valor) => ...` | Arrow function, outra forma de definir uma função. |
| `return` | Devolve um valor e encerra a função. |
| `if` | Executa algo se uma condição for verdadeira. |
| `===` e `!==` | Comparam valor e tipo, sem conversão automática entre tipos. |
| `&&`, `||`, `!` | E, OU e negação; também permitem avaliação condicional de expressões. |
| `condicao ? a : b` | Escolhe um resultado entre dois. |
| `valor ?? ""` | Usa vazio apenas se `valor` for `null` ou `undefined`. |
| `objeto?.propriedade` | Evita acessar a propriedade quando o objeto é `null` ou `undefined`. |
| `...lista` | Expande elementos; também ajuda a copiar uma lista superficialmente. |
| `...objeto` | Copia propriedades de um objeto superficialmente. |
| `{ o, item }` | Abrevia `{ o: o, item: item }`. |
| `({ o, item })` em parâmetro | Extrai propriedades do objeto recebido: desestruturação. |
| `for...of` | Percorre valores de uma coleção. |
| `.map()` | Transforma cada item em outro item, criando uma nova lista. |
| `.filter()` | Cria uma lista com os itens aprovados por uma condição. |
| `.find()` | Encontra o primeiro item correspondente. |
| `.some()` e `.every()` | Conferem se algum item ou todos os itens atendem a uma condição. |
| `.reduce()` | Acumula os itens em um resultado, como uma soma. |
| `.flatMap()` | Transforma e reúne listas em um nível, usado na tela de peças. |
| `.join("")` | Junta textos sem colocar separadores entre eles. |
| `.push()` e `.unshift()` | Adicionam ao fim ou ao início do array original. |
| `.slice()` | Produz um recorte sem modificar o array original. |
| `.sort()` e `.reverse()` | Alteram a ordem do próprio array; por isso às vezes copiamos antes. |
| `Object.entries()` | Transforma propriedades em pares de chave e valor. |
| `Object.fromEntries()` | Faz o caminho inverso: pares viram objeto. |
| `Object.assign()` | Copia propriedades para um objeto existente. |
| `new Set(...)` | Conjunto de valores únicos, usado para detectar duplicações. |
| `try`, `catch`, `finally` | Tratam falhas e executam a finalização de uma operação. |
| `throw new Error(...)` | Interrompe uma operação inválida. |
| `Promise`, `async`, `await` | Organizam resultados que chegam depois, como a leitura de um arquivo. |

Template literals usam crases e permitem interpolação:

```javascript
const nome = "Ana";
const frase = `Olá, ${nome}!`;
```

O resultado é `Olá, Ana!`. No projeto, a mesma técnica monta HTML. Isso exige tratar corretamente qualquer dado que entre na marcação.

## 7. modelo.js: dados e regras

### 7.1 Um módulo sem ferramenta de empacotamento

O arquivo envolve suas funções em uma função executada imediatamente, chamada IIFE. Esse escopo evita colocar cada função diretamente no objeto global.

No final, ele expõe um objeto chamado `API`. No navegador, esse objeto vira `window.GoodMec`; nos testes Node, vira `module.exports`. Aqui “API” significa o conjunto de funções disponíveis ao outro código. Não é uma chamada HTTP ao Java.

`typeof module !== "undefined"` permite verificar a variável mesmo quando ela não existe no navegador. `globalThis` é usado no ambiente sem `window`. O modo estrito, ativado por `"use strict"`, ajuda a detectar certas operações incorretas, como atribuir a uma variável não declarada.

### 7.2 O estado do aplicativo

`criarEstado()` devolve:

```javascript
{
  versao: 1,
  contador: 0,
  config: {
    oficina: "GoodMec", telefone: "", endereco: "",
    operador: "Equipe GoodMec", equipe: []
  },
  clientes: [], veiculos: [], ordens: [], agenda: [],
  lembretes: [], avisos: [], atendimentos: []
}
```

`estado` é o conjunto de registros com o qual a página trabalha. `versao` identifica o formato da base para leitura e importação; não é a versão de um relatório nem a versão publicada do aplicativo. `contador` ajuda a gerar IDs locais.

Cada entidade tem um papel:

- Cliente: nome, telefone e e-mail.
- Veículo: referência ao cliente, modelo, placa, quilometragem e ano.
- Ordem: referência ao cliente e veículo, problema, andamento, orçamento, relatório, anexos e histórico.
- Agenda: compromisso, motivo e situação da solicitação.
- Lembrete: retorno recomendado a partir de uma ordem.
- Aviso: prévia de uma mensagem gerada pelo sistema.
- Atendimento: pedido para falar com uma pessoa da oficina.

Os relacionamentos usam IDs. Um veículo guarda `clienteId: "c1"`, em vez de copiar o nome do cliente para ser sua referência. O cliente pode mudar de nome sem quebrar o vínculo. A cópia de identificação de um relatório tem outro propósito: preservar um documento histórico.

O prefixo indica o tipo: `c` para cliente, `v` para veículo, `o` para ordem, `i` para item, `f` para arquivo, `a` para agenda, `l` para lembrete, `n` para aviso e `h` para atendimento humano. IDs locais previsíveis não são senhas nem comprovam identidade.

### 7.3 Utilidades do modelo

| Função | O que faz e por quê |
| --- | --- |
| `agora` | Gera uma data ISO em UTC, adequada para guardar e comparar instantes. |
| `copiar` | Serializa e interpreta JSON para copiar os dados aninhados do estado. |
| `exigir` | Lança um erro quando uma condição não é atendida. |
| `texto` | Converte para texto e remove espaços nas pontas. |
| `obrigatorio` | Normaliza um texto e impede que fique vazio. |
| `id` | Incrementa o contador e acrescenta o prefixo. |
| `achar` | Busca por ID e acusa registro ausente. |
| `autor` | Recupera o nome configurado para identificar o histórico. |
| `dataDiaValida` | Confere formato e validade de uma data de calendário. |
| `historico` | Atualiza a data da ordem e acrescenta ação, autor e horário. |
| `aviso` | Acrescenta uma prévia de notificação, sem enviar mensagem externa. |

A cópia por JSON funciona aqui porque os registros são objetos, arrays, textos, números, booleanos e `null`. Não é uma cópia universal: funções, referências circulares e instâncias especiais exigiriam outro tratamento.

### 7.4 Normalizar antes de comparar

```javascript
let numero = texto(valor).replace(/\D/g, "");
```

`texto` prepara o valor; `replace` substitui partes dele; `/\D/g` procura todos os caracteres que não são dígitos; `""` remove esses caracteres. Assim, telefone com parênteses e telefone só com números passam a ter a mesma representação.

Números de 10 ou 11 dígitos recebem o DDI `55`; a regra final espera `55` e mais 10 ou 11 dígitos. Isso verifica o formato, não a existência do telefone nem sua posse.

Placas ficam em maiúsculas, sem espaços e hífen. A expressão `^[A-Z]{3}\d[A-Z0-9]\d{2}$` confere três letras, um dígito, um caractere alfanumérico e dois dígitos. `^` e `$` delimitam o texto inteiro; `{3}` e `{2}` indicam repetições.

### 7.5 Cadastros e edição

`registrarCliente` exige nome e telefone, evita telefone duplicado e decide entre criar ou editar pela presença de `chave`. Na edição, a busca de duplicidade ignora o próprio ID. O e-mail é normalizado como texto no modelo; o formulário usa `type="email"`.

`registrarVeiculo` confere a existência do cliente, placa única, modelo obrigatório, quilometragem inteira de 0 a 9.999.999 e ano opcional entre 1900 e o próximo ano. Na edição, preserva o proprietário: transferência de veículo não foi implementada.

`criarOrdem` confere cliente, veículo e vínculo, impede outra ordem não encerrada para o veículo e exige o problema relatado. Gera ID, número visível, datas e status `Recebido`. O número visível é o maior número já existente mais um; não é o mesmo contador usado pelos IDs.

Novas ordens entram no início da lista com `unshift`, aparecendo antes das antigas.

### 7.6 Andamento: distinguir regra e sequência sugerida

As situações de trabalho são `Recebido`, `Em diagnóstico`, `Aguardando aprovação`, `Em reparo` e `Em conferência`. `atualizarOrdem` permite selecionar essas situações enquanto o serviço não está concluído.

O código não obriga passar por todas em sequência, nem exige aprovação para selecionar manualmente `Em reparo`. Essas seriam regras adicionais. O que ele efetivamente bloqueia é finalizar pelo seletor comum: `Pronto para retirada` depende do relatório, e `Encerrado` depende da retirada.

`esperaPeca` e `pausa` ficam separados do status para representar condições paralelas. Diagnóstico, nota interna e atualização ao cliente também são campos distintos.

### 7.7 Orçamento, dinheiro e versões

`centavos` transforma um valor monetário em inteiro. `150,50` vira `15050`. `total` multiplica a quantidade pelo unitário e arredonda cada linha para centavos antes de somar.

```javascript
const total = (itens) => itens.reduce(
  (soma, item) => soma + Math.round(item.quantidade * item.unitario),
  0
);
```

1. `itens` é a lista de serviços e peças.
2. `reduce` percorre a lista, acumulando um número.
3. `soma` contém o resultado das linhas anteriores.
4. `item.quantidade * item.unitario` calcula a linha atual.
5. `Math.round` arredonda essa linha para um número inteiro de centavos.
6. O `0` é o valor inicial da soma e o resultado de uma lista vazia.

Valores unitários em centavos evitam acumular muitos dos problemas de somar preços decimais diretamente. Quantidades fracionadas e a conversão inicial ainda exigem arredondamento; não se trata de aritmética decimal arbitrária.

`salvarOrcamento` aceita de 1 a 100 itens, tipos `Serviço` ou `Peça`, quantidade positiva até 9999 e preços válidos. Preserva a versão anterior, aumenta a versão atual e volta a situação para `Rascunho`, retirando a resposta anterior dessa nova versão.

Um item pode preservar seu ID e acompanhamento de compra. Se descrição, tipo ou quantidade mudarem, o acompanhamento é reiniciado para não apresentar uma peça diferente como já recebida.

`solicitarAprovacao` exige orçamento em rascunho com itens, muda sua situação, ajusta a ordem e gera a prévia de notificação. `responderOrcamento` registra aprovação ou recusa, versão, data, autor e como a resposta foi recebida. É registro manual da equipe. Aprovar não muda automaticamente o serviço para `Em reparo`.

`atualizarCompra` altera a situação e previsão de uma peça em uma ordem ainda não encerrada. A tela de peças deriva dos itens dos orçamentos; não há uma base independente de estoque.

### 7.8 Relatório: documento com histórico

`salvarRelatorio` tem dois caminhos. O rascunho registra o preenchimento parcial sem concluir o serviço. A finalização exige trabalhos realizados e responsável, confere a data de retorno e cria uma versão final.

A versão final guarda:

- Trabalhos, peças utilizadas, conferências, recomendações e responsável.
- Data, autor e número da versão.
- Identificação da oficina, cliente, veículo, problema, diagnóstico e entrada daquele momento.
- Uma cópia dos itens aprovados quando a inclusão de valores foi marcada e é permitida.

Essa cópia histórica é um snapshot: editar o nome da oficina ou a quilometragem do veículo depois não altera a impressão de uma versão anterior. Uma correção preserva a versão anterior e cria outra. A nova versão pode refletir a identificação atual; a antiga permanece com sua cópia.

A primeira conclusão registra `concluidoEm`, muda a situação para `Pronto para retirada`, atualiza a mensagem pública, limpa espera por peça e pausa e gera uma prévia de aviso. Corrigir posteriormente preserva a primeira data de conclusão; uma ordem já encerrada continua encerrada.

Se houver retorno, a função atualiza o lembrete da ordem. Mantendo a mesma data, preserva a informação de que o acompanhamento já foi feito. Isso evita reabrir um lembrete resolvido por uma simples correção de texto.

`encerrarOrdem` exige status pronto e relatório, registra a retirada e atualiza a mensagem ao cliente. “Recomendação” e “trabalho realizado” são separados para não apresentar uma sugestão de manutenção como serviço executado.

### 7.9 Agenda, anexos e importação

`agendar` exige veículo do cliente escolhido, horário futuro e motivo. Recusa outro agendamento não cancelado com o mesmo instante inicial. Ainda não calcula duração, sobreposição de intervalos ou disponibilidade por mecânico.

`adicionarAnexo` limita a três arquivos por ordem e aceita Data URLs de JPG, PNG, WebP e PDF dentro do limite de texto definido. A interface verifica o arquivo original com limite de 1 MiB, exibido como “1 MB”. Converter para Base64 aumenta o volume, por isso o limite do texto é diferente. Essas verificações não fazem uma inspeção completa do conteúdo binário.

`validarEstado` verifica versão da base, tipos de coleções, IDs, contador, vínculos, duplicações, situações, itens, datas, histórico, relatórios e anexos. Retorna uma cópia somente depois de passar pelas verificações implementadas. Ler JSON com sucesso não significa que seu conteúdo seja uma base válida da oficina.

Essa função não é uma garantia de validade de qualquer regra possível: por exemplo, nem todos os limites de tamanho de formulários e todas as restrições de criação são rechecados de forma idêntica na importação. Ela também não autentica a origem do arquivo.

`exemplos` cria registros fictícios usando as mesmas funções de cadastro. Só é oferecido para uma base inicial vazia e marca as ordens como demonstração.

## 8. script.js: ligar a tela aos dados

### 8.1 Variáveis de inicialização

```javascript
const M = window.GoodMec;
const CHAVE = "goodmec.v1";
const $ = (seletor) => document.querySelector(seletor);
let estado = M.criarEstado();
```

1. `M` é um nome curto para as funções exportadas pelo modelo.
2. `CHAVE` é o nome usado para armazenar o JSON no navegador.
3. `$` é uma função nossa que procura um elemento. Não é jQuery.
4. `estado` começa com uma base vazia e pode ser substituído pela base local validada.

`pagina` guarda a seção ativa; `conversa`, as mensagens do simulador; `temporizadorToast`, o temporizador da mensagem; `backupIlegivel`, o texto original que falhou na leitura; `dadosNaoSalvos`, a existência de alterações que ainda estão apenas na sessão.

### 8.2 Desenhar é diferente de cadastrar

As funções de renderização montam a interface a partir do estado. Elas não deveriam criar uma ordem só para exibi-la.

| Função | Conteúdo produzido |
| --- | --- |
| `metricas` | Contagens calculadas das ordens existentes. |
| `cartaoOrdem` | Cartão reutilizado no painel e na lista de ordens. |
| `renderPainel` | Métricas, até quatro ordens não encerradas e três primeiros compromissos pendentes/confirmados na ordenação. |
| `renderOrdens` | Busca por número, cliente, veículo e placa, combinada com filtros. |
| `renderClientes` | Clientes, seus veículos e ações de cadastro/histórico. |
| `renderAgenda` | Compromissos e lembretes ordenados por data. |
| `renderPecas` | Itens do tipo peça reunidos de todas as ordens. |
| `renderIndicadores` | Distribuição por situação, tempo médio corrido e soma de orçamentos aprovados. |
| `renderConfiguracoes` | Dados da oficina e equipe; preserva um formulário de configuração em edição. |
| `renderAtendimento` | Clientes simulados, fila humana e até 20 prévias de avisos. |
| `renderizar` | Escolhe a função da página ativa por um objeto de funções. |

O painel chama alguns compromissos de “próximos”, mas atualmente filtra a situação, não exclui explicitamente todos os horários que já passaram. As métricas de tempo incluem noites e fins de semana. O total aprovado não representa pagamento recebido.

### 8.3 Transformar uma lista em cartões

Trecho real de uma renderização:

```javascript
lista.map((o) => cartaoOrdem(o)).join("")
```

`map` chama `cartaoOrdem` para cada ordem e produz um array de textos HTML. `join("")` reúne esses textos em um único HTML, sem as vírgulas que apareceriam na conversão comum de array para string.

A atribuição a `innerHTML` substitui o conteúdo da área. É simples para o tamanho deste protótipo, mas recria elementos: em sistemas maiores pode prejudicar desempenho, foco e valores ainda não salvos. O projeto toma alguns cuidados, como renderizar só a página atual e preservar a configuração marcada como alterada.

### 8.4 Impedir que texto digitado vire marcação

`h(valor)` transforma `&`, `<`, `>`, aspas duplas e aspas simples em entidades HTML antes de interpolar textos na marcação.

Exemplo: um nome `<b>Ana</b>` deve aparecer como esse texto, sem criar um elemento de negrito. `textContent` é usado quando só precisamos escrever texto, como título, erro e aviso.

Essa é uma proteção para os contextos HTML de texto e atributos delimitados usados aqui. Não torna qualquer URL, código JavaScript ou CSS seguro por si só. Arquivos e seus esquemas de URL têm validação própria. Argumentos de helpers que representam marcação, nomes de campos e atributos extras vêm do código, não de campos livres do usuário.

### 8.5 Helpers de apresentação

| Helper | Técnica |
| --- | --- |
| `dinheiro` | Divide centavos por 100 e formata como BRL em português brasileiro. |
| `data` | Apresenta datas no idioma local; datas sem horário recebem um horário local antes de formatar. |
| `numero` | Usa `padStart(3, "0")` para exibir 1 como 001, sem alterar o número guardado. |
| `cliente`, `veiculo`, `ordem` | Atalhos para buscar um registro pelo ID. |
| `encerrada` | Considera pronto ou encerrado como trabalho concluído para certos bloqueios e métricas. |
| `atrasada` | Confere previsão vencida em serviço ainda não concluído. |
| `textoBusca` | Decompõe acentos, remove os sinais combinantes comuns e usa minúsculas. |
| `localData` | Prepara uma data ISO para o valor de um campo `datetime-local`. |
| `opcoes` | Produz opções de select e marca a selecionada. |
| `botao` | Padroniza botão, classe, ação e ID. |
| `selo` | Associa situações a estilos, mantendo um texto visível. |
| `vazio` | Produz a orientação de lista vazia. |
| `campo`, `area` | Reutilizam a construção de inputs e textareas. |
| `textoLongo` | Escapa texto e preserva suas quebras de linha na apresentação. |
| `rodapeForm` | Reutiliza as ações de cancelar e salvar. |

Para pesquisar `João` digitando `joao`, `textoBusca` é aplicada à consulta e ao texto pesquisado. Sem normalizar ambos, a comparação ficaria inconsistente.

Há uma diferença de significado em `encerrada`: o helper engloba também `Pronto para retirada`; a regra que impede uma segunda ordem verifica especificamente `status !== "Encerrado"`. Portanto, um veículo pronto ainda não pode receber outra ordem até a retirada.

### 8.6 Delegação de eventos

Trecho simplificado do listener de clique:

```javascript
document.addEventListener("click", (evento) => {
  const b = evento.target.closest("button");
  if (!b) return;
  const acao = b.dataset.acao;
  if (acao === "nova-ordem") novaOrdem();
});
```

1. O documento recebe os cliques que se propagam dos elementos.
2. `evento.target` é o ponto de origem do clique.
3. `closest("button")` encontra o botão, mesmo quando clicamos em um elemento dentro dele.
4. Se não houve botão, `return` encerra o tratamento.
5. `dataset.acao` lê a instrução declarada no HTML.
6. A ação correspondente abre o formulário.

Esse cuidado permite que botões criados por `innerHTML` funcionem sem registrar um listener individual a cada renderização. Chamamos isso de delegação de eventos.

### 8.7 Coletar e converter dados do formulário

```javascript
evento.preventDefault();
const form = evento.target;
const dados = Object.fromEntries(new FormData(form));
```

`preventDefault` cancela o envio tradicional que navegaria ou recarregaria a página. `FormData` coleta os campos participantes com `name`. `Object.fromEntries` transforma os pares em um objeto, acessível por `dados.nome`.

Os campos comuns chegam como texto; números precisam ser convertidos. Uma caixa marcada, sem valor personalizado, chega como `"on"`; desmarcada, normalmente não entra na coleta. Por isso fazemos `dados.esperaPeca === "on"`.

Os itens de orçamento usam `data-campo` e são coletados linha por linha, pois existem várias descrições, quantidades e preços no mesmo formulário. `evento.submitter` identifica o botão que enviou o formulário e permite distinguir rascunho de conclusão.

### 8.8 Alterações sem registros pela metade

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

1. Recebe uma operação como parâmetro: funções também podem ser passadas como valores.
2. Faz uma cópia dos dados atuais, incluindo objetos aninhados.
3. Executa a regra sobre a cópia. Uma exceção interrompe a função neste ponto.
4. Substitui o estado somente depois de a operação terminar sem erro.
5. Tenta persistir o novo estado.
6. Atualiza a interface.
7. Mostra sucesso ou informa que os dados estão apenas na sessão.
8. Devolve o resultado, como o ID criado.

Na abertura de atendimento com cliente e veículo novos, as três criações ocorrem dentro da mesma operação sobre a cópia. Se a placa for inválida, o cliente recém-criado nessa tentativa também não entra na base principal.

É uma proteção local contra falhas de validação, inspirada na ideia de uma transação. Não é uma transação de banco de dados: se o `localStorage` falhar depois, o estado novo continua na memória para poder ser exportado.

### 8.9 Navegação, mensagens e edição não salva

`navegar` verifica o destino na lista `TITULOS`, alterna `hidden`, atualiza `aria-current`, o título visível e a aba do navegador e chama `renderizar`. Um destino desconhecido volta ao painel. `hashchange` acompanha alterações do fragmento da URL.

`toast` mostra uma mensagem por cinco segundos. Cancela o temporizador anterior antes de agendar outro, evitando que o temporizador da mensagem velha esconda a nova. `falhar` apresenta o erro dentro do modal, se ele estiver aberto; fora dele, usa o toast.

`abrir`, `fechar`, `salvoModal` e `confirmarSaida` controlam a janela. `dataset.sujo = "sim"` marca alterações ainda não enviadas. Fechar ou substituir a janela consulta essa marca; salvar limpa a marca. O formulário de configuração também tem seu próprio indicador de edição.

`beforeunload` solicita ao navegador um aviso antes de sair quando existe alteração pendente. O navegador decide as condições de exibição; ele não é uma garantia de recuperação e não oferece um texto personalizado confiável para esse aviso.

### 8.10 Mapa dos formulários e detalhes da ordem

| Função | Responsabilidade |
| --- | --- |
| `selectClientes` | Cria o seletor com IDs e nomes dos clientes. |
| `opcoesVeiculos` | Mostra só veículos do cliente escolhido. |
| `campoTecnico` | Oferece sugestões dos nomes da equipe. |
| `novoCliente` | Abre cadastro ou edição conforme a existência de um ID. |
| `novoVeiculo` | Exige cliente antes de cadastrar e preserva proprietário na edição. |
| `novaOrdem` | Oferece cadastro novo completo ou seleção de registros existentes. |
| `novoAgendamento` | Solicita cliente, veículo, horário e motivo. |
| `historicoVeiculo` | Reúne ordens associadas ao veículo. |
| `servicoOrdem` | Mostra andamento, diagnóstico, previsão e textos públicos/internos. |
| `linhaOrcamento` | Gera uma linha de serviço ou peça. |
| `orcamentoOrdem` | Mostra itens, total, aprovação e versões antigas. |
| `relatorioOrdem` | Mostra o relatório atual, versões e ações de impressão/correção. |
| `anexosOrdem` | Mostra upload local, classificação e downloads. |
| `abrirOrdem` | Reúne cabeçalho, botões e conteúdo da aba escolhida. |
| `formularioRelatorio` | Monta conclusão, rascunho ou correção de uma versão existente. |
| `responderOrcamento` | Registra manualmente a resposta recebida do cliente. |
| `editarCompra` | Abre situação e previsão de chegada da peça escolhida. |
| `atualizarTotal` | Calcula a prévia enquanto o usuário digita, antes de salvar o orçamento. |

A ordem tem cinco áreas: atendimento, orçamento, relatório, anexos e histórico. O histórico aparece do evento mais recente para o mais antigo; `[...o.historico].reverse()` copia antes de inverter para não alterar a ordem guardada.

### 8.11 O que cada listener acompanha

| Evento | Ações |
| --- | --- |
| `click` | Navegar, abrir detalhes/formulários, trocar abas, gerar exemplos, adicionar/remover itens, aprovação, retirada, compras, anexos, agenda, lembretes, atendimento e cópias. |
| `input` | Marcar alterações não salvas, recalcular orçamento e pesquisar enquanto digita. |
| `change` | Alternar modo de cadastro, atualizar veículos do cliente, aplicar filtros, trocar cliente/ordem do bot e importar arquivo. |
| `submit` | Coletar e converter os campos, chamar a operação apropriada e atualizar a interface. |
| `cancel` | Tratar Escape no modal sem descartar alterações silenciosamente. |
| `afterprint` | Esconder a área temporária de impressão e retirar a classe do corpo. |
| `hashchange` | Navegar a partir do fragmento da URL. |
| `beforeunload` | Solicitar aviso de saída com dados pendentes. |

Algumas operações menores, como marcar um lembrete feito, ficam diretamente nos handlers de `script.js`, dentro de `alterar`. A separação entre interface e regra já existe, mas ainda não é completa em todas as ações.

## 9. Acompanhando uma ação do início ao fim

Ao cadastrar uma ordem com cliente novo:

1. O clique em “Nova ordem” chega ao listener de `click`.
2. `data-acao="nova-ordem"` seleciona `novaOrdem()`.
3. A função monta o formulário e o entrega a `abrir()`.
4. O usuário preenche e envia. O navegador aplica as verificações HTML usuais.
5. O listener de `submit` cancela a navegação e coleta os campos.
6. `alterar()` cria a cópia do estado.
7. `registrarCliente()` cria o cliente nessa cópia.
8. `registrarVeiculo()` cria o veículo associado a esse cliente.
9. `criarOrdem()` confere os vínculos e cria a ordem.
10. Se uma regra falhar, o `catch` mostra o erro; o estado principal ainda não foi substituído.
11. Com sucesso, a cópia passa a ser o estado atual e `guardar()` tenta persistir.
12. A tela é redesenhada, a mensagem é mostrada e a nova ordem é aberta.

Essa sequência é um bom lugar para praticar breakpoints: comece no evento `submit`, entre em `alterar` e siga até `criarOrdem`. Observe o `estado` original e a `copia` antes e depois de uma falha de placa.

## 10. Datas: apresentação e armazenamento

`toISOString()` grava instantes em UTC, com `Z` no final. `toLocaleString("pt-BR")` mostra esses instantes no formato e fuso do ambiente. Um `datetime-local` não carrega o fuso no texto; o JavaScript converte a entrada local para ISO antes de salvar.

Datas de calendário, como retorno, usam `YYYY-MM-DD`, sem horário. A função de apresentação acrescenta meio-dia local antes de formatar essas datas, evitando tratá-las simplesmente como meia-noite UTC e mostrar o dia anterior em alguns fusos.

`dataDiaValida` não aceita apenas uma expressão regular: confere se o resultado normalizado pelo objeto Date continua sendo a data informada. Isso ajuda a recusar datas inexistentes. Datas e fusos merecem regras mais explícitas quando houver várias oficinas ou usuários em locais diferentes.

## 11. Impressão e preservação do documento

`imprimirRelatorio` escolhe a versão atual ou uma versão anterior. Usa a identificação guardada naquela versão, preenche o artigo `impressao`, mostra a área, aplica `body.imprimindo` e chama `window.print()`.

O navegador abre a impressão, onde o usuário pode selecionar “Salvar como PDF”. Não existe ainda uma biblioteca de geração de PDF nem um arquivo automaticamente guardado no servidor.

O relatório contém problema, diagnóstico, trabalho realizado, materiais, conferências e recomendações. Não inclui `notaInterna` nem o motivo interno de pausa. Quando habilitados, os valores são uma referência ao orçamento aprovado, usando os itens copiados para a versão do relatório.

`afterprint` restaura a apresentação normal. As regras de impressão escondem a navegação, os botões, o modal e os demais elementos da aplicação enquanto o relatório é impresso.

## 12. Simulador de WhatsApp

Não existe integração externa nem modelo de inteligência artificial nesta etapa. `assuntoMensagem` normaliza a pergunta e procura palavras-chave com expressões regulares:

- Atendente, pessoa, humano, falar ou agendar: atendimento humano.
- Orçamento, preço ou valor: orçamento.
- Relatório, feito ou realizado: relatório.
- Status, situação, andamento, pronto, carro ou veículo: situação.
- Sem correspondência: orientação com os assuntos disponíveis.

Como as regras são testadas nessa ordem, a primeira correspondência prevalece. Uma pergunta com “falar” e “orçamento” pode ir para atendimento humano. Os botões de atalho escolhem diretamente um assunto.

`dadosMensagem` lê o valor do campo de mensagem e usa `trim()` para retirar espaços das pontas antes de classificar e enviar o texto ao simulador.

`preencherOrdensBot` filtra as ordens pelo cliente simulado. `respostaBot` confere novamente o vínculo antes de responder. A resposta de status usa atualização pública, situação, informações apropriadas de prazo e última atualização. O motivo interno da pausa não é enviado; aparece uma mensagem genérica sobre a pausa.

Orçamentos em rascunho não exibem itens ao cliente. Relatórios só são apresentados depois de concluídos. Anexos aparecem na conversa apenas quando marcados como públicos.

`enviarBot` registra as mensagens na lista da conversa; `renderConversa` monta balões e rola até o final. São mantidas as últimas 60 mensagens dessa lista. Trocar o cliente ou o atendimento limpa a conversa.

Pedidos humanos vão para a fila local, sem duplicar um pedido pendente para o mesmo cliente e ordem. Resolver um pedido permite registrar outro futuramente. As notificações são prévias locais; nenhuma mensagem é enviada ao WhatsApp.

A identidade é simulada escolhendo um cliente no seletor. Esse filtro não equivale a autenticação: o navegador da equipe contém a base inteira. A integração real precisa verificar identidade e autorização no servidor.

## 13. Salvamento, cópias e recuperação

`localStorage` guarda texto. `JSON.stringify(estado)` transforma objetos em texto para salvar; `JSON.parse` reconstrói os dados ao abrir. A base é guardada com a chave `goodmec.v1`.

A leitura e a escrita estão em `try/catch` porque o navegador pode bloquear o acesso, atingir a quota ou conter um texto inválido. Se a base anterior não passa na leitura/validação, `backupIlegivel` conserva o texto original e impede sua substituição automática por uma base vazia.

Existem duas exportações distintas nesse caso: a sessão atual e os dados originais para recuperação. O aplicativo sinaliza quando os registros da sessão ainda não foram salvos.

`baixarArquivo` usa `Blob`, cria um endereço temporário com `URL.createObjectURL`, prepara um link de download, aciona o link e depois libera o endereço com `URL.revokeObjectURL`. O endereço temporário não publica o arquivo na internet.

`exportar` cria JSON legível, com indentação de dois espaços e nome contendo a data. `importar` verifica o limite de 20 MiB, lê o texto, interpreta o JSON e valida a base candidata antes de pedir confirmação para substituir os registros. Não faz mesclagem de bases.

`lerArquivo` usa `FileReader` e uma Promise para obter uma Data URL. Durante a leitura de um anexo, o botão fica desativado; `finally` restaura o controle. Depois da leitura, o código confere se o formulário ainda é o mesmo antes de reabrir os anexos, evitando substituir outra janela que o usuário tenha aberto nesse intervalo.

O armazenamento é local ao ambiente do navegador. Não há sincronização entre computadores nem tratamento completo de conflitos entre abas. Mudar a origem de acesso, como passar de arquivo local para servidor HTTP, pode resultar em outra área de armazenamento. A integração futura precisa prever a transferência dos dados explicitamente.

## 14. Testes, npm e a pasta node_modules

O site não carrega jsdom, React ou qualquer biblioteca do npm. Node é usado como ferramenta de teste.

`package.json` define `npm test` como `node --test testes/*.test.js` e inclui jsdom em `devDependencies`. `private: true` impede publicação acidental desse pacote pelo npm; isso não torna o repositório GitHub privado.

`package-lock.json` registra versões concretas das dependências e ajuda a reproduzir a instalação. `npm ci` usa esse registro. `node_modules` contém os arquivos instalados; não é o lugar de escrever funcionalidades do GoodMec.

O `node_modules/rrweb-cssom/build/CSSOM.js` que apareceu no editor pertence a uma dependência usada no contexto dos testes com jsdom. CSSOM significa modelo de objetos do CSS; esse arquivo não é o estilo do site. O arquivo do projeto que você edita para mudar a aparência é `style.css`.

Os testes se dividem em três grupos:

| Grupo | O que verifica |
| --- | --- |
| `testes/modelo.test.js` | Regras: duplicidade, estados, orçamento, relatório, notas internas, anexos e cópias. |
| `testes/interface.test.js` | Elementos e eventos: abrir formulário, preencher, enviar, exibir erro, persistir e montar impressão. |
| `backend/testes/api.test.js` | Contrato HTTP real do servidor Java, incluindo erros e vínculos. |

Nos testes de interface, jsdom cria um DOM em memória. Algumas APIs, como imprimir e abrir o dialog, recebem implementações substitutas para verificar o fluxo. O teste da impressão inspeciona o conteúdo montado, não uma folha física ou imagem de PDF.

Os testes Java iniciam um processo em uma porta livre usando `0`, fazem chamadas com `fetch` e encerram os processos ao fim. No Windows, descobrem o executável real do JDK porque o comando `java` do PATH pode ser apenas um lançador que cria outro processo.

A etapa anterior passou em 24 testes do front end e 10 cenários HTTP, exibidos pelo executor como 11 testes incluindo o agrupamento. Uma explicação ou edição documental não substitui uma nova execução quando o código mudar. Os testes de DOM não comprovam a qualidade visual em todos os navegadores, nem cobrem todos os cenários possíveis.

## 15. Java: como começou o back end

Escolhemos Java 21 sem framework, conforme a preferência para o curso. IntelliJ é a IDE: edita, compila, executa e permite depurar. Java é a linguagem; JDK é o conjunto de ferramentas; a JVM executa o bytecode.

O código usa classes tradicionais, atributos, construtores, métodos, listas, mapas e condicionais. Não há Spring Boot, Maven ou Gradle nessa etapa. O servidor vem do módulo `jdk.httpserver` do JDK.

### 15.1 Cliente, Veiculo e OrdemServico

Uma classe descreve um tipo de objeto. O construtor recebe os valores iniciais. Atributos `private` não podem ser acessados diretamente por outras classes. `final` impede reatribuir o atributo depois da inicialização; os atributos dos modelos atuais são Strings e números, então os registros não possuem campos mutáveis expostos.

```java
private final String nome;

public Cliente(String id, String nome, String telefone, String email) {
    this.id = id;
    this.nome = nome;
    this.telefone = telefone;
    this.email = email;
}
```

`String` é o tipo texto. `this.nome` é o atributo do objeto; `nome` é o parâmetro recebido pelo construtor. Um getter como `getId()` devolve o valor sem permitir sua alteração. `paraJson()` descreve os campos que serão devolvidos na resposta.

`Veiculo` guarda a referência ao cliente e `km` como `int`. `OrdemServico` guarda cliente, veículo e problema; seu construtor define o instante da entrada e o status `Recebido`. Nesta versão não existe método para atualizar o status Java.

### 15.2 OficinaService

Esta classe reúne regras e listas de registros. `List<Cliente>` representa uma lista cujos elementos são clientes. `new ArrayList<>()` cria a implementação concreta da lista. O atributo pode ser `final` e ainda receber novos elementos: a referência fica fixa, o conteúdo da lista não.

`Map<String, String>` associa os nomes dos campos aos textos recebidos. `Set<String>` representa nomes únicos, útil para a lista de campos permitidos.

| Método | Responsabilidade |
| --- | --- |
| `cadastrarCliente` | Nome, telefone normalizado, formato básico de e-mail, limites e duplicação. |
| `cadastrarVeiculo` | Cliente existente, modelo, placa, km, ano e duplicação. |
| `abrirOrdem` | Cliente, veículo, vínculo, problema e apenas uma ordem aberta por veículo. |
| `buscarCliente`, `buscarVeiculo`, `buscarOrdem` | Encontrar pelo ID ou produzir erro de registro ausente. |
| `listarClientes`, `listarVeiculos`, `listarOrdens` | Devolver cópias das listas. |
| `campo` | Ler valor ou vazio, remover espaços externos e conferir limite. |
| `obrigatorio` | Fazer essas verificações e também recusar vazio. |

No Java, `.equals()` compara o conteúdo das Strings. `==` entre referências de objetos não tem esse mesmo significado. `Integer.parseInt` transforma texto numérico em inteiro. As expressões regulares restringem os valores antes de certas conversões.

Os IDs só são gerados depois das validações. As listagens devolvem novas listas para que outro código não adicione ou remova registros da lista interna. Essa é uma cópia superficial; funciona com os modelos atuais, cujos campos não podem ser modificados por setters.

### 15.3 Aplicacao e main

`public static void main(String[] args)` é o ponto de entrada. `public` permite acesso, `static` dispensa criar uma instância para chamar esse método, `void` indica ausência de retorno e `String[] args` recebe os argumentos de execução.

```java
OficinaService oficina = new OficinaService();
InetSocketAddress endereco = new InetSocketAddress("127.0.0.1", porta);
HttpServer servidor = HttpServer.create(endereco, 0);
servidor.createContext("/", new ApiHandler(oficina));
servidor.start();
```

1. Cria uma oficina com listas inicialmente vazias.
2. Combina o IP do próprio computador e a porta, normalmente 8080.
3. Cria o servidor. O `0` dessa chamada é o tamanho padrão da fila de conexões, não a porta.
4. Encaminha as solicitações ao handler, que recebe a mesma instância de oficina.
5. Inicia o servidor. O processo permanece ativo para atender solicitações.

`createContext("/")` recebe os caminhos; o handler confere quais são válidos. O executor padrão atende as solicitações uma por vez nesta implementação. Essa simplicidade não equivale a uma solução de concorrência para uma aplicação maior.

### 15.4 ApiHandler: a camada HTTP

`implements HttpHandler` declara o contrato implementado. `@Override` ajuda o compilador a conferir o método correspondente. `HttpExchange` representa uma solicitação e sua resposta.

| Método | Passo |
| --- | --- |
| `handle` | Verifica origem, encaminha, trata erros conhecidos e inesperados e fecha a troca no `finally`. |
| `encaminhar` | Verifica caminho, método, recurso e identificador; escolhe consulta ou cadastro. |
| `consultar` | Converte um registro ou uma lista em JSON. |
| `lerFormulario` | Confere formato e tamanho do corpo, separa campos e decodifica os valores. |
| `validarCampos` | Recusa nomes de campos não previstos para o recurso. |
| `exigirMetodo` | Recusa métodos incompatíveis e informa os aceitos no cabeçalho `Allow`. |
| `validarOrigem` | Restringe Host e Origin aos endereços locais esperados. |
| `responder` | Define os cabeçalhos, tamanho em bytes e conteúdo da resposta. |

As rotas são `GET /api/saude`, `GET` e `POST` nas coleções `/api/clientes`, `/api/veiculos` e `/api/ordens`, além de `GET` pelo ID de cada registro. Não há edição, exclusão, busca com filtros ou relatório no back end ainda.

O corpo POST usa `application/x-www-form-urlencoded`: por exemplo, `nome=Ana&telefone=11999990001`. O código separa por `&`, divide cada campo só no primeiro `=` e usa `URLDecoder` para recuperar caracteres codificados. Isso evita construir um interpretador JSON de entrada sem biblioteca.

São lidos no máximo 16.385 bytes: um a mais que o limite de 16.384. Esse byte adicional permite detectar excesso sem carregar um corpo inteiro arbitrariamente grande. Campos repetidos e desconhecidos são recusados; cadastrar ordem enviando `status=Encerrado` não altera o status inicial.

A resposta usa JSON. `Content-Type` declara seu tipo e codificação; `Cache-Control: no-store` pede para não armazená-la em cache; `X-Content-Type-Options: nosniff` orienta o navegador a respeitar o tipo declarado. Em um cadastro bem-sucedido, `Location` indica onde consultar o registro criado.

UTF-8 pode representar um caractere com mais de um byte. Por isso o tamanho da resposta usa `bytes.length`, não `json.length()`. O tratamento de HEAD omite o corpo mesmo quando o método é recusado.

### 15.5 Erros e JSON

`ErroApi` estende `RuntimeException`, acrescentando o código HTTP. `super(mensagem)` inicializa a parte herdada da exceção. `throw` interrompe o fluxo; `catch` escolhe como responder.

Os códigos usados são 200 para consulta, 201 para criação, 400 para entrada inválida, 403 para origem/endereço recusado, 404 para ausência, 405 para método, 409 para conflito, 413 para tamanho, 415 para formato e 500 para erro inesperado.

`Json.texto` protege aspas, barras, caracteres de controle e unidades UTF-16 especiais ao escrever JSON. `StringBuilder` acumula a resposta. `Json.lista` reúne objetos já produzidos pelo programa; `Json.erro` padroniza a mensagem. Essa classe escreve JSON, mas não lê JSON enviado pelo cliente.

Juntar strings para esse conjunto pequeno de respostas mantém a primeira versão sem dependências, mas exige cuidado manual. As classes de dados conhecem a serialização; essa é uma simplificação da arquitetura atual.

### 15.6 Compilar, executar e testar

`executar.ps1` usa a pasta do próprio script para localizar os fontes, cria `out` e chama `javac --release 21 -encoding UTF-8 -d ...`. Isso converte arquivos `.java` em `.class`. Depois executa `java -cp ... br.com.goodmec.Aplicacao` ou os testes, conforme `-Testar`.

`-cp` informa onde procurar classes. `--release 21` define o alvo Java 21. O script verifica códigos de saída e interrompe quando há falha. O IntelliJ oferece uma forma visual de compilar e executar o mesmo `main`.

O guia `backend/README.md` contém os passos completos de importação na IDE e comandos PowerShell para criar cliente, veículo e ordem.

## 16. Git e GitHub

Git guarda versões localmente; GitHub hospeda o repositório remoto. `origin` é um apelido do endereço remoto e `main` é a branch atual do projeto.

O fluxo habitual é conferir com `git status`, preparar os arquivos com `git add`, revisar o que foi preparado, criar um `git commit` e enviar com `git push`. Commit e push são etapas distintas. Salvar um arquivo no editor não executa nenhuma delas automaticamente.

O `.gitignore` exclui de novos registros dependências instaladas, logs, arquivos de ambiente, cópias exportadas, classes compiladas e configurações locais de IDE. Um arquivo já versionado continua no histórico mesmo que depois passe a corresponder a um padrão ignorado.

O código-fonte, os testes, as instruções e o lockfile permitem reconstruir o projeto. A pasta `node_modules` e os arquivos `.class` são resultados reproduzíveis, não a fonte que devemos editar.

## 17. Detalhes que merecem atenção na próxima evolução

Estas observações descrevem o código atual; este guia não alterou o funcionamento da aplicação.

1. Existem oito fechamentos `</span>` sem abertura correspondente nos botões do menu em `index.html`, deixados após retirar a numeração. São marcações sobrando, não uma técnica de HTML. Há também estilos para esses antigos spans.
2. O JavaScript contém funções e marcações compactadas em linhas longas. Isso reduz linhas, mas dificulta estudar e depurar. Dividir expressões em nomes claros costuma facilitar o aprendizado.
3. Cliente, veículo e ordem Java ainda não têm todos os campos e operações do modelo JavaScript. Os contratos e limites também precisam ser alinhados: por exemplo, problema permite 3000 caracteres no formulário e 2000 na API inicial.
4. O controle de situação ainda não é uma sequência rígida com todas as transições de negócio. Aprovação, início do reparo e conclusão precisam ter regras definidas conforme o funcionamento real da oficina.
5. Nem o nome do operador nem a função da equipe representam uma conta autenticada. O histórico local pode ser alterado por quem controla a base.
6. Anexos em Base64 e cópias completas do estado atendem ao protótipo, mas aumentam espaço e trabalho a cada salvamento.
7. Persistência compartilhada, tratamento de concorrência, identidade e WhatsApp real ainda faltam. A restrição local da API não substitui login e autorização.
8. A aparência responsiva, o uso por teclado e a paginação do relatório precisam de conferência visual nos ambientes de uso; testes em memória não fazem essa avaliação.

## 18. Exercícios para entender o que já existe

Use registros fictícios e faça uma cópia antes de experimentar alterações na base.

1. Localize o botão “Nova ordem” no HTML e siga `data-acao` até `novaOrdem` no JavaScript.
2. Em uma cópia do CSS, altere `--azul` e observe quais áreas mudam; confira por que a cor dentro do SVG não muda junto.
3. Pesquise um cliente acentuado sem digitar acentos e acompanhe `textoBusca`.
4. Cadastre telefone com pontuação e tente repeti-lo sem pontuação; acompanhe a normalização.
5. Tente abrir uma ordem com placa inválida no modo de cliente novo; confira que não ficou um cliente criado pela metade.
6. Monte um orçamento de duas peças a R$ 12,50 e um serviço de R$ 80,00. O resultado deve ser 10500 centavos, exibidos como R$ 105,00.
7. Registre a aprovação e altere o orçamento. Veja a nova versão em rascunho e a aprovação guardada na anterior.
8. Salve um rascunho de relatório e confira que isso não liberou o veículo. Conclua depois com trabalho e responsável.
9. Corrija um relatório e compare as duas versões. Altere dados do cliente e confira a identificação preservada na versão antiga.
10. Coloque um texto exclusivo em `notaInterna` e confira que ele não aparece na consulta pública nem no relatório impresso.
11. Leia os testes correspondentes aos casos anteriores e identifique preparação, ação e verificação (`assert`).
12. Execute o Java, crie cadastros pela API, encerre e execute novamente. Observe a diferença entre a lista em memória e a persistência do navegador.

Para estudar o primeiro caminho completo, mantenha abertos `index.html`, `script.js` e `modelo.js`: identifique o controle, encontre seu evento, acompanhe a regra e observe como o resultado volta à tela.
