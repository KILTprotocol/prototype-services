import { MongooseModule } from '@nestjs/mongoose'
import { ConfigModule } from '../src/config/config.module'
import { MongoMemoryServer } from 'mongodb-memory-server'
import { ConfigService } from '../src/config/config.service'

export const mongodbInstance = new MongoMemoryServer()

/**
 * A MongooseModule that creates a new ephemeral in-memory db for testing purposes.
 * This module should be used instead of MyMongooseModule to allow concurrent testing -
 * multiple independent in-memory db's can run at the same time.
 */
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
