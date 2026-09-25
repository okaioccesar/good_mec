package br.com.goodmec;

import java.time.Instant; // Instant representa um instante, independente do fuso horário.

// Etapa 1: versão inicial da ordem. Orçamento e relatório serão adicionados depois.
public class OrdemServico {
    private final String id;
    private final int numero;
    private final String clienteId;
    private final String veiculoId;
    private final String problema;
    private final String entrada;
    private final String status;

    public OrdemServico(String id, int numero, String clienteId, String veiculoId, String problema) {
        this.id = id;
        this.numero = numero;
        this.clienteId = clienteId;
        this.veiculoId = veiculoId;
        this.problema = problema;
        this.entrada = Instant.now().toString(); // Guarda a data e a hora em UTC, no formato ISO.
        this.status = "Recebido"; // Quem cadastra a ordem não pode escolher uma situação final.
    }

    public String getId() {
        return id;
    }

    public String getVeiculoId() {
        return veiculoId;
    }

    public String getStatus() {
        return status;
    }

    public String paraJson() {
        return "{\"id\":" + Json.texto(id)
                + ",\"numero\":" + numero
                + ",\"clienteId\":" + Json.texto(clienteId)
                + ",\"veiculoId\":" + Json.texto(veiculoId)
                + ",\"problema\":" + Json.texto(problema)
                + ",\"entrada\":" + Json.texto(entrada)
                + ",\"status\":" + Json.texto(status) + "}";
    }
}
