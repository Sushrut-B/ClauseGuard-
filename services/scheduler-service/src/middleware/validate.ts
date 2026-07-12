import { Request, Response, NextFunction } from "express"
import { ZodSchema } from "zod"

export const validate = (schema: ZodSchema) =>
  (req: Request, res: Response, next: NextFunction) => {
    console.log("Raw req.body:", req.body)
    console.log("contractId type:", typeof req.body?.contractId, "value:", req.body?.contractId)
    const result = schema.safeParse(req.body)
    if (!result.success) {
      console.error("Validation failed:", JSON.stringify(result.error.format(), null, 2))
      return res.status(400).json({
        success: false,
        error: result.error.errors.map(e => `${e.path.join(".")}: ${e.message}`).join(", "),
      })
    }
    req.body = result.data
    next()
  }
