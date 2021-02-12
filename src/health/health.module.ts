import { Module } from '@nestjs/common'
import { TerminusModule } from '@nestjs/terminus'
import { KiltChainConnectionIndicator } from './bc.health'
import { HealthController } from './health.controller'

@Module({
  imports: [TerminusModule],
  controllers: [HealthController],
  providers: [KiltChainConnectionIndicator],
})
export class HealthModule {}
