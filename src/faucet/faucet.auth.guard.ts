import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Inject,
} from '@nestjs/common'
import { Observable } from 'rxjs'
import { ConfigService } from '../config/config.service'

@Injectable()
export class FaucetAuthGuard implements CanActivate {
  constructor(
    @Inject('ConfigService') private readonly configService: ConfigService
  ) {}

  public canActivate(
    context: ExecutionContext
  ): boolean | Promise<boolean> | Observable<boolean> {
    const faucetSecret = this.configService.get('FAUCET_SECRET')
    if (!faucetSecret) {
      console.log(
        'No faucet secret defined. Is environment variable $FAUCET_SECRET defined?'
      )
      return false
    }

    const request = context.switchToHttp().getRequest()
    const authorizationHeaderValue = request.headers.authorization

    return faucetSecret === authorizationHeaderValue
  }
}
