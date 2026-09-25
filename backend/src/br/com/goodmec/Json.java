package br.com.goodmec;

import java.util.List; // List representa uma sequência de elementos.

// Etapa 2: utilidades pequenas para gerar JSON sem instalar bibliotecas.
// Esta classe ESCREVE JSON; ela não tenta interpretar JSON recebido.
public class Json {
    public static String texto(String valor) {
        // StringBuilder monta um texto aos poucos, sem concatenar toda a resposta a cada volta.
        StringBuilder resultado = new StringBuilder("\"");
        for (int indice = 0; indice < valor.length(); indice++) {
            char caractere = valor.charAt(indice); // Lê um caractere por vez.
            if (caractere == '"' || caractere == '\\') {
                resultado.append('\\').append(caractere); // Protege aspas e barras invertidas.
            } else if (caractere < 32 || Character.isSurrogate(caractere)) {
                // Controles, quebras de linha e pares UTF-16 usam o escape Unicode do JSON.
                resultado.append(String.format("\\u%04x", (int) caractere));
            } else {
                resultado.append(caractere); // Letras acentuadas comuns são preservadas.
            }
        }
        return resultado.append('"').toString(); // Fecha as aspas e devolve a String pronta.
    }

    public static String lista(List<String> objetosJson) {
        // Recebe apenas JSON produzido pelas nossas classes, nunca texto bruto de um formulário.
        return "[" + String.join(",", objetosJson) + "]";
    }

    public static String erro(String mensagem) {
        return "{\"erro\":" + texto(mensagem) + "}";
    }
}
