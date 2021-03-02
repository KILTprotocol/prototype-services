import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { MockMongooseModule, mongodbInstance } from './MockMongooseModule'
import {
  ContactsService,
  Contact,
} from '../src/contacts/interfaces/contacts.interfaces'
import { ContactsModule } from '../src/contacts/contacts.module'
import { IDidDocumentSigned, Did, Identity } from '@kiltprotocol/core'

describe('contacts endpoint (e2e)', () => {
  let app: INestApplication
  let idAlice: Identity
  let idBob: Identity
  let contactsService: ContactsService
  let contactA: Contact
  let contactB: Contact

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [ContactsModule, MockMongooseModule],
    }).compile()

    app = moduleFixture.createNestApplication()
    await app.init()

    contactsService = app.get('ContactsService')
    idAlice = await Identity.buildFromURI('//Alice')
    idBob = await Identity.buildFromURI('//Bob')

    contactA = {
      publicIdentity: idAlice.getPublicIdentity(),
      metaData: { name: 'Alice' },
    }
    contactB = {
      publicIdentity: {
        ...idBob.getPublicIdentity(),
        serviceAddress: 'www.example.com',
      },
      metaData: { name: 'Bob' },
    }
  }, 30000)

  describe('get', () => {
    beforeAll(async () => {
      await contactsService.removeAll()
      await contactsService.add(contactA)
      await contactsService.add(contactB)
    })

    it('gets all contacts', async () => {
      await request(app.getHttpServer())
        .get(`/contacts`)
        .expect(200)
        .expect(response => {
          expect(response.body).toBeInstanceOf(Array)
          expect(response.body).toHaveLength(2)
          expect(response.body[0]).toEqual(expect.objectContaining(contactA))
          expect(response.body[1]).toEqual(expect.objectContaining(contactB))
        })
    })

    it('gets contact by address', async () => {
      await request(app.getHttpServer())
        .get(`/contacts/${contactA.publicIdentity.address}`)
        .expect(200)
        .expect(response => {
          expect(response.body).toEqual(expect.objectContaining(contactA))
        })
      await request(app.getHttpServer())
        .get(`/contacts/${contactB.publicIdentity.address}`)
        .expect(200)
        .expect(response => {
          expect(response.body).toEqual(expect.objectContaining(contactB))
        })
    })

    it('rejects request for contact if address unknown', async () => {
      await request(app.getHttpServer())
        .get(`/contacts/${'unknown-address'}`)
        .expect(404)
    })

    describe('with did', () => {
      it('rejects query for did if contact has none', async () => {
        await request(app.getHttpServer())
          .get(`/contacts/did/${contactA.publicIdentity.address}`)
          .expect(404)
      })

      it('gets did by contact address', async () => {
        const didAlice = Did.signDidDocument(
          Did.fromIdentity(idAlice).createDefaultDidDocument(),
          idAlice
        )
        await contactsService.add({ ...contactA, did: didAlice })
        await request(app.getHttpServer())
          .get(`/contacts/did/${contactA.publicIdentity.address}`)
          .expect(200)
          .expect(response => {
            expect(response.body).toMatchObject(didAlice)
          })
      })
    })
  })

  describe('add', () => {
    beforeEach(async () => {
      await contactsService.removeAll()
    })

    it('adds new contact if valid', async () => {
      await expect(contactsService.list()).resolves.toHaveLength(0)
      await request(app.getHttpServer())
        .post(`/contacts`)
        .send(contactA)
        .expect(201)

      const storedContacts = await contactsService.list()
      expect(storedContacts).toBeInstanceOf(Array)
      expect(storedContacts).toHaveLength(1)
      expect(storedContacts[0]).toMatchObject(contactA)
    })

    it('overwrites name but not public identity of a contact if already registered', async () => {
      await request(app.getHttpServer())
        .post(`/contacts`)
        .send(contactA)
        .expect(201)

      await request(app.getHttpServer())
        .post(`/contacts`)
        .send({
          ...contactA,
          metaData: { name: 'my friend Alice' },
          publicIdentity: {
            ...contactA.publicIdentity,
            serviceAddress: 'www.example.com',
          },
        })
        .expect(201)

      const contacts = await contactsService.list()
      expect(contacts).toHaveLength(1)
      expect(contacts[0]).toMatchObject({
        ...contactA,
        metaData: { name: 'my friend Alice' },
      })
    })

    it('rejects if address missing', async () => {
      const corruptedContact: Contact = {
        ...contactA,
        publicIdentity: { ...contactA.publicIdentity, address: undefined },
      }
      await request(app.getHttpServer())
        .post(`/contacts`)
        .send(corruptedContact)
        .expect(400)

      await expect(contactsService.list()).resolves.toEqual([])
    })

    it('rejects if boxPublicKeyAsHex missing', async () => {
      const corruptedContact: Contact = {
        ...contactA,
        publicIdentity: {
          ...contactA.publicIdentity,
          boxPublicKeyAsHex: undefined,
        },
      }
      await request(app.getHttpServer())
        .post(`/contacts`)
        .send(corruptedContact)
        .expect(400)

      await expect(contactsService.list()).resolves.toEqual([])
    })

    it('rejects if name missing', async () => {
      const corruptedContact: Contact = {
        ...contactA,
        metaData: {
          name: undefined,
        },
      }
      await request(app.getHttpServer())
        .post(`/contacts`)
        .send(corruptedContact)
        .expect(400)

      await expect(contactsService.list()).resolves.toEqual([])
    })

    describe('with did', () => {
      let didAlice: IDidDocumentSigned

      beforeAll(() => {
        didAlice = Did.signDidDocument(
          Did.fromIdentity(idAlice).createDefaultDidDocument(),
          idAlice
        )
      })

      it('adds new contact with did', async () => {
        await expect(contactsService.list()).resolves.toHaveLength(0)
        await request(app.getHttpServer())
          .post(`/contacts`)
          .send({
            publicIdentity: idAlice.getPublicIdentity(),
            metaData: { name: 'Alice' },
            did: didAlice,
          } as Contact)
          .expect(201)

        const storedContacts = await contactsService.list()
        expect(storedContacts).toBeInstanceOf(Array)
        expect(storedContacts).toHaveLength(1)
        expect(storedContacts[0]).toMatchObject({
          publicIdentity: idAlice.getPublicIdentity(),
          metaData: { name: 'Alice' },
          did: didAlice,
        })
      })

      it('adds did to existing contact', async () => {
        await request(app.getHttpServer())
          .post(`/contacts`)
          .send({
            publicIdentity: idAlice.getPublicIdentity(),
            metaData: { name: 'Alice' },
          } as Contact)
          .expect(201)

        await expect(contactsService.list()).resolves.toHaveLength(1)

        await request(app.getHttpServer())
          .post(`/contacts`)
          .send({
            publicIdentity: idAlice.getPublicIdentity(),
            metaData: { name: 'Alice' },
            did: didAlice,
          } as Contact)
          .expect(201)

        const storedContacts = await contactsService.list()
        expect(storedContacts).toBeInstanceOf(Array)
        expect(storedContacts).toHaveLength(1)
        expect(storedContacts[0]).toMatchObject({
          publicIdentity: idAlice.getPublicIdentity(),
          metaData: { name: 'Alice' },
          did: didAlice,
        })
      })

      it('rejects if signature missing', async () => {
        await request(app.getHttpServer())
          .post(`/contacts`)
          .send({
            publicIdentity: idAlice.getPublicIdentity(),
            metaData: { name: 'Alice' },
            did: { ...didAlice, signature: '' },
          } as Contact)
          .expect(400)

        await expect(contactsService.list()).resolves.toEqual([])
      })

      it('rejects if bad signature', async () => {
        await request(app.getHttpServer())
          .post(`/contacts`)
          .send({
            publicIdentity: idAlice.getPublicIdentity(),
            metaData: { name: 'Alice' },
            did: {
              ...didAlice,
              signature: didAlice.signature.replace('d', 'f'),
            },
          } as Contact)
          .expect(400)

        await expect(contactsService.list()).resolves.toEqual([])
      })
    })
  })

  describe('delete', () => {
    beforeEach(async () => {
      await contactsService.removeAll()
      await contactsService.add(contactA)
      await contactsService.add(contactB)
    })

    it('rejects unauthorized delete requests', async () => {
      await request(app.getHttpServer())
        .delete(`/contacts`)
        .expect(403)
      await expect(contactsService.list()).resolves.toHaveLength(2)
    })

    it('accepts authorized delete-all requests', async () => {
      const TOKEN = 'authtoken'
      // set token with which http delete request is authorized
      process.env['SECRET'] = TOKEN
      await request(app.getHttpServer())
        .delete(`/contacts`)
        .set('Authorization', TOKEN)
        .expect(200)
      await expect(contactsService.list()).resolves.toEqual([])
    })
  })

  it('register -> get -> reset', async () => {
    await request(app.getHttpServer())
      .post(`/contacts`)
      .send(contactA)
      .expect(201)

    await request(app.getHttpServer())
      .get(`/contacts/${contactA.publicIdentity.address}`)
      .expect(200)
      .expect(response => {
        expect(response.body).toEqual(expect.objectContaining(contactA))
      })

    const TOKEN = 'authtoken'
    // set token with which http delete request is authorized
    process.env['SECRET'] = TOKEN
    await request(app.getHttpServer())
      .delete(`/contacts`)
      .set('Authorization', TOKEN)
      .expect(200)

    await request(app.getHttpServer())
      .get(`/contacts`)
      .expect(200)
      .expect(response => {
        expect(response.body).toEqual([])
      })
  })

  afterAll(async () => {
    await Promise.all([app.close(), mongodbInstance.stop()])
  })
})
