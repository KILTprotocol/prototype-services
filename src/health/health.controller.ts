import { Controller, Get } from '@nestjs/common'
import {
  DNSHealthIndicator,
  HealthCheck,
  HealthCheckService,
  MongooseHealthIndicator,
} from '@nestjs/terminus'
import { KiltChainConnectionIndicator } from './bc.health'

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private dns: DNSHealthIndicator,
    private mongoose: MongooseHealthIndicator,
    private kiltChain: KiltChainConnectionIndicator
  ) {}

  @Get()
  @HealthCheck()
  public check() {
    return this.health.check([
      () => this.dns.pingCheck('google', 'https://google.com'),
      async () => this.mongoose.pingCheck('mongoose'),
      async () => this.kiltChain.isConnected('Kilt chain connection', 1000),
    ])
  }
}
