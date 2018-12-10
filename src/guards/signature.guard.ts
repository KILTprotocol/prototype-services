import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Observable } from 'rxjs';


@Injectable()
export class SignatureGuard implements CanActivate {
    canActivate(
        context: ExecutionContext,
    ): boolean | Promise<boolean> | Observable<boolean> {
        const request = context.switchToHttp().getRequest();
        return this.validateRequest(request);
    }

    validateRequest(request: any) : boolean {
        // console.log("signature guard");
        const identity = request.headers['identity'];
        const hash = request.headers['hash'];
        const signature = request.headers['signature'];
        // TODO
        return true
    }

}