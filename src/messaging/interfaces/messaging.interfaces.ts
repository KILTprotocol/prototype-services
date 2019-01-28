import { Document } from 'mongoose'
import { Contact } from '../../contacts/interfaces/contacts.interfaces'

export interface Message {
  messageId: string
  message: string
  nonce: string
  receiverAddress: Contact['publicIdentity']['address']
  senderAddress: Contact['publicIdentity']['address']
}

export interface MessageDB extends Document, Message {}

export declare interface MessagingService {
  add(message: Message): void

  findBySenderAddress(
    senderAddress: Contact['publicIdentity']['address']
  ): Promise<Message[]>

  findByReceiverAddress(
    receiverAddress: Contact['publicIdentity']['address']
  ): Promise<Message[]>

  remove(messageId: string): void

  removeAll(): void
}
