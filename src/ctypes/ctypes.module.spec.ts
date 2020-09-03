import { CType, CTypeService, CTypeDB } from './interfaces/ctype.interfaces'
import Optional from 'typescript-optional'
import * as SDK from '@kiltprotocol/sdk-js'
import { Test } from '@nestjs/testing'
import { CTypesController } from './ctypes.controller'
import { AuthGuard } from '../auth/auth.guard'
import { InvalidCtypeDefinitionException } from './exceptions/invalid-ctype-definition.exception'
import { CTypeNotOnChainException } from './exceptions/ctype-not-on-chain.exception'
import { AlreadyRegisteredException } from './exceptions/already-registered.exception'
import { NotFoundException } from '@nestjs/common/exceptions'
import { getModelToken } from '@nestjs/mongoose'
import { MongoDbCTypesService } from './mongodb-ctypes.service'

jest.mock('@kiltprotocol/sdk-js/build/ctype/CType.chain', () => {
  return {
    getOwner: jest.fn(() => Promise.resolve<string | null>(null)),
  }
})

jest.mock(
  '@kiltprotocol/sdk-js/build/blockchainApiConnection/BlockchainApiConnection'
)

describe('CType Module', () => {
  const SDKCTypeA: SDK.CType = SDK.CType.fromSchema({
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

  const metaDataA: SDK.CTypeMetadata = {
    ctypeHash: SDKCTypeA.hash,
    metadata: {
      title: { default: 'Test Ctype' },
      properties: {
        name: { title: { default: 'name' } },
        age: { title: { default: 'age' } },
      },
    },
  }

  const SDKCTypeB = SDK.CType.fromSchema({
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

  const metaDataB: SDK.CTypeMetadata = {
    ctypeHash: SDKCTypeB.hash,
    metadata: {
      title: { default: 'Test Ctype' },
      properties: {
        name: { title: { default: 'name' } },
        age: { title: { default: 'age' } },
      },
    },
  }
  describe('Controller', () => {
    let ctypesController: CTypesController
    let ctypesService: CTypeService
    let aliceAddress: string

    const blockchainApi = require('@kiltprotocol/sdk-js/build/blockchainApiConnection/BlockchainApiConnection')
      .__mocked_api

    const mockedGetOwner = require('@kiltprotocol/sdk-js/build/ctype/CType.chain')
      .getOwner

    const fakeCTypeService: CTypeService = {
      findByHash: jest.fn(
        async (): Promise<Optional<CType>> =>
          Promise.resolve(Optional.ofNullable<CType>(null))
      ),
      findAll: jest.fn(async (): Promise<CType[]> => Promise.resolve([])),
      register: jest.fn(async (): Promise<boolean> => Promise.resolve(true)),
      removeAll: jest.fn(
        async (): Promise<void> => {
          Promise.resolve()
        }
      ),
    }

    beforeAll(
      async () =>
        (aliceAddress = (await SDK.Identity.buildFromURI('//Alice')).address)
    )

    beforeEach(async () => {
      const moduleRef = await Test.createTestingModule({
        controllers: [CTypesController],
        providers: [
          {
            provide: 'CTypeService',
            useValue: fakeCTypeService,
          },
          {
            provide: 'BlockchainService',
            useValue: {
              connect: () => new SDK.Blockchain(blockchainApi.__mocked_api),
            },
          },
        ],
      })
        .overrideGuard(AuthGuard)
        .useValue({ canActivate: () => true })
        .compile()

      ctypesController = moduleRef.get(CTypesController)
      ctypesService = moduleRef.get('CTypeService')
    })

    describe('verifyCTypeAndReturnChainOwner', () => {
      it('valid CType', async () => {
        mockedGetOwner.mockResolvedValue(aliceAddress)
        const testCType = { ...SDKCTypeA, owner: aliceAddress }
        const serviceCType: CType = { cType: testCType, metaData: metaDataA }
        await expect(
          ctypesController['verifyCTypeAndReturnChainOwner'](serviceCType)
        ).resolves.toEqual(aliceAddress)
      })
      it('invalid CType', async () => {
        mockedGetOwner.mockResolvedValue(aliceAddress)
        const testCType = { ...SDKCTypeA, owner: aliceAddress, hash: '0x1' }
        const serviceCType: CType = { cType: testCType, metaData: metaDataA }

        await expect(
          ctypesController['verifyCTypeAndReturnChainOwner'](serviceCType)
        ).rejects.toThrow(new InvalidCtypeDefinitionException())
      })
      it('offChain CType', async () => {
        mockedGetOwner.mockResolvedValue(null)
        const testCType = { ...SDKCTypeA, owner: aliceAddress }
        const serviceCType: CType = { cType: testCType, metaData: metaDataA }
        await expect(
          ctypesController['verifyCTypeAndReturnChainOwner'](serviceCType)
        ).resolves.toBeNull()
      })
    })
    describe('register', () => {
      it('accepts unregistered ctypes', async () => {
        mockedGetOwner.mockResolvedValue(aliceAddress)
        const testCType = { ...SDKCTypeA, owner: aliceAddress }
        const serviceCType: CType = { cType: testCType, metaData: metaDataA }
        await expect(ctypesController.register(serviceCType)).resolves.toEqual(
          undefined
        )
      })
      it('rejects offchain ctypes', async () => {
        mockedGetOwner.mockResolvedValue(null)
        const testCType = { ...SDKCTypeA, owner: aliceAddress }
        const serviceCType: CType = { cType: testCType, metaData: metaDataA }
        await expect(ctypesController.register(serviceCType)).rejects.toThrow(
          new CTypeNotOnChainException()
        )
      })
      it('rejects already registered ctypes', async () => {
        mockedGetOwner.mockResolvedValue(aliceAddress)
        const testCType = { ...SDKCTypeA, owner: aliceAddress }
        const serviceCType: CType = { cType: testCType, metaData: metaDataA }
        ctypesService.register = jest.fn().mockResolvedValue(false)
        await expect(ctypesController.register(serviceCType)).rejects.toThrow(
          new AlreadyRegisteredException()
        )
      })
    })
    describe('removeAll', () => {
      it('calls cTypesService.removeAll', async () => {
        ctypesController.removeAll()
        expect(ctypesService.removeAll).toHaveBeenCalledTimes(1)
      })
    })
    describe('getByKey', () => {
      it('resolves to registered CType', async () => {
        const testCType = { ...SDKCTypeA, owner: aliceAddress }
        const serviceCType: CType = { cType: testCType, metaData: metaDataA }
        ctypesService.findByHash = jest
          .fn()
          .mockResolvedValue(Optional.ofNullable<CType>(serviceCType))
        await expect(
          ctypesController.getByKey(SDKCTypeA.hash)
        ).resolves.toEqual(serviceCType)
      })
      it('throws NotFoundException', async () => {
        const testCType = { ...SDKCTypeA, owner: aliceAddress }
        const serviceCType: CType = { cType: testCType, metaData: metaDataA }
        ctypesService.findByHash = jest
          .fn()
          .mockResolvedValue(Optional.ofNullable<CType>(null))
        await expect(ctypesController.getByKey(SDKCTypeA.hash)).rejects.toThrow(
          NotFoundException
        )
      })
    })
    describe('getAll', () => {
      it('finds all CTypes from the cTypesService', async () => {
        const testCTypeA = { ...SDKCTypeA, owner: aliceAddress }
        const serviceCTypeA: CType = { cType: testCTypeA, metaData: metaDataA }
        const testCTypeB = { ...SDKCTypeB, owner: aliceAddress }
        const serviceCTypeB: CType = { cType: testCTypeB, metaData: metaDataB }
        ctypesService.findAll = jest
          .fn()
          .mockResolvedValue([serviceCTypeA, serviceCTypeB])
        await expect(ctypesController.getAll()).resolves.toEqual([
          serviceCTypeA,
          serviceCTypeB,
        ])
      })
    })
  })
  class CTypeModel {
    public static find = jest
      .fn()
      .mockReturnValue({ exec: () => [] as CTypeDB[] })
    public static findOne = jest
      .fn()
      .mockReturnValue({ exec: () => Optional.ofNullable(null) })
    public static deleteMany = jest.fn().mockReturnValue({
      exec: () => Promise.resolve<void>(undefined),
    })
    public static save = jest
      .fn()
      .mockImplementation(object => Promise.resolve(object))
    public save = jest.fn().mockReturnValue(CTypeModel.save(this))

    constructor(data: CTypeDB) {
      return Object.assign(this, data)
    }
  }

  describe('Service', () => {
    let ctypesService: CTypeService
    let aliceAddress: string

    beforeAll(
      async () =>
        (aliceAddress = (await SDK.Identity.buildFromURI('//Alice')).address)
    )

    beforeEach(async () => {
      const cTypeServiceProvider = {
        provide: 'CTypeService',
        useClass: MongoDbCTypesService,
      }

      const moduleRef = await Test.createTestingModule({
        providers: [
          cTypeServiceProvider,
          { provide: getModelToken('CType'), useValue: CTypeModel },
        ],
      }).compile()

      ctypesService = moduleRef.get('CTypeService')
    })

    describe('removeAll', () => {
      it('calls cTypeDBModel.deleteMany with inclusive condition', async () => {
        const deleteManySpy = jest
          .spyOn(ctypesService['cTypeDBModel'], 'deleteMany')
          .mockImplementation(() => {
            return {
              exec: () => {
                return Promise.resolve<void>(undefined)
              },
            }
          })
        await ctypesService.removeAll()
        expect(deleteManySpy).toHaveBeenCalled()
        expect(deleteManySpy).toHaveBeenCalledWith({})
        deleteManySpy.mockRestore()
      })
    })
    describe('findByHash', () => {
      it('finds the registered CTypeDB for the given hash and returns it converted to CType', async () => {
        const SDKtestCTypeA = { ...SDKCTypeA, owner: aliceAddress }
        const testCTypeA: CType = { cType: SDKtestCTypeA, metaData: metaDataA }
        const DBCTypeA: CTypeDB = {
          metaData: JSON.stringify(metaDataA),
          cType: JSON.stringify(SDKtestCTypeA),
          hash: SDKtestCTypeA.hash,
        } as CTypeDB
        const findOneSpy = jest
          .spyOn(ctypesService['cTypeDBModel'], 'findOne')
          .mockImplementation(() => {
            return {
              exec: () => {
                return Promise.resolve<CTypeDB>(DBCTypeA)
              },
            }
          })
        await expect(
          ctypesService.findByHash(SDKtestCTypeA.hash)
        ).resolves.toEqual(Optional.ofNullable<CType>(testCTypeA))
        expect(findOneSpy).toHaveBeenCalledWith({
          hash: SDKtestCTypeA.hash,
        })
        findOneSpy.mockRestore()
      })
      it('returns nulled Optional if the hash is not registered', async () => {
        const findOneSpy = jest
          .spyOn(ctypesService['cTypeDBModel'], 'findOne')
          .mockImplementation(() => {
            return {
              exec: () => {
                return Promise.resolve<CTypeDB>(null)
              },
            }
          })

        await expect(ctypesService.findByHash(SDKCTypeA.hash)).resolves.toEqual(
          Optional.ofNullable<CType>(null)
        )
        expect(findOneSpy).toHaveBeenCalledWith({ hash: SDKCTypeA.hash })
        findOneSpy.mockRestore()
      })
    })
    describe('findAll', () => {
      it('uses cTypeDBModel.find() and returns all registered CTypesDB converted to CType', async () => {
        const SDKtestCTypeA = { ...SDKCTypeA, owner: aliceAddress }
        const testCTypeA: CType = { cType: SDKtestCTypeA, metaData: metaDataA }
        const DBCTypeA: CTypeDB = {
          metaData: JSON.stringify(metaDataA),
          cType: JSON.stringify(SDKtestCTypeA),
          hash: SDKtestCTypeA.hash,
        } as CTypeDB
        const SDKtestCTypeB = { ...SDKCTypeB, owner: aliceAddress }
        const testCTypeB: CType = { cType: SDKtestCTypeB, metaData: metaDataB }
        const DBCTypeB: CTypeDB = {
          metaData: JSON.stringify(metaDataB),
          cType: JSON.stringify(SDKtestCTypeB),
          hash: SDKtestCTypeB.hash,
        } as CTypeDB
        const findSpy = jest
          .spyOn(ctypesService['cTypeDBModel'], 'find')
          .mockImplementation(() => {
            return {
              exec: () => {
                return Promise.resolve<CTypeDB[]>([DBCTypeA, DBCTypeB])
              },
            }
          })
        await expect(ctypesService.findAll()).resolves.toEqual([
          testCTypeA,
          testCTypeB,
        ])
        expect(findSpy).toHaveBeenCalledWith()
        findSpy.mockImplementation(() => {
          return {
            exec: () => {
              return Promise.resolve<CTypeDB[]>([])
            },
          }
        })
        await expect(ctypesService.findAll()).resolves.toEqual([])
        findSpy.mockRestore()
      })
    })
    describe('register', () => {
      it('creates and saves CTypeDB for unregistered hash', async () => {
        const SDKtestCTypeA = { ...SDKCTypeA, owner: aliceAddress }
        const testCTypeA: CType = { cType: SDKtestCTypeA, metaData: metaDataA }
        const DBCTypeA: CTypeDB = {
          metaData: JSON.stringify(metaDataA),
          cType: JSON.stringify(SDKtestCTypeA),
          hash: SDKtestCTypeA.hash,
        } as CTypeDB
        const saveSpy = jest.spyOn(ctypesService['cTypeDBModel'], 'save')
        const findByHashSpy = jest
          .spyOn(ctypesService, 'findByHash')
          .mockImplementation(() =>
            Promise.resolve(Optional.ofNullable<CType>(null))
          )
        expect(await ctypesService.register(testCTypeA)).toEqual(true)
        expect(findByHashSpy).toHaveBeenCalledTimes(1)
        expect(findByHashSpy).toHaveBeenCalledWith(testCTypeA.cType.hash)
        expect(saveSpy).toHaveBeenCalledTimes(1)
        expect(saveSpy).toHaveBeenCalledWith(expect.objectContaining(DBCTypeA))
        findByHashSpy.mockRestore()
        saveSpy.mockRestore()
      })
      it('returns false for registered hash', async () => {
        const SDKtestCTypeA = { ...SDKCTypeA, owner: aliceAddress }
        const testCTypeA: CType = { cType: SDKtestCTypeA, metaData: metaDataA }
        const findByHashSpy = jest
          .spyOn(ctypesService, 'findByHash')
          .mockImplementation(() =>
            Promise.resolve(Optional.ofNullable<CType>(testCTypeA))
          )
        const saveSpy = jest.spyOn(ctypesService['cTypeDBModel'], 'save')
        expect(await ctypesService.register(testCTypeA)).toBeFalsy()
        expect(saveSpy).toHaveBeenCalledTimes(0)
        expect(findByHashSpy).toHaveBeenCalledWith(testCTypeA.cType.hash)
        findByHashSpy.mockRestore()
        saveSpy.mockRestore()
      })
    })
  })
})
