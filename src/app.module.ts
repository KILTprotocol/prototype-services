import { Module } from '@nestjs/common';
import { ConfigModule } from './config/config.module';
import { CTypesModule } from './ctypes/ctypes.module';
import { MessagingModule } from './messaging/messaging.module';
import { ContactsModule } from './contacts/contacts.module';
import { BlockchainModule } from './blockchain/blockchain.module';


@Module({
  imports: [ConfigModule, CTypesModule, MessagingModule, ContactsModule, BlockchainModule ]
})
export class AppModule { }
