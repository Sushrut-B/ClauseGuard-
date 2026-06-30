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
  } catch (err) {
    console.error("Failed to call notification-service:", (err as Error).message)
    throw err
  }
}
