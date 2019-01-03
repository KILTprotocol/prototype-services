import { Document } from 'mongoose'
import Optional from 'typescript-optional'

export interface Contact extends Document {
  key: string
  encryptionKey: string
  name: string
}

export declare interface ContactsService {
  add(contact: Contact)
  list(): Promise<Contact[]>
  findByKey(key: string): Promise<Optional<Contact>>
}
