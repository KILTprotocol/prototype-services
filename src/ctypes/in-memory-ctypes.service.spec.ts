import { InMemoryCTypesService } from './in-memory-ctypes.service';
import { CType } from './interfaces/ctype.interfaces';


describe('InMemoryCTypesService', () => {
    let cTypesInMemoryService: InMemoryCTypesService = new InMemoryCTypesService();

    describe('root', () => {
        it('should create and find cType',async () => {
            const cType = <CType>{
                key: '999',
                name: 'myCType',
                author: 'apasch'
            }
            await cTypesInMemoryService.register(cType);
            const result = await cTypesInMemoryService.findByKey('999')
            expect(result.isPresent).toBe(true)
            result.ifPresent((foundCType) => {
                expect(foundCType.key).toBe('999')
                expect(foundCType.name).toBe('myCType')
                expect(foundCType.author).toBe('apasch')
            });
        });
    });
});
