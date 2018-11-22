import { Module } from '@nestjs/common';
import { ConfigModule } from './config/config.module';
import { CTypesModule } from './ctypes/ctypes.module';


@Module({
  imports: [ConfigModule, CTypesModule]
})
export class AppModule { }
