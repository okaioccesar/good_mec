package br.com.goodmec; // Todas as nossas classes pertencem a este pacote.

import com.sun.net.httpserver.HttpServer; // Servidor HTTP que já acompanha o JDK.
import java.io.IOException; // Representa uma falha de entrada ou saída, como abrir a porta.
import java.net.InetSocketAddress; // Combina um endereço IP com uma porta.

// Etapa 5: ponto de partida. No IntelliJ, execute o main desta classe.
public class Aplicacao {
    // public: acessível; static: não precisa de new; void: não devolve um resultado.
    // args recebe argumentos de execução; throws informa uma falha que pode ser propagada.
    public static void main(String[] args) throws IOException {
        int porta = 8080; // Porta padrão; o endereço será http://127.0.0.1:8080.
        if (args.length > 0) {
            porta = Integer.parseInt(args[0]); // Permite escolher outra porta ao executar.
        }
        OficinaService oficina = new OficinaService(); // Cria as listas e as regras do sistema.
        InetSocketAddress endereco = new InetSocketAddress("127.0.0.1", porta);
        HttpServer servidor = HttpServer.create(endereco, 0); // 0 usa a fila de conexões padrão.
        servidor.createContext("/", new ApiHandler(oficina)); // Entrega as solicitações ao handler.
        // Sem executor personalizado, as solicitações são atendidas uma por vez nesta etapa.
        servidor.start(); // Inicia a escuta; o processo continua ativo até você pará-lo.
        System.out.println("GoodMec API: http://127.0.0.1:" + servidor.getAddress().getPort());
        System.out.println("Teste: /api/saude | Dados em memoria: reiniciar apaga os cadastros.");
        System.out.println("Use Stop no IntelliJ ou Ctrl+C no terminal para encerrar.");
    }
}
