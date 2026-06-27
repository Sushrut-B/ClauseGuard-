import { Router, Request, Response } from 'express'
import multer from 'multer'
import { extractTextFromPDF } from '../services/pdfService'
import { analyzeContract } from '../services/geminiService'

const router = Router()
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
})

router.post('/pdf', upload.single('contract'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No PDF file uploaded' })
    }
    if (req.file.mimetype !== 'application/pdf') {
      return res.status(400).json({ success: false, error: 'File must be a PDF' })
    }

    const contractText = await extractTextFromPDF(req.file.buffer)
    const result = await analyzeContract(contractText)

    res.json({
      success: true,
      data: {
        extractedLength: contractText.length,
        contractText,
        ...result
      }
    })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

export default router