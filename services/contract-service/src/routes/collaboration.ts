import { Router, Request, Response } from 'express'
import { authenticate, AuthRequest } from '../middleware/auth'
import { Contract } from '../models/contract'
import { ContractShare } from '../models/contractShare'
import { ContractComment } from '../models/contractComment'
import { v4 as uuidv4 } from 'uuid'
import { Op } from 'sequelize'
import { logAudit } from '../utils/audit'

const router = Router()

// Share a contract with someone
router.post('/:id/share', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { email, name, role } = req.body
    if (!email || !name || !role) {
      res.status(400).json({ success: false, error: 'email, name and role are required' })
      return
    }
    const contract = await Contract.findOne({
      where: { id: req.params.id, userId: req.user!.userId },
    })
    if (!contract) {
      res.status(404).json({ success: false, error: 'Contract not found' })
      return
    }
    const existing = await ContractShare.findOne({
      where: { contractId: req.params.id, email },
    })
    if (existing) {
      res.status(400).json({ success: false, error: 'Already shared with this email' })
      return
    }
    const token = uuidv4()
    const share = await ContractShare.create({
      contractId: req.params.id,
      email,
      name,
      role,
      status: 'pending',
      token,
    })
    
    await logAudit({
      contractId: req.params.id,
      userId: req.user!.userId,
      userEmail: req.user!.email ?? '',
      action: 'contract.shared',
      metadata: { email, role },
    })

    res.json({ success: true, data: share })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// List shares for a contract
router.get('/:id/shares', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const contract = await Contract.findOne({
      where: { id: req.params.id, userId: req.user!.userId },
    })
    if (!contract) {
      res.status(404).json({ success: false, error: 'Contract not found' })
      return
    }
    const shares = await ContractShare.findAll({
      where: { contractId: req.params.id },
      order: [['createdAt', 'ASC']],
    })
    res.json({ success: true, data: shares })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// Remove a share
router.delete('/:id/shares/:shareId', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const contract = await Contract.findOne({
      where: { id: req.params.id, userId: req.user!.userId },
    })
    if (!contract) {
      res.status(404).json({ success: false, error: 'Contract not found' })
      return
    }
    await ContractShare.destroy({ where: { id: req.params.shareId, contractId: req.params.id } })
    res.json({ success: true })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// Get comments for a contract
router.get('/:id/comments', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const contract = await Contract.findOne({
      where: { id: req.params.id, userId: req.user!.userId },
    })
    if (!contract) {
      res.status(404).json({ success: false, error: 'Contract not found' })
      return
    }
    const comments = await ContractComment.findAll({
      where: { contractId: req.params.id },
      order: [['createdAt', 'ASC']],
    })
    res.json({ success: true, data: comments })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// Post a comment (owner or collaborator via token)
router.post('/:id/comments', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { text, type, clauseIndex, decision, authorName, authorEmail } = req.body
    if (!text) {
      res.status(400).json({ success: false, error: 'text is required' })
      return
    }
    const contract = await Contract.findOne({
      where: { id: req.params.id, userId: req.user!.userId },
    })
    if (!contract) {
      res.status(404).json({ success: false, error: 'Contract not found' })
      return
    }
    const comment = await ContractComment.create({
      contractId: req.params.id,
      authorEmail: authorEmail ?? req.user!.email ?? 'owner',
      authorName: authorName ?? 'Owner',
      type: type ?? 'general',
      clauseIndex: clauseIndex ?? null,
      text,
      decision: decision ?? null,
    })
    
    await logAudit({
      contractId: req.params.id,
      userId: req.user!.userId,
      userEmail: req.user!.email ?? '',
      action: 'comment.added',
      metadata: { decision: decision ?? null },
    })

    res.json({ success: true, data: comment })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// Delete a comment
router.delete('/:id/comments/:commentId', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const contract = await Contract.findOne({
      where: { id: req.params.id, userId: req.user!.userId },
    })
    if (!contract) {
      res.status(404).json({ success: false, error: 'Contract not found' })
      return
    }
    await ContractComment.destroy({
      where: { id: req.params.commentId, contractId: req.params.id },
    })
    res.json({ success: true })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

export default router