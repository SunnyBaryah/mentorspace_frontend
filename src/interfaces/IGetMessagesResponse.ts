export type Message = string;
export interface GetMessagesResponse {
  status: "ok" | "error";
  messages: Message[];
}
