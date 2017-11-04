import * as ts from 'typescript'
import * as fs from "fs";
import * as path from 'path';
import tsruntimeTransformer from 'tsruntime/dist/transformer';
import * as utils from './utils';


function formatTscParserErrors(errors: ts.Diagnostic[]) {
    return errors.map(s => JSON.stringify(s, null, 4)).join('\n');
}

interface File {
    path: string
    version: number
}

class Files {
    private files: Map<string, File>
    constructor() {
        this.files = new Map()
    }
    set(path: string, file: File) {
        this.files.set(path, file)
    }
    get(path: string) {
        return this.files.get(path)
    }
    getFileNames() {
        return Array.from(this.files.values()).map(f => f.path)
    }
    getScriptVersion(path: string) {
        const f = this.get(path)
        if (f === undefined) {
            return ""
        }
        return f.version.toString()
    }
}


export class Compiler {
    private options: ts.CompilerOptions
    private service: ts.LanguageService
    private files: Files

    constructor(options: ts.CompilerOptions) {
        this.files = new Files()
        // this.files.set('./tests/modules.test.ts', {path: './tests/modules.test.ts', version: 0})
        this.options = options
        this.service = this.createServiceHost()


    }
    private createServiceHost() {
        const { files, options } = this;

        let service: ts.LanguageService

        class ServiceHost implements ts.LanguageServiceHost {
            getCustomTransformers() {
                return {
                    before: [tsruntimeTransformer(service.getProgram())]
                }
            }
            getScriptFileNames() {
                return files.getFileNames()
            }
            getScriptVersion(fileName: string) {
                return files.getScriptVersion(fileName)
            }
            getScriptSnapshot(fileName: string) {
                if (!fs.existsSync(fileName)) {
                    return undefined;
                }

                return ts.ScriptSnapshot.fromString(fs.readFileSync(fileName).toString());
            }
            getCurrentDirectory = () => process.cwd()
            getCompilationSettings = () => options
            getDefaultLibFileName = (options: ts.CompilerOptions) => ts.getDefaultLibFilePath(options)
            fileExists = ts.sys.fileExists
            readFile = ts.sys.readFile
            readDirectory = ts.sys.readDirectory
            // resolveTypeReferenceDirectives(typeDirectiveNames: string[], containingFile: string) {
            //     const resolved = typeDirectiveNames.map(directive =>
            //         ts.resolveTypeReferenceDirective(directive, containingFile, options, ts.sys)
            //             .resolvedTypeReferenceDirective);

            //     // resolved.forEach(res => {
            //     if (res && res.resolvedFileName) {
            //         fileDeps.add(containingFile, res.resolvedFileName);
            //     }
            // });

            // return resolved;
            // }
        }


        service = ts.createLanguageService(new ServiceHost(), ts.createDocumentRegistry())

        return service
    }

    emitFile(fileName: string) {
        this.files.set(fileName, { path: fileName, version: 0 })

        let output = this.service.getEmitOutput(fileName);

        if (!output.emitSkipped) {
            console.log(`Emitting ${fileName}`);
        }
        else {
            console.log(`Emitting ${fileName} failed`);
            this.logErrors(fileName);
        }
        if (output.outputFiles.length === 0) {
            throw new Error(`outpufiles.length==0, ${output}`)
        }
        const res = utils.findResultFor(fileName, output)
        return res
    }

    private logErrors(fileName: string) {
        let allDiagnostics = this.service.getCompilerOptionsDiagnostics()
            .concat(this.service.getSyntacticDiagnostics(fileName))
            .concat(this.service.getSemanticDiagnostics(fileName));

        allDiagnostics.forEach(diagnostic => {
            let message = ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n");
            if (diagnostic.file) {
                let { line, character } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start!);
                console.log(`  Error ${diagnostic.file.fileName} (${line + 1},${character + 1}): ${message}`);
            }
            else {
                console.log(`  Error: ${message}`);
            }
        });
    }
}


export function getConfig() {
    const configPath = ts.findConfigFile('./', ts.sys.fileExists)
    const loaded = ts.readConfigFile(configPath, file => {
        const read = ts.sys.readFile(file);
        if (!read) {
            throw new Error(
                `ENOENT: no such file or directory, open '${configPath}'`,
            );
        }
        return read;
    });

    if (loaded.error) {
        throw new Error(JSON.stringify(loaded.error, null, 4));
    }
    const basePath = path.dirname(configPath); // equal to "getDirectoryPath" from ts, at least in our case.
    const parsedConfig = ts.parseJsonConfigFileContent(
        loaded.config,
        ts.sys,
        basePath,
    );

    if (parsedConfig.errors.length > 0) {
        const formattedErrors = formatTscParserErrors(parsedConfig.errors);
        throw new Error(
            `Some errors occurred while attempting to read from ${configPath}: ${formattedErrors}`,
        );
    }
    return parsedConfig.options
}

