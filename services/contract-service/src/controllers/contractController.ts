import { Request, Response } from 'express'
import fs from 'fs'
import path from 'path'
import { Contract } from '../models/contract'
import { extractText } from '../utils/textExtractor'

const uploadDir = process.env.UPLOAD_DIR || 'uploads'

export const uploadContract = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, error: 'No file uploaded' })
      return
    }

    const { originalname, filename, size, mimetype, path: filePath } = req.file

    const contract = await Contract.create({
      userId: req.user!.userId,
      fileName: filename,
      originalName: originalname,
      fileSize: size,
      mimeType: mimetype,
      status: 'uploaded',
    })

    // Fire-and-forget extraction
    extractText(filePath, mimetype)
      .then(async ({ text, pageCount }) => {
        await contract.update({ status: 'processing', extractedText: text, pageCount })
        await contract.update({ status: 'analyzed' })
      })
      .catch(async (err) => {
        console.error('Extraction failed:', err.message)
        await contract.update({ status: 'failed' })
      })

    res.status(201).json({
      success: true,
      message: 'Contract uploaded. Extraction in progress.',
      data: {
        id: contract.id,
        originalName: contract.originalName,
        fileSize: contract.fileSize,
        mimeType: contract.mimeType,
        status: contract.status,
        createdAt: contract.createdAt,
      },
    })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
}

export const listContracts = async (req: Request, res: Response): Promise<void> => {
  try {
    const contracts = await Contract.findAll({
      where: { userId: req.user!.userId },
      attributes: { exclude: ['extractedText'] },
      order: [['createdAt', 'DESC']],
    })
    res.json({ success: true, data: contracts })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
}

export const getContract = async (req: Request, res: Response): Promise<void> => {
  try {
    const contract = await Contract.findOne({
      where: { id: req.params.id, userId: req.user!.userId },
      attributes: { exclude: ['extractedText'] },
    })
    if (!contract) {
      res.status(404).json({ success: false, error: 'Contract not found' })
      return
    }
    res.json({ success: true, data: contract })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
}

export const getContractText = async (req: Request, res: Response): Promise<void> => {
  try {
    const contract = await Contract.findOne({
      where: { id: req.params.id, userId: req.user!.userId },
    })
    if (!contract) {
      res.status(404).json({ success: false, error: 'Contract not found' })
      return
    }
    if (contract.status !== 'analyzed' || !contract.extractedText) {
      res.status(400).json({ success: false, error: `Contract not ready. Status: ${contract.status}` })
      return
    }
    res.json({
      success: true,
      data: {
        id: contract.id,
        originalName: contract.originalName,
        pageCount: contract.pageCount,
        extractedText: contract.extractedText,
      },
    })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
}

export const deleteContract = async (req: Request, res: Response): Promise<void> => {
  try {
    const contract = await Contract.findOne({
      where: { id: req.params.id, userId: req.user!.userId },
    })
    if (!contract) {
      res.status(404).json({ success: false, error: 'Contract not found' })
      return
    }

    const filePath = path.join(uploadDir, contract.fileName)
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath)

    await contract.destroy()
    res.json({ success: true, message: 'Contract deleted' })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
}