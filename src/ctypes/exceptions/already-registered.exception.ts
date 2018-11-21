import { HttpException } from '@nestjs/common/exceptions';
import { HttpStatus } from '@nestjs/common';
export class AlreadyRegisteredException extends HttpException {
    constructor() {
        super('Already registered', HttpStatus.BAD_REQUEST);
      }
}
