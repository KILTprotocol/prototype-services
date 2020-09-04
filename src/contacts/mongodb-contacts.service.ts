import { PublicIdentity } from '@kiltprotocol/sdk-js'
import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import Optional from 'typescript-optional'
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
    const modifiedContact: ContactDB = Optional.ofNullable<ContactDB>(
      await this.contactModel
        .findOne({ 'publicIdentity.address': contact.publicIdentity.address })
        .exec()
    ).orElse(new this.contactModel(contact as ContactDB))
    modifiedContact.metaData.name = contact.metaData.name
    modifiedContact.did = contact.did
    await modifiedContact.save()
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
  private convertToContact(contactDB: ContactDB): Contact {
    const { metaData, did, publicIdentity } = contactDB
    return {
      metaData,
      did,
      publicIdentity,
    }
  }
}
