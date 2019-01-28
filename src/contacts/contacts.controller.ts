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
} from '@nestjs/common'
import {
  Contact,
  ContactsService
} from './interfaces/contacts.interfaces'

@Controller('contacts')
export class ContactsController {
  constructor(
    @Inject('ContactsService') private readonly contactService: ContactsService
  ) {
  }

  @Post()
  public async add(@Body() contact: Contact) {
    if (!contact.publicIdentity.address) {
      throw new BadRequestException('no address')
    } else if (!contact.publicIdentity.boxPublicKeyAsHex) {
      throw new BadRequestException('no boxPublicKeyAsHex')
    } else if (!contact.metaData.name) {
      throw new BadRequestException('no name')
    }
    this.contactService.add(contact)
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

  @Delete()
  public async removeAll() {
    console.log('Remove all contacts')
    await this.contactService.removeAll()
  }
}
