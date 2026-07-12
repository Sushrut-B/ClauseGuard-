import { Router, Response } from "express"
import { z } from "zod"
import { requireAuth, AuthRequest } from "../middleware/auth"
import { validate } from "../middleware/validate"
import { createReminder, listReminders, cancelReminder } from "../services/reminderService"
const router = Router()
const createReminderSchema = z.object({
  contractId: z.string().uuid(),
  type: z.enum(["expiry", "renewal", "custom"] as const),
  triggerAt: z.string(),
  message: z.string().optional(),
})
router.post(
  "/",
  requireAuth,
  validate(createReminderSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const reminder = await createReminder({
        orgId: req.user!.orgId,
        contractId: req.body.contractId,
        userId: req.user!.userId,
        type: req.body.type,
        triggerAt: new Date(req.body.triggerAt),
        message: req.body.message,
      })
      res.json({ success: true, data: reminder })
    } catch (err) {
      console.error("Create reminder error:", err)
      res.status(500).json({ success: false, error: "Failed to create reminder" })
    }
  }
)
router.get("/", requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const reminders = await listReminders(req.user!.orgId)
    res.json({ success: true, data: reminders })
  } catch (err) {
    res.status(500).json({ success: false, error: "Failed to fetch reminders" })
  }
})
router.delete("/:id", requireAuth, async (req: AuthRequest, res: Response) => {
  const { id } = req.params
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(id)) {
    return res.status(400).json({ success: false, error: "id: Invalid UUID format" })
  }
  try {
    const reminder = await cancelReminder(id, req.user!.orgId)
    if (!reminder) {
      return res.status(404).json({ success: false, error: "Reminder not found" })
    }
    res.json({ success: true, data: reminder })
  } catch (err) {
    res.status(500).json({ success: false, error: "Failed to cancel reminder" })
  }
})
export default router