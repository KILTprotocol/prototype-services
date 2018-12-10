import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Contact, ContactsService } from './interfaces/contacts.interfaces';
import Optional from "typescript-optional";

@Injectable()
export class MongoDbMContactsService implements ContactsService {

    constructor(@InjectModel('Contact') private readonly contactModel: Model<Contact>) { }


    async add(contact: Contact) {
        let modifiedContact : Contact = (await this.findByKey(contact.key)).orElse(new this.contactModel(contact));
        modifiedContact.name = contact.name;
        await modifiedContact.save();
    }

    async findByKey(key: string): Promise<Optional<Contact>> {
        const result = await this.contactModel.findOne({ key: key }).exec();
        return Optional.ofNullable(result);
    }

    async list(): Promise<Contact[]> {
        return await this.contactModel.find().exec();
    }

}
