import { Controller, Get } from '@nestjs/common'
import {
  HealthCheck,
  HealthCheckService,
  MongooseHealthIndicator,
} from '@nestjs/terminus'
import { KiltChainConnectionIndicator } from './bc.health'

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private mongoose: MongooseHealthIndicator,
    private kiltChain: KiltChainConnectionIndicator
  ) {}

  @Get()
  @HealthCheck()
  public check() {
    return this.health.check([
      async () => this.mongoose.pingCheck('mongoose'),
      async () => this.kiltChain.isConnected('chain', 1000),
    ])
  }
}
