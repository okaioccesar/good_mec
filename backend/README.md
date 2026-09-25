# GoodMec — primeiro back end em Java

Esta etapa usa **Java 21, sem framework e sem dependências externas**. O servidor HTTP faz parte do próprio JDK. O IntelliJ é o editor em que você abre, executa e depura o programa.

Já é possível cadastrar e consultar clientes, veículos e ordens por HTTP. As regras conferem campos obrigatórios, telefone, placa, quilometragem, ano, vínculo entre cliente e veículo e duplicidade de uma ordem aberta.

**Os cadastros ficam na memória e são apagados ao parar o Java.** Esta é uma API local de aprendizado, ainda sem banco de dados, login ou WhatsApp. Use os dados fictícios dos exemplos.

O front end principal continua usando o armazenamento do navegador. Ele ainda **não está conectado a esta API**, e seus dados não são transferidos automaticamente. A ordem Java contém apenas os campos desta primeira etapa; ainda não substitui a ordem completa de `modelo.js`.

## 1. Executar no IntelliJ

1. Acesse **File → New → Project from Existing Sources…**. Se a opção estiver escondida, pressione **Ctrl+Shift+A** e procure `Project from Existing Sources`.
2. Selecione a pasta `C:\GoodMec(Descomplica)\backend`.
3. Escolha **Create project from existing sources**. Mantenha o projeto nessa pasta e avance.
4. Confirme `backend\src` como pasta de código-fonte. Não é necessário adicionar bibliotecas.
5. Selecione o **JDK 21**. Neste computador, ele foi encontrado em `C:\Program Files\Java\jdk-21.0.12.1`. Se não aparecer na lista, use **Add JDK** e indique essa pasta, sem selecionar a subpasta `bin`.
6. Conclua a importação. Abra `src → br → com → goodmec → Aplicacao.java`.
7. Clique no triângulo verde ao lado de `main` e selecione **Run 'Aplicacao.main()'**.
8. O console deve mostrar `GoodMec API: http://127.0.0.1:8080`. Abra `http://127.0.0.1:8080/api/saude` no navegador, ou consulte essa URL pelo terminal.

A resposta esperada é:

```json
{"aplicacao":"GoodMec","status":"online","armazenamento":"memoria"}
```

O programa continua em execução para receber solicitações. Para encerrar, use o botão **Stop** do IntelliJ. Se o editor indicar que o arquivo está fora da pasta de fontes, clique com o botão direito em `src` e use **Mark Directory as → Sources Root**. Se precisar conferir o JDK, abra **File → Project Structure → Project → SDK**.

