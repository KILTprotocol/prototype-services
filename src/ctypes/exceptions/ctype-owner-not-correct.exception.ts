import { HttpException } from '@nestjs/common/exceptions'
import { HttpStatus } from '@nestjs/common'
export class CTypeOwnerNotCorrect extends HttpException {
  constructor() {
    super('CTYPE owner does not match', HttpStatus.BAD_REQUEST)
  }
}
