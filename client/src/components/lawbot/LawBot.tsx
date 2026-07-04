import { useState, useRef, useEffect } from "react"
import { useLocation } from "react-router-dom"
import { sendMessage } from "../../api/lawbot"
import type { ChatMessage } from "../../api/lawbot"
import api from "../../api/client"
import styles from "./LawBot.module.css"

export default function LawBot() {
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const [contractContext, setContractContext] = useState<string | undefined>(undefined)
  const [contextLoaded, setContextLoaded] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: "Hi! I am LawBot. Ask me anything about your contracts or legal terms." }
  ])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const contractId = location.pathname.startsWith("/analysis/")
    ? location.pathname.split("/analysis/")[1]
    : null

  // Fetch contract text when on Analysis page
  useEffect(() => {
    if (!contractId) {
      setContractContext(undefined)
      setContextLoaded(false)
      setMessages([{ role: "assistant", content: "Hi! I am LawBot. Ask me anything about your contracts or legal terms." }])
      return
    }
    setContextLoaded(false)
    api.get(`/contracts/${contractId}/text`)
      .then((res) => {
        const text = res.data?.data?.extractedText
        if (text) {
          setContractContext(text)
          setMessages([{
            role: "assistant",
            content: "Hi! I have loaded this contract and I am ready to help. Ask me about any clause, term, or risk in this document."
          }])
        }
      })
      .catch(() => {
        setContractContext(undefined)
      })
      .finally(() => setContextLoaded(true))
  }, [contractId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSend = async () => {
    const text = input.trim()
    if (!text || loading) return
    const userMsg: ChatMessage = { role: "user", content: text }
    const next = [...messages, userMsg]
    setMessages(next)
    setInput("")
    setLoading(true)
    try {
      const reply = await sendMessage(next, contractContext)
      setMessages([...next, { role: "assistant", content: reply }])
    } catch {
      setMessages([...next, { role: "assistant", content: "Sorry, I could not process that. Please try again." }])
    } finally {
      setLoading(false)
    }
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  const handleClear = () => {
    setMessages([{
      role: "assistant",
      content: contractContext
        ? "Hi! I have loaded this contract and I am ready to help. Ask me about any clause, term, or risk in this document."
        : "Hi! I am LawBot. Ask me anything about your contracts or legal terms."
    }])
  }

  return (
    <div className={styles.wrap}>
      {open && (
        <div className={styles.panel}>
          <div className={styles.panelHead}>
            <div className={styles.headLeft}>
              <div className={styles.avatar}>?</div>
              <div>
                <div className={styles.botName}>LawBot</div>
                <div className={styles.botSub}>
                  {contractId
                    ? contextLoaded && contractContext
                      ? "Contract loaded ? ask anything"
                      : contractId && !contextLoaded
                      ? "Loading contract..."
                      : "General legal assistant"
                    : "General legal assistant"}
                </div>
              </div>
            </div>
            <div className={styles.headActions}>
              <button className={styles.iconBtn} onClick={handleClear} title="Clear chat">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" width="14" height="14">
                  <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/>
                </svg>
              </button>
              <button className={styles.iconBtn} onClick={() => setOpen(false)} title="Close">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" width="14" height="14">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
          </div>

          <div className={styles.messages}>
            {messages.map((m, i) => (
              <div key={i} className={`${styles.msg} ${m.role === "user" ? styles.userMsg : styles.botMsg}`}>
                {m.role === "assistant" && <div className={styles.msgAvatar}>?</div>}
                <div className={styles.msgBubble}>{m.content}</div>
              </div>
            ))}
            {loading && (
              <div className={`${styles.msg} ${styles.botMsg}`}>
                <div className={styles.msgAvatar}>?</div>
                <div className={styles.msgBubble}>
                  <span className={styles.dot} /><span className={styles.dot} /><span className={styles.dot} />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className={styles.inputRow}>
            <textarea
              className={styles.input}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder={contractContext ? "Ask about this contract..." : "Ask about a clause, term, or risk..."}
              rows={2}
            />
            <button className={styles.sendBtn} onClick={handleSend} disabled={!input.trim() || loading}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </div>
        </div>
      )}

      <button className={styles.fab} onClick={() => setOpen((o) => !o)} title="LawBot">
        {open ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" width="22" height="22">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
          </svg>
        )}
        {!open && <span className={styles.fabLabel}>LawBot</span>}
      </button>
    </div>
  )
}