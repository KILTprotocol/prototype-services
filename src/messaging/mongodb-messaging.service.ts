import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { MessageDB, MessagingService } from './interfaces/messaging.interfaces'
import { IEncryptedMessage, Crypto } from '@kiltprotocol/sdk-js'

@Injectable()
export class MongoDbMessagingService implements MessagingService {
  constructor(
    @InjectModel('Message') private readonly messageModel: Model<MessageDB>
  ) {}

  public async add(message: IEncryptedMessage): Promise<void> {
    const createdMessage: MessageDB = new this.messageModel(
      message as MessageDB
    )
    await createdMessage.save()
  }

  public async findBySenderAddress(
    senderAddress: IEncryptedMessage['senderAddress'],
  ): Promise<IEncryptedMessage[]> {
    return (await this.messageModel.find({ senderAddress }).exec()).map(
      (singleDBMessage: MessageDB) =>
        this.convertToEncryptedMessage(singleDBMessage)
    )
  }

  public async findByReceiverAddress(
    receiverAddress: IEncryptedMessage['receiverAddress'],
  ): Promise<IEncryptedMessage[]> {
    return (await this.messageModel.find({ receiverAddress }).exec()).map(
      (singleDBMessage: MessageDB) =>
        this.convertToEncryptedMessage(singleDBMessage)
    )
  }

  public async remove(
    messageId: IEncryptedMessage['messageId'],
    signature: string
  ): Promise<boolean> {
    const receiverAddress = (await this.messageModel
      .findOne({ messageId })
      .exec()).receiverAddress
    if (!Crypto.verify(messageId, signature, receiverAddress)) {
      return false
    } else {
      this.messageModel.deleteOne({ messageId }).exec()
      return true
    }
  }

  public async removeAll(): Promise<void> {
    await this.messageModel.deleteMany({}).exec()
  }
  private convertToEncryptedMessage(
    singleDBMessage: MessageDB
  ): IEncryptedMessage {
    return {
      message: singleDBMessage.message,
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
