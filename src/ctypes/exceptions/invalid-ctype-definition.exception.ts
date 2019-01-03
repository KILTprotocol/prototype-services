import { HttpException } from "@nestjs/common/exceptions";
import { HttpStatus } from "@nestjs/common";
export class InvalidCtypeDefinitionException extends HttpException {
  constructor() {
    super("Invalid CTYPE definition", HttpStatus.BAD_REQUEST);
  }
}
