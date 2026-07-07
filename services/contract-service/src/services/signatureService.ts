import * as DropboxSign from "@dropbox/sign"
import fs from "fs"
import path from "path"

const client = new DropboxSign.SignatureRequestApi()
client.username = process.env.HELLOSIGN_API_KEY!

const UPLOAD_DIR = process.env.UPLOAD_DIR || "uploads"

export const sendForSignature = async (params: {
  contractId: string
  fileName: string
  originalName: string
  signerEmail: string
  signerName: string
}): Promise<{ signatureRequestId: string }> => {
  const filePath = path.join(UPLOAD_DIR, params.fileName)

  if (!fs.existsSync(filePath)) {
    throw new Error("Contract file not found on disk")
  }

  const data: DropboxSign.SignatureRequestSendRequest = {
    title: params.originalName,
    subject: `Please sign: ${params.originalName}`,
    message:
      "This contract has been sent to you for review and signature via ClauseGuard.",
    signers: [
      {
        emailAddress: params.signerEmail,
        name: params.signerName,
        order: 0,
      },
    ],
    files: [fs.createReadStream(filePath)],
    testMode: true,
  }

  const response = await client.signatureRequestSend(data)

  const requestId = response.body.signatureRequest?.signatureRequestId

  if (!requestId) {
    throw new Error("No signature request ID returned")
  }

  return {
    signatureRequestId: requestId,
  }
}

export const getSignatureStatus = async (
  signatureRequestId: string
): Promise<{ status: string; signers: any[] }> => {
  const response =
    await client.signatureRequestGet(signatureRequestId)

  const sr = response.body.signatureRequest

  const allSigned =
    sr?.signatures?.every(
      (s) => s.statusCode === "signed"
    ) ?? false

  const anyDeclined =
    sr?.signatures?.some(
      (s) => s.statusCode === "declined"
    ) ?? false

  const status = allSigned
    ? "signed"
    : anyDeclined
    ? "declined"
    : "pending"

  return {
    status,
    signers: sr?.signatures ?? [],
  }
}
