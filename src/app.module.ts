import { Module } from '@nestjs/common'
import { ConfigModule } from './config/config.module'
import { MyMongooseModule } from './mongoose/mongoose.module'
import { CTypesModule } from './ctypes/ctypes.module'
import { MessagingModule } from './messaging/messaging.module'
import { ContactsModule } from './contacts/contacts.module'
import { BlockchainModule } from './blockchain/blockchain.module'
import { FaucetModule } from './faucet/faucet.module'
import { HealthModule } from './health/health.module'

@Module({
  imports: [
    ConfigModule,
    MyMongooseModule,
    CTypesModule,
    MessagingModule,
    ContactsModule,
    BlockchainModule,
    FaucetModule,
    HealthModule,
  ],
})
export class AppModule {}
