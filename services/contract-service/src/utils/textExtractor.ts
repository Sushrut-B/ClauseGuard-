import fs from 'fs'
import path from 'path'
import mammoth from 'mammoth'
const { PDFParse } = require('pdf-parse')

export interface ExtractionResult {
  text: string
  pageCount: number | null
  pages: { text: string; num: number }[]
}

export const extractText = async (
  filePath: string,
  mimeType: string
): Promise<ExtractionResult> => {
  const absolutePath = path.resolve(filePath)

  if (mimeType === 'application/pdf') {
    const parser = new PDFParse({ verbosity: 0, url: absolutePath })
    const data = await parser.getText()
    const pages = (data.pages || []).map((p: any) => ({
      text: (p.text || '').trim(),
      num: p.num || 1,
    }))
    return {
      text: data.text.trim(),
      pageCount: data.total,
      pages,
    }
  }

  if (
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mimeType === 'application/msword'
  ) {
    const buffer = fs.readFileSync(absolutePath)
    const result = await mammoth.extractRawText({ buffer })
    const text = result.value.trim()
    return {
      text,
      pageCount: 1,
      pages: [{ text, num: 1 }],
    }
  }

  if (mimeType === 'text/plain') {
    const text = fs.readFileSync(absolutePath, 'utf-8').trim()
    return {
      text,
      pageCount: 1,
      pages: [{ text, num: 1 }],
    }
  }

  throw new Error(`Unsupported file type: ${mimeType}`)
}