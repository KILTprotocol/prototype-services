import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Message, MessagingService } from './interfaces/messaging.interfaces';

@Injectable()
export class MongoDbMessagingService implements MessagingService {

    constructor(@InjectModel('Message') private readonly messageModel: Model<Message>) { }


    async add(message: Message) {
        const createdMessage = new this.messageModel(message);
        await createdMessage.save();
    }

    async findBySender(sender: string): Promise<Message[]> {
        return await this.messageModel.find({ sender: sender }).exec();
    }

    async findByReceiver(receiver: string): Promise<Message[]> {
        return await this.messageModel.find({ receiver: receiver }).exec();
    }

    async remove(id: string) {
        this.messageModel.deleteOne({id: id}).exec();
    }

}
