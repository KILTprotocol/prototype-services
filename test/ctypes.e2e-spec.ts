import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import * as sdk from '@kiltprotocol/sdk-js'
import { MockMongooseModule, mongodbInstance } from './MockMongooseModule'
import { CTypesModule } from '../src/ctypes/ctypes.module'
import { CType, CTypeService } from '../src/ctypes/interfaces/ctype.interfaces'
import { BlockchainModule } from '../src/blockchain/blockchain.module'

jest.mock('@kiltprotocol/sdk-js/build/ctype/CType.chain', () => {
  return {
    getOwner: jest.fn(async () => null),
  }
})
jest.mock(
  '@kiltprotocol/sdk-js/build/blockchainApiConnection/BlockchainApiConnection'
)

describe('ctypes endpoint (e2e)', () => {
  let app: INestApplication
  let idAlice: sdk.Identity
  let ctypeService: CTypeService

  const kiltCTypeA = sdk.CType.fromSchema({
    $schema: 'http://kilt-protocol.org/draft-01/ctype#',
    properties: {
      name: {
        type: 'string',
      },
      age: {
        type: 'integer',
      },
    },
    type: 'object',
    title: 'test_ctype',
  })
  const cTypeRecordA: CType = {
    cType: kiltCTypeA,
    metaData: {
      ctypeHash: kiltCTypeA.hash,
      metadata: {
        title: { default: 'Test Ctype' },
        properties: {
          name: { title: { default: 'name' } },
          age: { title: { default: 'age' } },
        },
      },
    },
  }

  const kiltCTypeB = sdk.CType.fromSchema({
    $schema: 'http://kilt-protocol.org/draft-01/ctype#',
    properties: {
      name: {
        type: 'string',
      },
      age: {
        type: 'integer',
      },
    },
    type: 'object',
    title: 'another_ctype',
  })
  const cTypeRecordB: CType = {
    cType: kiltCTypeB,
    metaData: {
      ctypeHash: kiltCTypeB.hash,
      metadata: {
        title: { default: 'Test Ctype' },
        properties: {
          name: { title: { default: 'name' } },
          age: { title: { default: 'age' } },
        },
      },
    },
  }

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [CTypesModule, BlockchainModule, MockMongooseModule],
    }).compile()

    app = moduleFixture.createNestApplication()
    await app.init()

    ctypeService = app.get('CTypeService')
    idAlice = await sdk.Identity.buildFromURI('//Alice')
  }, 30000)

  beforeEach(async () => {
    await ctypeService.removeAll()
  })

  describe('get', () => {
    beforeEach(async () => {
      await ctypeService.register(cTypeRecordA)
      await ctypeService.register(cTypeRecordB)
    })

    it('gets all ctypes', async () => {
      await request(app.getHttpServer())
        .get(`/ctype`)
        .expect(200)
        .expect(response => {
          expect(response.body).toBeInstanceOf(Array)
          expect(response.body).toHaveLength(2)
          expect(response.body).toMatchObject([cTypeRecordA, cTypeRecordB])
        })
    })

    it('gets ctype by hash', async () => {
      await request(app.getHttpServer())
        .get(`/ctype/${cTypeRecordA.cType.hash}`)
        .expect(200)
        .expect(response => {
          expect(response.body).toMatchObject(cTypeRecordA)
        })
      await request(app.getHttpServer())
        .get(`/ctype/${cTypeRecordB.cType.hash}`)
        .expect(200)
        .expect(response => {
          expect(response.body).toMatchObject(cTypeRecordB)
        })
    })

    it('rejects request for ctype if hash unknown', async () => {
      await request(app.getHttpServer())
        .get(`/ctype/${'unknown-hash'}`)
        .expect(404)
    })
  })

  describe('add', () => {
    const mockedGetOwner = require('@kiltprotocol/sdk-js/build/ctype/CType.chain')
      .getOwner

    beforeEach(() => {
      mockedGetOwner.mockResolvedValue(null)
    })

    it('adds new ctype if hash on chain', async () => {
      mockedGetOwner.mockResolvedValue(idAlice.address)

      await request(app.getHttpServer())
        .post(`/ctype`)
        .send(cTypeRecordA)
        .expect(201)

      expect(mockedGetOwner).toHaveBeenCalledWith(kiltCTypeA.hash)
      const storedCtypes = await ctypeService.findAll()
      expect(storedCtypes).toBeInstanceOf(Array)
      expect(storedCtypes).toHaveLength(1)
      // it overwrites ctype owner with actual owner
      expect(storedCtypes[0]).toMatchObject({
        ...cTypeRecordA,
        cType: { ...kiltCTypeA, owner: idAlice.address },
      })
    })

    it('overwrites owner with chain owner', async () => {
      mockedGetOwner.mockResolvedValue('new-owner')
      const cTypeRecordWithOwner = {
        ...cTypeRecordA,
        cType: sdk.CType.fromSchema(kiltCTypeA.schema, idAlice.address),
      }
      await request(app.getHttpServer())
        .post(`/ctype`)
        .send(cTypeRecordWithOwner)
        .expect(201)

      expect(mockedGetOwner).toHaveBeenCalledWith(kiltCTypeA.hash)
      const storedCtypes = await ctypeService.findAll()
      expect(storedCtypes).toBeInstanceOf(Array)
      expect(storedCtypes).toHaveLength(1)
      // it overwrites ctype owner with actual owner
      expect(storedCtypes[0]).toMatchObject({
        ...cTypeRecordWithOwner,
        cType: { ...kiltCTypeA, owner: 'new-owner' },
      })
    })

    it('rejects new ctype if hash not on chain', async () => {
      await request(app.getHttpServer())
        .post(`/ctype`)
        .send(cTypeRecordA)
        .expect(400)

      expect(mockedGetOwner).toHaveBeenCalledWith(kiltCTypeA.hash)
      await expect(ctypeService.findAll()).resolves.toEqual([])
    })

    it('rejects if data corrupted or ctype invalid', async () => {
      mockedGetOwner.mockResolvedValue(idAlice.address)
      const corruptedCtype: CType = {
        ...cTypeRecordA,
        cType: {
          ...kiltCTypeA,
          schema: { ...kiltCTypeA.schema, title: 'different-title' },
        },
      }
      await request(app.getHttpServer())
        .post(`/ctype`)
        .send(corruptedCtype)
        .expect(400)

      await expect(ctypeService.findAll()).resolves.toEqual([])
    })

    it('rejects if ctype already registered', async () => {
      mockedGetOwner.mockResolvedValue(idAlice.address)
      await request(app.getHttpServer())
        .post(`/ctype`)
        .send(cTypeRecordA)
        .expect(201)

      await request(app.getHttpServer())
        .post(`/ctype`)
        .send(cTypeRecordA)
        .expect(400)

      await expect(ctypeService.findAll()).resolves.toHaveLength(1)
    })
  })

  describe('delete', () => {
    beforeEach(async () => {
      await ctypeService.register(cTypeRecordA)
      await ctypeService.register(cTypeRecordB)
    })

    it('rejects unauthorized delete requests', async () => {
      await request(app.getHttpServer())
        .delete(`/ctype`)
        .expect(403)
      await expect(ctypeService.findAll()).resolves.toMatchObject([
        cTypeRecordA,
        cTypeRecordB,
      ])
    })

    it('accepts authorized delete-all requests', async () => {
      const TOKEN = 'authtoken'
      // set token with which http delete request is authorized
      process.env['SECRET'] = TOKEN
      await request(app.getHttpServer())
        .delete(`/ctype`)
        .set('Authorization', TOKEN)
        .expect(200)
      await expect(ctypeService.findAll()).resolves.toEqual([])
    })
  })

  it('register -> get -> reset', async () => {
    require('@kiltprotocol/sdk-js/build/ctype/CType.chain').getOwner.mockResolvedValue(
      idAlice.address
    )

    await request(app.getHttpServer())
      .post(`/ctype`)
      .send(cTypeRecordA)
      .expect(201)

    await request(app.getHttpServer())
      .get(`/ctype/${cTypeRecordA.cType.hash}`)
      .expect(200)
      .expect(response => {
        expect(response.body).toMatchObject({
          ...cTypeRecordA,
          // it overwrites ctype owner with actual owner
          cType: { ...kiltCTypeA, owner: idAlice.address },
        })
      })

    const TOKEN = 'authtoken'
    // set token with which http delete request is authorized
    process.env['SECRET'] = TOKEN
    await request(app.getHttpServer())
      .delete(`/ctype`)
      .set('Authorization', TOKEN)
      .expect(200)

    await request(app.getHttpServer())
      .get(`/ctype`)
      .expect(200)
      .expect(response => {
        expect(response.body).toEqual([])
      })
  })

  afterAll(async () => {
    await Promise.all([app.close(), mongodbInstance.stop()])
  })
})
