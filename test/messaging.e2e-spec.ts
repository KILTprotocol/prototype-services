import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import {
  Identity,
  Message,
  MessageBodyType,
  IEncryptedMessage,
} from '@kiltprotocol/sdk-js'
import supertest from 'supertest'
import { MessagingService } from '../src/messaging/interfaces/messaging.interfaces'
import { MessagingModule } from '../src/messaging/messaging.module'
import { MockMongooseModule, mongodbInstance } from './MockMongooseModule'

function assertErrorMessageIs(
  message: string,
  response: supertest.Response
): void {
  if (response.body['message'] !== message) {
    throw new Error(
      `Expected error message '${message}', got '${response.body['message']}'`
    )
  }
}

let app: INestApplication
let request: supertest.SuperTest<supertest.Test>
let messagingService: MessagingService

beforeAll(async () => {
  const moduleFixture = await Test.createTestingModule({
    imports: [MessagingModule, MockMongooseModule],
  }).compile()

  app = moduleFixture.createNestApplication()
  await app.init()

  messagingService = app.get('MessagingService')
  request = supertest(app.getHttpServer())
}, 30000)

describe('messaging (e2e)', () => {
  let sender: Identity
  let recipient: Identity
  let message: Message

  beforeAll(async () => {
    sender = await Identity.buildFromURI('//Alice')
    recipient = await Identity.buildFromURI('//Bob')
    message = new Message(
      {
        type: MessageBodyType.REQUEST_TERMS,
        content: { cTypeHash: 'CTYPEHASH' },
      },
      sender,
      recipient.getPublicIdentity()
    )
  })

  it('/messaging (GET) returns 404', () => {
    return request.get('/messaging').expect(404)
  })

  describe('sending messages', () => {
    describe('positive tests', () => {
      beforeEach(async () => {
        await messagingService.removeAll()
      })

      it('accepts valid send request', async () => {
        const encrypted = message.encrypt()
        await request
          .post(`/messaging`)
          .send(encrypted)
          .expect(201)

        const inbox = await app
          .get('MessagingService')
          .findByReceiverAddress(recipient.address)

        expect(inbox).toBeInstanceOf(Array)
        expect(inbox).toHaveLength(1)
        expect(inbox[0]).toMatchObject({
          ...encrypted,
          messageId: expect.any(String),
          receivedAt: expect.any(Number),
        })
      })

      it('returns message id & timestamp', async () => {
        const encrypted = message.encrypt()
        await request
          .post(`/messaging`)
          .send(encrypted)
          .expect(201)
          .expect(response => {
            expect(response.body).toHaveProperty(
              'messageId',
              expect.any(String)
            )
            expect(response.body).toHaveProperty(
              'receivedAt',
              expect.any(Number)
            )
            // expect timestamp to be within one second of Date.now()
            expect(Date.now() - response.body['receivedAt']).toBeLessThan(1000)
          })
      })

      it('shows message in sent & inbox after sending', async () => {
        const encrypted = message.encrypt()
        function responseContainsSentMessage(
          response: supertest.Response
        ): void {
          expect(response.body).toBeInstanceOf(Array)
          expect(response.body).toHaveLength(1)
          expect(response.body[0]).toMatchObject({
            ...encrypted,
            messageId: expect.any(String),
            receivedAt: expect.any(Number),
          })
        }
        // wait for message to be delivered
        await request
          .post(`/messaging`)
          .send(encrypted)
          .expect(201)
        // request recipient's inbox & sender's outbox
        await request
          .get(`/messaging/inbox/${recipient.address}`)
          .expect(200)
          .expect(responseContainsSentMessage)
        await request
          .get(`/messaging/sent/${sender.address}`)
          .expect(200)
          .expect(responseContainsSentMessage)
      })
    })

    describe('negative tests', () => {
      it('rejects request with empty body', async () => {
        return request
          .post(`/messaging`)
          .send({})
          .expect(400)
      })

      it('rejects request with missing sender address', async () => {
        const encrypted = message.encrypt()
        encrypted.senderAddress = undefined
        return request
          .post(`/messaging`)
          .send(encrypted)
          .expect(400)
          .expect(response =>
            assertErrorMessageIs('no sender address', response)
          )
      })

      it('rejects request with missing recipient address', async () => {
        const encrypted = message.encrypt()
        encrypted.receiverAddress = undefined
        return request
          .post(`/messaging`)
          .send(encrypted)
          .expect(400)
          .expect(response =>
            assertErrorMessageIs('no receiver address', response)
          )
      })

      it('rejects request with missing nonce', async () => {
        const encrypted = message.encrypt()
        encrypted.nonce = undefined
        return request
          .post(`/messaging`)
          .send(encrypted)
          .expect(400)
          .expect(response => assertErrorMessageIs('no nonce', response))
      })

      it('rejects request with missing message body', async () => {
        const encrypted = message.encrypt()
        encrypted.message = undefined
        return request
          .post(`/messaging`)
          .send(encrypted)
          .expect(400)
          .expect(response => assertErrorMessageIs('no message', response))
      })

      it('rejects request with missing hash', async () => {
        const encrypted = message.encrypt()
        encrypted.hash = undefined
        return request
          .post(`/messaging`)
          .send(encrypted)
          .expect(400)
          .expect(response => assertErrorMessageIs('no hash', response))
      })

      it('rejects request with missing signature', async () => {
        const encrypted = message.encrypt()
        encrypted.signature = undefined
        return request
          .post(`/messaging`)
          .send(encrypted)
          .expect(400)
          .expect(response => assertErrorMessageIs('no signature', response))
      })
    })
  })

  describe('deleting messages', () => {
    let message1: IEncryptedMessage
    let message2: IEncryptedMessage

    beforeEach(async () => {
      message1 = message.encrypt()
      message1.messageId = 'id1'
      message2 = message.encrypt()
      message2.messageId = 'id2'
      await messagingService.removeAll()
      await messagingService.add(message1)
      await messagingService.add(message2)
    })

    it('deletes a message by id', async () => {
      let inbox: IEncryptedMessage[]
      await expect(
        messagingService.findByReceiverAddress(recipient.address)
      ).resolves.toHaveLength(2)
      await request
        .delete('/messaging/id1')
        .set({ signature: recipient.signStr('id1') })
        .expect(200)
      inbox = await messagingService.findByReceiverAddress(recipient.address)
      expect(inbox).toHaveLength(1)
      expect(inbox[0]).toMatchObject(message2)
      await request
        .delete('/messaging/id2')
        .set({ signature: recipient.signStr('id2') })
        .expect(200)
      inbox = await messagingService.findByReceiverAddress(recipient.address)
      expect(inbox).toHaveLength(0)
    })
    it('rejects delete unauthorized requests', async () => {
      await request
        .delete('/messaging/id1')
        .set({ signature: recipient.signStr('id2') })
        .expect(403)
      await request
        .delete('/messaging/id1')
        .set({ signature: '' })
        .expect(400)
    })
    // should this give 400 or 403, or rather do we want to provide information if the id is unregistered?
    it('rejects delete requests for unknown id', async () => {
      await request
        .delete('/messaging/idx')
        .set({ signature: recipient.signStr('idx') })
        .expect(403)
    })

    it('rejects unauthorized delete-all requests', async () => {
      return request.delete(`/messaging`).expect(403)
    })

    it('accepts authorized delete-all requests', async () => {
      const TOKEN = 'authtoken'
      // set token with which http delete request is authorized
      process.env['SECRET'] = TOKEN
      await expect(
        messagingService.findByReceiverAddress(recipient.address)
      ).resolves.toHaveLength(2)
      await request
        .delete(`/messaging`)
        .set('Authorization', TOKEN)
        .expect(200)
      await expect(
        messagingService.findByReceiverAddress(recipient.address)
      ).resolves.toHaveLength(0)
    })
  })

  describe('inbox', () => {
    beforeEach(async () => {
      await messagingService.removeAll()
    })

    it('lists empty inbox (GET)', async () => {
      return request
        .get(`/messaging/inbox/${recipient.address}`)
        .expect(200, [])
    })

    it('lists incoming messages', async () => {
      await request.get(`/messaging/inbox/${recipient.address}`).expect(200, [])
      const message1: IEncryptedMessage = {
        ...message.encrypt(),
        messageId: 'id1',
        receivedAt: Date.now(),
      }
      const message2: IEncryptedMessage = {
        ...message.encrypt(),
        messageId: 'id2',
        receivedAt: Date.now(),
      }

      await messagingService.add(message1)
      await request
        .get(`/messaging/inbox/${recipient.address}`)
        .expect(200)
        .expect(response => {
          expect(response.body).toHaveLength(1)
          expect(response.body[0]).toMatchObject(message1)
        })
      await messagingService.add(message2)
      await request
        .get(`/messaging/inbox/${recipient.address}`)
        .expect(200)
        .expect(response => {
          expect(response.body).toHaveLength(2)
          expect(response.body[0]).toMatchObject(message1)
          expect(response.body[1]).toMatchObject(message2)
        })
    })
  })

  describe('outbox', () => {
    beforeEach(async () => {
      await messagingService.removeAll()
    })

    it('lists empty outbox (GET)', async () => {
      return request.get(`/messaging/sent/${sender.address}`).expect(200, [])
    })

    it('lists outgoing messages', async () => {
      const message1: IEncryptedMessage = {
        ...message.encrypt(),
        messageId: 'id1',
        receivedAt: Date.now(),
      }
      const message2: IEncryptedMessage = {
        ...message.encrypt(),
        messageId: 'id2',
        receivedAt: Date.now(),
      }

      await request.get(`/messaging/sent/${sender.address}`).expect(200, [])
      await messagingService.add(message1)
      await request
        .get(`/messaging/sent/${sender.address}`)
        .expect(200)
        .expect(response => {
          expect(response.body).toHaveLength(1)
          expect(response.body[0]).toMatchObject(message1)
        })
      await messagingService.add(message2)
      await request
        .get(`/messaging/sent/${sender.address}`)
        .expect(200)
        .expect(response => {
          expect(response.body).toHaveLength(2)
          expect(response.body[0]).toMatchObject(message1)
          expect(response.body[1]).toMatchObject(message2)
        })
    })
  })

  it('send -> receive -> decrypt -> delete', async () => {
    await messagingService.removeAll()
    const encrypted = message.encrypt()
    const messageId: string = await request
      .post(`/messaging`)
      .send(encrypted)
      .expect(201)
      .then(response => response.body['messageId'])

    const receivedMessages: IEncryptedMessage[] = await request
      .get(`/messaging/inbox/${recipient.address}`)
      .expect(200)
      .then(response => response.body)
    expect(receivedMessages).toBeInstanceOf(Array)
    expect(receivedMessages).toHaveLength(1)
    expect(receivedMessages[0]).toMatchObject({
      ...encrypted,
      messageId,
      receivedAt: expect.any(Number),
    })
    const decrypted = Message.decrypt(encrypted, recipient)
    expect(decrypted).toMatchObject(message)
    await request
      .delete(`/messaging/${messageId}`)
      .set({ signature: recipient.signStr(messageId) })
      .expect(200)
    await request.get(`/messaging/inbox/${recipient.address}`).expect(200, [])
  })
})

afterAll(async () => {
  await Promise.all([app.close(), mongodbInstance.stop()])
})
