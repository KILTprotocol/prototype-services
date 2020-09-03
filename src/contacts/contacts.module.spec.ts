import { Test } from '@nestjs/testing'
import { AuthGuard } from '../auth/auth.guard'
import {
  BadRequestException,
  NotFoundException,
} from '@nestjs/common/exceptions'
import { getModelToken } from '@nestjs/mongoose'
import { ContactsController } from './contacts.controller'
import {
  ContactsService,
  ContactDB,
  Contact,
} from './interfaces/contacts.interfaces'
import { MongoDbMContactsService } from './mongodb-contacts.service'
import Optional from 'typescript-optional'

jest.mock('@kiltprotocol/sdk-js/build/crypto/Crypto', () => {
  return {
    hashStr: jest.fn((): string => '0x1'),
    verify: jest.fn((): boolean => true),
  }
})

describe('Contact Module', async () => {
  const testContact: Contact = {
    metaData: {
      name: 'Test',
    },
    publicIdentity: {
      address: '5CKq9ovoHUFb5Qg2q7YmQ2waNhgQm4C22qwb1Wgehnn2eBcb',
      boxPublicKeyAsHex:
        '0x5640c86ce5a99b1caf37882197b17572fa8ac33db8387861ef24dd2b497edd43',
      serviceAddress: 'https://services.devnet.kilt.io:443/messaging',
    },
  }
  const testDID: object = {
    id: 'did:kilt:5CKq9ovoHUFb5Qg2q7YmQ2waNhgQm4C22qwb1Wgehnn2eBcb',
    '@context': 'https://w3id.org/did/v1',
    authentication: [
      {
        type: 'Ed25519SignatureAuthentication2018',
        publicKey: [
          'did:kilt:5CKq9ovoHUFb5Qg2q7YmQ2waNhgQm4C22qwb1Wgehnn2eBcb#key-1',
        ],
      },
    ],
    publicKey: [
      {
        id: 'did:kilt:5CKq9ovoHUFb5Qg2q7YmQ2waNhgQm4C22qwb1Wgehnn2eBcb#key-1',
        type: 'Ed25519VerificationKey2018',
        controller: 'did:kilt:5CKq9ovoHUFb5Qg2q7YmQ2waNhgQm4C22qwb1Wgehnn2eBcb',
        publicKeyHex:
          '0x0b893d72cdfb31a60af86f9519ab6892f2a3ced3cc5a36763ff2c60feb28fbad',
      },
      {
        id: 'did:kilt:5CKq9ovoHUFb5Qg2q7YmQ2waNhgQm4C22qwb1Wgehnn2eBcb#key-2',
        type: 'X25519Salsa20Poly1305Key2018',
        controller: 'did:kilt:5CKq9ovoHUFb5Qg2q7YmQ2waNhgQm4C22qwb1Wgehnn2eBcb',
        publicKeyHex:
          '0x5640c86ce5a99b1caf37882197b17572fa8ac33db8387861ef24dd2b497edd43',
      },
    ],
    service: [
      {
        type: 'KiltMessagingService',
        serviceEndpoint: 'https://services.devnet.kilt.io:443/messaging',
      },
    ],
  }
  const signature =
    '0x00aad52336444c0263a22c22f2b99bbcdfc3a6912b5d085c11df01de2bb13dae7c9adf89ecb58f9a32dd021c1c0c1ff0ed39ba361a85f350714b58f15cbd617607'
  const contactWithDid: Contact = {
    ...testContact,
    did: testDID,
    signature,
  }
  const noSigContact: Contact = {
    ...testContact,
    did: testDID,
  }
  const badSigContact: Contact = { ...contactWithDid, signature: '0x1' }

  const address = testContact.publicIdentity.address
  describe('Controller', async () => {
    let contactsController: ContactsController
    let contactsService: ContactsService

    const mockedHashStr = require('@kiltprotocol/sdk-js/build/crypto/Crypto')
      .hashStr
    const mockedVerify = require('@kiltprotocol/sdk-js/build/crypto/Crypto')
      .verify
    const fakeContactService: ContactsService = {
      add: jest.fn(async (): Promise<void> => Promise.resolve(undefined)),
      findByAddress: jest.fn(
        async (): Promise<Optional<Contact>> =>
          Promise.resolve<Optional<Contact>>(Optional.ofNullable<Contact>(null))
      ),
      list: jest.fn(
        async (): Promise<Contact[]> => Promise.resolve<Contact[]>([])
      ),
      removeAll: jest.fn(async (): Promise<void> => Promise.resolve(undefined)),
    }

    beforeEach(async () => {
      const moduleRef = await Test.createTestingModule({
        controllers: [ContactsController],
        providers: [
          {
            provide: 'ContactsService',
            useValue: fakeContactService,
          },
        ],
      })
        .overrideGuard(AuthGuard)
        .useValue({ canActivate: () => true })
        .compile()
      contactsController = moduleRef.get(ContactsController)
      contactsService = moduleRef.get('ContactsService')
    })
    afterEach(() => {
      jest.clearAllMocks()
    })

    describe('add', async () => {
      it('calls contactService.add on valid Contact without Did', async () => {
        const addSpy = jest.spyOn(contactsService, 'add')
        const noAddressContact: Contact = {
          ...testContact,
          publicIdentity: { ...testContact.publicIdentity, address: '' },
        }
        const noPubKeyContact: Contact = {
          ...testContact,
          publicIdentity: {
            ...testContact.publicIdentity,
            boxPublicKeyAsHex: '',
          },
        }
        const noNameContact: Contact = {
          ...testContact,
          metaData: {
            ...testContact.metaData,
            name: '',
          },
        }
        expect(await contactsController.add(testContact)).toEqual(undefined)
        expect(mockedHashStr).toHaveBeenCalledTimes(0)
        expect(mockedVerify).toHaveBeenCalledTimes(0)
        expect(addSpy).toHaveBeenCalledTimes(1)
        expect(addSpy).toHaveBeenCalledWith(testContact)
        addSpy.mockClear()
        await expect(contactsController.add(noAddressContact)).rejects.toThrow(
          BadRequestException
        )
        await expect(contactsController.add(noPubKeyContact)).rejects.toThrow(
          BadRequestException
        )
        await expect(contactsController.add(noNameContact)).rejects.toThrow(
          BadRequestException
        )
        expect(mockedHashStr).toHaveBeenCalledTimes(0)
        expect(mockedVerify).toHaveBeenCalledTimes(0)
        expect(addSpy).toHaveBeenCalledTimes(0)
      })
      it('calls contactService.add on valid Contact with Did', async () => {
        const addSpy = jest.spyOn(contactsService, 'add')
        expect(await contactsController.add(contactWithDid)).toEqual(undefined)
        expect(addSpy).toHaveBeenCalledTimes(1)
        expect(addSpy).toHaveBeenCalledWith(contactWithDid)
        expect(mockedHashStr).toHaveBeenCalledTimes(1)
        expect(mockedVerify).toHaveBeenCalledTimes(1)
        expect(mockedHashStr).toHaveBeenCalledWith(JSON.stringify(testDID))
        expect(mockedVerify).toHaveBeenCalledWith(
          '0x1',
          contactWithDid.signature,
          contactWithDid.publicIdentity.address
        )
        mockedVerify.mockReturnValue(false)
        await expect(contactsController.add(noSigContact)).rejects.toThrow(
          BadRequestException
        )
        expect(addSpy).toHaveBeenCalledTimes(1)
        await expect(contactsController.add(badSigContact)).rejects.toThrow(
          BadRequestException
        )
        expect(addSpy).toHaveBeenCalledTimes(1)
        expect(mockedHashStr).toHaveBeenCalledTimes(2)
        expect(mockedVerify).toHaveBeenCalledTimes(2)
      })
    })
    describe('list', async () => {
      it('returns all registered Contacts', async () => {
        const serviceListSpy = jest
          .spyOn(contactsService, 'list')
          .mockResolvedValue(Promise.resolve<Contact[]>([testContact]))
        expect(contactsController.list()).resolves.toEqual([testContact])
        expect(serviceListSpy).toHaveBeenCalledTimes(1)
        expect(serviceListSpy).toHaveBeenCalledWith()
        serviceListSpy.mockRestore()
      })
    })
    describe('findByKey', async () => {
      it('gets the Contact for the given address', async () => {
        const findByAddressSpy = jest
          .spyOn(contactsService, 'findByAddress')
          .mockResolvedValue(Promise.resolve(Optional.ofNullable(testContact)))
        expect(
          await contactsController.findByKey(testContact.publicIdentity.address)
        ).toEqual(testContact)
        expect(findByAddressSpy).toHaveBeenCalledTimes(1)
        expect(findByAddressSpy).toHaveBeenCalledWith(
          testContact.publicIdentity.address
        )
        findByAddressSpy.mockRestore()
      })
    })
    describe('removeAll', async () => {
      it('calls contactService.removeAll()', async () => {
        contactsController.removeAll()
        expect(contactsService.removeAll).toHaveBeenCalledTimes(1)
      })
    })
    describe('getDidDocument', () => {
      it('gets the contact for the given address and returns the did', async () => {
        const findByAddressSpy = jest
          .spyOn(contactsService, 'findByAddress')
          .mockReturnValue(Promise.resolve(Optional.ofNullable(contactWithDid)))
        expect(await contactsController.getDidDocument(address)).toEqual(
          contactWithDid.did
        )
        expect(findByAddressSpy).toHaveBeenCalledWith(address)
        findByAddressSpy.mockReturnValue(
          Promise.resolve(Optional.ofNullable(testContact))
        )
        expect(contactsController.getDidDocument(address)).rejects.toThrow(
          NotFoundException
        )
        expect(findByAddressSpy).toHaveBeenCalledWith(address)
        findByAddressSpy.mockRestore()
      })
    })
  })

  class ContactModel {
    public static find = jest
      .fn()
      .mockReturnValue({ exec: () => [] as ContactDB[] })
    public static findOne = jest
      .fn()
      .mockReturnValue({ exec: () => Promise.resolve<ContactDB>(null) })
    public static deleteMany = jest.fn().mockReturnValue({
      exec: () => Promise.resolve<void>(undefined),
    })
    public static save = jest
      .fn()
      .mockImplementation(object => Promise.resolve(object))
    public save = jest.fn().mockReturnValue(ContactModel.save(this))

    constructor(data: Contact) {
      return Object.assign(this, data as ContactDB)
    }
  }
  describe('Contacts Service', async () => {
    let contactsService: ContactsService

    beforeEach(async () => {
      const messageServiceProvider = {
        provide: 'ContactService',
        useClass: MongoDbMContactsService,
      }

      const moduleRef = await Test.createTestingModule({
        providers: [
          messageServiceProvider,
          { provide: getModelToken('Contact'), useValue: ContactModel },
        ],
      }).compile()

      contactsService = moduleRef.get('ContactService')
    })
    afterEach(() => {
      jest.clearAllMocks()
    })
    describe('add', async () => {
      it('creates a Contact and saves it', async () => {
        const saveSpy = jest.spyOn(contactsService['contactModel'], 'save')
        const findOneSpy = jest.spyOn(
          contactsService['contactModel'],
          'findOne'
        )
        await contactsService.add(testContact)
        expect(findOneSpy).toHaveBeenCalledWith({
          'publicIdentity.address': testContact.publicIdentity.address,
        })
        expect(saveSpy).toHaveBeenCalledTimes(1)
      })
      it('updates a Contact and saves it', async () => {
        const saveSpy = jest.spyOn(contactsService['contactModel'], 'save')
        const findOneSpy = jest.spyOn(
          contactsService['contactModel'],
          'findOne'
        )
        await contactsService.add(contactWithDid)
        expect(findOneSpy).toHaveBeenCalledWith({
          'publicIdentity.address': testContact.publicIdentity.address,
        })
        expect(saveSpy).toHaveBeenCalledTimes(1)
      })
    })
    describe('findByAddress', async () => {
      it('queries database and converts match', async () => {
        const findOneSpy = jest
          .spyOn(contactsService['contactModel'], 'findOne')
          .mockReturnValue({ exec: () => Promise.resolve<ContactDB>(null) })
        expect(await contactsService.findByAddress(address)).toEqual(
          Optional.ofNullable<Contact>(null)
        )
        expect(findOneSpy).toHaveBeenCalledWith({
          'publicIdentity.address': address,
        })
        findOneSpy.mockReturnValue({
          exec: () => {
            return Promise.resolve<ContactDB>(testContact as ContactDB)
          },
        })
        expect(await contactsService.findByAddress(address)).toEqual(
          Optional.ofNullable<Contact>(testContact)
        )
        expect(findOneSpy).toHaveBeenCalledWith({
          'publicIdentity.address': address,
        })
        expect(findOneSpy).toHaveBeenCalledTimes(2)
        findOneSpy.mockRestore()
      })
    })
    describe('list', async () => {
      it('queries database with inclusive parameter and converts matches', async () => {
        const findSpy = jest
          .spyOn(contactsService['contactModel'], 'find')
          .mockReturnValue({
            exec: () => {
              return Promise.resolve<ContactDB[]>([testContact as ContactDB])
            },
          })
        expect(await contactsService.list()).toEqual([testContact])
        expect(findSpy).toHaveBeenCalledWith()
        findSpy.mockReturnValue({
          exec: () => {
            return Promise.resolve<ContactDB[]>([])
          },
        })
        expect(await contactsService.list()).toEqual([])
        expect(findSpy).toHaveBeenCalledTimes(2)
        findSpy.mockRestore()
      })
    })
    describe('removeAll', async () => {
      it('calls deleteMany with inclusive parameter', async () => {
        const deleteManySpy = jest.spyOn(
          contactsService['contactModel'],
          'deleteMany'
        )
        await contactsService.removeAll()
        expect(deleteManySpy).toHaveBeenCalledTimes(1)
        expect(deleteManySpy).toHaveBeenCalledWith({})
      })
    })
  })
})
