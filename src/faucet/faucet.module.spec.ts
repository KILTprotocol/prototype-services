import {
  FaucetService,
  FaucetDropDB,
  FaucetDrop,
} from './interfaces/faucet.interfaces'
import { Identity, SubmittableResult } from '@kiltprotocol/sdk-js'
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

jest.mock('@kiltprotocol/sdk-js/build/balance/Balance.chain', () => {
  return {
    makeTransfer: jest.fn(() =>
      Promise.resolve<SubmittableResult>({
        isFinalized: true,
      } as SubmittableResult)
    ),
  }
})

describe('Faucet Module', () => {
  const address = '5Ded9KnRSDY9zc3QafT7dyueTqgZdqYK43cc5TcSwqACM1dL'
  const invalidAddress = address.replace('5', '7')
  const testFaucetDrop: FaucetDrop = {
    amount: 500,
    publickey: address,
    requestip: '::ffff:127.0.0.1',
    dropped: true,
    error: 0,
    created: 1598628768759,
  }
  const FAUCET_SEED =
    '0xcdfd6024d2b0eba27d54cc92a44cd9a627c69b2dbda15ed7e58085425119ae03'
  let faucetIdentity: Identity
  const faucetRequest = {
    ip: '::ffff:127.0.0.1',
  } as Request
  const KILT_FEMTO_COIN = '1000000000000000'
  const DEFAULT_TOKEN_AMOUNT = 500

  describe('Controller', async () => {
    let faucetController: FaucetController
    let faucetService: FaucetService

    const mockedMakeTransfer = require('@kiltprotocol/sdk-js/build/balance/Balance.chain')
      .makeTransfer

    const fakeFaucetService: FaucetService = {
      drop: jest.fn(
        async (): Promise<FaucetDrop> => Promise.resolve(testFaucetDrop)
      ),
      updateOnTransactionFailure: jest.fn(
        async (): Promise<void> => Promise.resolve(undefined)
      ),
    }
    beforeAll(async () => {
      faucetIdentity = await Identity.buildFromSeed(hexToU8a(FAUCET_SEED))
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
      }).compile()

      faucetController = moduleRef.get(FaucetController)
      faucetService = moduleRef.get('FaucetService')
    })
    afterEach(() => jest.clearAllMocks())
    describe('drop', async () => {
      it('checks address and eligibility then tries to transfer tokens', async () => {
        const dropSpy = jest.spyOn(fakeFaucetService, 'drop')
        const buildSpy = jest
          .spyOn(Identity, 'buildFromSeed')
          .mockReturnValue(Promise.resolve(faucetIdentity))
        expect(await faucetController.drop(address, faucetRequest)).toEqual(
          undefined
        )
        expect(dropSpy).toHaveBeenCalledWith(
          address,
          testFaucetDrop.requestip,
          DEFAULT_TOKEN_AMOUNT
        )
        expect(mockedMakeTransfer).toHaveBeenCalledWith(
          faucetIdentity,
          address,
          new BN(KILT_FEMTO_COIN).muln(DEFAULT_TOKEN_AMOUNT)
        )
      })
      it('updates the database on unsuccessful transfer and throws exception', async () => {
        const buildSpy = jest
          .spyOn(Identity, 'buildFromSeed')
          .mockReturnValue(Promise.resolve(faucetIdentity))
        mockedMakeTransfer.mockReturnValue(
          Promise.resolve<SubmittableResult>({
            isFinalized: false,
          } as SubmittableResult)
        )
        const updateSpy = jest.spyOn(
          fakeFaucetService,
          'updateOnTransactionFailure'
        )
        const dropSpy = jest.spyOn(fakeFaucetService, 'drop')
        await expect(
          faucetController.drop(address, faucetRequest)
        ).rejects.toThrow(new FaucetDropFailedTransferException())
        expect(dropSpy).toHaveBeenCalledWith(
          address,
          testFaucetDrop.requestip,
          DEFAULT_TOKEN_AMOUNT
        )
        expect(mockedMakeTransfer).toHaveBeenCalledWith(
          faucetIdentity,
          address,
          new BN(KILT_FEMTO_COIN).muln(DEFAULT_TOKEN_AMOUNT)
        )
        expect(updateSpy).toHaveBeenCalledWith(testFaucetDrop)
      })
      it('throws Exception on empty pubKey', async () => {
        const dropSpy = jest.spyOn(fakeFaucetService, 'drop')
        await expect(
          faucetController.drop('', {
            ip: '::ffff:127.0.0.1',
          } as Request)
        ).rejects.toThrow(BadRequestException)
        expect(dropSpy).toHaveBeenCalledTimes(0)
        expect(mockedMakeTransfer).toHaveBeenCalledTimes(0)
      })
      it('throws Exception on invalid pubKey', async () => {
        const dropSpy = jest.spyOn(fakeFaucetService, 'drop')
        await expect(
          faucetController.drop(invalidAddress, faucetRequest)
        ).rejects.toThrow(new FaucetDropInvalidAddressException())
        expect(dropSpy).toHaveBeenCalledTimes(0)
        expect(mockedMakeTransfer).toHaveBeenCalledTimes(0)
      })
      it('throws Exception on ineligibility', async () => {
        const falseTestFaucetDrop: FaucetDrop = {
          ...testFaucetDrop,
          dropped: false,
        }
        const dropSpy = jest
          .spyOn(fakeFaucetService, 'drop')
          .mockReturnValue(Promise.resolve(falseTestFaucetDrop))

        await expect(
          faucetController.drop(address, faucetRequest)
        ).rejects.toThrow(new FaucetDropThrottledException())
        expect(dropSpy).toHaveBeenCalledWith(
          address,
          testFaucetDrop.requestip,
          DEFAULT_TOKEN_AMOUNT
        )
      })
    })
    describe('transferTokens', async () => {
      it('builds faucet Id and tries to transfer default amount to the given address', async () => {
        const buildSpy = jest
          .spyOn(Identity, 'buildFromSeed')
          .mockReturnValue(Promise.resolve(faucetIdentity))
        mockedMakeTransfer.mockImplementation(() =>
          Promise.resolve<SubmittableResult>({
            isFinalized: true,
          } as SubmittableResult)
        )
        expect(await faucetController['transferTokens'](address)).toEqual(true)
        expect(buildSpy).toHaveBeenCalledWith(
          hexToU8a(process.env.FAUCET_ACCOUNT)
        )
        expect(mockedMakeTransfer).toHaveBeenCalledWith(
          faucetIdentity,
          address,
          new BN(KILT_FEMTO_COIN).muln(DEFAULT_TOKEN_AMOUNT)
        )
      })
      it(`returns false on thrown error or if the transfer failed`, async () => {
        const buildSpy = jest
          .spyOn(Identity, 'buildFromSeed')
          .mockImplementation(() => {
            throw new Error('buildFromSeed failed')
          })

        expect(await faucetController['transferTokens'](address)).toEqual(false)
        expect(buildSpy).toHaveBeenCalledWith(
          hexToU8a(process.env.FAUCET_ACCOUNT)
        )
        expect(mockedMakeTransfer).toHaveBeenCalledTimes(0)
        buildSpy.mockImplementation(() => Promise.resolve(faucetIdentity))
        mockedMakeTransfer.mockImplementation(() => {
          throw new Error('makeTransfer failed')
        })
        expect(await faucetController['transferTokens'](address)).toEqual(false)
        expect(buildSpy).toHaveBeenCalledWith(
          hexToU8a(process.env.FAUCET_ACCOUNT)
        )
        expect(mockedMakeTransfer).toHaveBeenCalledWith(
          faucetIdentity,
          address,
          new BN(KILT_FEMTO_COIN).muln(DEFAULT_TOKEN_AMOUNT)
        )
        mockedMakeTransfer.mockImplementation(() => {
          return Promise.resolve<SubmittableResult>({
            isFinalized: false,
          } as SubmittableResult)
        })
        expect(await faucetController['transferTokens'](address)).toEqual(false)
        expect(buildSpy).toHaveBeenCalledWith(
          hexToU8a(process.env.FAUCET_ACCOUNT)
        )
        expect(mockedMakeTransfer).toHaveBeenCalledWith(
          faucetIdentity,
          address,
          new BN(KILT_FEMTO_COIN).muln(DEFAULT_TOKEN_AMOUNT)
        )
      })
    })
  })
  class FaucetDropModel {
    public static countDocuments = jest
      .fn()
      .mockReturnValue({ exec: () => Promise.resolve(0) })
    public static save = jest
      .fn()
      .mockImplementation(object => Promise.resolve(object))
    public save = jest.fn().mockReturnValue(FaucetDropModel.save(this))

    constructor(data: FaucetDrop) {
      return Object.assign(this, data as FaucetDropDB)
    }
  }

  describe('Service', async () => {
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
    describe('drop', async () => {
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
                exec: () => Promise.resolve(99),
              }
            } else if (query.created) {
              return { exec: () => Promise.resolve(9999) }
            } else if (query.publickey) {
              return { exec: () => Promise.resolve(0) }
            }
          })
        const { publickey, requestip, amount, dropped, error, created } = {
          ...(await faucetService.drop(
            testFaucetDrop.publickey,
            testFaucetDrop.requestip,
            DEFAULT_TOKEN_AMOUNT
          )),
        }
        const dropResult: FaucetDrop = {
          publickey,
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
            if (query.publickey) {
              return { exec: () => Promise.resolve(1) }
            } else if (query.requestip) {
              return {
                exec: () => Promise.resolve(99),
              }
            } else if (query.created) {
              return { exec: () => Promise.resolve(9999) }
            }
          })
        let { publickey, requestip, amount, dropped, error, created } = {
          ...(await faucetService.drop(
            testFaucetDrop.publickey,
            testFaucetDrop.requestip,
            DEFAULT_TOKEN_AMOUNT
          )),
        }
        let dropResult: FaucetDrop = {
          publickey,
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
          if (query.publickey) {
            return { exec: () => Promise.resolve(0) }
          } else if (query.requestip) {
            return {
              exec: () => Promise.resolve(100),
            }
          } else if (query.created) {
            return { exec: () => Promise.resolve(9999) }
          }
        })
        ;({ publickey, requestip, amount, dropped, error, created } = {
          ...(await faucetService.drop(
            testFaucetDrop.publickey,
            testFaucetDrop.requestip,
            DEFAULT_TOKEN_AMOUNT
          )),
        })
        dropResult = {
          publickey,
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
          if (query.publickey) {
            return { exec: () => Promise.resolve(0) }
          } else if (query.requestip) {
            return {
              exec: () => Promise.resolve(99),
            }
          } else if (query.created) {
            return { exec: () => Promise.resolve(10000) }
          }
        })
        ;({ publickey, requestip, amount, dropped, error, created } = {
          ...(await faucetService.drop(
            testFaucetDrop.publickey,
            testFaucetDrop.requestip,
            DEFAULT_TOKEN_AMOUNT
          )),
        })
        dropResult = {
          publickey,
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
