package br.com.goodmec;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import java.io.IOException;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

// Etapa 4: traduzir HTTP para operações da oficina, e devolver uma resposta JSON.
// implements indica que cumprimos o contrato HttpHandler, implementando seu método handle.
public class ApiHandler implements HttpHandler {
    private final OficinaService oficina;

    public ApiHandler(OficinaService oficina) {
        this.oficina = oficina; // Todas as solicitações usam a mesma oficina em memória.
    }

    @Override // Avisa ao compilador que este método implementa o contrato HttpHandler.
    public void handle(HttpExchange troca) throws IOException {
        // HttpExchange contém URL, método, cabeçalhos e corpo da solicitação/resposta.
        try {
            validarOrigem(troca);
            encaminhar(troca);
        } catch (ErroApi erro) {
            responder(troca, erro.getCodigo(), Json.erro(erro.getMessage()));
        } catch (RuntimeException erro) {
            // Detalhes inesperados ficam no terminal, não na resposta ao cliente da API.
            erro.printStackTrace();
            responder(troca, 500, Json.erro("Ocorreu um erro interno no servidor."));
        } finally {
            troca.close(); // Fecha os recursos da solicitação, mesmo se houver uma falha.
        }
    }

    private void encaminhar(HttpExchange troca) throws IOException {
        String caminho = troca.getRequestURI().getRawPath();
        String metodo = troca.getRequestMethod();
        if (caminho.equals("/api/saude")) {
            exigirMetodo(troca, "GET");
            responder(troca, 200, "{\"aplicacao\":\"GoodMec\",\"status\":\"online\",\"armazenamento\":\"memoria\"}");
            return; // Encerra o método depois de enviar a resposta.
        }

        // Exemplo: /api/clientes/c1 vira ["", "api", "clientes", "c1"].
        String[] partes = caminho.split("/", -1); // -1 preserva partes vazias, inclusive no final.
        if (partes.length < 3 || partes.length > 4 || !partes[1].equals("api")
                || !Set.of("clientes", "veiculos", "ordens").contains(partes[2])
                || (partes.length == 4 && partes[3].isEmpty())) {
            throw new ErroApi(404, "Rota não encontrada.");
        }
        if (troca.getRequestURI().getRawQuery() != null) {
            throw new ErroApi(400, "Esta etapa ainda não aceita filtros na URL.");
        }
        String recurso = partes[2];
        String id = partes.length == 4 ? partes[3] : "";
        exigirMetodo(troca, id.isEmpty() ? "GET, POST" : "GET");

        if (metodo.equals("GET")) {
            responder(troca, 200, consultar(recurso, id));
        } else {
            Map<String, String> dados = lerFormulario(troca);
            String json;
            String novoId;
            if (recurso.equals("clientes")) {
                validarCampos(dados, Set.of("nome", "telefone", "email"));
                Cliente cliente = oficina.cadastrarCliente(dados);
                json = cliente.paraJson();
                novoId = cliente.getId();
            } else if (recurso.equals("veiculos")) {
                validarCampos(dados, Set.of("clienteId", "modelo", "placa", "km", "ano"));
                Veiculo veiculo = oficina.cadastrarVeiculo(dados);
                json = veiculo.paraJson();
                novoId = veiculo.getId();
            } else {
                validarCampos(dados, Set.of("clienteId", "veiculoId", "problema"));
                OrdemServico ordem = oficina.abrirOrdem(dados);
                json = ordem.paraJson();
                novoId = ordem.getId();
            }
            // Location informa a URL em que o registro recém-criado pode ser consultado.
            troca.getResponseHeaders().set("Location", "/api/" + recurso + "/" + novoId);
            responder(troca, 201, json);
        }
    }

    private String consultar(String recurso, String id) {
        if (!id.isEmpty()) {
            if (recurso.equals("clientes")) {
                return oficina.buscarCliente(id).paraJson();
            }
            if (recurso.equals("veiculos")) {
                return oficina.buscarVeiculo(id).paraJson();
            }
            return oficina.buscarOrdem(id).paraJson();
        }
        List<String> registros = new ArrayList<>();
        if (recurso.equals("clientes")) {
            for (Cliente cliente : oficina.listarClientes()) {
                registros.add(cliente.paraJson());
            }
        } else if (recurso.equals("veiculos")) {
            for (Veiculo veiculo : oficina.listarVeiculos()) {
                registros.add(veiculo.paraJson());
            }
        } else {
            for (OrdemServico ordem : oficina.listarOrdens()) {
                registros.add(ordem.paraJson());
            }
        }
        return Json.lista(registros);
    }

