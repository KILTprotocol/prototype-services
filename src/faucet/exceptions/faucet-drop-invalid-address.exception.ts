import { HttpException } from '@nestjs/common/exceptions'
import { HttpStatus } from '@nestjs/common'

export class FaucetDropInvalidAddressException extends HttpException {
  constructor() {
    super('Signature could not be verified', HttpStatus.BAD_REQUEST)
  }
}
