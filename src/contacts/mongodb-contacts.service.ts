import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { Contact, ContactsService } from './interfaces/contacts.interfaces'
import Optional from 'typescript-optional'

@Injectable()
export class MongoDbMContactsService implements ContactsService {
  constructor(
    @InjectModel('Contact') private readonly contactModel: Model<Contact>
  ) {}

  public async add(contact: Contact) {
    const modifiedContact: Contact = (await this.findByKey(contact.key)).orElse(
      new this.contactModel(contact)
    )
    modifiedContact.name = contact.name
    await modifiedContact.save()
  }

  public async findByKey(key: string): Promise<Optional<Contact>> {
    const result = await this.contactModel.findOne({ key }).exec()
    return Optional.ofNullable(result)
  }

  public async list(): Promise<Contact[]> {
    return await this.contactModel.find().exec()
  }
}
