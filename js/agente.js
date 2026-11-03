// Tela do agente (empresa ou banco): avaliar e modificar pedidos.

const agente = Sessao.exigir(['empresa', 'banco']);
const q = (id) => document.getElementById(id);

let automoveis = [];
let bancos = [];
let clientes = [];
let pedidos = [];
let atual = null;
let modal = null;

function achar(lista, id) {
  return lista.find((x) => String(x.id) === String(id));
}

function erroAnalise(msg) {
  const caixa = q('erroAnalise');
  caixa.textContent = msg || '';
  caixa.classList.toggle('d-none', !msg);
}

async function carregar() {
  try {
    [automoveis, bancos, clientes, pedidos] = await Promise.all([
      api.listar('automoveis'),
      api.listar('usuarios', { tipo: 'banco' }),
      api.listar('usuarios', { tipo: 'cliente' }),
      api.listar('pedidos'),
    ]);
  } catch (err) {
    aviso('Não foi possível carregar os dados.', 'danger');
    return;
  }
  desenharLista();
}

function desenharLista() {
  const filtro = q('filtro').value;
  const lista = pedidos
    .filter((p) => !filtro || p.status === filtro)
    .sort((a, b) => Number(b.id) - Number(a.id));

  const corpo = q('listaPedidos');
  if (!lista.length) {
    corpo.innerHTML = '<tr><td colspan="7" class="vazio">Nenhum pedido encontrado.</td></tr>';
    return;
  }
  corpo.innerHTML = lista.map((p) => {
    const cliente = achar(clientes, p.clienteId);
    const banco = achar(bancos, p.bancoId);
    return `
      <tr>
        <td>#${p.id}</td>
        <td>${esc(cliente ? cliente.nome : 'Cliente removido')}</td>
        <td>${esc(descAutomovel(achar(automoveis, p.automovelId)))}</td>
        <td>${dataBR(p.dataInicio)} a ${dataBR(p.dataFim)}</td>
        <td>${p.comCredito ? esc(banco ? banco.nome : 'Banco removido') : '<span class="text-secondary">Sem crédito</span>'}</td>
        <td>${badgeStatus(p.status)}</td>
        <td class="text-end">
          <button class="btn btn-sm btn-outline-dark" data-id="${p.id}">Abrir</button>
        </td>
      </tr>`;
  }).join('');
}

function rendaTotal(cliente) {
  return (cliente.empregadores || []).reduce((s, e) => s + Number(e.rendimento || 0), 0);
}

function desenharContratante(cliente) {
  if (!cliente) {
    q('dadosContratante').textContent = 'Cadastro do cliente não encontrado.';
    return;
  }
  const emps = (cliente.empregadores || []).map((e) =>
    `<li>${esc(e.nome)} - ${moeda(e.rendimento)}</li>`).join('');
  q('dadosContratante').innerHTML = `
    <div class="row g-2">
      <div class="col-md-6"><strong>Nome:</strong> ${esc(cliente.nome)}</div>
      <div class="col-md-3"><strong>RG:</strong> ${esc(cliente.rg)}</div>
      <div class="col-md-3"><strong>CPF:</strong> ${esc(formatarCpfExibicao(cliente.cpf))}</div>
      <div class="col-12"><strong>Endereço:</strong> ${esc(cliente.endereco)}</div>
      <div class="col-12"><strong>Profissão:</strong> ${esc(cliente.profissao)}</div>
      <div class="col-12">
        <strong>Rendimentos:</strong>
        ${emps ? `<ul class="mb-1">${emps}</ul>` : ' nenhum informado'}
        <strong>Total mensal:</strong> ${moeda(rendaTotal(cliente))}
      </div>
    </div>`;
}

function formatarCpfExibicao(cpf) {
  const n = String(cpf || '').replace(/\D/g, '');
  return n.length === 11 ? `${n.slice(0, 3)}.${n.slice(3, 6)}.${n.slice(6, 9)}-${n.slice(9)}` : n;
}

