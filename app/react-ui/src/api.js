const BASE = '/api/v1'

export async function checkIn(data) {
  const res = await fetch(`${BASE}/checkIn`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error?.message || json.message || 'Erro no check-in')
  return json
}

export async function registrarTara(ticketId, data) {
  const res = await fetch(`${BASE}/TicketsPesagem(${ticketId})/registrarTara`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error?.message || json.message || 'Erro ao registrar tara')
  return json
}

export async function iniciarCarregamento(ticketId, operadorId) {
  const res = await fetch(`${BASE}/TicketsPesagem(${ticketId})/iniciarCarregamento`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ operadorId })
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error?.message || json.message || 'Erro ao iniciar carregamento')
  return json
}

export async function registrarPesoBruto(ticketId, data) {
  const res = await fetch(`${BASE}/TicketsPesagem(${ticketId})/registrarPesoBruto`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error?.message || json.message || 'Erro ao registrar peso bruto')
  return json
}

export async function liberarCaminhao(ticketId, operadorId) {
  const res = await fetch(`${BASE}/TicketsPesagem(${ticketId})/liberarCaminhao`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ operadorId })
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error?.message || json.message || 'Erro ao liberar caminhão')
  return json
}

export async function aprovarDivergencia(ticketId, data) {
  const res = await fetch(`${BASE}/TicketsPesagem(${ticketId})/aprovarDivergencia`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error?.message || json.message || 'Erro ao aprovar divergência')
  return json
}

export async function getFilaEspera(fazendaId) {
  const res = await fetch(`${BASE}/filaEspera(fazendaId=${fazendaId})`)
  const json = await res.json()
  if (!res.ok) throw new Error(json.error?.message || 'Erro ao carregar fila')
  return json
}

export async function getTickets(fazendaId) {
  const res = await fetch(`${BASE}/TicketsPesagem?$filter=fazenda_ID eq ${fazendaId}&$orderby=createdAt desc&$top=20`)
  const json = await res.json()
  if (!res.ok) throw new Error('Erro ao carregar tickets')
  return json.value || []
}

export async function getFazendas() {
  const res = await fetch(`${BASE}/Fazendas`)
  const json = await res.json()
  return json.value || []
}
