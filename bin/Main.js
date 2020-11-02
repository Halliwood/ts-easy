"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var fs = __importStar(require("fs"));
var path = require("path");
var TsImporter_1 = require("./ts/TsImporter");
var TsAnalysor_1 = require("./ts/TsAnalysor");
var parser = require("@typescript-eslint/typescript-estree");
var As2TsPhase;
(function (As2TsPhase) {
    As2TsPhase[As2TsPhase["Analyse"] = 0] = "Analyse";
    As2TsPhase[As2TsPhase["Make"] = 1] = "Make";
})(As2TsPhase || (As2TsPhase = {}));
var Main = /** @class */ (function () {
    function Main() {
    }
    /**不支持内联函数、函数语句、单行声明多个成员变量 */
    Main.prototype.checkImports = function (inputPath, outputPath, module) {
        var startAt = (new Date()).getTime();
        this.inputFolder = inputPath;
        this.outputFolder = outputPath;
        this.transOption = {};
        this.transOption.module = module;
        if (!this.transOption.tmpRoot) {
            this.transOption.tmpRoot = 'tmp/';
        }
        this.tmpTsDir = this.transOption.tmpRoot + '/ts/';
        this.tmpAstDir = this.transOption.tmpRoot + '/ast/';
        if (!fs.existsSync(this.tmpTsDir))
            fs.mkdirSync(this.tmpTsDir, { recursive: true });
        if (!fs.existsSync(this.tmpAstDir))
            fs.mkdirSync(this.tmpAstDir, { recursive: true });
        if (!this.tsAnalysor) {
            this.tsAnalysor = new TsAnalysor_1.TsAnalysor(this.transOption);
            this.tsMaker = new TsImporter_1.TsImporter(this.tsAnalysor, this.transOption);
        }
        var inputStat = fs.statSync(inputPath);
        if (inputStat.isFile()) {
            this.doTranslateFile(inputPath, As2TsPhase.Analyse);
            this.dumpAnalysor();
            this.doTranslateFile(inputPath, As2TsPhase.Make);
        }
        else {
            this.readDir(inputPath, As2TsPhase.Analyse);
            this.dumpAnalysor();
            this.readDir(inputPath, As2TsPhase.Make);
        }
        var now = (new Date()).getTime();
        console.log('translation finished, %fs costed.', ((now - startAt) / 1000).toFixed(1));
    };
    Main.prototype.readDir = function (dirPath, phase) {
        var files = fs.readdirSync(dirPath);
        for (var i = 0, len = files.length; i < len; i++) {
            var filename = files[i];
            var filePath = path.join(dirPath, filename);
            var fileStat = fs.statSync(filePath);
            if (fileStat.isFile()) {
                var fileExt = path.extname(filename).toLowerCase();
                if ('.ts' == fileExt) {
                    this.doTranslateFile(filePath, phase);
                }
            }
            else {
                this.readDir(filePath, phase);
            }
        }
    };
    Main.prototype.doTranslateFile = function (filePath, phase) {
        // if(filePath.indexOf('DevRoot.ts')<0) return;
        var relativePath = path.relative(this.inputFolder, filePath);
        var tmpAstPath = this.tmpAstDir + relativePath.replace('.ts', '.json');
        if (phase == As2TsPhase.Analyse) {
            console.log('\x1B[1A\x1B[Kparsing: %s', filePath);
            var tsContent = fs.readFileSync(filePath, 'utf-8');
            if (this.transOption.tmpRoot) {
                var tmpTsPath = this.tmpTsDir + relativePath;
                var tmpTsPP = path.parse(tmpTsPath);
                if (!fs.existsSync(tmpTsPP.dir))
                    fs.mkdirSync(tmpTsPP.dir, { recursive: true });
                fs.writeFileSync(tmpTsPath, tsContent);
            }
            // 分析语法树
            var ast = parser.parse(tsContent, { loc: true }); //, {loc: true, range: true}
            if (this.transOption.tmpRoot) {
                var tmpAstPP = path.parse(tmpAstPath);
                if (!fs.existsSync(tmpAstPP.dir))
                    fs.mkdirSync(tmpAstPP.dir, { recursive: true });
                fs.writeFileSync(tmpAstPath, JSON.stringify(ast));
            }
            this.tsAnalysor.collect(ast, this.inputFolder, filePath);
        }
        else {
            // if(filePath.indexOf('Device.ts')<0) return;
            console.log('\x1B[1A\x1B[Kchecking: %s', filePath);
            var astContent = fs.readFileSync(tmpAstPath, 'utf-8');
            this.tsMaker.check(JSON.parse(astContent), this.inputFolder, filePath);
        }
    };
    Main.prototype.dumpAnalysor = function () {
        var analysorInfoPath = this.transOption.tmpRoot + '/analysor.txt';
        fs.writeFileSync(analysorInfoPath, this.tsAnalysor.toString());
    };
    return Main;
}());
exports.default = Main;
