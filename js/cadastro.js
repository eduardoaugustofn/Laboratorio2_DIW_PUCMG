// Cadastro e manutenção dos dados do usuário (CRUD de cliente).

const logado = Sessao.obter();
const MAX_EMPREGADORES = 3;

const el = (id) => document.getElementById(id);
const form = el('formCadastro');
const boxEmp = el('empregadores');

function mostrarErro(msg) {
  const caixa = el('erro');
  caixa.textContent = msg;
  caixa.classList.remove('d-none');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function cpfValido(cpf) {
  const n = cpf.replace(/\D/g, '');
  if (n.length !== 11 || /^(\d)\1+$/.test(n)) return false;
  for (const t of [9, 10]) {
    let soma = 0;
    for (let i = 0; i < t; i++) soma += Number(n[i]) * (t + 1 - i);
    const dv = ((soma * 10) % 11) % 10;
    if (dv !== Number(n[t])) return false;
  }
  return true;
}

function formatarCpf(v) {
  const n = v.replace(/\D/g, '').slice(0, 11);
  return n
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

function ajustarTipo() {
  const cliente = el('tipo').value === 'cliente';
  el('dadosCliente').classList.toggle('d-none', !cliente);
  el('rotuloNome').textContent = cliente ? 'Nome completo' : 'Razão social';
}

function atualizarBotaoEmp() {
  el('btnAddEmp').disabled = boxEmp.children.length >= MAX_EMPREGADORES;
}

function addEmpregador(nome = '', rendimento = '') {
  if (boxEmp.children.length >= MAX_EMPREGADORES) return;
  const linha = document.createElement('div');
  linha.className = 'row g-2 mb-2 linha-emp';
  linha.innerHTML = `
    <div class="col-7">
      <input type="text" class="form-control emp-nome" placeholder="Empregador" value="${esc(nome)}">
    </div>
    <div class="col-4">
      <input type="number" min="0" step="0.01" class="form-control emp-renda" placeholder="Rendimento (R$)" value="${esc(rendimento)}">
    </div>
    <div class="col-1">
      <button type="button" class="btn btn-outline-secondary w-100" title="Remover" aria-label="Remover empregador">&times;</button>
    </div>`;
  linha.querySelector('button').addEventListener('click', () => {
    linha.remove();
    atualizarBotaoEmp();
  });
  boxEmp.appendChild(linha);
  atualizarBotaoEmp();
}

function lerEmpregadores() {
  const lista = [];
  for (const linha of boxEmp.querySelectorAll('.linha-emp')) {
    const nome = linha.querySelector('.emp-nome').value.trim();
    const bruto = linha.querySelector('.emp-renda').value;
    if (!nome && !bruto) continue;
    if (!nome) throw new Error('Informe o nome do empregador em todas as linhas preenchidas.');
    const rendimento = Number(bruto);
    if (bruto === '' || Number.isNaN(rendimento) || rendimento < 0) {
      throw new Error(`Informe um rendimento válido para ${nome}.`);
    }
    lista.push({ nome, rendimento });
  }
  return lista;
}

async function preencher() {
  const u = await api.obter('usuarios', logado.id);
  if (!u) {
    Sessao.sair();
    return;
  }
  el('tipo').value = u.tipo;
  el('nome').value = u.nome;
  el('email').value = u.email;
  if (u.tipo === 'cliente') {
    el('rg').value = u.rg || '';
    el('cpf').value = formatarCpf(u.cpf || '');
    el('endereco').value = u.endereco || '';
    el('profissao').value = u.profissao || '';
    (u.empregadores || []).forEach((e) => addEmpregador(e.nome, e.rendimento));
  }
  ajustarTipo();
}

async function salvar(e) {
  e.preventDefault();
  el('erro').classList.add('d-none');

  const tipo = el('tipo').value;
  const nome = el('nome').value.trim();
  const email = el('email').value.trim().toLowerCase();
  const senha = el('senha').value;

  if (!nome) return mostrarErro('Informe o nome.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return mostrarErro('Informe um e-mail válido.');
  if (!logado && senha.length < 6) return mostrarErro('A senha precisa ter pelo menos 6 caracteres.');
  if (logado && senha && senha.length < 6) return mostrarErro('A nova senha precisa ter pelo menos 6 caracteres.');

  const dados = { tipo, nome, email };
  if (senha) dados.senha = senha;

  if (tipo === 'cliente') {
    const cpf = el('cpf').value;
    const rg = el('rg').value.trim();
    const endereco = el('endereco').value.trim();
    const profissao = el('profissao').value.trim();
    if (!rg) return mostrarErro('Informe o RG.');
    if (!cpfValido(cpf)) return mostrarErro('CPF inválido.');
    if (!endereco) return mostrarErro('Informe o endereço.');
    if (!profissao) return mostrarErro('Informe a profissão.');
    try {
      dados.empregadores = lerEmpregadores();
    } catch (err) {
      return mostrarErro(err.message);
    }
    Object.assign(dados, { rg, cpf: cpf.replace(/\D/g, ''), endereco, profissao });
  }

  try {
    const mesmos = await api.listar('usuarios', { email });
    if (mesmos.some((x) => !logado || String(x.id) !== String(logado.id))) {
      return mostrarErro('Já existe um cadastro com esse e-mail.');
    }

    if (logado) {
      const atualizado = await api.atualizar('usuarios', logado.id, dados);
      Sessao.entrar(atualizado);
      aviso('Dados atualizados.');
      montarNavbar();
      el('senha').value = '';
    } else {
      const novo = await api.criar('usuarios', dados);
      Sessao.entrar(novo);
      location.href = Sessao.paginaInicial(novo);
    }
  } catch (err) {
    mostrarErro('Não foi possível salvar. Tente novamente.');
  }
}

async function excluirConta() {
  if (!confirm('Excluir sua conta e todos os seus pedidos? Essa ação não pode ser desfeita.')) return;
  try {
    const pedidos = await api.listar('pedidos', { clienteId: logado.id });
    for (const p of pedidos) await api.excluir('pedidos', p.id);
    await api.excluir('usuarios', logado.id);
    Sessao.sair();
  } catch (err) {
    mostrarErro('Não foi possível excluir a conta.');
  }
}

el('tipo').addEventListener('change', ajustarTipo);
el('btnAddEmp').addEventListener('click', () => addEmpregador());
el('cpf').addEventListener('input', (e) => { e.target.value = formatarCpf(e.target.value); });
form.addEventListener('submit', salvar);
el('btnExcluir').addEventListener('click', excluirConta);

if (logado) {
  el('titulo').textContent = 'Meus dados';
  el('subtitulo').textContent = 'Atualize suas informações cadastrais.';
  el('btnSalvar').textContent = 'Salvar alterações';
  el('senha').required = false;
  el('dicaSenha').textContent = 'Deixe em branco para manter a senha atual.';
  el('tipo').disabled = true;
  if (logado.tipo === 'cliente') el('btnExcluir').classList.remove('d-none');
  preencher();
} else {
  addEmpregador();
  ajustarTipo();
}
