import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Post,
  Delete,
  BadRequestException,
} from '@nestjs/common'
import { Message, MessagingService } from './interfaces/messaging.interfaces'

function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

@Controller('messaging')
export class MessagingController {
  constructor(
    @Inject('MessagingService')
    private readonly messagingService: MessagingService
  ) {}

  @Delete(':id')
  public async removeMessage(@Param('id') id) {
    console.log(`Remove message for id ${id}`)
    await this.messagingService.remove(id)
  }

  @Delete()
  public async removeAll() {
    console.log('Remove all messages')
    await this.messagingService.removeAll()
  }

  @Get('sent/:senderAddress')
  public async listSent(@Param('senderAddress') senderAddress) {
    return this.messagingService.findBySenderAddress(senderAddress)
  }

  @Get('inbox/:receiverAddress')
  public async listInbox(@Param('receiverAddress') receiverAddress) {
    return this.messagingService.findByReceiverAddress(receiverAddress)
  }

  @Post()
  public async sendMessage(@Body() message: Message) {
    if (!message.senderAddress) {
      throw new BadRequestException('no sender address')
    } else if (!message.receiverAddress) {
      throw new BadRequestException('no receiver address')
    } else if (!message.nonce) {
      throw new BadRequestException('no nonce')
    } else if (!message.message) {
      throw new BadRequestException('no message')
    }
    message.messageId = uuidv4()
    this.messagingService.add(message)
    return message
  }
}
