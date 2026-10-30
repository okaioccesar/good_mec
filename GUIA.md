# 🔧 GoodMec

### Sistema de gerenciamento para oficinas mecânicas

O **GoodMec** é uma aplicação web desenvolvida para auxiliar no gerenciamento de oficinas mecânicas, centralizando informações de clientes, veículos, ordens de serviço, orçamentos, agenda, peças e relatórios em um único sistema.

## 📋 Sobre o projeto

O GoodMec foi desenvolvido com o objetivo de simular o funcionamento de um sistema utilizado por uma oficina mecânica.

A aplicação permite acompanhar uma ordem de serviço desde o cadastro do cliente e veículo até a conclusão do serviço e retirada do veículo.

### 🔄 Fluxo principal

**Cliente → Veículo → Ordem de Serviço → Diagnóstico → Orçamento → Aprovação → Serviço → Relatório → Retirada**

---

## ✨ Funcionalidades

### 🚗 Ordens de Serviço
- Cadastro de novas ordens;
- Acompanhamento do status do serviço;
- Diagnóstico do veículo;
- Definição de responsável;
- Previsão de conclusão;
- Registro do histórico.

### 👤 Clientes e veículos
- Cadastro de clientes;
- Cadastro de veículos;
- Informações como placa, modelo, ano e quilometragem;
- Histórico relacionado ao veículo.

### 💰 Orçamentos
- Adição de serviços e peças;
- Quantidade e valor unitário;
- Cálculo automático do total;
- Controle de versões;
- Registro da aprovação ou recusa do cliente.

### 📝 Relatórios
- Registro dos serviços realizados;
- Peças utilizadas;
- Recomendações;
- Responsável pelo serviço;
- Geração de relatório para impressão.

### 📅 Agenda
- Criação de agendamentos;
- Confirmação de horários;
- Cancelamento;
- Acompanhamento dos atendimentos.

### 🔩 Peças
- Acompanhamento de peças relacionadas às ordens;
- Situação da compra;
- Previsão de chegada.

### 💬 Atendimento
- Simulação de consulta de status;
- Consulta de orçamento;
- Consulta de relatório;
- Solicitação de atendimento humano.

### 📊 Indicadores
- Quantidade de ordens;
- Serviços concluídos;
- Orçamentos aprovados;
- Tempo médio de conclusão;
- Valores dos orçamentos.

### 💾 Dados
- Armazenamento local no navegador;
- Exportação dos dados;
- Importação de cópias;
- Validação dos dados importados.

## 🛠️ Tecnologias

[HTML5]
[CSS3]

O projeto atualmente utiliza:

- **HTML5** — estrutura das páginas;
- **CSS3** — estilização, layout e responsividade;
- **LocalStorage** — armazenamento local das informações.


## 📱 Interface

O GoodMec possui uma interface adaptada para diferentes tamanhos de tela, incluindo dispositivos móveis.

Também possui uma versão de relatório preparada para impressão e salvamento em PDF através do navegador.


## 💾 Armazenamento

Os dados do GoodMec são armazenados localmente utilizando o `localStorage` do navegador.

Também é possível exportar e importar os registros através de arquivos JSON.

### ⚠️ Importante

Como não existe um banco de dados ou servidor nesta versão, os dados ficam armazenados apenas no navegador e computador utilizados.


## 🚧 Limitações atuais

Esta versão é um **protótipo funcional** e ainda possui algumas limitações:

- Não possui banco de dados;
- Não possui sistema de login;
- Não possui autenticação real;
- A integração com WhatsApp é apenas simulada;
- Não envia notificações automaticamente;
- Não possui sistema de pagamentos;
- O controle de peças ainda não representa um estoque completo;
- O relatório em PDF utiliza a função de impressão do navegador.


## 🎯 Objetivo do projeto

O GoodMec está sendo desenvolvido como um projeto prático para aplicar conhecimentos de desenvolvimento web, principalmente em:

- Estruturação com HTML;
- Estilização com CSS;
- Programação com JavaScript;
- Manipulação do DOM;
- Formulários e eventos;
- Armazenamento local;
- Organização de uma aplicação web.

---

# 📌 Status

**🟡 Em desenvolvimento**

Novas funcionalidades e melhorias ainda estão sendo implementadas.

---

# 👨‍💻 Desenvolvedor

**Kaio Cesar**

Projeto desenvolvido para fins acadêmicos e de aprendizado em desenvolvimento web.


#  GoodMec
