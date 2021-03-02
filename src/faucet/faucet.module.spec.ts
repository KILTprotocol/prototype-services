import {
  FaucetService,
  FaucetDropDB,
  FaucetDrop,
} from './interfaces/faucet.interfaces'
import { Identity } from '@kiltprotocol/core'
import { ISubmittableResult, SubmittableExtrinsic } from '@kiltprotocol/types'
import { Test } from '@nestjs/testing'
import { FaucetController } from './faucet.controller'
import {
  FaucetDropThrottledException,
  FaucetDropFailedTransferException,
  FaucetDropInvalidAddressException,
} from './exceptions'
import BN from 'bn.js'
import { hexToU8a } from '@polkadot/util'
import { Request } from 'express'
import { BadRequestException } from '@nestjs/common'
import { MongoDbFaucetService } from './mongodb-faucet.service'
import { getModelToken } from '@nestjs/mongoose'
import { AuthGuard } from '../auth/auth.guard'

jest.mock('@kiltprotocol/core/lib/balance/Balance.chain', () => {
  return {
    makeTransfer: jest.fn(
      async (): Promise<SubmittableExtrinsic> => {
        return {} as SubmittableExtrinsic
      }
    ),
  }
})

jest.mock(
  '@kiltprotocol/chain-helpers/lib/blockchain/Blockchain.utils',
  () => {
    return {
      __esModule: true,
      submitSignedTx: jest.fn().mockImplementation(
        async (): Promise<ISubmittableResult> => {
          return { isInBlock: true } as ISubmittableResult
        }
      ),
    }
  }
)

