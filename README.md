# Locadora do Dudu - Sistema de Aluguel de Carros

<table>
  <tr>
    <td>
      Laboratório 02 de Desenvolvimento de Interfaces Web (Engenharia de Software, PUC Minas).<br><br>
      Sistema web para gestão de aluguéis de automóveis: o cliente faz, acompanha, modifica e cancela pedidos pela Internet, e empresas e bancos analisam o pedido financeiramente e executam o contrato.
    </td>
    <td>
      <img src="docs/img/logo.webp" alt="Logo da Locadora do Dudu" width="160px"/>
    </td>
  </tr>
</table>

## Índice
- [Links úteis](#links-úteis)
- [Funcionalidades](#funcionalidades)
- [Tecnologias](#tecnologias)
- [Arquitetura e modelagem](#arquitetura-e-modelagem)
- [Instalação e execução](#instalação-e-execução)
- [Estrutura de pastas](#estrutura-de-pastas)
- [Telas](#telas)
- [Autor](#autor)
- [Licença](#licença)

## Links úteis

- **Site publicado:** https://eduardoaugustofn.github.io/Laboratorio2_DIW_PUCMG/
- **Modelagem:** pasta [`docs`](docs/)
- **Contas de teste:** a tela de login tem botões para entrar como cliente, empresa ou banco sem cadastro. A senha das três contas é `123456`.

## Funcionalidades

- Cadastro e login para três perfis: cliente, empresa e banco.
- CRUD de cliente: cadastro, consulta, alteração e exclusão, com RG, CPF, endereço, profissão e até 3 empregadores com rendimento.
- Frota com 18 carros, filtro por categoria, foto e descrição.
- Pedidos de aluguel: o cliente cria, consulta, modifica e cancela, e acompanha o status.
- Contrato de crédito opcional ligado a um banco, e propriedade do carro em nome do cliente, da empresa ou do banco.
- Análise do agente: vê os dados e a renda do cliente, escreve o parecer, aprova ou reprova e executa o contrato.
- Regra de conflito: um carro não pode ser reservado em períodos que se sobrepõem.

## Tecnologias

- HTML5, CSS3 e JavaScript, sem framework.
- Bootstrap 5.3.3 na interface.
- JSON Server 0.17.4 como API REST simulada a partir do `db.json`, consumida com a Fetch API.
- Node.js 18 ou superior para rodar o JSON Server.
- GitHub Pages para publicar o site.

## Arquitetura e modelagem

O sistema é dividido em dois subsistemas, como no enunciado: a gestão de pedidos e contratos, e a construção dinâmica das páginas web. As páginas HTML trazem só a estrutura, e o JavaScript monta tabelas, cards e modais com os dados da API.

Todo acesso a dados passa por `js/api.js`, que funciona de dois jeitos:

- **Com servidor:** em `localhost`, se o JSON Server estiver rodando na porta 3000, as chamadas vão para a API e ficam gravadas no `db.json`.
- **Sem servidor:** no GitHub Pages, que só serve arquivos estáticos, os dados iniciais vêm do `db.json` e as alterações ficam no `localStorage` do navegador.

| Documento | Conteúdo |
| :--- | :--- |
| [Casos de uso](docs/diagrama-de-casos-de-uso.md) | Atores e casos de uso |
| [Histórias de usuário](docs/historias-de-usuario.md) | Histórias com critérios de aceitação |
| [Classes](docs/diagrama-de-classes.md) | Modelo de domínio e correspondência com o código |
| [Pacotes](docs/diagrama-de-pacotes.md) | Visão lógica |
| [Componentes](docs/diagrama-de-componentes.md) | Componentes e interfaces |
| [Revisão dos modelos](docs/revisoes-dos-modelos.md) | Enunciado x implementação e modificações feitas |

## Instalação e execução

```bash
git clone https://github.com/eduardoaugustofn/Laboratorio2_DIW_PUCMG.git
cd Laboratorio2_DIW_PUCMG
npm install
```

Em dois terminais:

```bash
npm run api
```

```bash
npm run site
```

A API fica em http://localhost:3000 e o site em http://localhost:8080. Se a API não estiver rodando, o site funciona guardando os dados no navegador.

## Estrutura de pastas

```
.
├── index.html          login
├── cadastro.html       cadastro e dados do cliente
├── cliente.html        frota e pedidos do cliente
├── agente.html         análise de pedidos (empresa e banco)
├── db.json             dados iniciais
├── css/style.css       tema sobre o Bootstrap
├── js/
│   ├── api.js          acesso a dados
│   ├── common.js       sessão, navbar e funções de apoio
│   ├── pedidos.js      regras de pedido
│   ├── cadastro.js
│   ├── cliente.js
│   └── agente.js
└── docs/               histórias de usuário, diagramas e revisão dos modelos
```

## Telas

| | |
| :---: | :---: |
| <img src="docs/img/login.jpg" alt="Login" width="380px"> | <img src="docs/img/frota.jpg" alt="Frota" width="380px"> |
| <img src="docs/img/novo-pedido.jpg" alt="Novo pedido" width="380px"> | <img src="docs/img/agente-analise.jpg" alt="Análise do pedido" width="380px"> |

## Autor

[Eduardo Augusto Freitas Nogueira](https://github.com/eduardoaugustofn)

## Licença

Apache License 2.0. Veja o arquivo [LICENSE](LICENSE).
