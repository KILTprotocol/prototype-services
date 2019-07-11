import { HttpException } from '@nestjs/common/exceptions'
import { HttpStatus } from '@nestjs/common'

export class FaucetDropThrottledException extends HttpException {
  constructor() {
    super('Faucet drop throttled', HttpStatus.BAD_REQUEST)
  }
}