describe('Faucet Module', () => {
  const claimerAddress = '5Ded9KnRSDY9zc3QafT7dyueTqgZdqYK43cc5TcSwqACM1dL'
  const invalidAddress = claimerAddress.replace('5', '7')
  const testFaucetDrop: FaucetDrop = {
    amount: 500,
    address: claimerAddress,
    requestip: '::ffff:127.0.0.1',
    dropped: true,
    error: 0,
    created: 1598628768759,
  }
  const FAUCET_SEED =
    '0xcdfd6024d2b0eba27d54cc92a44cd9a627c69b2dbda15ed7e58085425119ae03'
  let faucetIdentity: Identity
  const faucetRequest = {
    ip: testFaucetDrop.requestip,
  } as Request
  const KILT_FEMTO_COIN = '1000000000000000'
  const DEFAULT_TOKEN_AMOUNT = 500

  describe('Controller', () => {
    let faucetController: FaucetController
    let faucetService: FaucetService

    const mockedMakeTransfer = require('@kiltprotocol/core/lib/balance/Balance.chain')
      .makeTransfer

    const mockedsubmitSignedTx = require('@kiltprotocol/chain-helpers/lib/blockchain/Blockchain.utils')
      .submitSignedTx

    const fakeFaucetService: FaucetService = {
      drop: jest.fn(async (): Promise<FaucetDrop> => testFaucetDrop),
      updateOnTransactionFailure: jest.fn(
        async (): Promise<void> => {
          return
        }
      ),
      reset: jest.fn(
        async (): Promise<void> => {
          return
        }
      ),
    }
    beforeAll(() => {
      faucetIdentity = Identity.buildFromSeed(hexToU8a(FAUCET_SEED))
      process.env['FAUCET_ACCOUNT'] = FAUCET_SEED
    })
    beforeEach(async () => {
      const moduleRef = await Test.createTestingModule({
        controllers: [FaucetController],
        providers: [
          {
            provide: 'FaucetService',
            useValue: fakeFaucetService,
          },
        ],
      })
        .overrideGuard(AuthGuard)
        .useValue({ canActivate: () => true })
        .compile()

      faucetController = moduleRef.get(FaucetController)
      faucetService = moduleRef.get('FaucetService')
    })
    afterEach(() => jest.clearAllMocks())
    describe('drop', () => {
      it('checks address and eligibility then tries to transfer tokens', async () => {
        const dropSpy = jest.spyOn(fakeFaucetService, 'drop')
        const buildSpy = jest
          .spyOn(Identity, 'buildFromSeed')
          .mockResolvedValue(faucetIdentity)
        expect(
          await faucetController.drop(claimerAddress, faucetRequest)
        ).toEqual(undefined)
        expect(dropSpy).toHaveBeenCalledWith(
          claimerAddress,
          testFaucetDrop.requestip,
          DEFAULT_TOKEN_AMOUNT
        )
        expect(mockedMakeTransfer).toHaveBeenCalledWith(
          faucetIdentity,
          claimerAddress,
          new BN(DEFAULT_TOKEN_AMOUNT),
          0
        )
      })
      it('updates the database on unsuccessful transfer and throws exception', async () => {
        const buildSpy = jest
          .spyOn(Identity, 'buildFromSeed')
          .mockResolvedValue(faucetIdentity)
        mockedsubmitSignedTx.mockResolvedValue({
          isInBlock: false,
        } as ISubmittableResult)
        const updateSpy = jest.spyOn(
          fakeFaucetService,
          'updateOnTransactionFailure'
        )
        const dropSpy = jest.spyOn(fakeFaucetService, 'drop')
        await expect(
          faucetController.drop(claimerAddress, faucetRequest)
        ).rejects.toThrow(new FaucetDropFailedTransferException())
        expect(dropSpy).toHaveBeenCalledWith(
          claimerAddress,
          testFaucetDrop.requestip,
          DEFAULT_TOKEN_AMOUNT
        )
        expect(mockedMakeTransfer).toHaveBeenCalledWith(
          faucetIdentity,
          claimerAddress,
          new BN(DEFAULT_TOKEN_AMOUNT),
          0
        )
        expect(updateSpy).toHaveBeenCalledWith(testFaucetDrop)
      })
      it('throws Exception on empty address', async () => {
        const dropSpy = jest.spyOn(fakeFaucetService, 'drop')
        await expect(
          faucetController.drop('', {
            ip: '::ffff:127.0.0.1',
          } as Request)
        ).rejects.toThrow(BadRequestException)
        expect(dropSpy).not.toHaveBeenCalled()
        expect(mockedMakeTransfer).not.toHaveBeenCalled()
      })
      it('throws Exception on invalid address', async () => {
        const dropSpy = jest.spyOn(fakeFaucetService, 'drop')
        await expect(
          faucetController.drop(invalidAddress, faucetRequest)
        ).rejects.toThrow(new FaucetDropInvalidAddressException())
        expect(dropSpy).not.toHaveBeenCalled()
        expect(mockedMakeTransfer).not.toHaveBeenCalled()
      })
      it('throws Exception on ineligibility', async () => {
        const falseTestFaucetDrop: FaucetDrop = {
          ...testFaucetDrop,
          dropped: false,
        }
        const dropSpy = jest
          .spyOn(fakeFaucetService, 'drop')
          .mockResolvedValue(falseTestFaucetDrop)

        await expect(
          faucetController.drop(claimerAddress, faucetRequest)
        ).rejects.toThrow(new FaucetDropThrottledException())
        expect(dropSpy).toHaveBeenCalledWith(
          claimerAddress,
          testFaucetDrop.requestip,
          DEFAULT_TOKEN_AMOUNT
        )
      })
    })
    describe('transferTokens', () => {
      it('builds faucet Id and tries to transfer default amount to the given address', async () => {
        const buildSpy = jest
          .spyOn(Identity, 'buildFromSeed')
          .mockResolvedValue(faucetIdentity)
        mockedsubmitSignedTx.mockResolvedValue({
          isInBlock: true,
        } as ISubmittableResult)
        expect(
          await faucetController['transferTokens'](claimerAddress)
        ).toEqual(true)
        expect(buildSpy).toHaveBeenCalledWith(
          hexToU8a(process.env.FAUCET_ACCOUNT)
        )
        expect(mockedMakeTransfer).toHaveBeenCalledWith(
          faucetIdentity,
          claimerAddress,
          new BN(DEFAULT_TOKEN_AMOUNT),
          0
        )
      })
      it(`returns false on thrown error or if the transfer failed`, async () => {
        const buildSpy = jest
          .spyOn(Identity, 'buildFromSeed')
          .mockImplementation(() => {
            throw new Error('buildFromSeed failed')
          })

        expect(
          await faucetController['transferTokens'](claimerAddress)
        ).toEqual(false)
        expect(buildSpy).toHaveBeenCalledWith(
          hexToU8a(process.env.FAUCET_ACCOUNT)
        )
        expect(mockedMakeTransfer).not.toHaveBeenCalled()
        buildSpy.mockResolvedValue(faucetIdentity)
        mockedMakeTransfer.mockImplementation(() => {
          throw new Error('makeTransfer failed')
        })
        expect(
          await faucetController['transferTokens'](claimerAddress)
        ).toEqual(false)
        expect(buildSpy).toHaveBeenCalledWith(
          hexToU8a(process.env.FAUCET_ACCOUNT)
        )
        expect(mockedMakeTransfer).toHaveBeenCalledWith(
          faucetIdentity,
          claimerAddress,
          new BN(DEFAULT_TOKEN_AMOUNT),
          0
        )
        mockedsubmitSignedTx.mockResolvedValue({
          isInBlock: false,
        } as ISubmittableResult)
        expect(
          await faucetController['transferTokens'](claimerAddress)
        ).toEqual(false)
        expect(buildSpy).toHaveBeenCalledWith(
          hexToU8a(process.env.FAUCET_ACCOUNT)
        )
        expect(mockedMakeTransfer).toHaveBeenCalledWith(
          faucetIdentity,
          claimerAddress,
          new BN(DEFAULT_TOKEN_AMOUNT),
          0
        )
      })
    })
  })
  class FaucetDropModel {
    public static countDocuments = jest
      .fn()
      .mockReturnValue({ exec: async () => 0 })
    public static save = jest
      .fn()
      .mockImplementation(async (object): Promise<FaucetDropDB> => object)
    public save = jest.fn().mockReturnValue(FaucetDropModel.save(this))

    constructor(data: FaucetDrop) {
      return Object.assign(this, data as FaucetDropDB)
    }
  }

  describe('Service', () => {
    let faucetService: FaucetService
    let model: FaucetDropModel
    beforeEach(async () => {
      const faucetServiceProvider = {
        provide: 'FaucetService',
        useClass: MongoDbFaucetService,
      }

      const moduleRef = await Test.createTestingModule({
        providers: [
          faucetServiceProvider,
          { provide: getModelToken('FaucetDrop'), useValue: FaucetDropModel },
        ],
      }).compile()

      faucetService = moduleRef.get('FaucetService')
      model = moduleRef.get(getModelToken('FaucetDrop'))
    })
    afterEach(() => jest.clearAllMocks())
    describe('updateOnTransactionFailure', () => {
      it('creates and saves faucetDrop with error identification', async () => {
        const saveSpy = jest.spyOn(model, 'save')
        expect(
          await faucetService.updateOnTransactionFailure({ ...testFaucetDrop })
        ).toEqual(undefined)
        expect(saveSpy).toHaveBeenCalledWith(
          new FaucetDropModel({
            ...testFaucetDrop,
            error: 4,
            dropped: false,
          })
        )
      })
    })
    describe('drop', () => {
      it('checks eligibility of drop for address and ip and per day', async () => {
        const saveSpy = jest.spyOn(model, 'save')
        const nowSpy = jest
          .spyOn(Date, 'now')
          .mockReturnValue(testFaucetDrop.created)
        const countSpy = jest
          .spyOn(faucetService['faucetDropDBModel'], 'countDocuments')
          .mockImplementation((query: any) => {
            if (query.requestip) {
              return {
                exec: async () => 99,
              }
            } else if (query.created) {
              return { exec: async () => 9999 }
            } else if (query.address) {
              return { exec: async () => 0 }
            }
          })
        const { address, requestip, amount, dropped, error, created } = {
          ...(await faucetService.drop(
            testFaucetDrop.address,
            testFaucetDrop.requestip,
            DEFAULT_TOKEN_AMOUNT
          )),
        }
        const dropResult: FaucetDrop = {
          address,
          requestip,
          amount,
          dropped,
          error,
          created,
        }
        expect(saveSpy).toHaveBeenCalledWith(new FaucetDropModel(dropResult))
        expect(dropResult).toEqual({ ...testFaucetDrop })
      })
      it('assigns error code and falsifies dropped on ineligibility', async () => {
        const saveSpy = jest.spyOn(model, 'save')
        const nowSpy = jest
          .spyOn(Date, 'now')
          .mockReturnValue(testFaucetDrop.created)
        const countSpy = jest
          .spyOn(faucetService['faucetDropDBModel'], 'countDocuments')
          .mockImplementation((query: any) => {
            if (query.address) {
              return { exec: async () => 1 }
            } else if (query.requestip) {
              return {
                exec: async () => 99,
              }
            } else if (query.created) {
              return { exec: async () => 9999 }
            }
          })
        let { address, requestip, amount, dropped, error, created } = {
          ...(await faucetService.drop(
            testFaucetDrop.address,
            testFaucetDrop.requestip,
            DEFAULT_TOKEN_AMOUNT
          )),
        }
        let dropResult: FaucetDrop = {
          address,
          requestip,
          amount,
          dropped,
          error,
          created,
        }
        expect(dropResult).toEqual({
          ...testFaucetDrop,
          error: 1,
          dropped: false,
        } as FaucetDrop)
        expect(saveSpy).toHaveBeenCalledWith(new FaucetDropModel(dropResult))

        countSpy.mockImplementation((query: any) => {
          if (query.address) {
            return { exec: async () => 0 }
          } else if (query.requestip) {
            return {
              exec: async () => 100,
            }
          } else if (query.created) {
            return { exec: async () => 9999 }
          }
        })
        ;({ address, requestip, amount, dropped, error, created } = {
          ...(await faucetService.drop(
            testFaucetDrop.address,
            testFaucetDrop.requestip,
            DEFAULT_TOKEN_AMOUNT
          )),
        })
        dropResult = {
          address,
          requestip,
          amount,
          dropped,
          error,
          created,
        }
        expect(dropResult).toEqual({
          ...testFaucetDrop,
          error: 3,
          dropped: false,
        } as FaucetDrop)
        expect(saveSpy).toHaveBeenCalledWith(new FaucetDropModel(dropResult))
        countSpy.mockImplementation((query: any) => {
          if (query.address) {
            return { exec: async () => 0 }
          } else if (query.requestip) {
            return {
              exec: async () => 99,
            }
          } else if (query.created) {
            return { exec: async () => 10000 }
          }
        })
        ;({ address, requestip, amount, dropped, error, created } = {
          ...(await faucetService.drop(
            testFaucetDrop.address,
            testFaucetDrop.requestip,
            DEFAULT_TOKEN_AMOUNT
          )),
        })
        dropResult = {
          address,
          requestip,
          amount,
          dropped,
          error,
          created,
        }
        expect(dropResult).toEqual({
          ...testFaucetDrop,
          error: 2,
          dropped: false,
        } as FaucetDrop)
        expect(saveSpy).toHaveBeenCalledWith(new FaucetDropModel(dropResult))
      })
    })
  })
})
