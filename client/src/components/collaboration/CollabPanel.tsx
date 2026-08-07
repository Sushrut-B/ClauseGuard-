import { useEffect, useState } from "react"
import { getShares, shareContract, removeShare, getComments, postComment, deleteComment } from "../../api/collaboration"
import type { ContractShare, ContractComment, ShareRole } from "../../api/collaboration"

import styles from "./CollabPanel.module.css"

interface Props {
  contractId: string
  onClose: () => void
}

const ROLE_COLORS: Record<ShareRole, string> = {
  viewer: "var(--ink-3)",
  reviewer: "var(--amber)",
  approver: "var(--green)",
}

export default function CollabPanel({ contractId, onClose }: Props) {

  const [tab, setTab] = useState<"share" | "comments">("comments")
  const [shares, setShares] = useState<ContractShare[]>([])
  const [comments, setComments] = useState<ContractComment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const [shareEmail, setShareEmail] = useState("")
  const [shareName, setShareName] = useState("")
  const [shareRole, setShareRole] = useState<ShareRole>("reviewer")
  const [sharing, setSharing] = useState(false)

  const [commentText, setCommentText] = useState("")
  const [commentDecision, setCommentDecision] = useState<"" | "approved" | "changes_requested">("")
  const [posting, setPosting] = useState(false)

  useEffect(() => {
    loadAll()
  }, [contractId])

  const loadAll = async () => {
    setLoading(true)
    try {
      const [s, c] = await Promise.all([getShares(contractId), getComments(contractId)])
      setShares(s)
      setComments(c)
    } catch {
      setError("Failed to load collaboration data")
    } finally {
      setLoading(false)
    }
  }

  const handleShare = async () => {
    if (!shareEmail || !shareName) return
    setSharing(true)
    setError("")
    try {
      const share = await shareContract(contractId, shareEmail, shareName, shareRole)
      setShares(prev => [...prev, share])
      setShareEmail("")
      setShareName("")
    } catch (err: any) {
      setError(err.response?.data?.error ?? "Failed to share")
    } finally {
      setSharing(false)
    }
  }

  const handleRemoveShare = async (shareId: string) => {
    try {
      await removeShare(contractId, shareId)
      setShares(prev => prev.filter(s => s.id !== shareId))
    } catch {
      setError("Failed to remove share")
    }
  }

  const handlePostComment = async () => {
    if (!commentText.trim()) return
    setPosting(true)
    setError("")
    try {
      const comment = await postComment(
        contractId,
        commentText,
        "general",
        undefined,
        commentDecision || undefined
      )
      setComments(prev => [...prev, comment])
      setCommentText("")
      setCommentDecision("")
    } catch {
      setError("Failed to post comment")
    } finally {
      setPosting(false)
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    try {
      await deleteComment(contractId, commentId)
      setComments(prev => prev.filter(c => c.id !== commentId))
    } catch {
      setError("Failed to delete comment")
    }
  }

  const approved = comments.filter(c => c.decision === "approved").length
  const changesRequested = comments.filter(c => c.decision === "changes_requested").length

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.title}>Collaboration</div>
          {(approved > 0 || changesRequested > 0) && (
            <div className={styles.decisionBadges}>
              {approved > 0 && <span className={styles.approved}>{approved} Approved</span>}
              {changesRequested > 0 && <span className={styles.changes}>{changesRequested} Changes Requested</span>}
            </div>
          )}
        </div>
        <button className={styles.closeBtn} onClick={onClose}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" width="14" height="14">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      <div className={styles.tabs}>
        <button className={`${styles.tab} ${tab === "comments" ? styles.tabActive : ""}`} onClick={() => setTab("comments")}>
          Comments {comments.length > 0 && <span className={styles.tabBadge}>{comments.length}</span>}
        </button>
        <button className={`${styles.tab} ${tab === "share" ? styles.tabActive : ""}`} onClick={() => setTab("share")}>
          Collaborators {shares.length > 0 && <span className={styles.tabBadge}>{shares.length}</span>}
        </button>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {loading ? (
        <div className={styles.loading}>Loading...</div>
      ) : tab === "comments" ? (
        <div className={styles.tabContent}>
          <div className={styles.commentsList}>
            {comments.length === 0 ? (
              <div className={styles.empty}>No comments yet. Be the first to review.</div>
            ) : (
              comments.map(c => (
                <div key={c.id} className={styles.commentItem}>
                  <div className={styles.commentTop}>
                    <div className={styles.commentAvatar}>{c.authorName[0]?.toUpperCase()}</div>
                    <div className={styles.commentMeta}>
                      <div className={styles.commentAuthor}>{c.authorName}</div>
                      <div className={styles.commentDate}>{new Date(c.createdAt).toLocaleDateString()}</div>
                    </div>
                    {c.decision && (
                      <span className={`${styles.decisionTag} ${c.decision === "approved" ? styles.approved : styles.changes}`}>
                        {c.decision === "approved" ? "Approved" : "Changes Requested"}
                      </span>
                    )}
                    <button className={styles.deleteCommentBtn} onClick={() => handleDeleteComment(c.id)}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="11" height="11">
                        <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
                      </svg>
                    </button>
                  </div>
                  <div className={styles.commentText}>{c.text}</div>
                </div>
              ))
            )}
          </div>

          <div className={styles.commentForm}>
            <textarea
              className={styles.commentInput}
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              placeholder="Add a comment or review decision..."
              rows={3}
            />
            <div className={styles.commentActions}>
              <select
                className={styles.decisionSelect}
                value={commentDecision}
                onChange={e => setCommentDecision(e.target.value as any)}
              >
                <option value="">Comment only</option>
                <option value="approved">Approve</option>
                <option value="changes_requested">Request Changes</option>
              </select>
              <button
                className={styles.postBtn}
                onClick={handlePostComment}
                disabled={!commentText.trim() || posting}
              >
                {posting ? "Posting..." : "Post"}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className={styles.tabContent}>
          <div className={styles.shareForm}>
            <div className={styles.shareFormRow}>
              <input className={styles.shareInput} placeholder="Name" value={shareName} onChange={e => setShareName(e.target.value)} />
              <input className={styles.shareInput} placeholder="Email" type="email" value={shareEmail} onChange={e => setShareEmail(e.target.value)} />
            </div>
            <div className={styles.shareFormRow}>
              <select className={styles.shareSelect} value={shareRole} onChange={e => setShareRole(e.target.value as ShareRole)}>
                <option value="viewer">Viewer</option>
                <option value="reviewer">Reviewer</option>
                <option value="approver">Approver</option>
              </select>
              <button className={styles.shareBtn} onClick={handleShare} disabled={!shareEmail || !shareName || sharing}>
                {sharing ? "Sharing..." : "Invite"}
              </button>
            </div>
          </div>

          <div className={styles.shareList}>
            {shares.length === 0 ? (
              <div className={styles.empty}>No collaborators yet.</div>
            ) : (
              shares.map(s => (
                <div key={s.id} className={styles.shareItem}>
                  <div className={styles.shareAvatar}>{s.name[0]?.toUpperCase()}</div>
                  <div className={styles.shareInfo}>
                    <div className={styles.shareName}>{s.name}</div>
                    <div className={styles.shareEmail}>{s.email}</div>
                  </div>
                  <span className={styles.roleTag} style={{ color: ROLE_COLORS[s.role] }}>{s.role}</span>
                  <span className={`${styles.statusTag} ${s.status === "accepted" ? styles.accepted : styles.pending}`}>
                    {s.status}
                  </span>
                  <button className={styles.removeBtn} onClick={() => handleRemoveShare(s.id)}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="11" height="11">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}