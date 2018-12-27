import { HttpException } from "@nestjs/common/exceptions";
import { HttpStatus } from "@nestjs/common";
export class CTypeNotOnChainException extends HttpException {
  constructor() {
    super("CTYPE not found on chain", HttpStatus.BAD_REQUEST);
  }
}
