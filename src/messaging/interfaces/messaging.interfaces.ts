import { Document } from 'mongoose';

export interface Message extends Document {
    id: string;
    sender: string;
    receiver: string;
    message: string;
}

export declare interface MessagingService {
    add(message: Message);
    findBySender(sender: string): Promise<Message[]>;
    findByReceiver(receiver: string): Promise<Message[]>;
    remove(id: string);
}
