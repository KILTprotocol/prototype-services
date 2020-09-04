import { HttpException } from '@nestjs/common/exceptions'
import { HttpStatus } from '@nestjs/common'

export class FaucetDropInvalidAddressException extends HttpException {
  constructor() {
    super('Invalid address given', HttpStatus.BAD_REQUEST)
  }
}
