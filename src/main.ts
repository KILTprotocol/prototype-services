import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { SignatureGuard } from './guards/signature.guard'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  app.useGlobalGuards(new SignatureGuard())
  app.enableCors()
  await app.listen(3000)
}
bootstrap()
