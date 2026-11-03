// Regras de pedido compartilhadas entre as telas de cliente e de agente.

const STATUS_OCUPAM = ['Em análise', 'Aprovado', 'Contrato executado'];

const ROTULO_PROPRIEDADE = {
  cliente: 'Cliente',
  empresa: 'Empresa',
  banco: 'Banco',
};

// confere se o período está correto; devolve a mensagem de erro ou null
function validarPeriodo(inicio, fim, exigirFuturo) {
  if (!inicio || !fim) return 'Informe as datas de retirada e devolução.';
  if (fim < inicio) return 'A devolução não pode ser antes da retirada.';
  if (exigirFuturo && inicio < hojeISO()) return 'A retirada não pode ser em uma data passada.';
  return null;
}

// true se o automóvel já está reservado em algum pedido ativo no período
async function automovelOcupado(automovelId, inicio, fim, ignorarPedidoId) {
  const outros = await api.listar('pedidos', { automovelId });
  return outros.some((p) =>
    String(p.id) !== String(ignorarPedidoId) &&
    STATUS_OCUPAM.includes(p.status) &&
    p.dataInicio <= fim && p.dataFim >= inicio
  );
}

function opcoesAutomoveis(automoveis, selecionado) {
  return automoveis.map((a) =>
    `<option value="${a.id}" ${String(a.id) === String(selecionado) ? 'selected' : ''}>
      ${esc(descAutomovel(a))} - ${moeda(a.valorDiaria)}/dia
    </option>`
  ).join('');
}

function opcoesBancos(bancos, selecionado) {
  return bancos.map((b) =>
    `<option value="${b.id}" ${String(b.id) === String(selecionado) ? 'selected' : ''}>${esc(b.nome)}</option>`
  ).join('');
}

function totalEstimado(pedido, automovel) {
  if (!automovel) return 0;
  return diarias(pedido.dataInicio, pedido.dataFim) * automovel.valorDiaria;
}
