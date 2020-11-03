import * as fs from 'fs';
import path = require('path');
import {TsImporter} from './ts/TsImporter';
import {TsAnalysor} from './ts/TsAnalysor';
import parser = require('@typescript-eslint/typescript-estree');
import { TsEasyOption } from '../typings';

enum As2TsPhase {
    Analyse, 
    Make
}

export default class Main {    
    private tsAnalysor: TsAnalysor;
    private tsImporter: TsImporter;

    private inputFolder: string;
    private transOption: TsEasyOption;
    
    private tmpTsDir: string;
    private tmpAstDir: string;

    /**不支持内联函数、函数语句、单行声明多个成员变量 */
    checkImports(inputPath: string, checkTypes: string = '', module: boolean = false) {
        let startAt = (new Date()).getTime();
        this.inputFolder = inputPath;
        
        this.transOption = {};
        this.transOption.module = module;
        this.transOption.checkTypes = checkTypes.split(/,\s*/);
        if(!this.transOption.tmpRoot) {
            this.transOption.tmpRoot = 'tmp/';
        }
        this.tmpTsDir = this.transOption.tmpRoot + '/ts/';
        this.tmpAstDir = this.transOption.tmpRoot + '/ast/';
        if (!fs.existsSync(this.tmpTsDir)) fs.mkdirSync(this.tmpTsDir, { recursive: true });
        if (!fs.existsSync(this.tmpAstDir)) fs.mkdirSync(this.tmpAstDir, { recursive: true });

        if(!this.tsAnalysor) {
            this.tsAnalysor = new TsAnalysor(this.transOption);
            this.tsImporter = new TsImporter(this.tsAnalysor, this.transOption);
        }

        let inputStat = fs.statSync(inputPath);
        if(inputStat.isFile()) {
            this.doTranslateFile(inputPath, As2TsPhase.Analyse);
            this.dumpAnalysor();
            this.doTranslateFile(inputPath, As2TsPhase.Make);
        } else {
            this.readDir(inputPath, As2TsPhase.Analyse);
            this.dumpAnalysor();
            this.readDir(inputPath, As2TsPhase.Make);
        }
        let now = (new Date()).getTime();
        console.log('translation finished, %fs costed.', ((now - startAt) / 1000).toFixed(1));
    }

    private readDir(dirPath: string, phase: As2TsPhase) {
        let files = fs.readdirSync(dirPath);
        for(let i = 0, len = files.length; i < len; i++) {
            let filename = files[i];
            let filePath = path.join(dirPath, filename);
            let fileStat = fs.statSync(filePath);
            if (fileStat.isFile()) {
                let fileExt = path.extname(filename).toLowerCase();
                if ('.ts' == fileExt) {
                    this.doTranslateFile(filePath, phase);
                }
            } else {
                this.readDir(filePath, phase);
            }
        }
    }

    private doTranslateFile(filePath: string, phase: As2TsPhase) {
        // if(filePath.indexOf('DevRoot.ts')<0) return;
        let relativePath = path.relative(this.inputFolder, filePath);

        let tmpAstPath = this.tmpAstDir + relativePath.replace('.ts', '.json');
        if(phase == As2TsPhase.Analyse) {
            console.log('\x1B[1A\x1B[Kparsing: %s', filePath);    
            let tsContent = fs.readFileSync(filePath, 'utf-8');
            if(this.transOption.tmpRoot) {
                let tmpTsPath = this.tmpTsDir + relativePath;
                let tmpTsPP = path.parse(tmpTsPath);
                if (!fs.existsSync(tmpTsPP.dir)) fs.mkdirSync(tmpTsPP.dir, { recursive: true });
                fs.writeFileSync(tmpTsPath, tsContent);
            }
        
            // 分析语法树
            const ast = parser.parse(tsContent, {loc: true}); //, {loc: true, range: true}
            if(this.transOption.tmpRoot) {
                let tmpAstPP = path.parse(tmpAstPath);
                if (!fs.existsSync(tmpAstPP.dir)) fs.mkdirSync(tmpAstPP.dir, { recursive: true });
                fs.writeFileSync(tmpAstPath, JSON.stringify(ast));
            }
            this.tsAnalysor.collect(ast, this.inputFolder, filePath);
        } else {
            // if(filePath.indexOf('Device.ts')<0) return;
            console.log('\x1B[1A\x1B[Kchecking: %s', filePath);    
            let astContent = fs.readFileSync(tmpAstPath, 'utf-8');
            this.tsImporter.check(JSON.parse(astContent), this.inputFolder, filePath);
        }
    }

    private dumpAnalysor() {
        let analysorInfoPath = this.transOption.tmpRoot + '/analysor.txt';
        fs.writeFileSync(analysorInfoPath, this.tsAnalysor.toString());
    }
}