import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { Identity, Balance } from '@kiltprotocol/core'
import BN from 'bn.js'
import { FaucetService } from '../src/faucet/interfaces/faucet.interfaces'
import { MockMongooseModule, mongodbInstance } from './MockMongooseModule'
import { FaucetModule } from '../src/faucet/faucet.module'

jest.mock('@kiltprotocol/core/lib/balance/Balance.chain', () => {
  return {
    makeTransfer: jest.fn(() => Promise.resolve({})),
  }
})

jest.mock('@kiltprotocol/chain-helpers/lib/blockchain/Blockchain.utils', () => {
  return {
    __esModules: true,
    submitSignedTx: jest.fn(() => Promise.resolve({ isInBlock: true })),
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
    require('@kiltprotocol/chain-helpers/lib/blockchain/Blockchain.utils').submitSignedTx.mockResolvedValue(
      { isInBlock: true }
    )
    require('@kiltprotocol/core/lib/balance/Balance.chain').makeTransfer.mockResolvedValue(
      {}
    )
  })

  it('rejects malformed requests', async () => {
    return request(app.getHttpServer())
      .post(`/faucet/drop`)
      .send(idAlice.address)
      .expect(400)
  })

  it('handles invalid destination address / public key', async () => {
    require('@kiltprotocol/core/lib/balance/Balance.chain').makeTransfer.mockRejectedValue(
      'transfer destination invalid'
    )
    await request(app.getHttpServer())
      .post(`/faucet/drop`)
      .send('address=0x1234')
      .expect(400)
  })

  it('accepts first valid request', async () => {
    const spy = jest.spyOn(Balance, 'makeTransfer')
    await request(app.getHttpServer())
      .post(`/faucet/drop`)
      .send(`address=${idAlice.address}`)
      .expect(201)

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ seedAsHex: FAUCET_SEED }),
      idAlice.address,
      expect.any(BN),
      0
    )
  })

  it('rejects second valid request', async () => {
    await request(app.getHttpServer())
      .post(`/faucet/drop`)
      .send(`address=${idAlice.address}`)
      .expect(201)

    await request(app.getHttpServer())
      .post(`/faucet/drop`)
      .send(`address=${idAlice.address}`)
      .expect(400)
  })

  afterAll(async () => {
    await Promise.all([app.close(), mongodbInstance.stop()])
  })
})
