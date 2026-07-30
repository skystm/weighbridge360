import { useState } from 'react'
import { registrarTara, iniciarCarregamento, registrarPesoBruto, liberarCaminhao } from '../api'

const OPERADOR_ID = 'u1000001-0000-0000-0000-000000000001'

const STEPS = ['Check-in', 'Tara', 'Carregamento', 'Peso Bruto', 'Documentos', 'Concluído']
const STATUS_STEP = {
  AGUARDANDO_TARA: 1, AGUARDANDO_CARGA: 2, AGUARDANDO_BRUTO: 3,
  AGUARDANDO_DOCUMENTO: 4, CONCLUIDO: 5, DIVERGENCIA: 3
}

function Stepper({ status }) {
  const atual = STATUS_STEP[status] ?? 0
  return (
    <div className="stepper">
      {STEPS.map((s, i) => (
        <div key={s} className={`step ${i < atual ? 'done' : i === atual ? 'active' : ''}`}>
          <span className="step-num">{i < atual ? '✓' : i + 1}</span>
          {s}
        </div>
      ))}
    </div>
  )
}

function simularSensor(base) {
  return parseFloat((base + (Math.random() * 20 - 10)).toFixed(2))
}

export default function Pesagem({ ticket, onVoltar }) {
  const [t, setT] = useState(ticket)
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState(null)
  const [pesoSimulado, setPesoSimulado] = useState(null)
  const [lendoSensor, setLendoSensor] = useState(false)

  async function acionar(fn, ...args) {
    setLoading(true); setErro(null)
    try {
      const updated = await fn(...args)
      setT(updated); setPesoSimulado(null)
    } catch (e) { setErro(e.message) }
    finally { setLoading(false) }
  }

  function lerSensor(pesoBase) {
    setLendoSensor(true)
    setTimeout(() => {
      setPesoSimulado(simularSensor(pesoBase))
      setLendoSensor(false)
    }, 2000)
  }

  if (!t) return (
    <div className="card">
      <div className="alert alert-info">Nenhum ticket ativo. Faça o check-in de um caminhão primeiro.</div>
      <button className="btn btn-ghost" onClick={onVoltar}>← Voltar ao check-in</button>
    </div>
  )

  const status = t.status_code

  return (
    <div>
      {/* Cabeçalho do ticket */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 24, fontWeight: 700 }}>{t.placa}</div>
            <div style={{ fontSize: 14, color: 'var(--sap-gray-3)' }}>{t.produto_code} · {t.transportadora}</div>
          </div>
          <span className={`badge badge-${status?.toLowerCase().replace('aguardando_', '').replace('_', '')}`}>
            {status?.replace(/_/g, ' ')}
          </span>
        </div>
        <Stepper status={status} />
      </div>

      {erro && <div className="alert alert-error">❌ {erro}</div>}

      {/* DIVERGÊNCIA */}
      {status === 'DIVERGENCIA' && (
        <div className="card">
          <div className="alert alert-error" style={{ marginBottom: 16 }}>
            ⚠️ <strong>Divergência detectada:</strong> {t.divergenciaDesc}
          </div>
          <div className="alert alert-warning">
            Aguardando aprovação do Coordenador. O Coordenador deve acessar o Dashboard para liberar este ticket.
          </div>
        </div>
      )}

      {/* PESAGEM 1 — TARA */}
      {status === 'AGUARDANDO_TARA' && (
        <div className="card">
          <div className="card-title">⚖️ Pesagem 1 — Registrar Tara</div>
          <p style={{ color: 'var(--sap-gray-3)', marginBottom: 16, fontSize: 14 }}>
            Caminhão vazio posicionado na balança. Acione o sensor para capturar o peso.
          </p>
          <button className="btn btn-primary" style={{ width: '100%', marginBottom: 12 }}
            onClick={() => lerSensor(18500)} disabled={lendoSensor}>
            {lendoSensor ? <><span className="spinner" style={{ marginRight: 8 }} />Aguardando estabilização...</> : '📡 Ler sensor da balança'}
          </button>
          {pesoSimulado && (
            <>
              <div className="peso-display">
                <div className="peso-valor">{pesoSimulado.toLocaleString('pt-BR')}</div>
                <div className="peso-unidade">kg</div>
                <div className="peso-fonte">✅ SENSOR AUTOMÁTICO · Leitura estabilizada</div>
              </div>
              <button className="btn btn-success btn-lg" onClick={() =>
                acionar(registrarTara, t.ID, { valor: pesoSimulado, fonte: 'SENSOR_AUTOMATICO', operadorId: OPERADOR_ID })}
                disabled={loading}>
                {loading ? 'Registrando...' : `✅ Confirmar Tara: ${pesoSimulado.toLocaleString('pt-BR')} kg`}
              </button>
            </>
          )}
        </div>
      )}

      {/* AGUARDANDO CARGA */}
      {status === 'AGUARDANDO_CARGA' && (
        <div className="card">
          <div className="card-title">🚛 Liberar para Carregamento</div>
          <div className="data-row"><span className="data-label">Tara registrada</span>
            <span className="data-value">{t.taraValor?.toLocaleString('pt-BR')} kg</span></div>
          <div style={{ height: 16 }} />
          <button className="btn btn-primary btn-lg" onClick={() =>
            acionar(iniciarCarregamento, t.ID, OPERADOR_ID)} disabled={loading}>
            {loading ? 'Processando...' : '🟢 Liberar caminhão para o silo'}
          </button>
        </div>
      )}

      {/* PESAGEM 2 — PESO BRUTO */}
      {status === 'AGUARDANDO_BRUTO' && (
        <div className="card">
          <div className="card-title">⚖️ Pesagem 2 — Registrar Peso Bruto</div>
          <div className="data-row"><span className="data-label">Tara</span>
            <span className="data-value">{t.taraValor?.toLocaleString('pt-BR')} kg</span></div>
          <div style={{ height: 12 }} />
          <button className="btn btn-primary" style={{ width: '100%', marginBottom: 12 }}
            onClick={() => lerSensor(43200)} disabled={lendoSensor}>
            {lendoSensor ? <><span className="spinner" style={{ marginRight: 8 }} />Aguardando estabilização...</> : '📡 Ler sensor da balança'}
          </button>
          {pesoSimulado && (
            <>
              <div className="peso-display">
                <div className="peso-valor">{pesoSimulado.toLocaleString('pt-BR')}</div>
                <div className="peso-unidade">kg bruto</div>
                <div className="peso-fonte">
                  Peso líquido estimado: {(pesoSimulado - t.taraValor).toLocaleString('pt-BR')} kg
                </div>
              </div>
              <button className="btn btn-success btn-lg" onClick={() =>
                acionar(registrarPesoBruto, t.ID, { valor: pesoSimulado, fonte: 'SENSOR_AUTOMATICO', operadorId: OPERADOR_ID })}
                disabled={loading}>
                {loading ? 'Registrando...' : `✅ Confirmar Peso Bruto: ${pesoSimulado.toLocaleString('pt-BR')} kg`}
              </button>
            </>
          )}
        </div>
      )}

      {/* AGUARDANDO DOCUMENTO */}
      {status === 'AGUARDANDO_DOCUMENTO' && (
        <div className="card">
          <div className="card-title">📄 Emissão de Documentos Fiscais</div>
          <div className="grid-2" style={{ marginBottom: 16 }}>
            <div className="data-row"><span className="data-label">Tara</span><span className="data-value">{t.taraValor?.toLocaleString('pt-BR')} kg</span></div>
            <div className="data-row"><span className="data-label">Peso Bruto</span><span className="data-value">{t.pesoBrutoValor?.toLocaleString('pt-BR')} kg</span></div>
          </div>
          <div className="data-row" style={{ marginBottom: 16 }}>
            <span className="data-label">Peso Líquido</span>
            <span className="data-value" style={{ fontSize: 24, color: 'var(--sap-green)' }}>
              {t.pesoLiquidoValor?.toLocaleString('pt-BR')} kg
            </span>
          </div>
          {t.danfeStatus === 'AUTORIZADO' ? (
            <>
              <div className="alert alert-success">
                ✅ DANFe #{t.danfeNumero} autorizado · CTe #{t.cteNumero} autorizado
              </div>
              <button className="btn btn-success btn-lg" onClick={() =>
                acionar(liberarCaminhao, t.ID, OPERADOR_ID)} disabled={loading}>
                {loading ? 'Liberando...' : '🚀 Liberar caminhão'}
              </button>
            </>
          ) : (
            <div className="alert alert-info">
              <span className="spinner" style={{ marginRight: 8 }} />
              Aguardando autorização SEFAZ... (automático)
            </div>
          )}
        </div>
      )}

      {/* CONCLUÍDO */}
      {status === 'CONCLUIDO' && (
        <div className="card">
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <div style={{ fontSize: 64 }}>✅</div>
            <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--sap-green)', margin: '12px 0' }}>Ticket Concluído</div>
            <div className="grid-3" style={{ margin: '24px 0' }}>
              <div className="stat-card">
                <div className="stat-label">Peso Líquido</div>
                <div className="stat-value green">{t.pesoLiquidoValor?.toLocaleString('pt-BR')} kg</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">DANFe</div>
                <div className="stat-value" style={{ fontSize: 16 }}>#{t.danfeNumero}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">SAP HANA</div>
                <div className="stat-value" style={{ fontSize: 16, color: t.sincronizadoSAP ? 'var(--sap-green)' : 'var(--sap-orange)' }}>
                  {t.sincronizadoSAP ? '✅ Sincronizado' : '⏳ Pendente'}
                </div>
              </div>
            </div>
            <button className="btn btn-primary" onClick={onVoltar}>Novo check-in</button>
          </div>
        </div>
      )}
    </div>
  )
}
