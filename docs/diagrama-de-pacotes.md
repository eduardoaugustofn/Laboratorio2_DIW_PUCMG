# Diagrama de Pacotes (Visão Lógica)

O enunciado divide o sistema em dois subsistemas: um para a **gestão de pedidos e contratos** e outro para a **construção dinâmica das páginas web**. O diagrama abaixo mostra os pacotes de cada subsistema e as dependências entre eles. As setas indicam `«use»`: o pacote de origem depende do de destino.

## Pacotes da aplicação

```mermaid
flowchart TB
    subgraph paginasWeb["Subsistema de páginas web (construção dinâmica das páginas)"]
        direction TB
        visao["Pacote Visão<br/>index.html, cadastro.html, cliente.html, agente.html<br/>css/style.css"]
        telas["Pacote Telas<br/>js/cadastro.js, js/cliente.js, js/agente.js"]
    end

    subgraph gestao["Subsistema de gestão de pedidos e contratos"]
        direction TB
        regras["Pacote Regras de pedido<br/>js/pedidos.js"]
        sessao["Pacote Sessão e utilidades<br/>js/common.js"]
    end

    subgraph dados["Acesso a dados"]
        direction TB
        api["Pacote API<br/>js/api.js"]
    end

    subgraph persistencia["Persistência"]
        direction TB
        servidor["JSON Server<br/>db.json"]
        local["localStorage<br/>cópia do db.json"]
    end

    subgraph externos["Bibliotecas e serviços externos"]
        direction TB
        bootstrap["Bootstrap 5 (CDN)"]
        fontes["Google Fonts"]
        imagens["Wikimedia Commons"]
    end

    visao -. "«use»" .-> telas
    visao -. "«use»" .-> bootstrap
    visao -. "«use»" .-> fontes
    visao -. "«use»" .-> imagens
    telas -. "«use»" .-> regras
    telas -. "«use»" .-> sessao
    telas -. "«use»" .-> api
    regras -. "«use»" .-> api
    regras -. "«use»" .-> sessao
    sessao -. "«use»" .-> visao
    api -. "«use»" .-> servidor
    api -. "«use»" .-> local
```

A seta de `Sessão e utilidades` para `Visão` existe porque o `js/common.js` monta a barra de navegação nas páginas.

## Pacotes do domínio

Organização lógica das classes do [diagrama de classes](diagrama-de-classes.md).

```mermaid
flowchart LR
    subgraph usuarios["Pacote Usuários"]
        u1["Usuario"]
        u2["Cliente"]
        u3["Agente, Empresa, Banco"]
        u4["Empregador"]
    end

    subgraph pedidos["Pacote Pedidos"]
        p1["Pedido"]
        p2["StatusPedido"]
        p3["Propriedade"]
    end

    subgraph frota["Pacote Frota"]
        f1["Automovel"]
    end

    pedidos -. "«use»" .-> usuarios
    pedidos -. "«use»" .-> frota
```

## Responsabilidade de cada pacote

| Pacote | Arquivos | Responsabilidade |
|--------|----------|------------------|
| Visão | `index.html`, `cadastro.html`, `cliente.html`, `agente.html`, `css/style.css` | Estrutura e aparência das páginas, com Bootstrap 5 e tema próprio. |
| Telas | `js/cadastro.js`, `js/cliente.js`, `js/agente.js` | Montam as páginas dinamicamente (tabelas, cards, modais) e tratam os eventos do usuário. |
| Regras de pedido | `js/pedidos.js` | Validação de período, checagem de carro ocupado e montagem das opções de carros e bancos. |
| Sessão e utilidades | `js/common.js` | Sessão do usuário, barra de navegação, formatação de datas e valores, escape de HTML e avisos. |
| API | `js/api.js` | Único ponto de acesso aos dados. Usa `fetch` no JSON Server ou o modo local. |
| Persistência | `db.json` e `localStorage` | Guardam usuários, automóveis e pedidos. |
