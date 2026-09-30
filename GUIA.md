# 🔧 GoodMec

### Sistema de gerenciamento para oficinas mecânicas

O **GoodMec** é uma aplicação web desenvolvida para auxiliar no gerenciamento de oficinas mecânicas, centralizando informações de clientes, veículos, ordens de serviço, orçamentos, agenda, peças e relatórios em um único sistema.

> 🚧 Projeto em desenvolvimento — novas funcionalidades estão sendo implementadas.

---

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

---

## 🛠️ Tecnologias

<div align="center">

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)

</div>

O projeto atualmente utiliza:

- **HTML5** — estrutura das páginas;
- **CSS3** — estilização, layout e responsividade;
- **JavaScript** — lógica da aplicação, interação com a interface e gerenciamento dos dados;
- **LocalStorage** — armazenamento local das informações.

---

## 🚀 Como executar

Não é necessário instalar dependências ou configurar um servidor.

### 1. Clone o repositório

```bash
git clone https://github.com/okaioccesar/goodmec.git
```

### 2. Acesse a pasta

```bash
cd goodmec
```

### 3. Abra o projeto

Abra o arquivo:

```text
index.html
```

diretamente no navegador.

---

## 🧪 Como testar

Na tela inicial, você pode escolher entre:

**Nova ordem**

Para criar um atendimento do zero.

**Explorar com exemplos**

Para carregar dados fictícios e conhecer as principais funcionalidades do sistema.

---

## 📱 Interface

O GoodMec possui uma interface adaptada para diferentes tamanhos de tela, incluindo dispositivos móveis.

Também possui uma versão de relatório preparada para impressão e salvamento em PDF através do navegador.

> 💡 Caso você tenha screenshots do projeto, esta seção pode receber imagens da interface.

---

## 💾 Armazenamento

Os dados do GoodMec são armazenados localmente utilizando o `localStorage` do navegador.

Também é possível exportar e importar os registros através de arquivos JSON.

### ⚠️ Importante

Como não existe um banco de dados ou servidor nesta versão, os dados ficam armazenados apenas no navegador e computador utilizados.

---

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

---

## 📂 Estrutura do projeto

```text
GoodMec/
│
├── index.html
├── style.css
├── modelo.js
├── script.js
├── logo.svg
│
└── testes/
    ├── modelo.test.js
    └── interface.test.js
```

### Principais arquivos

| Arquivo | Função |
|---|---|
| `index.html` | Estrutura da aplicação |
| `style.css` | Estilos, layout e responsividade |
| `modelo.js` | Regras e gerenciamento dos dados |
| `script.js` | Interações e funcionamento da interface |
| `logo.svg` | Identidade visual do projeto |

---

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

## 📌 Status

**🟡 Em desenvolvimento**

Novas funcionalidades e melhorias ainda estão sendo implementadas.

---

## 👨‍💻 Desenvolvedor

**Kaio Cesar**

Projeto desenvolvido para fins acadêmicos e de aprendizado em desenvolvimento web.

---

<div align="center">

### 🔧 GoodMec

**Organizando o trabalho da oficina em um só lugar.**

</div>