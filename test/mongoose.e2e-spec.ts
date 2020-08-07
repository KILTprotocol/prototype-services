import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { MessagingService } from '../src/messaging/interfaces/messaging.interfaces'
import { MessagingModule } from '../src/messaging/messaging.module'
import { MockMongooseModule, mongodbInstance } from './MockMongooseModule'

let app: INestApplication
let messagingService: MessagingService

it('connects to mongodb', async () => {
  const moduleFixture = await Test.createTestingModule({
    imports: [MockMongooseModule, MessagingModule],
  }).compile()

  app = moduleFixture.createNestApplication()
  await app.init()

  messagingService = app.get('MessagingService')

  await expect(messagingService.findBySenderAddress('0xaaa')).resolves.toEqual(
    []
  )
}, 30000)

afterAll(async () => {
  await mongodbInstance.stop()
  await app.close()
})
