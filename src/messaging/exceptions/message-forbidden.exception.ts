import { HttpException } from '@nestjs/common/exceptions'
import { HttpStatus } from '@nestjs/common'

export class ForbiddenMessageAccessException extends HttpException {
  constructor() {
    super('Message owner signature could not be verified', HttpStatus.FORBIDDEN)
  }
}
