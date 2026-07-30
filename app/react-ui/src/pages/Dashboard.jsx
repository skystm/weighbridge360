import { useState, useEffect } from 'react'
import { getFilaEspera, getTickets, aprovarDivergencia } from '../api'

const FAZENDA_ID = 'f1000001-0000-0000-0000-000000000001'
const COORDENADOR_ID = 'u1000002-0000-0000-0000-000000000002'

const STATUS_LABEL = {
  AGUARDANDO_TARA: 'Aguardando Tara',
  AGUARDANDO_CARGA: 'Aguardando Carga',
  AGUARDANDO_BRUTO: 'Aguardando Bruto',
  AGUARDANDO_DOCUMENTO: 'Aguardando Documento',
  CONCLUIDO: 'Concluído',
  DIVERGENCIA: 'Divergência',
  PENDENTE_SAP: 'Pendente SAP'
}

export default function Dashboard() {
  const [fila, setFila] = useState(null)
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [justificativa, setJustificativa] = useState('')
  const [aprovando, setAprovando] = useState(null)

  async function carregar() {
    setLoading(true)
    try {
      const [f, t] = await Promise.all([
        getFilaEspera(FAZENDA_ID),
        getTickets(FAZENDA_ID)
      ])
      setFila(f); setTickets(t)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { carregar(); const i = setInterval(carregar, 15000); return () => clearInterval(i) }, [])

  async function handleAprovar(ticketId) {
    if (!justificativa || justificativa.length < 20) {
      alert('Justificativa deve ter no mínimo 20 caracteres'); return
    }
    setAprovando(ticketId)
    try {
      await aprovarDivergencia(ticketId, { coordenadorId: COORDENADOR_ID, justificativa })
      setJustificativa(''); carregar()
    } catch (e) { alert(e.message) }
    finally { setAprovando(null) }
  }

  const divergencias = tickets.filter(t => t.status_code === 'DIVERGENCIA')
  const ativos = tickets.filter(t => !['CONCLUIDO'].includes(t.status_code))
  const concluidos = tickets.filter(t => t.status_code === 'CONCLUIDO')

  return (
    <div>
      {/* KPIs */}
      <div className="grid-3" style={{ marginBottom: 16 }}>
        <div className="stat-card">
          <div className="stat-label">Fila atual</div>
          <div className={`stat-value ${fila?.alertaAtivo ? 'red' : 'blue'}`}>
            {fila?.quantidadeAtual ?? '—'}
            {fila?.alertaAtivo && <span style={{ fontSize: 14, marginLeft: 8 }}>⚠️</span>}
          </div>
          <div style={{ fontSize: 12, color: 'var(--sap-gray-3)', marginTop: 4 }}>
            Threshold: {fila?.thresholdFila} · Tempo médio: {fila?.tempoMedioEspera ?? 0} min
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Divergências pendentes</div>
          <div className={`stat-value ${divergencias.length > 0 ? 'red' : 'green'}`}>{divergencias.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Concluídos hoje</div>
          <div className="stat-value green">{concluidos.length}</div>
        </div>
      </div>

      {/* Alerta de fila */}
      {fila?.alertaAtivo && (
        <div className="alert alert-error" style={{ marginBottom: 16 }}>
          ⚠️ Fila acima do threshold ({fila.quantidadeAtual} caminhões). Considere acionar reforço operacional.
        </div>
      )}

      {/* Divergências */}
      {divergencias.length > 0 && (
        <div className="card">
          <div className="card-title">⚠️ Divergências — Aprovação necessária</div>
          {divergencias.map(t => (
            <div key={t.ID} style={{ border: '1px solid var(--sap-red)', borderRadius: 8, padding: 16, marginBottom: 12, background: '#fff8f8' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <strong style={{ fontSize: 18 }}>{t.placa}</strong>
                <span className="badge badge-divergencia">DIVERGÊNCIA</span>
              </div>
              <div style={{ fontSize: 13, color: 'var(--sap-red)', marginBottom: 12 }}>{t.divergenciaDesc}</div>
              <textarea
                className="form-input"
                rows={2}
                placeholder="Justificativa da aprovação (mín. 20 caracteres)..."
                value={justificativa}
                onChange={e => setJustificativa(e.target.value)}
                style={{ marginBottom: 8 }}
              />
              <button className="btn btn-success" onClick={() => handleAprovar(t.ID)} disabled={aprovando === t.ID}>
                {aprovando === t.ID ? 'Aprovando...' : '✅ Aprovar e retomar fluxo'}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Tickets ativos */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div className="card-title" style={{ margin: 0 }}>🚛 Tickets em andamento</div>
          <button className="btn btn-ghost" onClick={carregar} disabled={loading} style={{ padding: '6px 12px' }}>
            {loading ? '⟳' : '🔄 Atualizar'}
          </button>
        </div>
        {ativos.length === 0
          ? <div style={{ color: 'var(--sap-gray-3)', textAlign: 'center', padding: 24 }}>Nenhum ticket ativo</div>
          : (
            <table className="table">
              <thead><tr>
                <th>Placa</th><th>Produto</th><th>Status</th><th>Tara (kg)</th><th>Bruto (kg)</th><th>Líquido (kg)</th>
              </tr></thead>
              <tbody>
                {ativos.map(t => (
                  <tr key={t.ID}>
                    <td><strong>{t.placa}</strong></td>
                    <td>{t.produto_code}</td>
                    <td><span className={`badge badge-${t.status_code?.toLowerCase().replace('aguardando_','').replace('_','')}`}>{STATUS_LABEL[t.status_code]}</span></td>
                    <td>{t.taraValor ? t.taraValor.toLocaleString('pt-BR') : '—'}</td>
                    <td>{t.pesoBrutoValor ? t.pesoBrutoValor.toLocaleString('pt-BR') : '—'}</td>
                    <td>{t.pesoLiquidoValor ? <strong style={{ color: 'var(--sap-green)' }}>{t.pesoLiquidoValor.toLocaleString('pt-BR')}</strong> : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
      </div>

      {/* Tickets concluídos */}
      {concluidos.length > 0 && (
        <div className="card">
          <div className="card-title">✅ Concluídos hoje</div>
          <table className="table">
            <thead><tr>
              <th>Placa</th><th>Produto</th><th>Peso Líquido</th><th>DANFe</th><th>SAP</th>
            </tr></thead>
            <tbody>
              {concluidos.map(t => (
                <tr key={t.ID}>
                  <td><strong>{t.placa}</strong></td>
                  <td>{t.produto_code}</td>
                  <td><strong style={{ color: 'var(--sap-green)' }}>{t.pesoLiquidoValor?.toLocaleString('pt-BR')} kg</strong></td>
                  <td style={{ fontSize: 12 }}>{t.danfeNumero || '—'}</td>
                  <td>{t.sincronizadoSAP ? '✅' : '⏳'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
