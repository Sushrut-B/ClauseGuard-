import Bull from "bull"

export const reminderQueue = new Bull("reminder-queue", {
  redis: {
    host: process.env.REDIS_HOST || "localhost",
    port: Number(process.env.REDIS_PORT) || 6379,
  },
})
