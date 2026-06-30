import { reminderQueue } from "../queues/reminderQueue"
import { Reminder } from "../models/reminder"
import { sendNotification } from "../services/notificationService"

export const startReminderWorker = () => {
  reminderQueue.process(async (job) => {
    const { reminderId } = job.data

    const reminder = await Reminder.findByPk(reminderId)
    if (!reminder || reminder.status !== "pending") return

    try {
      await sendNotification({
        userId: reminder.userId,
        orgId: reminder.orgId,
        type: reminder.type,
        title: `Contract ${reminder.type} reminder`,
        message: reminder.message || `Your contract requires attention (${reminder.type}).`,
      })

      await reminder.update({ status: "sent", sentAt: new Date() })
    } catch (err) {
      await reminder.update({ status: "failed" })
      throw err
    }
  })

  console.log("scheduler-service: reminder worker started")
}
