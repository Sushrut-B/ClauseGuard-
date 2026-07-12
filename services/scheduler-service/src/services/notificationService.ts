import axios from "axios"

export const sendNotification = async (params: {
  userId: string
  orgId: string
  type: string
  title: string
  message: string
}) => {
  try {
    await axios.post(
      `${process.env.NOTIFICATION_SERVICE_URL}/api/notifications`,
      params
    )
    console.log(`[Notification] Successfully sent notification to user ${params.userId}`)
  } catch (err) {
    console.warn(`[Notification Mock] Notification service not available (${(err as Error).message}). Simulated sending:`, params)
  }
}
