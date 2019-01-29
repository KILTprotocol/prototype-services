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
    const modifiedContact: ContactDB = (await this._findByAddress(
      contact.publicIdentity.address
    )).orElse(new this.contactModel(contact as ContactDB))
    modifiedContact.metaData.name = contact.metaData.name
    await modifiedContact.save()
  }

  public async findByAddress(address: string): Promise<Optional<Contact>> {
    const result = await this._findByAddress(address)
    return result.map(
      (contact: ContactDB): Contact => convertToContact(contact)
    )
  }

  public async list(): Promise<Contact[]> {
    const result: ContactDB[] = await this.contactModel.find().exec()
    return result.map(
      (contact: ContactDB): Contact => convertToContact(contact)
    )
  }

  public async removeAll(): Promise<void> {
    await this.contactModel.deleteMany({}).exec()
  }

  private async _findByAddress(address: string): Promise<Optional<ContactDB>> {
    const result: ContactDB = await this.contactModel
      .findOne({ 'publicIdentity.address': address })
      .exec()
    return Optional.ofNullable(result)
  }
}

function convertToContact(contact: ContactDB): Contact {
  const { metaData, publicIdentity } = contact
  return {
    metaData,
    publicIdentity,
  }
}
