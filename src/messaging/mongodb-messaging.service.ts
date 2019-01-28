import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import {
  Message,
  MessageDB,
  MessagingService
} from './interfaces/messaging.interfaces'

@Injectable()
export class MongoDbMessagingService implements MessagingService {
  constructor(
    @InjectModel('Message') private readonly messageModel: Model<MessageDB>
  ) {}

  public async add(message: Message): Promise<void> {
    const createdMessage: MessageDB = new this.messageModel(message as MessageDB)
    await createdMessage.save()
  }

  public async findBySenderAddress(senderAddress: Message['senderAddress']): Promise<Message[]> {
    return await this.messageModel.find({ 'sender.address': senderAddress }).exec()
  }

  public async findByReceiverAddress(receiverAddress: Message['receiverAddress']): Promise<Message[]> {
    return await this.messageModel.find({ 'receiver.address': receiverAddress }).exec()
  }

  public async remove(messageId: Message['messageId']): Promise<void> {
    this.messageModel.deleteOne({ messageId }).exec()
  }

  public async removeAll(): Promise<void> {
    await this.messageModel.deleteMany({}).exec()
  }
}
