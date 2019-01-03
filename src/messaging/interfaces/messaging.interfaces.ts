import { Document } from 'mongoose'

export interface Message extends Document {
  id: string
  sender: string
  senderKey: string
  senderEncryptionKey: string
  receiverKey: string
  message: string
  nonce: string
}

export declare interface MessagingService {
  add(message: Message)
  findBySender(senderKey: string): Promise<Message[]>
  findByReceiver(receiverKey: string): Promise<Message[]>
  remove(id: string)
}
