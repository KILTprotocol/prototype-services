import { Body, Controller, Get, Inject, NotFoundException, Param, Post, Delete } from '@nestjs/common';
import { CType, CTypeService } from './interfaces/ctype.interfaces';


@Controller('ctype')
export class CTypesController {
  constructor(@Inject('CTypeService') private readonly cTypesService: CTypeService) {}

  @Get(':key')
  async get(@Param('key') key): Promise<CType> {
    console.log(`Search CType by key ${key}`);
    const result = await this.cTypesService.findByKey(key)
    return result.orElseThrow(() => new NotFoundException());
  }

  @Delete()
  async removeAll() {
    console.log('Remove all CTypes');
    await this.cTypesService.removeAll();
  }

  @Post()
  register(@Body() cType: CType) {
    this.cTypesService.register(cType);
  }
}
