import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { Message, MessagingService } from './interfaces/messaging.interfaces'

@Injectable()
export class MongoDbMessagingService implements MessagingService {
  constructor(
    @InjectModel('Message') private readonly messageModel: Model<Message>
  ) {}

  public async add(message: Message) {
    const createdMessage = new this.messageModel(message)
    await createdMessage.save()
  }

  public async findBySender(senderKey: string): Promise<Message[]> {
    return await this.messageModel.find({ senderKey }).exec()
  }

  public async findByReceiver(receiverKey: string): Promise<Message[]> {
    return await this.messageModel.find({ receiverKey }).exec()
  }

  public async remove(id: string) {
    this.messageModel.deleteOne({ id }).exec()
  }
}
