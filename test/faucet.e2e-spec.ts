import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { Identity, Balance } from '@kiltprotocol/sdk-js'
import BN from 'bn.js'
import { FaucetService } from '../src/faucet/interfaces/faucet.interfaces'
import { MockMongooseModule, mongodbInstance } from './MockMongooseModule'
import { FaucetModule } from '../src/faucet/faucet.module'

jest.mock('@kiltprotocol/sdk-js/build/balance/Balance.chain', () => {
  return {
    makeTransfer: jest.fn(() => Promise.resolve({ isFinalized: true })),
  }
})

const FAUCET_SEED =
  '0xcdfd6024d2b0eba27d54cc92a44cd9a627c69b2dbda15ed7e58085425119ae03'

describe('faucet endpoint (e2e)', () => {
  let app: INestApplication
  let idAlice: Identity
  let faucetService: FaucetService

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [FaucetModule, MockMongooseModule],
    }).compile()

    app = moduleFixture.createNestApplication()
    await app.init()

    faucetService = app.get('FaucetService')
    idAlice = await Identity.buildFromURI('//Alice')

    process.env['FAUCET_ACCOUNT'] = FAUCET_SEED
  }, 30000)

  beforeEach(async () => {
    await faucetService.reset()
  })

  it('rejects malformed requests', async () => {
    return request(app.getHttpServer())
      .post(`/faucet/drop`)
      .send(idAlice.getBoxPublicKey())
      .expect(400)
  })

  // TODO, see KILTprotocol/ticket#686
  xit('handles invalid destination address / public key', async () => {
    require('@kiltprotocol/sdk-js/build/balance/Balance.chain').makeTransfer.mockRejectedValueOnce(
      'transfer destination invalid'
    )
    await request(app.getHttpServer())
      .post(`/faucet/drop`)
      .send('pubkey=0x1234')
      .expect(400)
  })

  it('accepts first valid request', async () => {
    const spy = jest.spyOn(Balance, 'makeTransfer')
    await request(app.getHttpServer())
      .post(`/faucet/drop`)
      .send(`pubkey=${idAlice.getBoxPublicKey()}`)
      .expect(201)

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ seedAsHex: FAUCET_SEED }),
      idAlice.getBoxPublicKey(),
      expect.any(BN)
    )
  })

  it('rejects second valid request', async () => {
    await request(app.getHttpServer())
      .post(`/faucet/drop`)
      .send(`pubkey=${idAlice.getBoxPublicKey()}`)
      .expect(201)

    await request(app.getHttpServer())
      .post(`/faucet/drop`)
      .send(`pubkey=${idAlice.getBoxPublicKey()}`)
      .expect(400)
  })

  afterAll(async () => {
    await Promise.all([app.close(), mongodbInstance.stop()])
  })
})