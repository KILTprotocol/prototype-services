import { Test } from '@nestjs/testing'
import { AuthGuard } from '../auth/auth.guard'
import { BadRequestException } from '@nestjs/common/exceptions'
import { getModelToken } from '@nestjs/mongoose'
import { MessagingController } from './messaging.controller'
import { MessagingService, MessageDB } from './interfaces/messaging.interfaces'
import { IEncryptedMessage } from '@kiltprotocol/sdk-js'
import * as Controller from './messaging.controller'
import { MongoDbMessagingService } from './mongodb-messaging.service'

describe('Messaging Module', () => {
  const encryptedMessage: IEncryptedMessage = {
    message: '0xa2b61c9a28d3...ced170dc8190a3a1516',
    nonce: '0x7a4a64377cd833416cadc1277a7c914598246e94df541e08',
    createdAt: 1598438707517,
    hash: '0xa46441cfbeb4ebd517c810fe78718eb43e891e1603e1db5665f751a1ef632991',
    signature:
      '0x00f0a10b39879d6bc9ee7fe54260e6becc4becd4d5e2ca2cfdaf5c8b079fdda852368e56dc776020086f481694374cfcef3b5b9469d1916714db81541b77f7f10d',
    receiverAddress: '5D5D5fSDUFVvn6RroC85zgaKL93oFv7R332RGwdCdBvAQzUn',
    senderAddress: '5CKq9ovoHUFb5Qg2q7YmQ2waNhgQm4C22qwb1Wgehnn2eBcb',
    senderBoxPublicKey:
      '0x5640c86ce5a99b1caf37882197b17572fa8ac33db8387861ef24dd2b497edd43',
    messageId: 'e545724a-00ad-495c-b314-c66750ae14e4',
    receivedAt: 1598438707577,
  }

  describe('Controller', () => {
    let messagesController: MessagingController
    let messagesService: MessagingService

    const fakeMessagingService: MessagingService = {
      add: jest.fn(
        async (): Promise<void> => {
          return
        }
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
    describe('removeMessage', () => {
      it('removes a message for an id from the service', async () => {
        const removeSpy = jest.spyOn(messagesService, 'remove')
        messagesController.removeMessage(encryptedMessage.messageId)
        expect(removeSpy).toHaveBeenCalledTimes(1)
        expect(removeSpy).toHaveBeenCalledWith(encryptedMessage.messageId)
        removeSpy.mockRestore()
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
          .mockReturnValue(encryptedMessage.messageId)

        const nowSpy = jest
          .spyOn(Date, 'now')
          .mockReturnValue(encryptedMessage.receivedAt)
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
      const noSender: IEncryptedMessage = {
        ...encryptedMessage,
        senderAddress: null,
      }
      const noReceiver: IEncryptedMessage = {
        ...encryptedMessage,
        receiverAddress: null,
      }
      const noNonce: IEncryptedMessage = { ...encryptedMessage, nonce: null }
      const noMessage: IEncryptedMessage = {
        ...encryptedMessage,
        message: null,
      }
      const noHash: IEncryptedMessage = { ...encryptedMessage, hash: null }
      const noSignature: IEncryptedMessage = {
        ...encryptedMessage,
        signature: null,
      }

      await expect(messagesController.sendMessage(noSender)).rejects.toThrow(
        BadRequestException
      )
      await expect(messagesController.sendMessage(noReceiver)).rejects.toThrow(
        BadRequestException
      )
      await expect(messagesController.sendMessage(noNonce)).rejects.toThrow(
        BadRequestException
      )
      await expect(messagesController.sendMessage(noMessage)).rejects.toThrow(
        BadRequestException
      )
      await expect(messagesController.sendMessage(noHash)).rejects.toThrow(
        BadRequestException
      )
      await expect(messagesController.sendMessage(noSignature)).rejects.toThrow(
        BadRequestException
      )
    })
  })

  class MessageModel {
    public static find = jest
      .fn()
      .mockReturnValue({ exec: async (): Promise<MessageDB[]> => [] })
    public static deleteOne = jest.fn().mockReturnValue({
      exec: async (): Promise<void> => {
        return
      },
    })
    public static deleteMany = jest.fn().mockReturnValue({
      exec: (): Promise<void> => {
        return
      },
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

    describe('add', () => {
      it('creates and saves new MessageDB object', async () => {
        const saveSpy = jest.spyOn(messagingService['messageModel'], 'save')
        expect(saveSpy).not.toHaveBeenCalled()

        await messagingService.add(encryptedMessage)
        expect(saveSpy).toHaveBeenCalledTimes(1)
        saveSpy.mockRestore()
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
        await messagingService.remove(encryptedMessage.messageId)
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
