import api from "./client"

export interface ChatMessage {
  role: "user" | "assistant"
  content: string
}

export const sendMessage = async (
  messages: ChatMessage[],
  contractContext?: string
): Promise<string> => {
  const { data } = await api.post("/ai/chat", { messages, contractContext })
  return data.data.reply
}