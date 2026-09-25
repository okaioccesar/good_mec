package br.com.goodmec; // Agrupa as classes do back end no mesmo pacote.

// Etapa 1: uma classe descreve quais dados cada cliente possui.
public class Cliente {
    // private impede alterações diretas de outras classes; final permite atribuir uma única vez.
    private final String id;
    private final String nome;
    private final String telefone;
    private final String email;

    // O construtor é executado quando usamos new Cliente(...).
    public Cliente(String id, String nome, String telefone, String email) {
        this.id = id; // this.id é o atributo; id é o parâmetro recebido.
        this.nome = nome;
        this.telefone = telefone;
        this.email = email;
    }

    // Getters permitem consultar os atributos sem alterá-los.
    public String getId() {
        return id;
    }

    public String getTelefone() {
        return telefone;
    }

    // JSON é um texto estruturado que o JavaScript consegue ler com response.json().
    public String paraJson() {
        return "{\"id\":" + Json.texto(id)
                + ",\"nome\":" + Json.texto(nome)
                + ",\"telefone\":" + Json.texto(telefone)
                + ",\"email\":" + Json.texto(email) + "}";
    }
}
