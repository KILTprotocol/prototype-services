import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  NotFoundException,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common'
import { Contact, ContactsService } from './interfaces/contacts.interfaces'
import { Did } from '@kiltprotocol/sdk-js'
import { Optional } from 'typescript-optional'
import { AuthGuard } from '../auth/auth.guard'
import { IDidDocumentSigned } from '@kiltprotocol/sdk-js/build/did/Did'

@Controller('contacts')
export class ContactsController {
  constructor(
    @Inject('ContactsService') private readonly contactService: ContactsService
  ) {}

  @Post()
  public async add(@Body() contact: Contact) {
    if (!contact.publicIdentity.address) {
      throw new BadRequestException('no address')
    } else if (!contact.publicIdentity.boxPublicKeyAsHex) {
      throw new BadRequestException('no boxPublicKeyAsHex')
    } else if (!contact.metaData.name) {
      throw new BadRequestException('no name')
    }
    if (contact.did) {
      try {
        if (
          !Did.verifyDidDocumentSignature(
            contact.did,
            Did.getIdentifierFromAddress(contact.publicIdentity.address)
          )
        ) {
          throw new BadRequestException('Did signature not verifiable')
        }
      } catch (e) {
        console.log(e)
        throw new BadRequestException('Did signature not verifiable')
      }
    }
    await this.contactService.add(contact)
  }

  @Get()
  public async list(): Promise<Contact[]> {
    return this.contactService.list()
  }

  @Get(':address')
  public async findByKey(@Param('address') address): Promise<Contact> {
    const result = await this.contactService.findByAddress(address)
    return result.orElseThrow(() => new NotFoundException())
  }

  @UseGuards(AuthGuard)
  @Delete()
  public async removeAll() {
    console.log('Remove all contacts')
    await this.contactService.removeAll()
  }

  @Get('did/:address')
  public async getDidDocument(
    @Param('address') address
  ): Promise<IDidDocumentSigned> {
    const result: Optional<Contact> = await this.contactService.findByAddress(
      address
    )
    return result
      .filter((contact: Contact) => !!contact.did)
      .map((contact: Contact) => contact.did)
      .orElseThrow(() => new NotFoundException())
  }
}
