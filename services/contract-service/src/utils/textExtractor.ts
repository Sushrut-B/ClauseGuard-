import fs from 'fs'
import path from 'path'
import mammoth from 'mammoth'

const { PDFParse } = require('pdf-parse')

export interface ExtractionResult {
  text: string
  pageCount: number | null
}

export const extractText = async (
  filePath: string,
  mimeType: string
): Promise<ExtractionResult> => {
  const absolutePath = path.resolve(filePath)

  if (mimeType === 'application/pdf') {
    const parser = new PDFParse({ verbosity: 0, url: absolutePath })
    const data = await parser.getText()
    return {
      text: data.text.trim(),
      pageCount: data.total,
    }
  }

  if (
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mimeType === 'application/msword'
  ) {
    const buffer = fs.readFileSync(absolutePath)
    const result = await mammoth.extractRawText({ buffer })
    return { text: result.value.trim(), pageCount: null }
  }

  throw new Error(`Unsupported file type: ${mimeType}`)
}