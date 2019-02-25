import { Document } from 'mongoose'
import { Contact } from '../../contacts/interfaces/contacts.interfaces'
import { IEncryptedMessage } from '@kiltprotocol/prototype-sdk'

export interface MessageDB extends Document, IEncryptedMessage {}

export declare interface MessagingService {
  add(message: IEncryptedMessage): void

  findBySenderAddress(
    senderAddress: Contact['publicIdentity']['address']
  ): Promise<IEncryptedMessage[]>

  findByReceiverAddress(
    receiverAddress: Contact['publicIdentity']['address']
  ): Promise<IEncryptedMessage[]>

  remove(messageId: string): void

  removeAll(): void
}
