# Revisão dos Modelos

O enunciado pede que o protótipo seja comparado com os modelos descritos inicialmente e que as modificações feitas para o software funcionar sejam apresentadas. Este documento faz essa comparação: de um lado o que o enunciado descreve, do outro o que ficou implementado e os diagramas atuais.

## Enunciado x implementação

| Item do enunciado | Como ficou no sistema | Observação |
|-------------------|----------------------|------------|
| O sistema só pode ser usado após cadastro prévio. | Todas as páginas, menos login e cadastro, redirecionam para o login quando não há sessão. | Foram acrescentados botões de entrada com contas de demonstração, que já estão cadastradas no `db.json`. |
| Clientes introduzem, modificam, consultam e cancelam pedidos. | `cliente.html` e `js/cliente.js`. | A modificação e o cancelamento só valem enquanto o pedido está "Em análise". O cancelamento muda o status e não apaga o pedido. |
| Agentes (empresas e bancos) modificam e avaliam pedidos. | `agente.html` e `js/agente.js`. | Empresa e banco têm a mesma tela. Eles só se diferenciam pelo tipo, e o banco é também quem aparece como concedente de crédito. |
| Pedidos são analisados financeiramente e, se o parecer for positivo, vão para execução do contrato. | Status "Em análise", "Aprovado" ou "Reprovado" e depois "Contrato executado". | O parecer escrito é obrigatório na aprovação e na reprovação. |
| Dados do contratante: RG, CPF, nome, endereço, profissão, empregadores e rendimentos (máximo 3). | Cadastro do cliente, com validação do CPF e limite de 3 empregadores. | O agente vê a renda total e o percentual que o aluguel representa. |
| Automóveis podem ser registrados como propriedade de clientes, empresas ou bancos, conforme o contrato. | Campo `propriedade` no pedido. | Ficou no pedido e não no automóvel, porque a propriedade depende do contrato. |
| Automóveis: matrícula, ano, marca, modelo e placa. | Coleção `automoveis`. | Acrescentados `valorDiaria`, `categoria`, `obra`, `foto`, `descricao` e `fonte`, para calcular o valor e montar a frota. |
| O aluguel pode ter um contrato de crédito concedido por um banco agente. | Campos `comCredito` e `bancoId` no pedido. | O crédito é opcional. |
| Servidor central ligado aos clientes e aos agentes pela Internet. | JSON Server como API REST, consumida por `fetch`. | No GitHub Pages não há servidor, então a API cai para o modo local. Ver abaixo. |
| Dois subsistemas: gestão de pedidos e contratos, e construção dinâmica das páginas. | Descritos no [diagrama de pacotes](diagrama-de-pacotes.md). | As telas são montadas por JavaScript a partir dos dados. |

## Modificações feitas durante o desenvolvimento

| # | Modificação | Motivo | Diagramas afetados |
|---|-------------|--------|--------------------|
| 1 | Todos os usuários ficam em uma única coleção `usuarios`, com o campo `tipo`. | O JSON Server trabalha com coleções planas, e cliente, empresa e banco compartilham nome, e-mail e senha. A herança do modelo virou o campo `tipo`. | Classes |
| 2 | Cliente passou a ter a lista `empregadores` embutida no registro. | Evita uma coleção a mais para no máximo 3 itens que só existem junto do cliente. | Classes |
| 3 | `propriedade` ficou no pedido. | A propriedade do carro muda conforme o contrato, e o mesmo carro pode ser alugado de formas diferentes. | Classes |
| 4 | Criada a regra de conflito de reservas. | Sem ela, dois clientes poderiam alugar o mesmo carro no mesmo período. Vale para criação e modificação, no cliente e no agente. | Casos de uso, classes, histórias |
| 5 | Acrescentados `valorDiaria` e o valor estimado do pedido. | O agente precisa de um valor para a análise financeira. | Classes |
| 6 | Criada a frota com categorias, fotos e descrições. | Dá contexto à escolha do carro na tela de novo pedido. As fotos vêm do Wikimedia Commons. | Classes |
| 7 | Criado o modo local da API (`localStorage`). | O GitHub Pages só serve arquivos estáticos, então o JSON Server não roda lá. O código de telas não muda entre os modos. | Componentes, pacotes |
| 8 | Cancelar um pedido muda o status para "Cancelado". | Mantém o histórico e libera o carro para outros pedidos. | Status, casos de uso |
| 9 | Contas de demonstração na tela de login. | Permite testar o sistema sem cadastro. | Histórias de usuário |

## Observações sobre o escopo

- A senha é guardada em texto puro no `db.json`. Isso é aceitável em um protótipo de laboratório com API simulada, mas não deve ser feito em um sistema real, que precisaria de um servidor de verdade com senhas protegidas por hash.
- O JSON Server não tem autenticação nem autorização, então as regras de perfil (quem pode editar o quê) são aplicadas apenas na interface.
- No modo local (GitHub Pages) os dados ficam só no navegador de cada visitante.
