package br.com.goodmec;

import java.time.Year;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;

// Etapa 3: aqui ficam as regras da oficina, sem depender de navegador ou HTTP.
// Service significa serviço: uma classe que coordena operações do sistema.
public class OficinaService {
    // ArrayList guarda objetos na memória. Reiniciar o programa esvazia estas listas.
    private final List<Cliente> clientes = new ArrayList<>();
    private final List<Veiculo> veiculos = new ArrayList<>();
    private final List<OrdemServico> ordens = new ArrayList<>();
    private int contador = 0; // Um contador comum evita repetir os identificadores nesta sessão.

    public Cliente cadastrarCliente(Map<String, String> dados) {
        String nome = obrigatorio(dados, "nome", 120);
        String telefone = obrigatorio(dados, "telefone", 30).replaceAll("\\D", "");
        if (telefone.length() == 10 || telefone.length() == 11) {
            telefone = "55" + telefone; // Acrescenta o DDI brasileiro quando veio apenas DDD + número.
        }
        if (!telefone.matches("55\\d{10,11}")) {
            throw new ErroApi(400, "Informe um telefone brasileiro com DDD.");
        }
        String email = campo(dados, "email", 160);
        if (!email.isEmpty() && !email.matches("[^\\s@]+@[^\\s@]+\\.[^\\s@]+")) {
            throw new ErroApi(400, "Confira o e-mail informado.");
        }
        for (Cliente cliente : clientes) { // Percorre cada cliente já cadastrado.
            if (cliente.getTelefone().equals(telefone)) {
                throw new ErroApi(409, "Este telefone já pertence a um cliente cadastrado.");
            }
        }
        // Só criamos o identificador e salvamos depois de todas as verificações.
        Cliente cliente = new Cliente("c" + (++contador), nome, telefone, email);
        clientes.add(cliente);
        return cliente;
    }

    public Veiculo cadastrarVeiculo(Map<String, String> dados) {
        Cliente cliente = buscarCliente(obrigatorio(dados, "clienteId", 30));
        String modelo = obrigatorio(dados, "modelo", 120);
        String placa = obrigatorio(dados, "placa", 20).toUpperCase(Locale.ROOT).replaceAll("[\\s-]", "");
        if (!placa.matches("[A-Z]{3}\\d[A-Z0-9]\\d{2}")) {
            throw new ErroApi(400, "Informe uma placa como ABC1D23 ou ABC1234.");
        }
        for (Veiculo veiculo : veiculos) {
            if (veiculo.getPlaca().equals(placa)) {
                throw new ErroApi(409, "Esta placa já está cadastrada.");
            }
        }
        String kmInformado = campo(dados, "km", 7);
        if (!kmInformado.isEmpty() && !kmInformado.matches("[0-9]{1,7}")) {
            throw new ErroApi(400, "A quilometragem deve ser um inteiro de 0 a 9999999.");
        }
        // A expressão condição ? valor1 : valor2 escolhe um dos dois valores.
        int km = kmInformado.isEmpty() ? 0 : Integer.parseInt(kmInformado);
        String ano = campo(dados, "ano", 4);
        if (!ano.isEmpty() && (!ano.matches("[0-9]{4}")
                || Integer.parseInt(ano) < 1900 || Integer.parseInt(ano) > Year.now().getValue() + 1)) {
            throw new ErroApi(400, "Confira o ano do veículo.");
        }
        Veiculo veiculo = new Veiculo("v" + (++contador), cliente.getId(), modelo, placa, km, ano);
        veiculos.add(veiculo);
        return veiculo;
    }

    public OrdemServico abrirOrdem(Map<String, String> dados) {
        Cliente cliente = buscarCliente(obrigatorio(dados, "clienteId", 30));
        Veiculo veiculo = buscarVeiculo(obrigatorio(dados, "veiculoId", 30));
        String problema = obrigatorio(dados, "problema", 2000);
        if (!veiculo.getClienteId().equals(cliente.getId())) {
            throw new ErroApi(400, "Escolha um veículo deste cliente.");
        }
        for (OrdemServico ordem : ordens) {
            if (ordem.getVeiculoId().equals(veiculo.getId()) && !ordem.getStatus().equals("Encerrado")) {
                throw new ErroApi(409, "Este veículo já possui uma ordem em aberto.");
            }
        }
        OrdemServico ordem = new OrdemServico("o" + (++contador), ordens.size() + 1,
                cliente.getId(), veiculo.getId(), problema);
        ordens.add(ordem);
        return ordem;
    }

    // Buscas comparam o identificador; equals compara o conteúdo de duas Strings.
    public Cliente buscarCliente(String id) {
        for (Cliente cliente : clientes) {
            if (cliente.getId().equals(id)) {
                return cliente;
            }
        }
        throw new ErroApi(404, "Cliente não encontrado.");
    }

    public Veiculo buscarVeiculo(String id) {
        for (Veiculo veiculo : veiculos) {
            if (veiculo.getId().equals(id)) {
                return veiculo;
            }
        }
        throw new ErroApi(404, "Veículo não encontrado.");
    }

    public OrdemServico buscarOrdem(String id) {
        for (OrdemServico ordem : ordens) {
            if (ordem.getId().equals(id)) {
                return ordem;
            }
        }
        throw new ErroApi(404, "Ordem de serviço não encontrada.");
    }

    // A cópia impede que outra classe adicione ou remova itens das listas originais.
    public List<Cliente> listarClientes() {
        return new ArrayList<>(clientes);
    }

    public List<Veiculo> listarVeiculos() {
        return new ArrayList<>(veiculos);
    }

    public List<OrdemServico> listarOrdens() {
        return new ArrayList<>(ordens);
    }

    private String campo(Map<String, String> dados, String nome, int limite) {
        String valor = dados.getOrDefault(nome, "").strip(); // Ausente vira vazio; strip remove espaços nas pontas.
        if (valor.length() > limite) {
            throw new ErroApi(400, "O campo " + nome + " aceita até " + limite + " caracteres.");
        }
        return valor;
    }

    private String obrigatorio(Map<String, String> dados, String nome, int limite) {
        String valor = campo(dados, nome, limite);
        if (valor.isEmpty()) {
            throw new ErroApi(400, "Preencha o campo " + nome + ".");
        }
        return valor;
    }
}
