// Camada de acesso aos dados.
// Rodando em localhost, usa o JSON Server (http://localhost:3000).
// Publicado no GitHub Pages (sem servidor), lê o db.json e guarda as
// alterações no localStorage do navegador.

const API_URL = 'http://localhost:3000';
const CHAVE_LOCAL = 'aluguel_db_v3';

const api = (() => {
  let modo = null;
  let banco = null;

  async function detectarModo() {
    if (modo) return modo;
    const host = location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
      try {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 800);
        const r = await fetch(`${API_URL}/automoveis`, { signal: ctrl.signal });
        clearTimeout(timer);
        if (r.ok) return (modo = 'servidor');
      } catch (e) {
        // sem JSON Server rodando, cai para o modo local
      }
    }
    return (modo = 'local');
  }

  async function carregarLocal() {
    if (banco) return banco;
    const salvo = localStorage.getItem(CHAVE_LOCAL);
    if (salvo) {
      banco = JSON.parse(salvo);
      return banco;
    }
    const resp = await fetch('db.json');
    banco = await resp.json();
    gravarLocal();
    return banco;
  }

  function gravarLocal() {
    localStorage.setItem(CHAVE_LOCAL, JSON.stringify(banco));
  }

  function confere(item, filtro) {
    return Object.keys(filtro).every((k) => String(item[k]) === String(filtro[k]));
  }

  async function requisitar(metodo, caminho, corpo) {
    const opcoes = { method: metodo, headers: { 'Content-Type': 'application/json' } };
    if (corpo !== undefined) opcoes.body = JSON.stringify(corpo);
    const resp = await fetch(API_URL + caminho, opcoes);
    if (!resp.ok) throw new Error(`Erro ${resp.status} em ${caminho}`);
    return metodo === 'DELETE' ? null : resp.json();
  }

  return {
    async modo() {
      return detectarModo();
    },

    async listar(colecao, filtro = {}) {
      if ((await detectarModo()) === 'servidor') {
        const qs = new URLSearchParams(filtro).toString();
        return requisitar('GET', `/${colecao}${qs ? '?' + qs : ''}`);
      }
      const db = await carregarLocal();
      return db[colecao].filter((x) => confere(x, filtro)).map((x) => ({ ...x }));
    },

    async obter(colecao, id) {
      if ((await detectarModo()) === 'servidor') {
        return requisitar('GET', `/${colecao}/${id}`);
      }
      const db = await carregarLocal();
      const item = db[colecao].find((x) => String(x.id) === String(id));
      return item ? { ...item } : null;
    },

    async criar(colecao, dados) {
      if ((await detectarModo()) === 'servidor') {
        return requisitar('POST', `/${colecao}`, dados);
      }
      const db = await carregarLocal();
      const proximo = db[colecao].reduce((m, x) => Math.max(m, Number(x.id)), 0) + 1;
      const novo = { ...dados, id: proximo };
      db[colecao].push(novo);
      gravarLocal();
      return { ...novo };
    },

    async atualizar(colecao, id, dados) {
      if ((await detectarModo()) === 'servidor') {
        return requisitar('PATCH', `/${colecao}/${id}`, dados);
      }
      const db = await carregarLocal();
      const item = db[colecao].find((x) => String(x.id) === String(id));
      if (!item) throw new Error('Registro não encontrado');
      Object.assign(item, dados);
      gravarLocal();
      return { ...item };
    },

    async excluir(colecao, id) {
      if ((await detectarModo()) === 'servidor') {
        return requisitar('DELETE', `/${colecao}/${id}`);
      }
      const db = await carregarLocal();
      db[colecao] = db[colecao].filter((x) => String(x.id) !== String(id));
      gravarLocal();
      return null;
    },

    // volta o modo local para os dados originais do db.json
    async restaurarLocal() {
      localStorage.removeItem(CHAVE_LOCAL);
      banco = null;
    },
  };
})();
