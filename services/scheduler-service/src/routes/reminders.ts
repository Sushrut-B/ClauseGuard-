import { Router, Response } from "express"
import { z } from "zod"
import { requireAuth, AuthRequest } from "../middleware/auth"
import { validate } from "../middleware/validate"
import { createReminder, listReminders, cancelReminder } from "../services/reminderService"

const router = Router()

const createReminderSchema = z.object({
  contractId: z.string().uuid(),
  type: z.enum<["expiry", "renewal", "custom"]>,
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
        userId: req.user!.id,
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
  try {
    const reminder = await cancelReminder(req.params.id, req.user!.orgId)
    if (!reminder) {
      return res.status(404).json({ success: false, error: "Reminder not found" })
    }
    res.json({ success: true, data: reminder })
  } catch (err) {
    res.status(500).json({ success: false, error: "Failed to cancel reminder" })
  }
})

export default router
