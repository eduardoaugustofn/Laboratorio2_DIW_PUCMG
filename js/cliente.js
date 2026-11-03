// Tela do cliente: frota, criar, consultar, modificar e cancelar pedidos.

const usuario = Sessao.exigir(['cliente']);
const q = (id) => document.getElementById(id);

const CATEGORIAS = ['Super esportivo', 'Cinema e TV', 'Popular'];

let automoveis = [];
let bancos = [];
let pedidos = [];
let editandoId = null;
let filtroAtual = 'Todos';
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
  desenharTopo();
  desenharFiltros();
  desenharCatalogo();
  desenharLista();
}

function desenharTopo() {
  q('statCarros').textContent = automoveis.length;
  q('statCategorias').textContent = new Set(automoveis.map((a) => a.categoria)).size;
  // a faixa é repetida duas vezes para o loop da animação ficar contínuo
  const nomes = automoveis.map((a) => `<span>${esc(a.marca)} ${esc(a.modelo)}</span>`).join('');
  q('trilho').innerHTML = nomes + nomes;
}

function desenharFiltros() {
  const nomes = ['Todos', ...CATEGORIAS.filter((c) => automoveis.some((a) => a.categoria === c))];
  q('filtros').innerHTML = nomes.map((n) => `
    <button type="button" class="btn btn-outline-dark ${n === filtroAtual ? 'ativo' : ''}" data-filtro="${esc(n)}">${esc(n)}</button>
  `).join('');
}

function desenharCatalogo() {
  const lista = automoveis.filter((a) => filtroAtual === 'Todos' || a.categoria === filtroAtual);
  q('catalogo').innerHTML = lista.map((a) => `
    <div class="col-12 col-sm-6 col-lg-4">
      <article class="carro">
        <div class="foto">
          <img src="${esc(a.foto)}" alt="${esc(a.marca + ' ' + a.modelo)}" loading="lazy">
          <span class="etiqueta">${esc(a.categoria || 'Carro')}</span>
        </div>
        <div class="corpo">
          <h3>${esc(a.marca)} ${esc(a.modelo)}</h3>
          ${a.obra ? `<div class="obra">${esc(a.obra)}</div>` : ''}
          <div class="detalhes mt-1">${esc(a.ano)} &middot; placa ${esc(a.placa)}</div>
          <div class="d-flex justify-content-between align-items-end mt-auto pt-3">
            <div class="preco">${moeda(a.valorDiaria)} <small>/ dia</small></div>
            <button type="button" class="btn btn-dark btn-sm" data-alugar="${a.id}">Alugar</button>
          </div>
        </div>
      </article>
    </div>`).join('');
}

function desenharLista() {
  const corpo = q('listaPedidos');
  if (!pedidos.length) {
    corpo.innerHTML = '<tr><td colspan="6" class="vazio">Você ainda não fez nenhum pedido. Escolha um carro na frota acima.</td></tr>';
    return;
  }
  const ordenados = [...pedidos].sort((a, b) => Number(b.id) - Number(a.id));
  corpo.innerHTML = ordenados.map((p) => {
    const carro = achar(automoveis, p.automovelId);
    const banco = achar(bancos, p.bancoId);
    const editavel = p.status === 'Em análise';
    return `
      <tr>
        <td>#${p.id}</td>
        <td>
          <div class="d-flex align-items-center gap-2">
            ${carro && carro.foto ? `<img class="miniatura" src="${esc(carro.foto)}" alt="">` : ''}
            <span>${esc(descAutomovel(carro))}</span>
          </div>
        </td>
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

function atualizarPrevia() {
  const a = achar(automoveis, q('automovel').value);
  const foto = q('fotoCarro');
  if (!a) {
    foto.removeAttribute('src');
    q('infoCarro').innerHTML = '';
    return;
  }
  foto.src = a.foto;
  foto.alt = `${a.marca} ${a.modelo}`;
  const credito = a.fotoLink
    ? `<a href="${esc(a.fotoLink)}" target="_blank" rel="noopener">Foto: Wikimedia Commons${a.licenca ? ' (' + esc(a.licenca) + ')' : ''}</a>`
    : 'Foto: Wikipédia';
  q('infoCarro').innerHTML = `
    <span class="badge text-bg-primary mb-2">${esc(a.categoria || 'Carro')}</span>
    <h3 class="h5 mb-0">${esc(a.marca)} ${esc(a.modelo)}</h3>
    ${a.obra ? `<div class="small fst-italic" style="color: var(--roxo-claro)">${esc(a.obra)}</div>` : ''}
    <ul class="list-unstyled small text-secondary my-2">
      <li>Ano: ${esc(a.ano)}</li>
      <li>Placa: ${esc(a.placa)} &middot; Matrícula: ${esc(a.matricula)}</li>
      <li>Diária: ${moeda(a.valorDiaria)}</li>
    </ul>
    <p class="small mb-1">${esc(a.descricao || '')}</p>
    <div class="small text-secondary">
      ${a.fonte ? `<a href="${esc(a.fonte)}" target="_blank" rel="noopener">Wikipédia</a> &middot; ` : ''}${credito}
    </div>`;
}

function atualizarResumo() {
  const a = achar(automoveis, q('automovel').value);
  const ini = q('dataInicio').value;
  const fim = q('dataFim').value;
  const resumo = q('resumo');
  if (!a || !ini || !fim || fim < ini) {
    resumo.textContent = 'Escolha o período.';
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

// pedido: abre um existente; carroId: abre um novo já com o carro escolhido
function abrirModal(pedido, carroId) {
  editandoId = pedido ? pedido.id : null;
  erroPedido('');
  const escolhido = pedido ? pedido.automovelId : carroId;
  q('automovel').innerHTML = opcoesAutomoveis(automoveis, escolhido);
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

  atualizarPrevia();
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
    q('pedidos').scrollIntoView({ behavior: 'smooth' });
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

  q('formPedido').addEventListener('submit', salvarPedido);
  q('comCredito').addEventListener('change', alternarBanco);
  q('automovel').addEventListener('change', () => {
    atualizarPrevia();
    atualizarResumo();
  });
  ['dataInicio', 'dataFim'].forEach((id) => q(id).addEventListener('change', atualizarResumo));

  q('filtros').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-filtro]');
    if (!btn) return;
    filtroAtual = btn.dataset.filtro;
    desenharFiltros();
    desenharCatalogo();
  });

  q('catalogo').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-alugar]');
    if (btn) abrirModal(null, btn.dataset.alugar);
  });

  q('listaPedidos').addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-acao]');
    if (!btn) return;
    if (btn.dataset.acao === 'abrir') abrirModal(achar(pedidos, btn.dataset.id));
    if (btn.dataset.acao === 'cancelar') cancelarPedido(btn.dataset.id);
  });

  carregar();
}
