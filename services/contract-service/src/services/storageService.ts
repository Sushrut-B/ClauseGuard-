import fs from 'fs'
import path from 'path'

export interface StorageProvider {
  saveFile(buffer: Buffer, filename: string): Promise<string>
  getFile(filename: string): Promise<Buffer>
  deleteFile(filename: string): Promise<void>
  getSignedUrl(filename: string): Promise<string>
}

export class LocalStorageProvider implements StorageProvider {
  private uploadDir: string

  constructor() {
    this.uploadDir = path.resolve(process.env.UPLOAD_DIR || 'uploads')
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true })
    }
  }

  async saveFile(buffer: Buffer, filename: string): Promise<string> {
    const filePath = path.join(this.uploadDir, filename)
    await fs.promises.writeFile(filePath, buffer)
    return filename
  }

  async getFile(filename: string): Promise<Buffer> {
    const filePath = path.join(this.uploadDir, filename)
    return await fs.promises.readFile(filePath)
  }

  async deleteFile(filename: string): Promise<void> {
    const filePath = path.join(this.uploadDir, filename)
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath)
    }
  }

  async getSignedUrl(filename: string): Promise<string> {
    // Return relative API path for local development
    return `/api/contracts/files/${filename}`
  }
}

export class StorageService {
  private provider: StorageProvider

  constructor() {
    // Extensible strategy: if AWS_S3_BUCKET is provided, instantiate S3Provider; otherwise LocalStorageProvider
    this.provider = new LocalStorageProvider()
  }

  saveFile(buffer: Buffer, filename: string) {
    return this.provider.saveFile(buffer, filename)
  }

  getFile(filename: string) {
    return this.provider.getFile(filename)
  }

  deleteFile(filename: string) {
    return this.provider.deleteFile(filename)
  }

  getSignedUrl(filename: string) {
    return this.provider.getSignedUrl(filename)
  }
}

export const storageService = new StorageService()
