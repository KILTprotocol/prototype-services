import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { MessageDB, MessagingService } from './interfaces/messaging.interfaces'
import { IEncryptedMessage } from '@kiltprotocol/types'
import { Optional } from 'typescript-optional'

@Injectable()
export class MongoDbMessagingService implements MessagingService {
  constructor(
    @InjectModel('Message') private readonly messageModel: Model<MessageDB>
  ) {}

  public async add(message: IEncryptedMessage): Promise<void> {
    const createdMessage: MessageDB = new this.messageModel(message)
    await createdMessage.save()
  }

  public async findById(
    messageId: IEncryptedMessage['messageId']
  ): Promise<Optional<IEncryptedMessage>> {
    return Optional.ofNullable<MessageDB>(
      await this.messageModel.findOne({ messageId }).exec()
    ).map((messageDB: MessageDB) => this.convertToEncryptedMessage(messageDB))
  }

  public async findBySenderAddress(
    senderAddress: IEncryptedMessage['senderAddress']
  ): Promise<IEncryptedMessage[]> {
    return (await this.messageModel.find({ senderAddress }).exec()).map(
      (singleDBMessage: MessageDB) =>
        this.convertToEncryptedMessage(singleDBMessage)
    )
  }

  public async findByReceiverAddress(
    receiverAddress: IEncryptedMessage['receiverAddress']
  ): Promise<IEncryptedMessage[]> {
    return (await this.messageModel.find({ receiverAddress }).exec()).map(
      (singleDBMessage: MessageDB) =>
        this.convertToEncryptedMessage(singleDBMessage)
    )
  }

  public async remove(
    messageId: IEncryptedMessage['messageId']
  ): Promise<void> {
    await this.messageModel.deleteOne({ messageId }).exec()
  }

  public async removeAll(): Promise<void> {
    await this.messageModel.deleteMany({}).exec()
  }
  private convertToEncryptedMessage(
    singleDBMessage: MessageDB
  ): IEncryptedMessage {
    return {
      ciphertext: singleDBMessage.ciphertext || singleDBMessage.message,
      nonce: singleDBMessage.nonce,
      createdAt: singleDBMessage.createdAt,
      hash: singleDBMessage.hash,
      signature: singleDBMessage.signature,
      receiverAddress: singleDBMessage.receiverAddress,
      senderAddress: singleDBMessage.senderAddress,
      senderBoxPublicKey: singleDBMessage.senderBoxPublicKey,
      messageId: singleDBMessage.messageId,
      receivedAt: singleDBMessage.receivedAt,
    } as IEncryptedMessage
  }
}
