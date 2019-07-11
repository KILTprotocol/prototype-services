import { HttpException } from '@nestjs/common/exceptions'
import { HttpStatus } from '@nestjs/common'

export class FaucetDropFailedTransferException extends HttpException {
  constructor() {
    super('Transfer failed', HttpStatus.INTERNAL_SERVER_ERROR)
  }
}
