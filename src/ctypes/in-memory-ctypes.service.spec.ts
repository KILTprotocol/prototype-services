import { InMemoryCTypesService } from './in-memory-ctypes.service'
import { CType } from './interfaces/ctype.interfaces'
import Optional from 'typescript-optional'

describe('InMemoryCTypesService', () => {
  const cTypesInMemoryService: InMemoryCTypesService = new InMemoryCTypesService()

  describe('root', () => {
    it('should create and find cType(s)', async () => {
      const cType = {
        cType: {
          hash: '999',
          schema: {},
        },
        metaData: {
          author: 'apasch',
        },
      } as CType
      await cTypesInMemoryService.register(cType)
      const result: Optional<CType> = await cTypesInMemoryService.findByHash(
        '999'
      )
      expect(result.isPresent).toBe(true)
      result.ifPresent((foundCType: CType) => {
        expect(foundCType.cType.hash).toBe('999')
        // expect(foundCType.cType.metadata.title.default).toBe('myCTYPE')
        expect(foundCType.metaData.author).toBe('apasch')
      })

      const results: CType[] = await cTypesInMemoryService.findAll()
      expect(results[0]).toBe(result.get())
      expect(results.length).toBe(1)
    })
  })
})