function atualizarResumo() {
  const a = achar(automoveis, q('automovel').value);
  const ini = q('dataInicio').value;
  const fim = q('dataFim').value;
  const resumo = q('resumo');
  if (!a || !ini || !fim || fim < ini) {
    resumo.textContent = 'Período inválido.';
    return;
  }
  const n = diarias(ini, fim);
  const total = n * a.valorDiaria;
  const cliente = achar(clientes, atual.clienteId);
  const renda = cliente ? rendaTotal(cliente) : 0;
  const comp = renda > 0 ? ` (${Math.round((total / renda) * 100)}% da renda mensal do cliente)` : '';
  resumo.innerHTML = `${n} ${n === 1 ? 'diária' : 'diárias'} &times; ${moeda(a.valorDiaria)} =
    <strong>${moeda(total)}</strong>${comp}`;
}

function alternarBanco() {
  q('banco').classList.toggle('d-none', !q('comCredito').checked);
}

function abrirPedido(id) {
  atual = achar(pedidos, id);
  if (!atual) return;
  erroAnalise('');

  q('tituloAnalise').innerHTML = `Pedido #${atual.id} ${badgeStatus(atual.status)}`;
  desenharContratante(achar(clientes, atual.clienteId));

  q('automovel').innerHTML = opcoesAutomoveis(automoveis, atual.automovelId);
  q('banco').innerHTML = opcoesBancos(bancos, atual.bancoId);
  q('dataInicio').value = atual.dataInicio;
  q('dataFim').value = atual.dataFim;
  q('propriedade').value = atual.propriedade;
  q('comCredito').checked = !!atual.comCredito;
  q('parecer').value = atual.parecer || '';
  alternarBanco();
  atualizarResumo();

  // o que cada status permite
  const emAnalise = atual.status === 'Em análise';
  const aprovado = atual.status === 'Aprovado';
  const encerrado = !emAnalise && !aprovado;
  ['automovel', 'dataInicio', 'dataFim', 'propriedade', 'comCredito', 'banco', 'parecer'].forEach((campo) => {
    q(campo).disabled = encerrado;
  });
  const botao = (d) => document.querySelector(`#botoesAnalise [data-decisao="${d}"]`);
  botao('salvar').classList.toggle('d-none', encerrado);
  botao('Aprovado').classList.toggle('d-none', !emAnalise);
  botao('Reprovado').classList.toggle('d-none', !emAnalise);
  botao('Contrato executado').classList.toggle('d-none', !aprovado);

  modal.show();
}

async function aplicar(decisao) {
  erroAnalise('');
  const automovelId = Number(q('automovel').value);
  const dataInicio = q('dataInicio').value;
  const dataFim = q('dataFim').value;
  const comCredito = q('comCredito').checked;
  const parecer = q('parecer').value.trim();

  const falha = validarPeriodo(dataInicio, dataFim, false);
  if (falha) return erroAnalise(falha);
  if (comCredito && !q('banco').value) return erroAnalise('Escolha o banco do crédito.');
  if ((decisao === 'Aprovado' || decisao === 'Reprovado') && !parecer) {
    return erroAnalise('Escreva o parecer antes de aprovar ou reprovar.');
  }

  try {
    if (await automovelOcupado(automovelId, dataInicio, dataFim, atual.id)) {
      return erroAnalise('Esse automóvel já está reservado em parte desse período.');
    }

    const dados = {
      automovelId,
      dataInicio,
      dataFim,
      propriedade: q('propriedade').value,
      comCredito,
      bancoId: comCredito ? Number(q('banco').value) : null,
      parecer,
      analisadoPor: agente.id,
    };
    if (decisao !== 'salvar') dados.status = decisao;

    await api.atualizar('pedidos', atual.id, dados);
    aviso(decisao === 'salvar' ? 'Alterações salvas.' : `Pedido #${atual.id}: ${decisao.toLowerCase()}.`);
    modal.hide();
    await carregar();
  } catch (err) {
    erroAnalise('Não foi possível salvar.');
  }
}

if (agente) {
  modal = new bootstrap.Modal(q('modalAnalise'));
  q('filtro').addEventListener('change', desenharLista);
  q('comCredito').addEventListener('change', alternarBanco);
  ['automovel', 'dataInicio', 'dataFim'].forEach((id) => q(id).addEventListener('change', atualizarResumo));
  q('formAnalise').addEventListener('submit', (e) => e.preventDefault());

  q('listaPedidos').addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-id]');
    if (btn) abrirPedido(btn.dataset.id);
  });
  q('botoesAnalise').addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-decisao]');
    if (btn) aplicar(btn.dataset.decisao);
  });

  carregar();
}
