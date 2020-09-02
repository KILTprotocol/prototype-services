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
    message:
      '0xa2b61c9a28d3d272d95f846e6837d1e0733ec035b4d186f69c75effbec68f2bf5d343dde6c31e05e514b4ff1a95791d7a9a691ff39aaaa214230e4a6984362a42c61e06ea99ee827edc93ca7871db0fbbbb2d43415b8efee9527fcf1c9d986202b5d85e2d25524ec932b3fc2a34afd4af0a9f02aa6bd6adcda8ee0933608e9626430b613eb87e8f3f71b340a62e34b4ac8a9a0f4d0293e7670ea05c1b1b1c80ffadc75f55bf26aa8d7036e0188c74ba43ca449a2ee3108ab1c4323727c3efd686fb189f2a6bfaafb86943ad97b3d24fe02b821436b49ee48572d311be24eb5c4e24e2f3ee2096772b315941f3a4cab33b5375905db9ff22beee93bc29fc25eab008e6faeff6dfb6794b69f85778154eb12177c306428716a2d28d34ec4f8948d33fefb599b84f669e42f4589a142dec5cf08684b7908b8ca48835d20cf573b8c3b44e4f6a2e0c7d43308461cbb7ae1f35317f39df9f880f67fe4a0639c58d9047652656875d74cb452e91490f4e22339ca0fa2affe62a63b07f0a7812a882c50a09cc497bcfdb58bfebc87a9717aafe270059597db497ad61660eb1830b513d5e1defd1adad7e7270833b4a385b6a2acd8253b899eca2869509f4f9323a40e917b06645dd4f0053bfc61bc256dc81065dbea08750ee5fbee7f61b169f89a9499d3b6462ec658622c9b1dc5ddc22327a594f2600158e6ed1216eebb79a78f8656babe85f30beeb055f5f67e9f07597aad038695944e4345b6ba581c54e533e572081f7a21e63d7a45c87bfeda8114272abda939517301feef2b025cec1e0f5ce796b1b5c2427a788234ed3478c97bee321be798e197926221fd02310cec5a815854b255349af1c634aa194db66c4a264eca0e7a6418fff055b86b98ea7d5866562864464efb40a38f0e9190a5f2d2960952772b88194467a970e5223ea3dc5619b59ca8247ae4a7d20c1aabf43ca47d58a4f35b19df18a7ad1bfc1489c903bfbea6459edc98a6a08b77bc343fa49bc626967ea325d4740ae8ce712dc21d8bac41ccedc176d0c0d87ef269b0deff62786ee576155243a7cc3132729a536ae0fc08c4e6675be5d12a3340652fe37484e6be4812f24c4bce4cb7a0660ad27f3eab7f442e066d5ec6eb5e9849268183e8429c12ff1afad5f5043bfdb5b628c1856d272a4aa20c026c2a60a156f0550978fc9c7617ebe5b869c6a2d6cc931ab4a28affc29555a23a948080cd7acacef6ca04f29ae33051ca7eb3390d75f4d17d0c7d6ae253be89fc8736900f0d0bc23c09ae1c8506249d56f783aea628b672bb37ec1d5a4afc781282431df00e29ca160f93784e24a3076d30bd3ad5baab25d426561c43ee3ed167633fc95b5385de09aba6f1256592d05f701603a79188809f17c61ced170dc8190a3a1516',
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
      add: jest.fn(async (): Promise<void> => Promise.resolve(undefined)),
      findBySenderAddress: jest.fn(
        async (): Promise<IEncryptedMessage[]> =>
          Promise.resolve<IEncryptedMessage[]>([])
      ),
      findByReceiverAddress: jest.fn(
        async (): Promise<IEncryptedMessage[]> => Promise.resolve([])
      ),
      remove: jest.fn(async (): Promise<void> => Promise.resolve(undefined)),
      removeAll: jest.fn(async (): Promise<void> => Promise.resolve(undefined)),
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
          .mockResolvedValue(
            Promise.resolve<IEncryptedMessage[]>([encryptedMessage])
          )
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
          .mockResolvedValue(
            Promise.resolve<IEncryptedMessage[]>([encryptedMessage])
          )
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
          .mockResolvedValue(Promise.resolve(undefined))
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
      .mockReturnValue({ exec: () => [] as MessageDB[] })
    public static deleteOne = jest
      .fn()
      .mockReturnValue({ exec: () => Promise.resolve<void>(undefined) })
    public static deleteMany = jest.fn().mockReturnValue({
      exec: () => Promise.resolve<void>(undefined),
    })
    public static save = jest
      .fn()
      .mockImplementation(object => Promise.resolve(object))
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
        expect(saveSpy).toHaveBeenCalledTimes(0)

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
            exec: () => {
              return Promise.resolve<MessageDB[]>([
                encryptedMessage as MessageDB,
                differingMail,
              ])
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
          exec: () => {
            return Promise.resolve<MessageDB[]>([reverseMessage])
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
            exec: () => {
              return Promise.resolve<MessageDB[]>([reverseMessage])
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
          exec: () => {
            return Promise.resolve<MessageDB[]>([
              differingMail,
              encryptedMessage as MessageDB,
            ])
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
            exec: () => Promise.resolve<void>(undefined),
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
            exec: () => Promise.resolve<void>(undefined),
          })
        await messagingService.removeAll()
        expect(deleteManySpy).toHaveBeenCalledTimes(1)
        expect(deleteManySpy).toHaveBeenCalledWith({})
        deleteManySpy.mockRestore()
      })
    })
  })
})
