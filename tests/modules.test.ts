
import {Reflective} from 'tsruntime'

import {B, E} from './b'


let a = E.a
console.log(a)

@Reflective
class A {

    b: B
}

