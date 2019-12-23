import { Module } from '@nestjs/common'
import { ConfigModule } from './config/config.module'
import { MyMongooseModule } from './mongoose/mongoose.module'
import { CTypesModule } from './ctypes/ctypes.module'
import { MessagingModule } from './messaging/messaging.module'
import { ContactsModule } from './contacts/contacts.module'
import { BlockchainModule } from './blockchain/blockchain.module'
import { TerminusModule } from '@nestjs/terminus'
import { TerminusOptionsService } from './health/terminus-options.service'
import { FaucetModule } from './faucet/faucet.module'

@Module({
  imports: [
    ConfigModule,
    MyMongooseModule,
    CTypesModule,
    MessagingModule,
    ContactsModule,
    BlockchainModule,
    FaucetModule,
    TerminusModule.forRootAsync({
      useClass: TerminusOptionsService,
    }),
  ],
})
export class AppModule {}
