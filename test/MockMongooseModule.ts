import { MongooseModule } from '@nestjs/mongoose'
import { ConfigModule } from '../src/config/config.module'
import { MongoMemoryServer } from 'mongodb-memory-server'
import { ConfigService } from '../src/config/config.service'

export const mongodbInstance = new MongoMemoryServer()

export const MockMongooseModule = MongooseModule.forRootAsync({
  imports: [ConfigModule],
  useFactory: async () => {
    await mongodbInstance.ensureInstance()
    const uri = await mongodbInstance.getUri()
    return {
      uri,
    }
  },
  inject: [ConfigService],
})
