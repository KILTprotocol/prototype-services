import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { MessageDB, MessagingService } from './interfaces/messaging.interfaces'
import { IEncryptedMessage } from '@kiltprotocol/prototype-sdk'

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
    senderAddress: IEncryptedMessage['senderAddress']
  ): Promise<IEncryptedMessage[]> {
    return await this.messageModel.find({ senderAddress }).exec()
  }

  public async findByReceiverAddress(
    receiverAddress: IEncryptedMessage['receiverAddress']
  ): Promise<IEncryptedMessage[]> {
    return await this.messageModel.find({ receiverAddress }).exec()
  }

  public async remove(
    messageId: IEncryptedMessage['messageId']
  ): Promise<void> {
    this.messageModel.deleteOne({ messageId }).exec()
  }

  public async removeAll(): Promise<void> {
    await this.messageModel.deleteMany({}).exec()
  }
}