    private Map<String, String> lerFormulario(HttpExchange troca) throws IOException {
        // Formato nativo de formulários HTML e URLSearchParams, sem precisar de um leitor JSON.
        String tipo = troca.getRequestHeaders().getFirst("Content-Type");
        if (tipo == null || !tipo.matches("(?i)application/x-www-form-urlencoded(?:\\s*;\\s*charset=UTF-8)?")) {
            throw new ErroApi(415, "Envie application/x-www-form-urlencoded em UTF-8.");
        }
        byte[] bytes = troca.getRequestBody().readNBytes(16385); // Lê no máximo 16 KiB mais um byte.
        if (bytes.length > 16384) {
            throw new ErroApi(413, "O formulário excede o limite de 16 KiB.");
        }
        String corpo = new String(bytes, StandardCharsets.UTF_8);
        Map<String, String> dados = new LinkedHashMap<>(); // Associa cada nome ao valor recebido.
        if (corpo.isEmpty()) {
            return dados;
        }
        for (String campo : corpo.split("&", -1)) {
            String[] par = campo.split("=", 2); // Divide só no primeiro sinal de igual.
            if (par.length != 2) {
                throw new ErroApi(400, "Formato de formulário inválido.");
            }
            String nome;
            String valor;
            try {
                nome = URLDecoder.decode(par[0], StandardCharsets.UTF_8);
                valor = URLDecoder.decode(par[1], StandardCharsets.UTF_8);
            } catch (IllegalArgumentException erro) {
                throw new ErroApi(400, "Codificação do formulário inválida.");
            }
            if (dados.containsKey(nome)) {
                throw new ErroApi(400, "Campo repetido: " + nome + ".");
            }
            dados.put(nome, valor);
        }
        return dados;
    }

    private void validarCampos(Map<String, String> dados, Set<String> permitidos) {
        for (String nome : dados.keySet()) {
            if (!permitidos.contains(nome)) {
                throw new ErroApi(400, "Campo desconhecido: " + nome + ".");
            }
        }
    }

    private void exigirMetodo(HttpExchange troca, String permitidos) {
        if (!List.of(permitidos.split(", ")).contains(troca.getRequestMethod())) {
            troca.getResponseHeaders().set("Allow", permitidos);
            throw new ErroApi(405, "Método não permitido nesta rota.");
        }
    }

    private void validarOrigem(HttpExchange troca) {
        // Esta API de estudo só atende o próprio computador; não possui login nem CORS aberto.
        int porta = troca.getLocalAddress().getPort();
        Set<String> hosts = Set.of("127.0.0.1:" + porta, "localhost:" + porta);
        String host = troca.getRequestHeaders().getFirst("Host");
        String origem = troca.getRequestHeaders().getFirst("Origin");
        if (host == null || !hosts.contains(host)) {
            throw new ErroApi(403, "Use o endereço local informado pelo servidor.");
        }
        if (origem != null && !origem.equals("http://" + host)) {
            throw new ErroApi(403, "A integração com páginas de outra origem ainda não está habilitada.");
        }
    }

    private void responder(HttpExchange troca, int codigo, String json) throws IOException {
        byte[] bytes = json.getBytes(StandardCharsets.UTF_8); // O tamanho enviado deve ser em bytes.
        troca.getResponseHeaders().set("Content-Type", "application/json; charset=utf-8");
        troca.getResponseHeaders().set("Cache-Control", "no-store");
        troca.getResponseHeaders().set("X-Content-Type-Options", "nosniff");
        boolean somenteCabecalhos = troca.getRequestMethod().equals("HEAD");
        troca.sendResponseHeaders(codigo, somenteCabecalhos ? -1 : bytes.length);
        if (!somenteCabecalhos) {
            troca.getResponseBody().write(bytes);
        }
    }
}
