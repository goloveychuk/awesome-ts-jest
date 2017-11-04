
import {Reflective, getPropType, Types} from 'tsruntime'

import {StringArray, Enum} from './b'



@Reflective
class SomeCls {

    b: StringArray
}


describe('modules', () => {
    it('should know const enum val', ()=> {
        let a = Enum.a
        expect(a).toEqual('someenumval')
    })

    it('should works custom custom transformer', ()=> {
        const type = getPropType(SomeCls, 'b') as Types.ReferenceType
        expect(type.kind).toEqual(Types.TypeKind.Reference)

        expect(type.type).toEqual(Array)
        expect(type.arguments).toEqual([{kind: Types.TypeKind.String}])
    })
})