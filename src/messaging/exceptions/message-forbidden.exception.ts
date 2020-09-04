import { HttpException } from '@nestjs/common/exceptions'
import { HttpStatus } from '@nestjs/common'

export class ForbiddenMessageAccessException extends HttpException {
  constructor() {
    super('Invalid address given', HttpStatus.FORBIDDEN)
  }
}
