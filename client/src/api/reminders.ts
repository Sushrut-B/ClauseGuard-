import api from "./client"

export type ReminderType = "expiry" | "renewal" | "custom"
export type ReminderStatus = "pending" | "sent" | "failed" | "canceled"

export interface Reminder {
  id: string
  orgId: string
  contractId: string
  userId: string
  type: ReminderType
  status: ReminderStatus
  triggerAt: string
  message: string | null
  sentAt: string | null
  createdAt: string
}

export interface CreateReminderInput {
  contractId: string
  type: ReminderType
  triggerAt: string
  message?: string
}

export const listReminders = async (): Promise<Reminder[]> => {
  const { data } = await api.get("/reminders")
  return data.data
}

export const createReminder = async (input: CreateReminderInput): Promise<Reminder> => {
  const { data } = await api.post("/reminders", input)
  return data.data
}

export const cancelReminder = async (id: string): Promise<Reminder> => {
  const { data } = await api.delete(`/reminders/${id}`)
  return data.data
}