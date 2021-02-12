import { PublicIdentity } from '@kiltprotocol/sdk-js'
import { IDidDocumentSigned } from '@kiltprotocol/sdk-js/build/did/Did'
import { Document } from 'mongoose'
import { Optional } from 'typescript-optional'

export interface Contact {
  metaData: {
    name: string
  }
  did?: IDidDocumentSigned
  publicIdentity: PublicIdentity
}

export interface ContactDB extends Document, Contact {}

export declare interface ContactsService {
  add(contact: Contact): Promise<void>
  list(): Promise<Contact[]>
  findByAddress(address: PublicIdentity['address']): Promise<Optional<Contact>>
  removeAll(): Promise<void>
}
