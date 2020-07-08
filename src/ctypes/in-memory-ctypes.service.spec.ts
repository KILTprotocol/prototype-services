import { InMemoryCTypesService } from './in-memory-ctypes.service'
import { CType } from './interfaces/ctype.interfaces'
import Optional from 'typescript-optional'
import { ICTypeMetadata } from '@kiltprotocol/sdk-js'

describe('InMemoryCTypesService', () => {
  const cTypesInMemoryService: InMemoryCTypesService = new InMemoryCTypesService()

  describe('root', () => {
    it('should create and find cType(s)', async () => {
      const meta: ICTypeMetadata['metadata'] = {
        title: {
          default: 'myCTYPE',
        },
        description: {
          default: 'myCTYPE description',
        },
        properties: {},
      }
      const cType: CType = {
        cType: {
          hash: '999',
          schema: {
            $id:  '',
            title: '',
            $schema: '',
            properties: {},
            type: 'object',
          },
          owner: 'apasch',
        },
        metaData: {
          metadata: meta,
          ctypeHash: '999',
        },
      }

      await cTypesInMemoryService.register(cType)
      const result: Optional<CType> = await cTypesInMemoryService.findByHash(
        '999'
      )
      expect(result.isPresent).toBe(true)
      result.ifPresent((foundCType: CType) => {
        expect(foundCType.cType.hash).toBe('999')
        expect(foundCType.metaData.metadata.title.default).toBe('myCTYPE')
        expect(foundCType.cType.owner).toBe('apasch')
      })

      const results: CType[] = await cTypesInMemoryService.findAll()
      console.log(JSON.stringify(results, null, 4))
      expect(results[0]).toBe(result.get())
      expect(results.length).toBe(1)
    })
  })
})
