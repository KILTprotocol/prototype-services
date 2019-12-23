import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { MessagingController } from './messaging.controller'
import { MongoDbMessagingService } from './mongodb-messaging.service'
import { MessageSchema } from './schemas/messaging.schema'

const messagingServiceProvider = {
  provide: 'MessagingService',
  useClass: MongoDbMessagingService,
}

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Message', schema: MessageSchema, collection: 'Message' },
    ]),
  ],
  controllers: [MessagingController],
  providers: [messagingServiceProvider],
})
export class MessagingModule {}
