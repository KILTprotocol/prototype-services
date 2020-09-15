import { HttpException } from '@nestjs/common/exceptions'
import { HttpStatus } from '@nestjs/common'

export class ForbiddenMessageAccessException extends HttpException {
  constructor() {
    super(
      'Signature could not be verified with the message owner',
      HttpStatus.FORBIDDEN
    )
  }
}
