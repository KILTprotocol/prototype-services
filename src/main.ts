import { NestFactory } from '@nestjs/core'
import { NestExpressApplication } from '@nestjs/platform-express'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  app.set('trust proxy', true)
  app.enableCors()
  await app.listen(3000)
}
bootstrap()
