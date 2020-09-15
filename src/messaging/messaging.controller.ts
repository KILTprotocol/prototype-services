import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Headers,
  Post,
  Delete,
  BadRequestException,
  UseGuards,
} from '@nestjs/common'
import { MessagingService } from './interfaces/messaging.interfaces'
import { IEncryptedMessage } from '@kiltprotocol/sdk-js'
import { AuthGuard } from '../auth/auth.guard'
import { verify } from '@kiltprotocol/sdk-js/build/crypto'
import { ForbiddenMessageAccessException } from './exceptions/message-forbidden.exception'
import { MessageNotFoundException } from './exceptions/message-not-found.exception'

export const uuidv4 = () => {
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
  public async removeMessage(
    @Param('id') id,
    @Headers('signature') signature
  ): Promise<void> {
    const { receiverAddress } = (await this.messagingService.findById(
      id
    )).orElseThrow(() => {
      throw new MessageNotFoundException()
    })

    if (!signature) {
      throw new BadRequestException('No signature provided')
    } else if (!verify(id, signature, receiverAddress)) {
      throw new ForbiddenMessageAccessException()
    }
    console.log(`Remove message for id ${id} with signature ${signature}`)
    await this.messagingService.remove(id)
  }

  @UseGuards(AuthGuard)
  @Delete()
  public async removeAll(): Promise<void> {
    console.log('Remove all messages')
    await this.messagingService.removeAll()
  }

  @Get('sent/:senderAddress')
  public async listSent(
    @Param('senderAddress') senderAddress
  ): Promise<IEncryptedMessage[]> {
    return this.messagingService.findBySenderAddress(senderAddress)
  }

  @Get('inbox/:receiverAddress')
  public async listInbox(
    @Param('receiverAddress') receiverAddress
  ): Promise<IEncryptedMessage[]> {
    return this.messagingService.findByReceiverAddress(receiverAddress)
  }

  @Post()
  public async sendMessage(
    @Body() message: IEncryptedMessage
  ): Promise<IEncryptedMessage> {
    if (!message.senderAddress) {
      throw new BadRequestException('no sender address')
    } else if (!message.receiverAddress) {
      throw new BadRequestException('no receiver address')
    } else if (!message.nonce) {
      throw new BadRequestException('no nonce')
    } else if (!message.message) {
      throw new BadRequestException('no message')
    } else if (!message.hash) {
      throw new BadRequestException('no hash')
    } else if (!message.signature) {
      throw new BadRequestException('no signature')
    }
    message.messageId = uuidv4()
    message.receivedAt = Date.now()
    this.messagingService.add(message)
    return message
  }
}
