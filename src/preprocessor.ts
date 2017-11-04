import {Compiler, getConfig} from './compiler'

let compiler: Compiler

function setup() {
    const options = getConfig()
    
    compiler = new Compiler(options)
    
}

setup()



export function process(
    src: string,
    path: string
){
    
    const res = compiler.emitFile(path)
    // console.log(res)
    return res.text



}

// export function getCacheKey() {
//     return 'asd'
// }
