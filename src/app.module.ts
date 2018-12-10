import { Module } from '@nestjs/common';
import { ConfigModule } from './config/config.module';
import { CTypesModule } from './ctypes/ctypes.module';
import { MessagingModule } from './messaging/messaging.module';


@Module({
  imports: [ConfigModule, CTypesModule, MessagingModule ]
})
export class AppModule { }
