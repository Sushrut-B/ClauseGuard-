import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { uploadContract, analyzeContract, getAnalysis } from '../api/contracts'
import s from './Upload.module.css'

type Stage = 'idle' | 'uploading' | 'analyzing' | 'done' | 'error'

export default function Upload() {
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  const [stage, setStage] = useState<Stage>('idle')
  const [dragOver, setDragOver] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [contractId, setContractId] = useState('')

  const handleFile = async (file: File) => {
    const allowed = ['application/pdf', 'text/plain', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    if (!allowed.includes(file.type)) {
      setErrorMsg('Only PDF, TXT, DOC, DOCX files are supported.')
      setStage('error')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg('File must be under 10 MB.')
      setStage('error')
      return
    }

    try {
      // Step 1 — upload
      setStage('uploading')
      const contract = await uploadContract(file)
      setContractId(contract.id)

      // Step 2 — trigger analysis
      setStage('analyzing')
      await analyzeContract(contract.id)

      // Step 3 — poll until Gemini is done
      let ready = false
      for (let i = 0; i < 20; i++) {
        await new Promise(res => setTimeout(res, 1500))
        try {
          const analysis = await getAnalysis(contract.id)
          if (analysis?.overallScore !== undefined) { ready = true; break }
        } catch {
          // 404 = not ready yet, keep polling
        }
      }

      if (!ready) throw new Error('Analysis timed out. Please try again.')

      setStage('done')
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error ?? err.message ?? 'Something went wrong.')
      setStage('error')
    }
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  const reset = () => {
    setStage('idle')
    setErrorMsg('')
    setContractId('')
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className={s.page}>
      <div className={s.header}>
        <div className={s.eyebrow}>Upload</div>
        <h2 className={s.headline}>Add a contract for analysis</h2>
        <p className={s.sub}>
          Gemini 2.5 Flash reads every clause and scores it across liability,
          termination, payment, IP, and dispute resolution risk.
        </p>
      </div>

      <div className={s.body}>
        {/* Upload zone */}
        {(stage === 'idle' || stage === 'error') && (
          <>
            <div
              className={`${s.zone} ${dragOver ? s.dragOver : ''}`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              onClick={() => inputRef.current?.click()}
            >
              <input
                ref={inputRef}
                type="file"
                accept=".pdf,.txt,.doc,.docx"
                onChange={onFileChange}
                style={{ display: 'none' }}
              />
              <svg className={s.zoneIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              <div className={s.zoneTitle}>Drop contract here</div>
              <div className={s.zoneSub}>or click to browse</div>
              <div className={s.formats}>
                {['.pdf', '.txt', '.doc', '.docx'].map(f => (
                  <span key={f} className={s.fmt}>{f}</span>
                ))}
              </div>
            </div>

            {stage === 'error' && (
              <div className={s.errorBox}>
                <span>{errorMsg}</span>
                <button className={s.retryBtn} onClick={reset}>Try again</button>
              </div>
            )}
          </>
        )}

        {/* Progress */}
        {(stage === 'uploading' || stage === 'analyzing') && (
          <div className={s.progress}>
            <div className={s.spinner} />
            <div className={s.progressTitle}>
              {stage === 'uploading' ? 'Uploading contract…' : 'Analyzing with Gemini 2.5 Flash…'}
            </div>
            <div className={s.progressSub}>
              {stage === 'uploading'
                ? 'Extracting text and storing securely'
                : 'Reading every clause for risk — this takes 10–30 seconds'}
            </div>
            <div className={s.steps}>
              <div className={`${s.step} ${s.done}`}>
                <div className={s.stepDot} />
                <span>Upload &amp; text extraction</span>
              </div>
              <div className={`${s.step} ${stage === 'analyzing' ? s.active : ''}`}>
                <div className={s.stepDot} />
                <span>AI clause analysis</span>
              </div>
              <div className={s.step}>
                <div className={s.stepDot} />
                <span>Risk report ready</span>
              </div>
            </div>
          </div>
        )}

        {/* Done */}
        {stage === 'done' && (
          <div className={s.success}>
            <div className={s.successIcon}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <div className={s.successTitle}>Analysis complete</div>
            <div className={s.successSub}>
              Gemini has reviewed every clause. View your risk report below.
            </div>
            <div className={s.successActions}>
              <button className={s.btnPrimary} onClick={() => navigate(`/analysis/${contractId}`)}>
                View risk report →
              </button>
              <button className={s.btnGhost} onClick={reset}>
                Upload another
              </button>
            </div>
          </div>
        )}

        {/* How it works */}
        {stage === 'idle' && (
          <div className={s.info}>
            {[
              { n: '1', title: 'Text extraction', desc: 'Your PDF or DOCX is parsed and stored in the contract service on port 3002.' },
              { n: '2', title: 'Gemini 2.5 Flash analysis', desc: 'Every clause is read and scored across 5 risk dimensions with reasons and suggestions.' },
              { n: '3', title: 'Highlighted report', desc: 'View the contract with risky clauses underlined. Hover for the AI annotation.' },
            ].map(({ n, title, desc }) => (
              <div key={n} className={s.infoRow}>
                <div className={s.infoNum}>{n}</div>
                <div>
                  <div className={s.infoTitle}>{title}</div>
                  <div className={s.infoDesc}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}