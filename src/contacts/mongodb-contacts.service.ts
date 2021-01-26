import { PublicIdentity } from '@kiltprotocol/sdk-js'
import { IDidDocumentSigned } from '@kiltprotocol/sdk-js/build/did/Did'
import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { Optional } from 'typescript-optional'
import {
  Contact,
  ContactDB,
  ContactsService,
} from './interfaces/contacts.interfaces'

@Injectable()
export class MongoDbMContactsService implements ContactsService {
  constructor(
    @InjectModel('Contact') private readonly contactModel: Model<ContactDB>
  ) {}

  public async add(contact: Contact): Promise<void> {
    const registeredContact: Optional<
      ContactDB & { signature?: string }
    > = Optional.ofNullable<ContactDB & { signature?: string }>(
      await this.contactModel
        .findOne({ 'publicIdentity.address': contact.publicIdentity.address })
        .exec()
    )
    if (registeredContact.isPresent) {
      const registered = registeredContact.get()
      // If the contact was already registered we want to replace the document, as it could exist in outdated format! Signature is still valid.
      await this.contactModel.replaceOne({ _id: registered._id }, {
        did: registered.signature && {
          ...registered.did,
          signature: registered.signature,
        },
        ...contact,
        publicIdentity: registered.publicIdentity,
        metaData: {
          ...registered.metaData,
          name: contact.metaData.name,
        },
      } as ContactDB)
    } else {
      await new this.contactModel(contact as ContactDB).save()
    }
  }

  public async findByAddress(
    address: PublicIdentity['address']
  ): Promise<Optional<Contact>> {
    const result = await this.contactModel
      .findOne({ 'publicIdentity.address': address })
      .exec()

    return Optional.ofNullable<ContactDB>(result).map(
      (contact: ContactDB): Contact => this.convertToContact(contact)
    )
  }

  public async list(): Promise<Contact[]> {
    const result: ContactDB[] = await this.contactModel.find().exec()
    return result.map(
      (contactDB: ContactDB): Contact => this.convertToContact(contactDB)
    )
  }

  public async removeAll(): Promise<void> {
    await this.contactModel.deleteMany({}).exec()
  }

  private convertToContact(
    contactDB: ContactDB & { signature?: string }
  ): Contact {
    // The Old Format had the signature as property in ContactDB, so we check if we have to move it. Signature is still valid.
    const { metaData, did, publicIdentity, signature } = contactDB
    return {
      metaData,
      did: signature && did ? { ...did, signature } : did,
      publicIdentity,
    }
  }
}
