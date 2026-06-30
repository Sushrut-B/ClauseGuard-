import { Reminder, ReminderType } from "../models/reminder"
import { reminderQueue } from "../queues/reminderQueue"

export const createReminder = async (params: {
  orgId: string
  contractId: string
  userId: string
  type: ReminderType
  triggerAt: Date
  message?: string
}) => {
  const reminder = await Reminder.create({
    orgId: params.orgId,
    contractId: params.contractId,
    userId: params.userId,
    type: params.type,
    triggerAt: params.triggerAt,
    message: params.message || null,
  })

  const delay = params.triggerAt.getTime() - Date.now()

  await reminderQueue.add(
    { reminderId: reminder.id },
    { delay: delay > 0 ? delay : 0 }
  )

  return reminder
}

export const listReminders = async (orgId: string) => {
  return Reminder.findAll({ where: { orgId }, order: [["triggerAt", "ASC"]] })
}

export const cancelReminder = async (id: string, orgId: string) => {
  const reminder = await Reminder.findOne({ where: { id, orgId } })
  if (!reminder) return null
  await reminder.update({ status: "canceled" })
  return reminder
}
