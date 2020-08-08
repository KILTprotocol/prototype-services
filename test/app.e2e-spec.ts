import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { AppModule } from '../src/app.module'
import { Identity } from '@kiltprotocol/sdk-js'
import { MongoMemoryServer } from 'mongodb-memory-server'

jest.mock(
  '@kiltprotocol/sdk-js/build/blockchainApiConnection/BlockchainApiConnection'
)

describe('AppController availability (e2e)', () => {
  let app: INestApplication
  const mongodbInstance = new MongoMemoryServer({
    instance: { dbName: 'registry', ip: 'localhost', port: 27017, auth: false },
  })

  beforeAll(async () => {
    await mongodbInstance.ensureInstance()
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = moduleFixture.createNestApplication()
    await app.init()
  }, 30000)

  it('root responds with 404 (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(404)
  })

  it('ctypes endpoint available (GET)', () => {
    return request(app.getHttpServer())
      .get('/ctype')
      .expect(200, [])
  })

  it('contacts endpoint available (GET)', () => {
    return request(app.getHttpServer())
      .get('/contacts')
      .expect(200, [])
  })

  it('outgoing messages enpoint available (POST)', async () => {
    return request(app.getHttpServer())
      .post(`/messaging`)
      .send({})
      .expect(400)
  })

  it('message inbox endpoint available (GET)', async () => {
    const idAlice = await Identity.buildFromURI('//Alice')
    return request(app.getHttpServer())
      .get(`/messaging/inbox/${idAlice.address}`)
      .expect(200, [])
  })

  it('message outbox endpoint available (GET)', async () => {
    const idAlice = await Identity.buildFromURI('//Alice')
    return request(app.getHttpServer())
      .get(`/messaging/sent/${idAlice.address}`)
      .expect(200, [])
  })

  it('health enpoint available (GET)', () => {
    return request(app.getHttpServer())
      .get('/health')
      .expect(200, { status: 'ok', info: {} })
  })

  it('faucet endpoint available (POST)', async () => {
    return request(app.getHttpServer())
      .post(`/faucet/drop`)
      .send({})
      .expect(400)
  })

  afterAll(async () => {
    await Promise.all([app.close(), mongodbInstance.stop()])
  })
})
