import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { MongoDbFaucetService } from './mongodb-faucet.service'
import { FaucetDropSchema } from './schemas/faucet.schema'
import { FaucetController } from './faucet.controller'

const faucetServiceProvider = {
  provide: 'FaucetService',
  useClass: MongoDbFaucetService,
}

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: 'FaucetDrop',
        schema: FaucetDropSchema,
        collection: 'FaucetDrop',
      },
    ]),
  ],
  controllers: [FaucetController],
  providers: [faucetServiceProvider],
})
export class FaucetModule {}
