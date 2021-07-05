import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Inject,
} from '@nestjs/common'
import type { Observable } from 'rxjs'
import { ConfigService } from '../config/config.service'

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    @Inject('ConfigService') private readonly configService: ConfigService
  ) {}

  public canActivate(
    context: ExecutionContext
  ): boolean | Promise<boolean> | Observable<boolean> {
    const secret = this.configService.get('SECRET')
    if (!secret) {
      console.log(
        'No faucet secret defined. Is environment variable $SECRET defined?'
      )
      return false
    }

    const request = context.switchToHttp().getRequest()
    const authorizationHeaderValue = request.headers.authorization

    return secret === authorizationHeaderValue
  }
}
