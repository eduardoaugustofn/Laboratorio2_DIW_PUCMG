// Tela do cliente: criar, consultar, modificar e cancelar pedidos.

const usuario = Sessao.exigir(['cliente']);
const q = (id) => document.getElementById(id);

let automoveis = [];
let bancos = [];
let pedidos = [];
let editandoId = null;
let modal = null;

function achar(lista, id) {
  return lista.find((x) => String(x.id) === String(id));
}

function erroPedido(msg) {
  const caixa = q('erroPedido');
  caixa.textContent = msg || '';
  caixa.classList.toggle('d-none', !msg);
}

async function carregar() {
  try {
    [automoveis, bancos, pedidos] = await Promise.all([
      api.listar('automoveis'),
      api.listar('usuarios', { tipo: 'banco' }),
      api.listar('pedidos', { clienteId: usuario.id }),
    ]);
  } catch (err) {
    aviso('Não foi possível carregar os dados.', 'danger');
    return;
  }
  desenharLista();
}

function desenharLista() {
  const corpo = q('listaPedidos');
  if (!pedidos.length) {
    corpo.innerHTML = '<tr><td colspan="6" class="vazio">Você ainda não fez nenhum pedido.</td></tr>';
    return;
  }
  const ordenados = [...pedidos].sort((a, b) => Number(b.id) - Number(a.id));
  corpo.innerHTML = ordenados.map((p) => {
    const banco = achar(bancos, p.bancoId);
    const editavel = p.status === 'Em análise';
    return `
      <tr>
        <td>#${p.id}</td>
        <td>${esc(descAutomovel(achar(automoveis, p.automovelId)))}</td>
        <td>${dataBR(p.dataInicio)} a ${dataBR(p.dataFim)}</td>
        <td>${p.comCredito ? esc(banco ? banco.nome : 'Banco removido') : '<span class="text-secondary">Sem crédito</span>'}</td>
        <td>${badgeStatus(p.status)}</td>
        <td class="text-end text-nowrap">
          <button class="btn btn-sm btn-outline-dark" data-acao="abrir" data-id="${p.id}">${editavel ? 'Editar' : 'Ver'}</button>
          ${editavel ? `<button class="btn btn-sm btn-outline-danger" data-acao="cancelar" data-id="${p.id}">Cancelar</button>` : ''}
        </td>
      </tr>`;
  }).join('');
}

function atualizarResumo() {
  const a = achar(automoveis, q('automovel').value);
  const ini = q('dataInicio').value;
  const fim = q('dataFim').value;
  const resumo = q('resumo');
  if (!a || !ini || !fim || fim < ini) {
    resumo.textContent = 'Escolha o automóvel e o período.';
    return;
  }
  const n = diarias(ini, fim);
  resumo.innerHTML = `${n} ${n === 1 ? 'diária' : 'diárias'} &times; ${moeda(a.valorDiaria)} =
    <strong>${moeda(n * a.valorDiaria)}</strong> (valor estimado)`;
}

function alternarBanco() {
  q('banco').classList.toggle('d-none', !q('comCredito').checked);
}

function travarCampos(travar) {
  ['automovel', 'dataInicio', 'dataFim', 'propriedade', 'comCredito', 'banco'].forEach((id) => {
    q(id).disabled = travar;
  });
  q('btnSalvarPedido').classList.toggle('d-none', travar);
}

function abrirModal(pedido) {
  editandoId = pedido ? pedido.id : null;
  erroPedido('');
  q('automovel').innerHTML = opcoesAutomoveis(automoveis, pedido && pedido.automovelId);
  q('banco').innerHTML = opcoesBancos(bancos, pedido && pedido.bancoId);
  q('dataInicio').min = hojeISO();
  q('dataInicio').value = pedido ? pedido.dataInicio : '';
  q('dataFim').value = pedido ? pedido.dataFim : '';
  q('propriedade').value = pedido ? pedido.propriedade : 'cliente';
  q('comCredito').checked = pedido ? pedido.comCredito : false;
  alternarBanco();

  const somenteLeitura = !!pedido && pedido.status !== 'Em análise';
  travarCampos(somenteLeitura);
  q('tituloModal').textContent = pedido
    ? `Pedido #${pedido.id}${somenteLeitura ? '' : ' - editar'}`
    : 'Novo pedido';

  const parecer = q('parecerBox');
  if (pedido && pedido.parecer) {
    parecer.innerHTML = `<strong>Parecer do agente:</strong> ${esc(pedido.parecer)}`;
    parecer.classList.remove('d-none');
  } else {
    parecer.classList.add('d-none');
  }

  atualizarResumo();
  modal.show();
}

async function salvarPedido(e) {
  e.preventDefault();
  erroPedido('');

  const automovelId = Number(q('automovel').value);
  const dataInicio = q('dataInicio').value;
  const dataFim = q('dataFim').value;
  const comCredito = q('comCredito').checked;

  // ao editar, mantém a data de retirada original mesmo que já tenha passado
  const original = editandoId ? achar(pedidos, editandoId) : null;
  const mudouInicio = !original || original.dataInicio !== dataInicio;
  const falha = validarPeriodo(dataInicio, dataFim, mudouInicio);
  if (falha) return erroPedido(falha);
  if (!automovelId) return erroPedido('Escolha um automóvel.');
  if (comCredito && !q('banco').value) return erroPedido('Escolha o banco do crédito.');

  try {
    if (await automovelOcupado(automovelId, dataInicio, dataFim, editandoId)) {
      return erroPedido('Esse automóvel já está reservado em parte desse período.');
    }

    const dados = {
      automovelId,
      dataInicio,
      dataFim,
      propriedade: q('propriedade').value,
      comCredito,
      bancoId: comCredito ? Number(q('banco').value) : null,
    };

    if (editandoId) {
      await api.atualizar('pedidos', editandoId, dados);
      aviso('Pedido atualizado.');
    } else {
      await api.criar('pedidos', {
        ...dados,
        clienteId: usuario.id,
        status: 'Em análise',
        parecer: '',
        criadoEm: hojeISO(),
      });
      aviso('Pedido enviado para análise.');
    }
    modal.hide();
    await carregar();
  } catch (err) {
    erroPedido('Não foi possível salvar o pedido.');
  }
}

async function cancelarPedido(id) {
  if (!confirm(`Cancelar o pedido #${id}?`)) return;
  try {
    await api.atualizar('pedidos', id, { status: 'Cancelado' });
    aviso('Pedido cancelado.');
    await carregar();
  } catch (err) {
    aviso('Não foi possível cancelar o pedido.', 'danger');
  }
}

if (usuario) {
  modal = new bootstrap.Modal(q('modalPedido'));

  q('btnNovo').addEventListener('click', () => abrirModal(null));
  q('formPedido').addEventListener('submit', salvarPedido);
  q('comCredito').addEventListener('change', alternarBanco);
  ['automovel', 'dataInicio', 'dataFim'].forEach((id) => q(id).addEventListener('change', atualizarResumo));

  q('listaPedidos').addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-acao]');
    if (!btn) return;
    if (btn.dataset.acao === 'abrir') abrirModal(achar(pedidos, btn.dataset.id));
    if (btn.dataset.acao === 'cancelar') cancelarPedido(btn.dataset.id);
  });

  carregar();
}
