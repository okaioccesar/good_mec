package br.com.goodmec;

// Etapa 1: clienteId relaciona o veículo ao cliente que já foi cadastrado.
public class Veiculo {
    private final String id;
    private final String clienteId;
    private final String modelo;
    private final String placa;
    private final int km; // int armazena um número inteiro.
    private final String ano; // O ano pode estar vazio quando não foi informado.

    public Veiculo(String id, String clienteId, String modelo, String placa, int km, String ano) {
        this.id = id;
        this.clienteId = clienteId;
        this.modelo = modelo;
        this.placa = placa;
        this.km = km;
        this.ano = ano;
    }

    public String getId() {
        return id;
    }

    public String getClienteId() {
        return clienteId;
    }

    public String getPlaca() {
        return placa;
    }

    public String paraJson() {
        return "{\"id\":" + Json.texto(id)
                + ",\"clienteId\":" + Json.texto(clienteId)
                + ",\"modelo\":" + Json.texto(modelo)
                + ",\"placa\":" + Json.texto(placa)
                + ",\"km\":" + km // Números JSON não recebem aspas.
                + ",\"ano\":" + Json.texto(ano) + "}";
    }
}
