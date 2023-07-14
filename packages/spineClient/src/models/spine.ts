export type ClientRequest = SpineRequest

export interface SpineRequest {
  message: string
  interactionId: string
  messageId: string
  conversationId: string
  fromPartyKey: string
}

export type SpineResponse<T> = SpineDirectResponse<T>

export interface SpineDirectResponse<T> {
  body: T
  statusCode: number
}
