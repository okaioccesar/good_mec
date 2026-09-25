package br.com.goodmec;

// Etapa 2: uma exceção interrompe uma operação inválida antes de salvar os dados.
public class ErroApi extends RuntimeException {
    // Identificador exigido pela convenção de serialização herdada de RuntimeException.
    private static final long serialVersionUID = 1L;
    private final int codigo; // Código HTTP que a API vai enviar, como 400 ou 404.

    public ErroApi(int codigo, String mensagem) {
        super(mensagem); // Entrega a mensagem ao construtor de RuntimeException.
        this.codigo = codigo;
    }

    public int getCodigo() {
        return codigo;
    }
}
