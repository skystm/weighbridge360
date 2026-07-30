import { useState } from 'react'
import { checkIn } from '../api'

const FAZENDA_ID = 'f1000001-0000-0000-0000-000000000001'
const OPERADOR_ID = 'u1000001-0000-0000-0000-000000000001'

export default function CheckIn({ onTicketCriado }) {
  const [placa, setPlaca] = useState('')
  const [simulandoOCR, setSimulandoOCR] = useState(false)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState(null)
  const [ocrScore, setOcrScore] = useState(null)

  function simularOCR() {
    setSimulandoOCR(true)
    setErro(null)
    setTimeout(() => {
      const placas = ['ABC1D23', 'DEF2E34', 'GHI3F45']
      const lida = placas[Math.floor(Math.random() * placas.length)]
      const score = (0.85 + Math.random() * 0.14).toFixed(2)
      setPlaca(lida)
      setOcrScore(parseFloat(score))
      setSimulandoOCR(false)
    }, 1800)
  }

  async function handleCheckIn() {
    if (!placa) return
    setLoading(true)
    setErro(null)
    try {
      const ticket = await checkIn({
        fazendaId: FAZENDA_ID,
        placa: placa.toUpperCase(),
        fonteIdentificacao: ocrScore ? 'OCR_AUTOMATICO' : 'DIGITACAO_MANUAL',
        confiancaOCR: ocrScore || 0.99,
        operadorId: OPERADOR_ID
      })
      onTicketCriado(ticket)
    } catch (e) {
      setErro(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="card">
        <div className="card-title">📷 Check-in de Caminhão</div>

        <div className="form-group">
          <label className="form-label">Leitura automática de placa (OCR)</label>
          <button className="btn btn-primary" onClick={simularOCR} disabled={simulandoOCR} style={{ width: '100%', marginBottom: 12 }}>
            {simulandoOCR ? <><span className="spinner" style={{ marginRight: 8 }} />Lendo câmera...</> : '📷 Acionar câmera OCR'}
          </button>
          {ocrScore && (
            <div className="alert alert-success">
              ✅ Placa lida: <strong>{placa}</strong> · Confiança: <strong>{(ocrScore * 100).toFixed(0)}%</strong>
            </div>
          )}
        </div>

        <div className="form-group">
          <label className="form-label">Placa do caminhão</label>
          <input
            className="form-input"
            placeholder="ABC1D23"
            value={placa}
            onChange={e => { setPlaca(e.target.value.toUpperCase()); setOcrScore(null) }}
            style={{ fontSize: 20, fontWeight: 700, letterSpacing: 2, textAlign: 'center' }}
          />
          <div style={{ fontSize: 12, color: 'var(--sap-gray-3)', marginTop: 4 }}>
            Formato Mercosul (ABC1D23) ou antigo (ABC-1234)
          </div>
        </div>

        {erro && <div className="alert alert-error">❌ {erro}</div>}

        <button
          className="btn btn-success btn-lg"
          onClick={handleCheckIn}
          disabled={!placa || loading}
        >
          {loading ? <><span className="spinner" style={{ marginRight: 8 }} />Verificando contrato...</> : '✅ Registrar chegada'}
        </button>
      </div>

      <div className="card">
        <div className="card-title">ℹ️ Como funciona</div>
        <div className="data-row"><span className="data-label">1. Câmera OCR</span><span className="data-value">Lê a placa automaticamente</span></div>
        <div className="data-row"><span className="data-label">2. Validação SAP</span><span className="data-value">Verifica contrato ativo e saldo</span></div>
        <div className="data-row"><span className="data-label">3. Ticket criado</span><span className="data-value">Processo de pesagem iniciado</span></div>
      </div>
    </div>
  )
}
