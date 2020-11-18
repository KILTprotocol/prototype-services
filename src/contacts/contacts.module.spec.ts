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
import {
  IDidDocumentSigned,
  IDENTIFIER_PREFIX,
} from '@kiltprotocol/sdk-js/build/did/Did'

jest.mock('@kiltprotocol/sdk-js/build/did/Did', () => {
  return {
    verifyDidDocumentSignature: jest.fn((): boolean => true),
    getIdentifierFromAddress: jest.fn(
      (address: string): string => IDENTIFIER_PREFIX + address
    ),
  }
})
describe('Contact Module', () => {
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
  const signature =
    '0x00aad52336444c0263a22c22f2b99bbcdfc3a6912b5d085c11df01de2bb13dae7c9adf89ecb58f9a32dd021c1c0c1ff0ed39ba361a85f350714b58f15cbd617607'
  const unsignedTestDID: IDidDocumentSigned = {
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
  } as any

  const signedTestDID: IDidDocumentSigned = {
    ...unsignedTestDID,
    signature,
  }
  const contactWithDid: Contact = {
    ...testContact,
    did: signedTestDID,
  }
  const badSigContact: Contact = {
    ...testContact,
    did: { ...signedTestDID, signature: signature.replace('d', 'f') },
  }
  const deprecatedDIDFormat: Contact = {
    ...testContact,
    signature,
    did: {},
  } as any
  const address = testContact.publicIdentity.address
  describe('Controller', () => {
    let contactsController: ContactsController
    let contactsService: ContactsService

    const mockedVerifyDidDocumentSignature = require('@kiltprotocol/sdk-js/build/did/Did')
      .verifyDidDocumentSignature
    const fakeContactService: ContactsService = {
      add: jest.fn(
        async (): Promise<void> => {
          return
        }
      ),
      findByAddress: jest.fn(
        async (): Promise<Optional<Contact>> =>
          Optional.ofNullable<Contact>(null)
      ),
      list: jest.fn(async (): Promise<Contact[]> => []),
      removeAll: jest.fn(
        async (): Promise<void> => {
          return
        }
      ),
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

    afterEach(() => jest.clearAllMocks())

    describe('add', () => {
      it('calls contactService.add on valid Contact without Did', async () => {
        const addSpy = jest.spyOn(contactsService, 'add')
        expect(await contactsController.add(testContact)).toEqual(undefined)
        expect(mockedVerifyDidDocumentSignature).not.toHaveBeenCalled()
        expect(addSpy).toHaveBeenCalledTimes(1)
        expect(addSpy).toHaveBeenCalledWith(testContact)
      })
      it('calls throws Exception on invalid Contact', async () => {
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
        await expect(contactsController.add(noAddressContact)).rejects.toThrow(
          BadRequestException
        )
        await expect(contactsController.add(noPubKeyContact)).rejects.toThrow(
          BadRequestException
        )
        await expect(contactsController.add(noNameContact)).rejects.toThrow(
          BadRequestException
        )
        expect(addSpy).not.toHaveBeenCalled()
      })

      it('calls contactService.add on valid Contact with Did', async () => {
        const addSpy = jest.spyOn(contactsService, 'add')

        await contactsController.add(contactWithDid)
        expect(mockedVerifyDidDocumentSignature).toHaveBeenCalledWith(
          signedTestDID,
          IDENTIFIER_PREFIX + contactWithDid.publicIdentity.address
        )
        expect(addSpy).toHaveBeenCalledTimes(1)
        expect(addSpy).toHaveBeenCalledWith(contactWithDid)
      })
      it('rejects contact with did if signature is missing or invalid', async () => {
        const addSpy = jest.spyOn(contactsService, 'add')
        mockedVerifyDidDocumentSignature.mockReturnValue(false)
        await expect(contactsController.add(badSigContact)).rejects.toThrow(
          BadRequestException
        )
        expect(addSpy).not.toHaveBeenCalled()
      })
    })
    describe('list', () => {
      it('returns all registered Contacts', async () => {
        const serviceListSpy = jest
          .spyOn(contactsService, 'list')
          .mockResolvedValue([testContact])
        await expect(contactsController.list()).resolves.toEqual([testContact])
        expect(serviceListSpy).toHaveBeenCalledTimes(1)
        expect(serviceListSpy).toHaveBeenCalledWith()
        serviceListSpy.mockRestore()
      })
    })
    describe('findByKey', () => {
      it('gets the Contact for the given address', async () => {
        const findByAddressSpy = jest
          .spyOn(contactsService, 'findByAddress')
          .mockResolvedValue(Optional.ofNullable(testContact))
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
    describe('removeAll', () => {
      it('calls contactService.removeAll()', async () => {
        contactsController.removeAll()
        expect(contactsService.removeAll).toHaveBeenCalledTimes(1)
      })
    })
    describe('getDidDocument', () => {
      it('gets the contact for the given address and returns the did', async () => {
        const findByAddressSpy = jest
          .spyOn(contactsService, 'findByAddress')
          .mockResolvedValue(Optional.ofNullable(contactWithDid))
        expect(await contactsController.getDidDocument(address)).toEqual(
          contactWithDid.did
        )
        expect(findByAddressSpy).toHaveBeenCalledWith(address)
        findByAddressSpy.mockResolvedValue(Optional.ofNullable(testContact))
        await expect(
          contactsController.getDidDocument(address)
        ).rejects.toThrow(NotFoundException)
        expect(findByAddressSpy).toHaveBeenCalledWith(address)
        findByAddressSpy.mockRestore()
      })
    })
  })

  class ContactModel {
    public static find = jest
      .fn()
      .mockReturnValue({ exec: async (): Promise<ContactDB[]> => [] })
    public static findOne = jest
      .fn()
      .mockReturnValue({ exec: async (): Promise<ContactDB> => null })
    public static deleteOne = jest
      .fn()
      .mockReturnValue({ exec: async (): Promise<void> => {} })
    public static deleteMany = jest.fn().mockReturnValue({
      exec: async () => {
        return
      },
    })
    public static save = jest.fn().mockImplementation(async object => object)
    public save = jest
      .fn()
      .mockImplementation(async () => ContactModel.save(this))

    constructor(data: Contact) {
      return Object.assign(this, data as ContactDB)
    }
  }
  describe('Contacts Service', () => {
    let contactsService: ContactsService

    beforeEach(async () => {
      const contactServiceProvider = {
        provide: 'ContactService',
        useClass: MongoDbMContactsService,
      }

      const moduleRef = await Test.createTestingModule({
        providers: [
          contactServiceProvider,
          { provide: getModelToken('Contact'), useValue: ContactModel },
        ],
      }).compile()

      contactsService = moduleRef.get('ContactService')
    })
    afterEach(() => jest.clearAllMocks())

    describe('add', () => {
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
        const findOneSpy = jest
          .spyOn(contactsService['contactModel'], 'findOne')
          .mockReturnValueOnce({
            exec: async (): Promise<ContactDB> =>
              (({
                ...deprecatedDIDFormat,
                toObject: () => deprecatedDIDFormat,
              } as any) as ContactDB),
          })
        const deleteOneSpy = jest.spyOn(
          contactsService['contactModel'],
          'deleteOne'
        )
        await contactsService.add(contactWithDid)
        expect(findOneSpy).toHaveBeenCalledWith({
          'publicIdentity.address': testContact.publicIdentity.address,
        })
        expect(saveSpy).toHaveBeenCalledTimes(1)
        expect(deleteOneSpy).toHaveBeenCalledTimes(1)
      })
    })
    describe('findByAddress', () => {
      it('queries database and converts match', async () => {
        const findOneSpy = jest
          .spyOn(contactsService['contactModel'], 'findOne')
          .mockReturnValue({ exec: async (): Promise<ContactDB> => null })
        expect(await contactsService.findByAddress(address)).toEqual(
          Optional.ofNullable<Contact>(null)
        )
        expect(findOneSpy).toHaveBeenCalledWith({
          'publicIdentity.address': address,
        })
        findOneSpy.mockReturnValue({
          exec: async (): Promise<ContactDB> =>
            (({
              ...testContact,
              toObject: () => testContact,
            } as any) as ContactDB),
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
    describe('list', () => {
      it('queries database with inclusive parameter and converts matches', async () => {
        const findSpy = jest
          .spyOn(contactsService['contactModel'], 'find')
          .mockReturnValue({
            exec: async (): Promise<ContactDB[]> => {
              return [
                ({
                  ...testContact,
                  toObject: () => testContact,
                } as any) as ContactDB,
              ]
            },
          })
        expect(await contactsService.list()).toEqual([testContact])
        expect(findSpy).toHaveBeenCalledWith()
        findSpy.mockReturnValue({
          exec: async (): Promise<ContactDB[]> => {
            return []
          },
        })
        expect(await contactsService.list()).toEqual([])
        expect(findSpy).toHaveBeenCalledTimes(2)
        findSpy.mockRestore()
      })
    })
    describe('removeAll', () => {
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
