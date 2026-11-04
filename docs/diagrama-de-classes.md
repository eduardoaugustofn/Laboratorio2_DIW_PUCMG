# Diagrama de Classes

Modelo de domínio do sistema, alinhado com o que existe no `db.json` e no código JavaScript.

```mermaid
classDiagram
    direction LR

    class Usuario {
        <<abstract>>
        +int id
        +String nome
        +String email
        +String senha
        +TipoUsuario tipo
        +entrar() Usuario
        +atualizarDados()
    }

    class Cliente {
        +String rg
        +String cpf
        +String endereco
        +String profissao
        +cadastrar()
        +excluirConta()
        +criarPedido(Automovel, Periodo) Pedido
        +modificarPedido(Pedido)
        +cancelarPedido(Pedido)
        +rendaTotal() double
    }

    class Agente {
        <<abstract>>
        +listarPedidos(StatusPedido) Pedido[]
        +avaliarPedido(Pedido, String parecer, boolean aprovado)
        +modificarPedido(Pedido)
        +executarContrato(Pedido)
    }

    class Empresa
    class Banco

    class Empregador {
        +String nome
        +double rendimento
    }

    class Automovel {
        +int id
        +String matricula
        +int ano
        +String marca
        +String modelo
        +String placa
        +double valorDiaria
        +String categoria
        +String obra
        +String foto
        +String descricao
        +String fonte
        +estaOcupado(Periodo, Pedido ignorado) boolean
    }

    class Pedido {
        +int id
        +date dataInicio
        +date dataFim
        +Propriedade propriedade
        +boolean comCredito
        +StatusPedido status
        +String parecer
        +date criadoEm
        +diarias() int
        +totalEstimado() double
    }

    class StatusPedido {
        <<enumeration>>
        Em análise
        Aprovado
        Reprovado
        Contrato executado
        Cancelado
    }

    class Propriedade {
        <<enumeration>>
        cliente
        empresa
        banco
    }

    class TipoUsuario {
        <<enumeration>>
        cliente
        empresa
        banco
    }

    Usuario <|-- Cliente
    Usuario <|-- Agente
    Agente <|-- Empresa
    Agente <|-- Banco

    Cliente "1" *-- "0..3" Empregador : possui
    Cliente "1" --> "0..*" Pedido : solicita
    Pedido "0..*" --> "1" Automovel : reserva
    Pedido "0..*" --> "0..1" Banco : crédito concedido por
    Agente "1" --> "0..*" Pedido : analisa

    Pedido --> StatusPedido
    Pedido --> Propriedade
    Usuario --> TipoUsuario
```

## Como o modelo aparece no código

| Elemento do modelo | Onde está |
|--------------------|-----------|
| `Usuario`, `Cliente`, `Empresa`, `Banco`, `Empregador` | Coleção `usuarios` do `db.json`. Um único registro guarda o campo `tipo`. Os dados do cliente (`rg`, `cpf`, `endereco`, `profissao`) e a lista `empregadores` só existem nos usuários do tipo `cliente`. |
| `Automovel` | Coleção `automoveis`. |
| `Pedido` | Coleção `pedidos`. Guarda `clienteId`, `automovelId` e `bancoId` (quando há crédito). |
| `Propriedade` | Campo `propriedade` do pedido, pois o enunciado diz que o carro é registrado em nome do cliente, da empresa ou do banco **conforme o tipo de contrato**. |
| `Cliente.criarPedido`, `modificarPedido`, `cancelarPedido` | `js/cliente.js` |
| `Agente.avaliarPedido`, `modificarPedido`, `executarContrato` | `js/agente.js` |
| `Automovel.estaOcupado`, validação de período, `totalEstimado` | `js/pedidos.js` e `js/common.js` (`diarias`) |
| `Usuario.entrar` e sessão | `index.html` e `js/common.js` (`Sessao`) |
| `Cliente.cadastrar`, `atualizarDados`, `excluirConta`, `rendaTotal` | `js/cadastro.js` e `js/agente.js` (`rendaTotal`) |

O acesso aos dados de todas as classes passa por `js/api.js`.
