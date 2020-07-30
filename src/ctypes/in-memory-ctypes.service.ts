import { Injectable } from '@nestjs/common'
import Optional from 'typescript-optional'
import { AlreadyRegisteredException } from './exceptions/already-registered.exception'
import { CType, CTypeService } from './interfaces/ctype.interfaces'

@Injectable()
export class InMemoryCTypesService implements CTypeService {
  private readonly registration = new Map<string, CType>()

  public async findByHash(key: string): Promise<Optional<CType>> {
    const foundCType = this.registration.get(key)
    return Promise.resolve(Optional.ofNullable(foundCType))
  }

  public async findAll(): Promise<CType[]> {
    const ctypes = []
    this.registration.forEach(ctype => ctypes.push(ctype))
    return Promise.resolve(ctypes)
  }

  public async register(cType: CType): Promise<boolean> {
    const found = await this.findByHash(cType.cType.hash)
    if (found.isPresent) {
      return false
    } else {
      this.registration.set(cType.cType.hash, cType)
      return true
    }
  }

  public async removeAll(): Promise<void> {
    this.registration.clear()
  }
}
