import { BlockchainApiConnection } from '@kiltprotocol/sdk-js'
import { Injectable } from '@nestjs/common'
import {
  HealthCheckError,
  HealthIndicator,
  HealthIndicatorResult,
} from '@nestjs/terminus'

@Injectable()
export class KiltChainConnectionIndicator extends HealthIndicator {
  public async isConnected(
    key: string,
    timeout: number
  ): Promise<HealthIndicatorResult> {
    return new Promise((resolve, reject) => {
      setTimeout(
        () =>
          reject(
            new HealthCheckError(
              `no connection before timeout (${timeout} ms)`,
              'timeout'
            )
          ),
        timeout
      )
      BlockchainApiConnection.getCached()
        .then(bc => bc.api.isReadyOrError)
        .then(resolve)
        .catch(e => reject(e))
    })
      .then(() => this.getStatus(key, true))
      .catch(e =>
        Promise.reject(
          new HealthCheckError(
            'Error with Kilt chain connection',
            this.getStatus(key, false, e)
          )
        )
      )
  }
}
