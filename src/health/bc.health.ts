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
    return new Promise<HealthIndicatorResult>(async (resolve, reject) => {
      setTimeout(
        reject,
        timeout,
        new HealthCheckError(
          `no response before timeout (${timeout} ms)`,
          `no response before timeout (${timeout} ms)`
        )
      )
      try {
        const bc = await BlockchainApiConnection.getCached()
        const stats = await bc.api.rpc.system.health()
        resolve(this.getStatus(key, true, stats))
      } catch (e) {
        reject(e)
      }
    }).catch(e =>
      Promise.reject(
        new HealthCheckError(
          'Error with Kilt chain connection',
          this.getStatus(key, false, e)
        )
      )
    )
  }
}
