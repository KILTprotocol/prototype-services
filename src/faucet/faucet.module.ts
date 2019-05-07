import { Module } from '@nestjs/common'
import { FaucetController } from './faucet.controller'

@Module({
  imports: [],
  controllers: [FaucetController],
  providers: [],
})
export class FaucetModule {}
