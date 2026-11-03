// Sessão, navbar e funções de apoio usadas em todas as páginas.

const Sessao = {
  obter() {
    try {
      return JSON.parse(sessionStorage.getItem('usuario'));
    } catch (e) {
      return null;
    }
  },
  entrar(u) {
    sessionStorage.setItem('usuario', JSON.stringify({ id: u.id, tipo: u.tipo, nome: u.nome }));
  },
  sair() {
    sessionStorage.removeItem('usuario');
    location.href = 'index.html';
  },
  exigir(tipos) {
    const u = this.obter();
    if (!u || (tipos && !tipos.includes(u.tipo))) {
      location.href = 'index.html';
      return null;
    }
    return u;
  },
  paginaInicial(u) {
    return u.tipo === 'cliente' ? 'cliente.html' : 'agente.html';
  },
};

const ROTULO_TIPO = { cliente: 'Cliente', empresa: 'Empresa', banco: 'Banco' };

const COR_STATUS = {
  'Em análise': 'warning',
  Aprovado: 'success',
  Reprovado: 'danger',
  'Contrato executado': 'primary',
  Cancelado: 'secondary',
};

function esc(valor) {
  return String(valor ?? '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

function dataBR(iso) {
  if (!iso) return '';
  const [a, m, d] = iso.split('-');
  return `${d}/${m}/${a}`;
}

function moeda(v) {
  return Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function hojeISO() {
  const d = new Date();
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mes}-${dia}`;
}

// número de diárias, contando o dia da retirada e o da devolução
function diarias(inicio, fim) {
  const a = new Date(inicio + 'T00:00:00');
  const b = new Date(fim + 'T00:00:00');
  return Math.round((b - a) / 86400000) + 1;
}

function badgeStatus(status) {
  return `<span class="badge text-bg-${COR_STATUS[status] || 'secondary'}">${esc(status)}</span>`;
}

function descAutomovel(a) {
  return a ? `${a.marca} ${a.modelo} (${a.ano}) - ${a.placa}` : 'Automóvel removido';
}

function aviso(mensagem, tipo = 'success') {
  let caixa = document.getElementById('avisos');
  if (!caixa) {
    caixa = document.createElement('div');
    caixa.id = 'avisos';
    document.body.appendChild(caixa);
  }
  const el = document.createElement('div');
  el.className = `alert alert-${tipo} shadow-sm py-2`;
  el.textContent = mensagem;
  caixa.appendChild(el);
  setTimeout(() => el.remove(), 4000);
}

function montarNavbar() {
  const topo = document.getElementById('topo');
  if (!topo) return;
  const u = Sessao.obter();
  let links = '';
  let direita = '';
  if (u) {
    const inicio = Sessao.paginaInicial(u);
    links = `
      <li class="nav-item"><a class="nav-link" href="${inicio}">${u.tipo === 'cliente' ? 'Meus pedidos' : 'Pedidos'}</a></li>
      <li class="nav-item"><a class="nav-link" href="cadastro.html">Meus dados</a></li>`;
    direita = `
      <span class="navbar-text me-3">${esc(u.nome)} <span class="text-secondary">(${ROTULO_TIPO[u.tipo]})</span></span>
      <button class="btn btn-outline-light btn-sm" id="btnSair">Sair</button>`;
  } else {
    links = `
      <li class="nav-item"><a class="nav-link" href="index.html">Entrar</a></li>
      <li class="nav-item"><a class="nav-link" href="cadastro.html">Cadastrar</a></li>`;
  }
  topo.innerHTML = `
    <nav class="navbar navbar-expand-md navbar-dark bg-dark">
      <div class="container">
        <a class="navbar-brand" href="index.html">Aluguel de Carros</a>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#menu" aria-label="Abrir menu">
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="menu">
          <ul class="navbar-nav me-auto">${links}</ul>
          <div class="d-flex align-items-center">${direita}</div>
        </div>
      </div>
    </nav>`;
  const sair = document.getElementById('btnSair');
  if (sair) sair.addEventListener('click', () => Sessao.sair());
}

document.addEventListener('DOMContentLoaded', montarNavbar);
