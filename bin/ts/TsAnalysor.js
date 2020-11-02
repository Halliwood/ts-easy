"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TsAnalysor = exports.ClassInfo = void 0;
var typescript_estree_1 = require("@typescript-eslint/typescript-estree");
var util = require("util");
var path = require("path");
var Strings_1 = require("../Strings");
var ClassInfo = /** @class */ (function () {
    function ClassInfo() {
    }
    Object.defineProperty(ClassInfo.prototype, "fullName", {
        get: function () {
            if (!this.module)
                return this.name;
            return this.module + '.' + this.name;
        },
        enumerable: false,
        configurable: true
    });
    ClassInfo.prototype.toString = function () {
        return this.fullName + ': ' + this.file;
    };
    return ClassInfo;
}());
exports.ClassInfo = ClassInfo;
var TsAnalysor = /** @class */ (function () {
    function TsAnalysor(option) {
        this.classNameMap = {};
        this.importedMap = {};
        this.option = option || {};
    }
    TsAnalysor.prototype.collect = function (ast, inputFolder, filePath) {
        this.filePath = filePath;
        this.relativePath = path.relative(inputFolder, filePath);
        this.dirname = path.dirname(filePath);
        if (filePath.match(/\.d\.ts$/)) {
            this.fileModule = '';
        }
        else {
            this.fileModule = path.relative(inputFolder, this.dirname).replace(/\\+/g, '.').replace(/\.$/, '');
        }
        this.importedMap[this.filePath] = {};
        this.processAST(ast);
    };
    TsAnalysor.prototype.getImportedMap = function (filePath) {
        return this.importedMap[filePath];
    };
    TsAnalysor.prototype.processAST = function (ast) {
        switch (ast.type) {
            case typescript_estree_1.AST_NODE_TYPES.ClassDeclaration:
                this.processClassDeclaration(ast);
                break;
            case typescript_estree_1.AST_NODE_TYPES.ClassExpression:
                this.processClassExpression(ast);
                break;
            case typescript_estree_1.AST_NODE_TYPES.ExportNamedDeclaration:
                this.processExportNamedDeclaration(ast);
                break;
            case typescript_estree_1.AST_NODE_TYPES.ImportDeclaration:
                this.processImportDeclaration(ast);
                break;
            case typescript_estree_1.AST_NODE_TYPES.Program:
                this.processProgram(ast);
                break;
            case typescript_estree_1.AST_NODE_TYPES.TSImportEqualsDeclaration:
                this.processTSImportEqualsDeclaration(ast);
                break;
            case typescript_estree_1.AST_NODE_TYPES.TSInterfaceDeclaration:
                this.processTSInterfaceDeclaration(ast);
                break;
            case typescript_estree_1.AST_NODE_TYPES.TSModuleBlock:
                this.processTSModuleBlock(ast);
                break;
            case typescript_estree_1.AST_NODE_TYPES.TSModuleDeclaration:
                this.processTSModuleDeclaration(ast);
                break;
            default:
                break;
        }
    };
    TsAnalysor.prototype.processClassDeclaration = function (ast) {
        if (!ast.id) {
            this.assert(false, ast, 'Class name is necessary!');
        }
        var className = this.codeFromAST(ast.id);
        var info = new ClassInfo();
        info.name = className;
        info.module = this.crtModule;
        info.file = this.filePath;
        this.classNameMap[className] = info;
    };
    TsAnalysor.prototype.processClassExpression = function (ast) {
        this.processClassDeclaration(ast);
    };
    TsAnalysor.prototype.processExportNamedDeclaration = function (ast) {
        ast.declaration.__exported = true;
        if (ast.__module) {
            ast.declaration.__module = ast.__module;
        }
        this.processAST(ast.declaration);
    };
    TsAnalysor.prototype.processImportDeclaration = function (ast) {
        var sourceValue = ast.source.value;
        for (var i = 0, len = ast.specifiers.length; i < len; i++) {
            var ss = this.codeFromAST(ast.specifiers[i]);
            if (this.filePath.includes('CommonForm')) {
                console.log('import found: %s in %s', ss, this.fileModule);
            }
            this.importedMap[this.filePath][ss] = sourceValue;
        }
    };
    TsAnalysor.prototype.processProgram = function (ast) {
        for (var i = 0, len = ast.body.length; i < len; i++) {
            var stm = ast.body[i];
            this.processAST(stm);
        }
    };
    TsAnalysor.prototype.processTSImportEqualsDeclaration = function (ast) {
        var idStr = this.codeFromAST(ast.id);
        this.importedMap[this.filePath][idStr] = this.codeFromAST(ast.moduleReference);
    };
    TsAnalysor.prototype.processTSInterfaceDeclaration = function (ast) {
        var className = this.codeFromAST(ast.id);
        var info = new ClassInfo();
        info.name = className;
        info.module = this.crtModule;
        info.file = this.filePath;
        this.classNameMap[className] = info;
    };
    TsAnalysor.prototype.processTSModuleBlock = function (ast) {
        for (var i = 0, len = ast.body.length; i < len; i++) {
            this.processAST(ast.body[i]);
        }
        this.crtModule = null;
    };
    TsAnalysor.prototype.processTSModuleDeclaration = function (ast) {
        var idStr = this.codeFromAST(ast.id);
        if (!this.crtModule) {
            this.crtModule = idStr;
        }
        else {
            this.crtModule += '.' + idStr;
        }
        this.processAST(ast.body);
    };
    TsAnalysor.prototype.codeFromAST = function (ast) {
        var str = '';
        switch (ast.type) {
            case typescript_estree_1.AST_NODE_TYPES.Identifier:
                str += this.codeFromIdentifier(ast);
                break;
            case typescript_estree_1.AST_NODE_TYPES.ImportDefaultSpecifier:
                str += this.codeFromImportDefaultSpecifier(ast);
                break;
            case typescript_estree_1.AST_NODE_TYPES.ImportSpecifier:
                str += this.codeFromImportSpecifier(ast);
                break;
            case typescript_estree_1.AST_NODE_TYPES.MemberExpression:
                str += this.codeFromMemberExpression(ast);
                break;
            case typescript_estree_1.AST_NODE_TYPES.TSQualifiedName:
                str += this.codeFromTSQualifiedName(ast);
                break;
            default:
                this.assert(false, ast, '[ERROR]Analyse ast error, not support: ' + ast.type);
                break;
        }
        return str;
    };
    TsAnalysor.prototype.codeFromIdentifier = function (ast) {
        return ast.name;
    };
    TsAnalysor.prototype.codeFromImportDefaultSpecifier = function (ast) {
        var str = this.codeFromAST(ast.local);
        return str;
    };
    TsAnalysor.prototype.codeFromImportSpecifier = function (ast) {
        var str = this.codeFromAST(ast.local);
        return str;
    };
    TsAnalysor.prototype.codeFromMemberExpression = function (ast) {
        var objStr = this.codeFromAST(ast.object);
        var str = objStr;
        var propertyStr = this.codeFromAST(ast.property);
        if (ast.computed) {
            str += '[' + propertyStr + ']';
        }
        else {
            str += '.' + propertyStr;
        }
        return str;
    };
    TsAnalysor.prototype.codeFromTSQualifiedName = function (ast) {
        return this.codeFromAST(ast.left) + '.' + this.codeFromAST(ast.right);
    };
    TsAnalysor.prototype.assert = function (cond, ast, message) {
        if (message === void 0) { message = null; }
        if (!cond) {
            if (ast) {
                console.log(util.inspect(ast, true, 2));
            }
            console.log('\x1B[36m%s\x1B[0m\x1B[33m%d:%d\x1B[0m - \x1B[31merror\x1B[0m: %s', this.filePath, ast.loc ? ast.loc.start.line : -1, ast.loc ? ast.loc.start.column : -1, message ? message : 'Error');
            console.log(Strings_1.TsEasyHints.ContactMsg);
            throw new Error('[As2TS]Something wrong encountered.');
        }
    };
    TsAnalysor.prototype.toString = function () {
        var str = '';
        for (var className in this.classNameMap) {
            str += this.classNameMap[className].toString() + '\n';
        }
        return str;
    };
    return TsAnalysor;
}());
exports.TsAnalysor = TsAnalysor;
