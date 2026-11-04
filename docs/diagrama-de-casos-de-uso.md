# Diagrama de Casos de Uso

O Mermaid não tem um tipo próprio para casos de uso, então o diagrama foi desenhado como fluxograma: os retângulos são os atores, as elipses são os casos de uso e as setas pontilhadas com `«include»` e `«extend»` são as relações entre casos de uso.

```mermaid
flowchart LR
    visitante["Visitante"]
    cliente["Cliente"]
    agente["Agente"]
    empresa["Empresa"]
    banco["Banco"]

    empresa -. "especializa" .-> agente
    banco -. "especializa" .-> agente

    subgraph sistema["Sistema de Aluguel de Carros"]
        direction TB

        subgraph acesso["Acesso"]
            ucCadastrar(["Cadastrar-se"])
            ucEntrar(["Entrar no sistema"])
            ucDemo(["Entrar com conta de demonstração"])
        end

        subgraph contratante["Dados do contratante"]
            ucDados(["Consultar e alterar dados"])
            ucExcluir(["Excluir conta"])
            ucEmpregadores(["Informar empregadores e rendimentos"])
        end

        subgraph pedidosCliente["Pedidos do cliente"]
            ucFrota(["Consultar frota"])
            ucCriar(["Criar pedido de aluguel"])
            ucStatus(["Consultar status do pedido"])
            ucModCli(["Modificar pedido"])
            ucCancelar(["Cancelar pedido"])
            ucDisp(["Verificar disponibilidade do carro"])
            ucCredito(["Associar contrato de crédito"])
        end

        subgraph analise["Análise e contratos"]
            ucListar(["Listar pedidos"])
            ucAvaliar(["Avaliar pedido financeiramente"])
            ucRenda(["Consultar dados e renda do contratante"])
            ucModAg(["Modificar pedido"])
            ucExecutar(["Executar contrato"])
        end
    end

    visitante --- ucCadastrar
    visitante --- ucDemo

    cliente --- ucEntrar
    cliente --- ucDados
    cliente --- ucExcluir
    cliente --- ucFrota
    cliente --- ucCriar
    cliente --- ucStatus
    cliente --- ucModCli
    cliente --- ucCancelar

    agente --- ucEntrar
    agente --- ucListar
    agente --- ucAvaliar
    agente --- ucModAg
    agente --- ucExecutar

    ucCadastrar -. "«include»" .-> ucEmpregadores
    ucDados -. "«include»" .-> ucEmpregadores
    ucCriar -. "«include»" .-> ucDisp
    ucModCli -. "«include»" .-> ucDisp
    ucModAg -. "«include»" .-> ucDisp
    ucAvaliar -. "«include»" .-> ucRenda
    ucCredito -. "«extend»" .-> ucCriar
    ucExecutar -. "«extend»" .-> ucAvaliar
```

## Descrição dos principais casos de uso

| Caso de uso | Ator | Pré-condição | Resultado |
|-------------|------|--------------|-----------|
| Cadastrar-se | Visitante | Nenhuma | Conta criada e sessão iniciada. |
| Entrar no sistema | Cliente, Agente | Estar cadastrado | Sessão iniciada e redirecionamento para a página do perfil. |
| Criar pedido de aluguel | Cliente | Estar logado | Pedido salvo com status "Em análise". |
| Verificar disponibilidade do carro | (incluído) | Carro e período escolhidos | Recusa se houver pedido ativo sobreposto. |
| Associar contrato de crédito | Cliente | Criando ou editando um pedido | Pedido ligado a um banco. É opcional. |
| Cancelar pedido | Cliente | Pedido "Em análise" | Pedido passa a "Cancelado". |
| Avaliar pedido financeiramente | Agente | Pedido "Em análise" | Pedido passa a "Aprovado" ou "Reprovado", com parecer. |
| Executar contrato | Agente | Pedido "Aprovado" | Pedido passa a "Contrato executado". |

As histórias de usuário que detalham cada caso de uso estão em [historias-de-usuario.md](historias-de-usuario.md).
