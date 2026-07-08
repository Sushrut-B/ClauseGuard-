import { Request, Response, NextFunction } from 'express'

const ROLE_RANK: Record<string, number> = {
  admin: 3,
  member: 2,
  viewer: 1,
}

export const requireRole = (minRole: 'viewer' | 'member' | 'admin') => {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = req.user?.role ?? 'viewer'
    const userRank = ROLE_RANK[userRole] ?? 0
    const requiredRank = ROLE_RANK[minRole] ?? 0
    if (userRank < requiredRank) {
      return res.status(403).json({
        success: false,
        error: `Insufficient permissions. Required: ${minRole}, current: ${userRole}`,
      })
    }
    next()
  }
}