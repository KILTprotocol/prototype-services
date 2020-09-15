import { HttpException } from '@nestjs/common/exceptions'
import { HttpStatus } from '@nestjs/common'

export class MessageNotFoundException extends HttpException {
  constructor() {
    super('Message requested not found', HttpStatus.NOT_FOUND)
  }
}
