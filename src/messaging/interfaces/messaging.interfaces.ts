import { Document } from 'mongoose'
import { Contact } from '../../contacts/interfaces/contacts.interfaces'
import { IEncryptedMessage } from '@kiltprotocol/sdk-js'
import { Optional } from 'typescript-optional'

export interface MessageDB extends Document, IEncryptedMessage {}

export declare interface MessagingService {
  add(message: IEncryptedMessage): Promise<void>

  findById(
    messageId: IEncryptedMessage['messageId']
  ): Promise<Optional<IEncryptedMessage>>

  findBySenderAddress(
    senderAddress: Contact['publicIdentity']['address']
  ): Promise<IEncryptedMessage[]>

  findByReceiverAddress(
    receiverAddress: Contact['publicIdentity']['address']
  ): Promise<IEncryptedMessage[]>

  remove(messageId: string): Promise<void>

  removeAll(): Promise<void>
}
