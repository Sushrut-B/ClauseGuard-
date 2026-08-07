import { useState } from 'react'
import PageHeader from '../components/ui/PageHeader'
import Button from '../components/ui/Button'
import { generateStitchUI } from '../api/contracts'
import { showToast } from '../components/ui/ToastContainer'
import s from './StitchBuilder.module.css'

export default function StitchBuilder() {
  const [prompt, setPrompt] = useState('A scorecard showing the risk score and highlights of liability limits')
  const [loading, setLoading] = useState(false)
  const [generatedHtml, setGeneratedHtml] = useState('')
  const [rawCode, setRawCode] = useState('')

  const presets = [
    'A summary card showing high risk liabilities',
    'A contract obligation timeline checklist',
    'A governing law agreement banner',
    'A signature confirmation dialog layout',
  ]

  const handleGenerate = async (targetPrompt = prompt) => {
    if (!targetPrompt.trim() || loading) return
    setLoading(true)
    try {
      const data = await generateStitchUI(targetPrompt)
      setGeneratedHtml(data.html)
      setRawCode(data.html)
      showToast('Stitch UI screen compiled successfully!', 'success')
    } catch {
      showToast('Failed to compile Stitch template. Using fallback.', 'warning')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = () => {
    if (!rawCode) return
    navigator.clipboard.writeText(rawCode)
    showToast('HTML code copied to clipboard!', 'success')
  }

  return (
    <div className={s.container}>
      <PageHeader
        title="Google Stitch UI Builder"
        subtitle="Generate responsive visual templates and contract cards using the Google Labs Stitch API."
        breadcrumbs={['ClauseGuard', 'Stitch Builder']}
      />

      <div className={s.workspace}>
        <div className={s.controls}>
          <div>
            <div className={s.sectionTitle}>Prompt Input</div>
            <textarea
              className={s.textarea}
              placeholder="Describe the UI card or component..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
          </div>

          <Button onClick={() => handleGenerate()} isLoading={loading} style={{ width: '100%' }}>
            Generate Layout
          </Button>

          <div>
            <div className={s.sectionTitle}>Example Presets</div>
            <div className={s.presets}>
              {presets.map((p) => (
                <button
                  key={p}
                  className={s.presetBtn}
                  onClick={() => {
                    setPrompt(p)
                    handleGenerate(p)
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className={s.previewArea}>
          <div className={s.previewHeader}>
            <span className={s.previewTitle}>Visual Live Sandbox Preview</span>
            {rawCode && (
              <Button size="sm" onClick={handleCopy}>
                Copy HTML Source
              </Button>
            )}
          </div>

          <div className={s.previewFrameWrapper}>
            {generatedHtml ? (
              <iframe
                className={s.iframe}
                title="Stitch Sandbox"
                srcDoc={generatedHtml}
                sandbox="allow-scripts"
              />
            ) : (
              <div style={{ color: 'var(--ink-3)', fontSize: '13px' }}>
                Enter a prompt on the left and click Generate to see the layout preview.
              </div>
            )}
          </div>

          {rawCode && (
            <div className={s.codePanel}>
              <code>{rawCode}</code>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
