import { Test } from '@nestjs/testing'
import { AuthGuard } from '../auth/auth.guard'
import { BadRequestException } from '@nestjs/common/exceptions'
import { getModelToken } from '@nestjs/mongoose'
import { MessagingController } from './messaging.controller'
import { MessagingService, MessageDB } from './interfaces/messaging.interfaces'
import { Identity } from '@kiltprotocol/core'
import { IEncryptedMessage } from '@kiltprotocol/types'
import * as Controller from './messaging.controller'
import { MongoDbMessagingService } from './mongodb-messaging.service'
import { Optional } from 'typescript-optional'
import { ForbiddenMessageAccessException } from './exceptions/message-forbidden.exception'
import { MessageNotFoundException } from './exceptions/message-not-found.exception'
import { cryptoWaitReady } from '@polkadot/util-crypto'

describe('Messaging Module', () => {
  const encryptedMessage: IEncryptedMessage = {
    ciphertext: '0xa2b61c9a28d3...ced170dc8190a3a1516',
    nonce: '0x7a4a64377cd833416cadc1277a7c914598246e94df541e08',
    createdAt: 1598438707517,
    hash: '0xa46441cfbeb4ebd517c810fe78718eb43e891e1603e1db5665f751a1ef632991',
    signature:
      '0x00f0a10b39879d6bc9ee7fe54260e6becc4becd4d5e2ca2cfdaf5c8b079fdda852368e56dc776020086f481694374cfcef3b5b9469d1916714db81541b77f7f10d',
    receiverAddress: '5HYCKhYheTbkB5tPwKWXvs9qimDV4g6TrRuYyXBdFqED2w9J',
    senderAddress: '5CKq9ovoHUFb5Qg2q7YmQ2waNhgQm4C22qwb1Wgehnn2eBcb',
    senderBoxPublicKey:
      '0x5640c86ce5a99b1caf37882197b17572fa8ac33db8387861ef24dd2b497edd43',
    messageId: 'e545724a-00ad-495c-b314-c66750ae14e4',
    receivedAt: 1598438707577,
  }
  describe('Controller', () => {
    let messagesController: MessagingController
    let messagesService: MessagingService
    let receiverIdentity: Identity
    let receiverSignature: string

    const fakeMessagingService: MessagingService = {
      add: jest.fn(
        async (): Promise<void> => {
          return
        }
      ),
      findById: jest.fn(async () =>
        Optional.ofNullable<IEncryptedMessage>(null)
      ),
      findBySenderAddress: jest.fn(
        async (): Promise<IEncryptedMessage[]> => []
      ),
      findByReceiverAddress: jest.fn(
        async (): Promise<IEncryptedMessage[]> => []
      ),
      remove: jest.fn(
        async (): Promise<void> => {
          return
        }
      ),
      removeAll: jest.fn(
        async (): Promise<void> => {
          return
        }
      ),
    }

    beforeEach(async () => {
      const moduleRef = await Test.createTestingModule({
        controllers: [MessagingController],
        providers: [
          {
            provide: 'MessagingService',
            useValue: fakeMessagingService,
          },
        ],
      })
        .overrideGuard(AuthGuard)
        .useValue({ canActivate: () => true })
        .compile()
      messagesController = moduleRef.get(MessagingController)
      messagesService = moduleRef.get('MessagingService')
    })
    afterEach(() => jest.clearAllMocks())
    beforeAll(async () => {
      await cryptoWaitReady()
      receiverIdentity = Identity.buildFromMnemonic(
        'layer donor village public cruel caution learn bronze fish come embrace hurt',
        { signingKeyPairType: 'ed25519' }
      )
      receiverSignature = receiverIdentity.signStr(encryptedMessage.messageId!)
    })
    describe('removeMessage', () => {
      it('removes a message for an id from the service', async () => {
        const removeSpy = jest.spyOn(messagesService, 'remove')
        const findByIdSpy = jest
          .spyOn(messagesService, 'findById')
          .mockResolvedValue(Optional.ofNullable(encryptedMessage))
        await messagesController.removeMessage(
          encryptedMessage.messageId,
          receiverSignature
        )
        expect(findByIdSpy).toHaveBeenCalledTimes(1)
        expect(findByIdSpy).toHaveBeenCalledWith(encryptedMessage.messageId)
        expect(removeSpy).toHaveBeenCalledTimes(1)
        expect(removeSpy).toHaveBeenCalledWith(encryptedMessage.messageId)
      })
      it('rejects removal request when requirements are not met', async () => {
        const removeSpy = jest.spyOn(messagesService, 'remove')
        const findByIdSpy = jest
          .spyOn(messagesService, 'findById')
          .mockResolvedValue(Optional.ofNullable(encryptedMessage))
        await expect(
          messagesController.removeMessage(
            encryptedMessage.messageId,
            receiverSignature.replace('d', 'a')
          )
        ).rejects.toThrow(ForbiddenMessageAccessException)
        expect(findByIdSpy).toHaveBeenCalledTimes(1)
        expect(findByIdSpy).toHaveBeenCalledWith(encryptedMessage.messageId)

        expect(removeSpy).not.toHaveBeenCalled()
        removeSpy.mockClear()
        findByIdSpy.mockClear()
        await expect(
          messagesController.removeMessage(encryptedMessage.messageId, '')
        ).rejects.toThrow(BadRequestException)
        expect(findByIdSpy).toHaveBeenCalledTimes(1)
        expect(findByIdSpy).toHaveBeenCalledWith(encryptedMessage.messageId)

        expect(removeSpy).not.toHaveBeenCalled()
        removeSpy.mockClear()
        findByIdSpy.mockClear()
        findByIdSpy.mockResolvedValue(
          Optional.ofNullable<IEncryptedMessage>(null)
        )
        await expect(
          messagesController.removeMessage(
            encryptedMessage.messageId,
            receiverSignature
          )
        ).rejects.toThrow(MessageNotFoundException)
        expect(findByIdSpy).toHaveBeenCalledTimes(1)
        expect(findByIdSpy).toHaveBeenCalledWith(encryptedMessage.messageId)

        expect(removeSpy).not.toHaveBeenCalled()
        removeSpy.mockClear()
        findByIdSpy.mockClear()
      })
    })
    describe('removeAll', () => {
      it('calls messagingService.removeAll()', async () => {
        messagesController.removeAll()
        expect(messagesService.removeAll).toHaveBeenCalledTimes(1)
      })
    })
    describe('listSent', () => {
      it('returns list of all messages with the supplied sender Address', async () => {
        const findBySenderSpy = jest
          .spyOn(messagesService, 'findBySenderAddress')
          .mockResolvedValue([encryptedMessage])
        await expect(
          messagesController.listSent(encryptedMessage.senderAddress)
        ).resolves.toEqual([encryptedMessage])
        expect(findBySenderSpy).toHaveBeenCalledTimes(1)
        expect(findBySenderSpy).toHaveBeenCalledWith(
          encryptedMessage.senderAddress
        )
        findBySenderSpy.mockRestore()
      })
    })
    describe('listInbox', () => {
      it('returns list of all messages with the supplied receiver Address', async () => {
        const findByReceiverSpy = jest
          .spyOn(messagesService, 'findByReceiverAddress')
          .mockResolvedValue([encryptedMessage])
        expect(
          await messagesController.listInbox(encryptedMessage.receiverAddress)
        ).toEqual([encryptedMessage])
        expect(findByReceiverSpy).toHaveBeenCalledTimes(1)
        expect(findByReceiverSpy).toHaveBeenCalledWith(
          encryptedMessage.receiverAddress
        )
        findByReceiverSpy.mockRestore()
      })
    })
    describe('sendMessage', () => {
      it('sets messageId, receival Date and calls messagingService.add for valid message', async () => {
        const uuidv4Spy = jest
          .spyOn(Controller, 'uuidv4')
          .mockReturnValue(encryptedMessage.messageId!)

        const nowSpy = jest
          .spyOn(Date, 'now')
          .mockReturnValue(encryptedMessage.receivedAt!)
        const addSpy = jest
          .spyOn(messagesService, 'add')
          .mockResolvedValue(undefined)
        const sendCreatedMessage = await messagesController.sendMessage(
          encryptedMessage
        )
        expect(sendCreatedMessage).toEqual(encryptedMessage)
        expect(sendCreatedMessage.messageId).toBeTruthy()
        expect(sendCreatedMessage.receivedAt).toBeTruthy()
        expect(nowSpy).toHaveBeenCalled()
        expect(uuidv4Spy).toHaveBeenCalled()
        expect(addSpy).toHaveBeenCalledTimes(1)
        expect(addSpy).toHaveBeenCalledWith(encryptedMessage)
        uuidv4Spy.mockRestore()
        addSpy.mockRestore()
        nowSpy.mockRestore()
      })
    })
    it('throws BadRequestException on invalid message', async () => {
      const { senderAddress, ...noSender } = encryptedMessage
      const { receiverAddress, ...noReceiver } = encryptedMessage
      const { nonce, ...noNonce } = encryptedMessage
      const { ciphertext, ...noMessage } = encryptedMessage
      const { hash, ...noHash } = encryptedMessage
      const { signature, ...noSignature } = encryptedMessage

      await expect(
        messagesController.sendMessage(noSender as IEncryptedMessage)
      ).rejects.toThrow(BadRequestException)
      await expect(
        messagesController.sendMessage(noReceiver as IEncryptedMessage)
      ).rejects.toThrow(BadRequestException)
      await expect(
        messagesController.sendMessage(noNonce as IEncryptedMessage)
      ).rejects.toThrow(BadRequestException)
      await expect(
        messagesController.sendMessage(noMessage as IEncryptedMessage)
      ).rejects.toThrow(BadRequestException)
      await expect(
        messagesController.sendMessage(noHash as IEncryptedMessage)
      ).rejects.toThrow(BadRequestException)
      await expect(
        messagesController.sendMessage(noSignature as IEncryptedMessage)
      ).rejects.toThrow(BadRequestException)
    })
  })

  class MessageModel {
    public static findOne = jest.fn().mockReturnValue({
      exec: async () => {
        return null
      },
    })
    public static find = jest
      .fn()
      .mockReturnValue({ exec: async (): Promise<MessageDB[]> => [] })
    public static deleteOne = jest.fn().mockReturnValue({
      exec: async (): Promise<void> => {
        return
      },
    })
    public static deleteMany = jest.fn().mockReturnValue({
      exec: async (): Promise<void> => undefined,
    })
    public static save = jest
      .fn()
      .mockImplementation((object): Promise<MessageDB> => object)
    public save = jest.fn().mockReturnValue(MessageModel.save(this))

    constructor(data: IEncryptedMessage) {
      return Object.assign(this, data as MessageDB)
    }
  }
  describe('Messaging Service', () => {
    let messagingService: MessagingService

    beforeEach(async () => {
      const messageServiceProvider = {
        provide: 'MessagingService',
        useClass: MongoDbMessagingService,
      }

      const moduleRef = await Test.createTestingModule({
        providers: [
          messageServiceProvider,
          { provide: getModelToken('Message'), useValue: MessageModel },
        ],
      }).compile()

      messagingService = moduleRef.get('MessagingService')
    })
    afterEach(() => jest.clearAllMocks())

    describe('add', () => {
      it('creates and saves new MessageDB object', async () => {
        const saveSpy = jest.spyOn(messagingService['messageModel'], 'save')
        expect(saveSpy).not.toHaveBeenCalled()

        await messagingService.add(encryptedMessage)
        expect(saveSpy).toHaveBeenCalledTimes(1)
        saveSpy.mockRestore()
      })
    })
    describe('findById', () => {
      it('returns Optional for Id and converts to EncryptedMessage', async () => {
        const findOneSpy = jest
          .spyOn(messagingService['messageModel'], 'findOne')
          .mockReturnValue({
            exec: async (): Promise<MessageDB> => {
              return encryptedMessage as MessageDB
            },
          })
        expect(
          await messagingService.findById(encryptedMessage.messageId)
        ).toEqual(Optional.ofNullable(encryptedMessage))
        expect(findOneSpy).toHaveBeenCalledTimes(1)
        expect(findOneSpy).toHaveBeenLastCalledWith({
          messageId: encryptedMessage.messageId,
        })
      })
      it('returns nulled Optional for Id and converts to EncryptedMessage', async () => {
        const findOneSpy = jest
          .spyOn(messagingService['messageModel'], 'findOne')
          .mockReturnValue({
            exec: async () => {
              return null
            },
          })
        expect(
          await messagingService.findById(encryptedMessage.messageId)
        ).toEqual(Optional.ofNullable<IEncryptedMessage>(null))
        expect(findOneSpy).toHaveBeenCalledTimes(1)
        expect(findOneSpy).toHaveBeenLastCalledWith({
          messageId: encryptedMessage.messageId,
        })
      })
    })
    describe('findBySenderAddress', () => {
      it('queries database and converts matches', async () => {
        const reverseMessage = {
          ...encryptedMessage,
          receiverAddress: encryptedMessage.senderAddress,
          senderAddress: encryptedMessage.receiverAddress,
        } as MessageDB
        const differingMail = {
          ...encryptedMessage,
          nonce: '1',
          hash: '0x1',
        } as MessageDB
        const findSpy = jest
          .spyOn(messagingService['messageModel'], 'find')
          .mockReturnValue({
            exec: async (): Promise<MessageDB[]> => {
              return [encryptedMessage as MessageDB, differingMail]
            },
          })
        expect(
          await messagingService.findBySenderAddress(
            encryptedMessage.senderAddress
          )
        ).toEqual([encryptedMessage, differingMail as IEncryptedMessage])
        expect(findSpy).toHaveBeenCalledWith({
          senderAddress: encryptedMessage.senderAddress,
        })
        findSpy.mockReturnValue({
          exec: async (): Promise<MessageDB[]> => {
            return [reverseMessage]
          },
        })
        expect(
          await messagingService.findBySenderAddress(
            encryptedMessage.receiverAddress
          )
        ).toEqual([reverseMessage as IEncryptedMessage])
        expect(findSpy).toHaveBeenCalledWith({
          senderAddress: encryptedMessage.receiverAddress,
        })
        expect(findSpy).toHaveBeenCalledTimes(2)
        findSpy.mockRestore()
      })
    })
    describe('findByReceiverAddress', () => {
      it('queries database and converts matches', async () => {
        const reverseMessage = {
          ...encryptedMessage,
          receiverAddress: encryptedMessage.senderAddress,
          senderAddress: encryptedMessage.receiverAddress,
        } as MessageDB
        const differingMail = {
          ...reverseMessage,
          nonce: '1',
          hash: '0x1',
        } as MessageDB
        const findSpy = jest
          .spyOn(messagingService['messageModel'], 'find')
          .mockReturnValue({
            exec: async (): Promise<MessageDB[]> => {
              return [reverseMessage]
            },
          })
        expect(
          await messagingService.findByReceiverAddress(
            reverseMessage.receiverAddress
          )
        ).toEqual([reverseMessage as IEncryptedMessage])
        expect(findSpy).toHaveBeenCalledWith({
          receiverAddress: reverseMessage.receiverAddress,
        })
        findSpy.mockReturnValue({
          exec: async (): Promise<MessageDB[]> => {
            return [differingMail, encryptedMessage as MessageDB]
          },
        })
        expect(
          await messagingService.findByReceiverAddress(
            encryptedMessage.receiverAddress
          )
        ).toEqual([differingMail as IEncryptedMessage, encryptedMessage])
        expect(findSpy).toHaveBeenCalledWith({
          receiverAddress: encryptedMessage.receiverAddress,
        })
        expect(findSpy).toHaveBeenCalledTimes(2)
        findSpy.mockRestore()
      })
    })
    describe('remove', () => {
      it('calls deleteOne with messageId', async () => {
        const deleteOneSpy = jest
          .spyOn(messagingService['messageModel'], 'deleteOne')
          .mockReturnValue({
            exec: async (): Promise<void> => {
              return
            },
          })
        await messagingService.remove(encryptedMessage.messageId!)
        expect(deleteOneSpy).toHaveBeenCalledTimes(1)
        expect(deleteOneSpy).toHaveBeenCalledWith({
          messageId: encryptedMessage.messageId,
        })
        deleteOneSpy.mockRestore()
      })
    })
    describe('removeAll', () => {
      it('calls deleteMany with inclusive parameter', async () => {
        const deleteManySpy = jest
          .spyOn(messagingService['messageModel'], 'deleteMany')
          .mockReturnValue({
            exec: async (): Promise<void> => {
              return
            },
          })
        await messagingService.removeAll()
        expect(deleteManySpy).toHaveBeenCalledTimes(1)
        expect(deleteManySpy).toHaveBeenCalledWith({})
        deleteManySpy.mockRestore()
      })
    })
  })
})
