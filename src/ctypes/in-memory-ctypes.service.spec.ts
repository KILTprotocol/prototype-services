import { InMemoryCTypesService } from './in-memory-ctypes.service';
import { CType } from './interfaces/ctype.interfaces';

describe('InMemoryCTypesService', () => {
    const cTypesInMemoryService: InMemoryCTypesService = new InMemoryCTypesService();

    describe('root', () => {
        it('should create and find cType(s)', async () => {
            const cType = {
                key: '999',
                name: 'myCType',
                author: 'apasch',
                definition: { key: '999' }
            } as CType;
            await cTypesInMemoryService.register(cType);
            const result = await cTypesInMemoryService.findByKey('999');
            expect(result.isPresent).toBe(true);
            result.ifPresent((foundCType) => {
                expect(foundCType.key).toBe('999');
                expect(foundCType.name).toBe('myCType');
                expect(foundCType.author).toBe('apasch');
            });

            const results = await cTypesInMemoryService.findAll();
            expect(results.isPresent).toBe(true);
            results.ifPresent((ctypes) => {
                expect(ctypes[0]).toBe(result.get());
                expect(ctypes.length).toBe(1);
            });
        });
    });
});
