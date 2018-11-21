import { Module } from '@nestjs/common';
import { CTypesModule } from './ctypes/ctypes.module';

@Module({
  imports: [CTypesModule]
})
export class AppModule { }
