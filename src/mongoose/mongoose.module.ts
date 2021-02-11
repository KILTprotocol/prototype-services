import fs from 'fs'
import { MongooseModule } from '@nestjs/mongoose'
import { ConfigModule } from '../config/config.module'
import { ConfigService } from '../config/config.service'

//Specify the Amazon DocumentDB cert
const ca = [fs.readFileSync(`${__dirname}/rds-combined-ca-bundle.pem`)]

export const MyMongooseModule = MongooseModule.forRootAsync({
  imports: [ConfigModule],
  useFactory: (configService: ConfigService) => {
    const host = configService.get('MONGODB_HOST')
    const user = configService.get('MONGODB_USER')
    const pass = configService.get('MONGODB_PASS')
    return {
      uri: `mongodb://${host}/devnet?ssl=true&replicaSet=rs0&readPreference=secondaryPreferred`,
      user,
      pass,
      sslValidate: true,
      sslCA: ca,
      useNewUrlParser: true,
    }
  },
  inject: [ConfigService],
})
