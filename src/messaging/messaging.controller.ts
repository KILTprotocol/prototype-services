import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Post,
  Delete,
  BadRequestException,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common'
import { MessagingService } from './interfaces/messaging.interfaces'
import { IEncryptedMessage } from '@kiltprotocol/sdk-js'
import { AuthGuard } from '../auth/auth.guard'
import { verify } from '@kiltprotocol/sdk-js/build/crypto'
import { ForbiddenMessageAccessException } from './exceptions/message-forbidden.exception'

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
    @Body() signature: string
  ): Promise<void> {
    if (!signature) {
      throw new BadRequestException('No signature provided')
    }
    console.log(`Remove message for id ${id} with signature ${signature}`)
    if (!(await this.messagingService.remove(id, signature))) {
      throw new ForbiddenMessageAccessException()
    }
  }

  @UseGuards(AuthGuard)
  @Delete()
  public async removeAll(): Promise<void> {
    console.log('Remove all messages')
    await this.messagingService.removeAll()
  }

  @Get('sent/:senderAddress')
  public async listSent(
    @Param('senderAddress') senderAddress,
    @Body() signature: string
  ): Promise<IEncryptedMessage[]> {
    if (!signature) {
      throw new BadRequestException('No signature provided')
    } else if (!verify(senderAddress, signature, senderAddress)) {
      throw new ForbiddenMessageAccessException()
    }
    return this.messagingService.findBySenderAddress(senderAddress)
  }

  @Get('inbox/:receiverAddress')
  public async listInbox(
    @Param('receiverAddress') receiverAddress,
    @Body() signature: string
  ): Promise<IEncryptedMessage[]> {
    if (!signature) {
      throw new BadRequestException('No signature provided')
    } else if (!verify(receiverAddress, signature, receiverAddress)) {
      throw new ForbiddenMessageAccessException()
    }
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