As etapas de importação seguem o [guia oficial do IntelliJ para código existente](https://www.jetbrains.com/help/idea/import-project-or-module-wizard.html). A aparência dos menus pode variar conforme a versão instalada.

## 2. Executar pelo terminal

No PowerShell, a partir da raiz do projeto:

```powershell
.\backend\executar.ps1
```

O script compila as classes em `backend\out` e inicia o servidor. Ele não instala nenhum pacote. Use **Ctrl+C** para parar. Se você já estiver com o terminal dentro de `backend`, use `./executar.ps1`.

Para escolher outra porta:

```powershell
.\backend\executar.ps1 -Porta 8081
```

Se aparecer `Address already in use`, pode existir outra execução usando a mesma porta. Pare a execução anterior ou escolha outra porta. No IntelliJ, a porta também pode ser passada em **Run → Edit Configurations → Program arguments**, por exemplo `8081`.

Se a política do Windows bloquear scripts PowerShell, execute pelo `main` do IntelliJ. Não é necessário alterar a política do computador.

## 3. Fazer o primeiro cadastro

Deixe o servidor ativo e abra **outro terminal PowerShell**. Estes comandos usam dados fictícios; execute-os na sequência. Se estiver usando outra porta, ajuste `$api`.

```powershell
# Guarda o endereço da API para reutilizá-lo nas próximas solicitações.
$api = 'http://127.0.0.1:8080/api'

# GET consulta a saúde do servidor.
Invoke-RestMethod -Uri "$api/saude"

# POST envia campos de formulário e cria um cliente.
# A resposta fica guardada em $cliente, incluindo seu identificador.
$cliente = Invoke-RestMethod -Method Post -Uri "$api/clientes" `
    -ContentType 'application/x-www-form-urlencoded; charset=UTF-8' `
    -Body @{ nome = 'Ana Exemplo'; telefone = '11999990001'; email = '' }

# Usa o identificador devolvido pelo servidor para cadastrar o veículo desta cliente.
$veiculo = Invoke-RestMethod -Method Post -Uri "$api/veiculos" `
    -ContentType 'application/x-www-form-urlencoded; charset=UTF-8' `
    -Body @{ clienteId = $cliente.id; modelo = 'Palio'; placa = 'ABC1D23'; km = '80000'; ano = '2016' }

# A ordem relaciona os dois cadastros e descreve o problema relatado.
$ordem = Invoke-RestMethod -Method Post -Uri "$api/ordens" `
    -ContentType 'application/x-www-form-urlencoded; charset=UTF-8' `
    -Body @{ clienteId = $cliente.id; veiculoId = $veiculo.id; problema = 'Motor com ruido' }

# Mostra a ordem criada e depois consulta a lista de ordens pelo servidor.
$ordem
Invoke-RestMethod -Uri "$api/ordens"
```

O acento grave no fim de algumas linhas é a continuação de comando do PowerShell. Não coloque espaços depois dele. Ao repetir o exemplo na mesma sessão do servidor, o telefone já cadastrado será recusado: essa é uma das regras que queremos verificar.

## 4. Entender a API

Uma **API** é uma forma definida de um programa conversar com outro. A solicitação HTTP informa um **método**, um **caminho** e, quando necessário, um **corpo** com os dados. A resposta contém um código HTTP e os dados em JSON.

| Método e caminho | Resultado |
| --- | --- |
| `GET /api/saude` | Informa que a API está ativa e usa memória. |
| `GET /api/clientes` | Lista os clientes. |
| `GET /api/clientes/{id}` | Consulta um cliente. |
| `POST /api/clientes` | Cria cliente: `nome`, `telefone`, `email` opcional. |
| `GET /api/veiculos` | Lista os veículos. |
| `GET /api/veiculos/{id}` | Consulta um veículo. |
| `POST /api/veiculos` | Cria veículo: `clienteId`, `modelo`, `placa`, `km` e `ano` opcionais. |
| `GET /api/ordens` | Lista as ordens. |
| `GET /api/ordens/{id}` | Consulta uma ordem. |
| `POST /api/ordens` | Abre ordem: `clienteId`, `veiculoId`, `problema`. |

Substitua `{id}` pelo identificador recebido no cadastro. Ele é gerado pelo servidor, como `c1`, `v2` ou `o3`. A ordem começa com `status: "Recebido"`; ainda não existe uma rota de alteração ou conclusão.

As solicitações POST usam **`application/x-www-form-urlencoded` em UTF-8**, o formato de formulários HTML. Exemplo do corpo: `nome=Ana+Exemplo&telefone=11999990001`. O servidor responde em **JSON**. Escolhemos esse formato de entrada para começar sem instalar uma biblioteca nem construir um interpretador JSON. Futuramente, `new URLSearchParams(dados)` no JavaScript poderá montar esse corpo.

| Código | Significado nesta API |
| --- | --- |
| 200 | Consulta realizada. |
| 201 | Cadastro criado; `Location` informa o caminho da consulta. |
| 400 | Campo inválido, desconhecido, repetido ou filtro ainda não suportado. |
| 403 | Endereço ou origem não aceitos pela API local. |
| 404 | Rota ou registro não encontrado. |
| 405 | Método não disponível; `Allow` informa os aceitos. |
| 409 | Telefone, placa ou ordem aberta em conflito com um registro existente. |
| 413 | Corpo maior que 16 KiB. |
| 415 | Formato do corpo não suportado. |
| 500 | Falha inesperada; detalhes aparecem no console Java. |

Uma resposta de erro tem este formato: `{"erro":"Preencha o campo nome."}`. As regras também são conferidas no servidor: a validação do HTML, sozinha, não protege os dados.

## 5. Ordem de estudo do código

Os comentários **Etapa** explicam o papel dos blocos. Comece com `Cliente.java`, siga para `OficinaService.java`, depois leia `Aplicacao.java` e `ApiHandler.java`. `Json.java` e `ErroApi.java` são classes de apoio.

| Arquivo | O que aprender |
| --- | --- |
| `Cliente.java` | Classe, atributos, construtor, `this`, getters e retorno. |
| `Veiculo.java` | Relação entre registros usando `clienteId`. |
| `OrdemServico.java` | Estado inicial e data gerados pelo servidor. |
| `OficinaService.java` | Listas, mapas, laços, validação e exceções. |
| `Aplicacao.java` | Método `main`, criação de objetos e inicialização do servidor. |
| `ApiHandler.java` | Rotas, métodos HTTP, leitura de formulário e resposta. |
| `Json.java` | Proteção de caracteres ao produzir texto JSON válido. |
| `ErroApi.java` | Exceção com mensagem e código HTTP. |
| `executar.ps1` | Compilação e execução fora da IDE. |
| `testes/api.test.js` | Testes usando a API por HTTP real. |

### Lendo a inicialização, linha por linha

```java
OficinaService oficina = new OficinaService();
InetSocketAddress endereco = new InetSocketAddress("127.0.0.1", porta);
HttpServer servidor = HttpServer.create(endereco, 0);
servidor.createContext("/", new ApiHandler(oficina));
servidor.start();
```

1. `new OficinaService()` cria um objeto que guarda os registros e aplica as regras. A variável `oficina` permite usar esse objeto depois.
2. `new InetSocketAddress(...)` combina o IP do próprio computador com a porta escolhida. `porta` vale `8080` quando não recebemos outro argumento.
3. `HttpServer.create(...)` cria o servidor nesse endereço. O segundo argumento `0` escolhe o tamanho padrão da fila de conexões; não é a porta.
4. `createContext(...)` associa as solicitações ao nosso `ApiHandler`. O caminho `/` é o ponto de entrada; o handler verifica a rota completa antes de executar uma operação.
5. `start()` começa a receber solicitações. Elas são processadas uma por vez nesta versão, usando o executor padrão do JDK.

A classe [`HttpServer` está documentada no JDK 21](https://docs.oracle.com/en/java/javase/21/docs/api/jdk.httpserver/com/sun/net/httpserver/HttpServer.html). Apesar do nome do pacote começar com `com.sun`, ela é uma API pública do módulo `jdk.httpserver`.

### Lendo a criação de um cliente

```java
Cliente cliente = new Cliente("c" + (++contador), nome, telefone, email);
clientes.add(cliente);
return cliente;
```

1. `Cliente` é o tipo da variável; `cliente` é seu nome. `++contador` incrementa o contador antes de usá-lo. `"c" + ...` forma o identificador. `new Cliente(...)` chama o construtor e preenche o objeto.
2. `clientes.add(cliente)` coloca esse objeto na lista mantida pelo serviço.
3. `return cliente` devolve o objeto ao código que chamou o método. O handler vai convertê-lo em JSON e responder com código 201.

No fluxo completo: **solicitação HTTP → `ApiHandler` → `OficinaService` → objeto cadastrado → resposta JSON**. As chaves `{ }` delimitam blocos; os pontos e vírgulas `;` encerram instruções. Os comentários no código detalham as demais operações.

## 6. Verificar o funcionamento

Na raiz do projeto:

```powershell
# Compila o Java e executa os testes HTTP. Requer o Node já usado nos testes do front end.
.\backend\executar.ps1 -Testar

# Executa os testes existentes do front end.
npm test
```

Os testes iniciam seus próprios servidores em portas livres e os encerram ao terminar. Cobrem cadastro e consulta, caracteres especiais no JSON, erros de validação, vínculos, duplicidades, métodos HTTP, formatos de entrada e a ausência de persistência entre processos. Não alteram os dados do front end nem de uma API aberta no IntelliJ.

## 7. Próximas etapas

1. Adicionar banco de dados para manter os registros após reiniciar.
2. Migrar edição, andamento, orçamento e relatório para regras no Java, mantendo a conclusão vinculada ao relatório obrigatório.
3. Conectar as telas com `fetch`, definindo uma única fonte de dados e uma migração explícita do armazenamento local.
4. Implementar login e permissões antes de disponibilizar o sistema para a oficina.
5. Integrar o WhatsApp com identificação do cliente e respostas que não exponham notas internas.

Nesta etapa a API escuta somente `127.0.0.1` e não habilita chamadas de páginas de outras origens. Os endpoints são para estudo local; não são ainda uma API pública para os clientes da oficina.
