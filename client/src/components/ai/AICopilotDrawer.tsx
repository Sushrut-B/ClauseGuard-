import { useState } from 'react'
import Button from '../ui/Button'
import s from './AICopilotDrawer.module.css'

export interface AICopilotDrawerProps {
  isOpen: boolean
  onClose: () => void
  contractName?: string
}

export default function AICopilotDrawer({ isOpen, onClose, contractName }: AICopilotDrawerProps) {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'ai',
      text: `Hello! I am your AI Legal Copilot. I have analyzed ${contractName || 'your contract'}. Ask me anything about liability clauses, termination notice periods, IP rights, or risk mitigation recommendations!`,
    },
  ])
  const [input, setInput] = useState('')
  const [isSending, setIsSending] = useState(false)

  if (!isOpen) return null

  const handleSend = () => {
    if (!input.trim() || isSending) return

    const userMsg = { id: Date.now(), sender: 'user', text: input }
    setMessages((prev) => [...prev, userMsg])
    const promptText = input
    setInput('')
    setIsSending(true)

    setTimeout(() => {
      let responseText = `Regarding "${promptText}": Under standard legal review, this clause poses a medium risk. We recommend capping liability at 12 months' fees and ensuring mutual indemnification.`
      if (promptText.toLowerCase().includes('termination')) {
        responseText = 'Notice period for termination is 30 days written notice. We recommend extending to 60 days for operational continuity.'
      } else if (promptText.toLowerCase().includes('ip') || promptText.toLowerCase().includes('intellectual')) {
        responseText = 'Intellectual Property rights remain with the original owner, with a non-exclusive license granted during the agreement period.'
      }

      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, sender: 'ai', text: responseText },
      ])
      setIsSending(false)
    }, 800)
  }

  return (
    <div className={s.overlay} onClick={onClose}>
      <div className={s.drawer} onClick={(e) => e.stopPropagation()}>
        <div className={s.header}>
          <div className={s.headerTitle}>
            <svg className={s.sparkleIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2l2.4 7.2L21.6 11.6l-7.2 2.4L12 21.2l-2.4-7.2-7.2-2.4 7.2-2.4L12 2z" />
            </svg>
            <span>AI Legal Copilot</span>
          </div>
          <button className={s.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div className={s.body}>
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`${s.message} ${msg.sender === 'user' ? s.userMessage : s.aiMessage}`}
            >
              {msg.text}
            </div>
          ))}
          {isSending && <div className={`${s.message} ${s.aiMessage}`}>AI is thinking...</div>}
        </div>

        <div className={s.footer}>
          <input
            className={s.input}
            type="text"
            placeholder="Ask AI Copilot about this contract..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          />
          <Button size="sm" onClick={handleSend} isLoading={isSending}>
            Send
          </Button>
        </div>
      </div>
    </div>
  )
}
