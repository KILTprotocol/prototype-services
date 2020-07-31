import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { Identity, Balance } from '@kiltprotocol/sdk-js'
import { AppModule } from '../src/app.module'
import { FaucetService } from '../src/faucet/interfaces/faucet.interfaces'

jest.mock(
  '@kiltprotocol/sdk-js/build/blockchainApiConnection/BlockchainApiConnection'
)
jest.mock('@kiltprotocol/sdk-js/build/balance/Balance.chain', () => {
  return {
    makeTransfer: () => Promise.resolve({ isFinalized: true }),
  }
})

const FAUCET_SEED =
  '0xcdfd6024d2b0eba27d54cc92a44cd9a627c69b2dbda15ed7e58085425119ae03'

describe('faucet (e2e)', () => {
  let app: INestApplication
  let idAlice: Identity
  let faucetService: FaucetService

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = moduleFixture.createNestApplication()
    await app.init()

    faucetService = app.get('FaucetService')
    idAlice = await Identity.buildFromURI('//Alice')

    process.env['FAUCET_ACCOUNT'] = FAUCET_SEED
  })

  beforeEach(async () => {
    await faucetService.reset()
  })

  it('faucet endpoint rejects invalid requests', async () => {
    return request(app.getHttpServer())
      .post(`/faucet/drop`)
      .send(idAlice.getBoxPublicKey())
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
      expect.anything()
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
    await app.close()
  })
})
