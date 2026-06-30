import { Request, Response, NextFunction } from "express"
import jwt from "jsonwebtoken"

export interface AuthRequest extends Request {
  user?: {
    id: string
    orgId: string
    role: string
  }
}

export const requireAuth = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const header = req.headers.authorization
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, error: "No token provided" })
  }

  const token = header.split(" ")[1]

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
      id: string
      orgId: string
      role: string
    }
    req.user = decoded
    next()
  } catch (err) {
    return res.status(401).json({ success: false, error: "Invalid or expired token" })
  }
}
