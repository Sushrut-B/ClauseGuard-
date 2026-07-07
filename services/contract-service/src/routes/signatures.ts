import { Router, Response } from 'express'
import { authenticate, AuthRequest } from '../middleware/auth'
import { Contract } from '../models/contract'
import { sendForSignature, getSignatureStatus } from '../services/signatureService'
import path from 'path'

const router = Router()
const UPLOAD_DIR = process.env.UPLOAD_DIR || 'uploads'

router.post('/:id/send', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { signerEmail, signerName } = req.body
    if (!signerEmail || !signerName) {
      res.status(400).json({ success: false, error: 'signerEmail and signerName are required' })
      return
    }
    const contract = await Contract.findOne({
      where: { id: req.params.id, userId: req.user!.userId },
    })
    if (!contract) {
      res.status(404).json({ success: false, error: 'Contract not found' })
      return
    }
    if (contract.signatureStatus === 'pending') {
      res.status(400).json({ success: false, error: 'Signature already pending' })
      return
    }
    const { signatureRequestId } = await sendForSignature({
      contractId: contract.id,
      fileName: contract.fileName,
      originalName: contract.originalName,
      signerEmail,
      signerName,
    })
    await contract.update({
      signatureStatus: 'pending',
      signatureRequestId,
      signerEmail,
    })
    res.json({ success: true, data: { signatureRequestId, signatureStatus: 'pending' } })
  } catch (err: any) {
    console.error('Send signature error:', err.message)
    res.status(500).json({ success: false, error: err.message })
  }
})

router.get('/:id/signature-status', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const contract = await Contract.findOne({
      where: { id: req.params.id, userId: req.user!.userId },
    })
    if (!contract) {
      res.status(404).json({ success: false, error: 'Contract not found' })
      return
    }
    if (!contract.signatureRequestId || contract.signatureStatus === 'none') {
      res.json({ success: true, data: { signatureStatus: 'none', signers: [] } })
      return
    }
    const { status, signers } = await getSignatureStatus(contract.signatureRequestId)
    await contract.update({ signatureStatus: status as any })
    res.json({ success: true, data: { signatureStatus: status, signers } })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

export default router