import {Body, Controller, Get, Inject, Param, Post, Delete, BadRequestException} from '@nestjs/common';
import { Message, MessagingService } from './interfaces/messaging.interfaces';

function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

@Controller('messaging')
export class MessagingController {

    constructor(@Inject('MessagingService') private readonly messagingService: MessagingService) {}

    @Delete(':id')
    async removeMessage(@Param('id') id) {
        await this.messagingService.remove(id);
    }

    @Get('sent/:sender')
    async listSent(@Param('sender') sender) {
        return this.messagingService.findBySender(sender);
    }

    @Get('inbox/:receiver')
    async listInbox(@Param('receiver') receiver) {
        return this.messagingService.findByReceiver(receiver);
    }

    @Post()
    async sendMessage(@Body() message: Message) {
        if (!message.sender) {
            throw new BadRequestException("no sender");
        } else if (!message.receiver) {
            throw new BadRequestException("no receiver");
        } else if (!message.message) {
            throw new BadRequestException("no message");
        }
        message.id = uuidv4();
        this.messagingService.add(message);
        return message;
    }
}
