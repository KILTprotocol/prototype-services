import { MongooseModule } from '@nestjs/mongoose'
import { ConfigModule } from '../config/config.module'
import { ConfigService } from '../config/config.service'

export const MyMongooseModule = MongooseModule.forRootAsync({
  imports: [ConfigModule],
  useFactory: (configService: ConfigService) => {
    const host = configService.get('MONGODB_HOST')
    const user = configService.get('MONGODB_USER')
    const pass = configService.get('MONGODB_PASS')
    return {
      uri: `mongodb://${host}/registry?authSource=admin`,
      user,
      pass,
    }
  },
  inject: [ConfigService],
})
