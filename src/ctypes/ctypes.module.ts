import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CTypesController } from './ctypes.controller';
import { MongoDbCTypesService } from './mongodb-ctypes.service';
import { CTypeSchema } from './schemas/ctypes.schema';
import { BlockchainModule } from '../blockchain/blockchain.module';

const cTypeServiceProvider = {
  provide: 'CTypeService',
  useClass: MongoDbCTypesService
};

@Module({  
  imports: [
    MongooseModule.forFeature([{ name: 'CTypeModel', schema: CTypeSchema, collection: 'CTypeModel' }]),
    MongooseModule.forRoot(`mongodb://mongoadmin:secret@${process.env.MONGODB_HOST}/registry?authSource=admin`)
  ],
  controllers: [CTypesController],
  providers: [cTypeServiceProvider],
})
export class CTypesModule { }
