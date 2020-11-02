import { Accessibility, ArrayExpression, ArrayPattern, ArrowFunctionExpression, AssignmentExpression, AssignmentPattern, AwaitExpression, BigIntLiteral, BinaryExpression, BlockStatement, BreakStatement, CallExpression, CatchClause, ClassBody, ClassDeclaration, ClassExpression, ClassProperty, ConditionalExpression, ContinueStatement, DebuggerStatement, Decorator, DoWhileStatement, EmptyStatement, EntityName, ExportAllDeclaration, ExportDefaultDeclaration, ExportNamedDeclaration, ExportSpecifier, ExpressionStatement, ForInStatement, ForOfStatement, ForStatement, FunctionDeclaration, FunctionExpression, Identifier, IfStatement, ImportDeclaration, ImportDefaultSpecifier, ImportNamespaceSpecifier, ImportSpecifier, LabeledStatement, Literal, LogicalExpression, MemberExpression, MetaProperty, MethodDefinition, NewExpression, ObjectExpression, ObjectPattern, Program, Property, RestElement, ReturnStatement, SequenceExpression, SpreadElement, Super, SwitchCase, SwitchStatement, TaggedTemplateExpression, TemplateElement, TemplateLiteral, ThisExpression, ThrowStatement, TryStatement, UnaryExpression, UpdateExpression, VariableDeclaration, VariableDeclarator, WhileStatement, WithStatement, YieldExpression, TSEnumDeclaration, BindingName, TSAsExpression, TSClassImplements, TSInterfaceDeclaration, TSTypeAssertion, TSModuleDeclaration, TSModuleBlock, TSDeclareFunction, TSAbstractMethodDefinition, TSInterfaceBody, TSImportEqualsDeclaration, TSMethodSignature, TSQualifiedName, TSTypeAnnotation, TSTypeParameterInstantiation, TSTypeReference, TSVoidKeyword, BaseNode } from '@typescript-eslint/types/dist/ts-estree';
import { AST_NODE_TYPES } from '@typescript-eslint/typescript-estree';
import util = require('util');
import path = require('path');
import { TsEasyOption } from '../../typings';
import { TsEasyHints } from '../Strings';

export class ClassInfo {
    name: string;
    module: string;
    file: string;

    get fullName(): string {
        if(!this.module) return this.name;
        return this.module + '.' + this.name;
    }

    toString(): string {
        return this.fullName + ': ' + this.file;
    }
}

export class TsAnalysor {
    // 选项
    private option: TsEasyOption;

    public classNameMap: {[name: string]: ClassInfo} = {};
    private crtModule: string;

    private filePath: string;
    private dirname: string;
    private relativePath: string;
    private fileModule: string;
    private importedMap: {[filePath: string]: {[key: string]: string}} = {};

    constructor(option: TsEasyOption) {
        this.option = option || {};
    }

    collect(ast: any, inputFolder: string, filePath: string) {
        this.filePath = filePath;
        this.relativePath = path.relative(inputFolder, filePath);
        this.dirname = path.dirname(filePath);
        if(filePath.match(/\.d\.ts$/)) {
            this.fileModule = '';
        } else {
            this.fileModule = path.relative(inputFolder, this.dirname).replace(/\\+/g, '.').replace(/\.$/, '');
        }
        this.importedMap[this.filePath] = {};
        this.processAST(ast);
    }

    getImportedMap(filePath: string): {[key: string]: string} {
        return this.importedMap[filePath];
    }

    private processAST(ast: any) {
        switch (ast.type) {
            case AST_NODE_TYPES.ClassDeclaration:
                this.processClassDeclaration(ast);
                break;

            case AST_NODE_TYPES.ClassExpression:
                this.processClassExpression(ast);
                break;

            case AST_NODE_TYPES.ExportNamedDeclaration:
                this.processExportNamedDeclaration(ast);
                break;

            case AST_NODE_TYPES.ImportDeclaration:
                this.processImportDeclaration(ast);
                break;

            case AST_NODE_TYPES.Program:
                this.processProgram(ast);
                break;

            case AST_NODE_TYPES.TSImportEqualsDeclaration:
                this.processTSImportEqualsDeclaration(ast);
                break;

            case AST_NODE_TYPES.TSInterfaceDeclaration:
                this.processTSInterfaceDeclaration(ast);
                break;

            case AST_NODE_TYPES.TSModuleBlock:
                this.processTSModuleBlock(ast);
                break;

            case AST_NODE_TYPES.TSModuleDeclaration:
                this.processTSModuleDeclaration(ast);
                break;

            default:
                break;
        }
    }

    private processClassDeclaration(ast: ClassDeclaration) {
        if (!ast.id) {
            this.assert(false, ast, 'Class name is necessary!');
        }
        let className = this.codeFromAST(ast.id);
        let info: ClassInfo = new ClassInfo();
        info.name = className;
        info.module = this.crtModule;
        info.file = this.filePath;
        this.classNameMap[className] = info;
    }

    private processClassExpression(ast: ClassExpression) {
        this.processClassDeclaration(ast as any);
    }

    private processExportNamedDeclaration(ast: ExportNamedDeclaration) {
        (ast.declaration as any).__exported = true;
        if ((ast as any).__module) {
            (ast.declaration as any).__module = (ast as any).__module;
        }
        this.processAST(ast.declaration);
    }

    private processImportDeclaration(ast: ImportDeclaration) {
        let sourceValue = ast.source.value as string;
        for(let i = 0, len = ast.specifiers.length; i < len; i++) {
            let ss = this.codeFromAST(ast.specifiers[i]);
            if(this.filePath.includes('CommonForm')) {
                console.log('import found: %s in %s', ss, this.fileModule);
            }
            this.importedMap[this.filePath][ss] = sourceValue;
        }
    }

    private processProgram(ast: Program) {
        for (let i = 0, len = ast.body.length; i < len; i++) {
            let stm = ast.body[i];
            this.processAST(stm);
        }
    }

    private processTSImportEqualsDeclaration(ast: TSImportEqualsDeclaration) {
        let idStr = this.codeFromAST(ast.id);
        this.importedMap[this.filePath][idStr] = this.codeFromAST(ast.moduleReference);
    }

    private processTSInterfaceDeclaration(ast: TSInterfaceDeclaration) {
        let className = this.codeFromAST(ast.id);
        let info: ClassInfo = new ClassInfo();
        info.name = className;
        info.module = this.crtModule;
        info.file = this.filePath;
        this.classNameMap[className] = info;
    }

    private processTSModuleBlock(ast: TSModuleBlock) {
        for(let i = 0, len = ast.body.length; i < len; i++) {
            this.processAST(ast.body[i]);
        }
        this.crtModule = null;        
    }

    private processTSModuleDeclaration(ast: TSModuleDeclaration) {
        let idStr = this.codeFromAST(ast.id);
        if(!this.crtModule) {
            this.crtModule = idStr;
        } else {
            this.crtModule += '.' + idStr;
        }
        this.processAST(ast.body);
    }

    private codeFromAST(ast: any): string {
        let str = '';
        switch(ast.type) {
            case AST_NODE_TYPES.Identifier:
                str += this.codeFromIdentifier(ast);
                break;
            
            case AST_NODE_TYPES.ImportDefaultSpecifier:
                str += this.codeFromImportDefaultSpecifier(ast);
                break;
            
            case AST_NODE_TYPES.ImportSpecifier:
                str += this.codeFromImportSpecifier(ast);
                break;

            case AST_NODE_TYPES.MemberExpression:
                str += this.codeFromMemberExpression(ast);
                break;

            case AST_NODE_TYPES.TSQualifiedName:
                str += this.codeFromTSQualifiedName(ast);
                break;
            
            default:
                this.assert(false, ast, '[ERROR]Analyse ast error, not support: ' + (ast as any).type);
                break;
        }
        return str;
    }
    
    private codeFromIdentifier(ast: Identifier): string {
        return ast.name;
    }

    private codeFromImportDefaultSpecifier(ast: ImportDefaultSpecifier): string {
        let str = this.codeFromAST(ast.local);
        return str;
    }

    private codeFromImportSpecifier(ast: ImportSpecifier): string {
        let str = this.codeFromAST(ast.local);
        return str;
    }

    private codeFromMemberExpression(ast: MemberExpression): string {
        let objStr = this.codeFromAST(ast.object);
        let str = objStr;
        let propertyStr = this.codeFromAST(ast.property);
        if (ast.computed) {
            str += '[' + propertyStr + ']';
        } else {
            str += '.' + propertyStr;
        }
        return str;
    }

    private codeFromTSQualifiedName(ast: TSQualifiedName): string {
        return this.codeFromAST(ast.left) + '.' + this.codeFromAST(ast.right);
    }
  
    private assert(cond: boolean, ast: BaseNode, message: string = null) {
        if (!cond) {
            if (ast) {
                console.log(util.inspect(ast, true, 2));
            }
            console.log('\x1B[36m%s\x1B[0m\x1B[33m%d:%d\x1B[0m - \x1B[31merror\x1B[0m: %s', this.filePath, ast.loc ? ast.loc.start.line : -1, ast.loc ? ast.loc.start.column : -1, message ? message : 'Error');
            console.log(TsEasyHints.ContactMsg);
            throw new Error('[As2TS]Something wrong encountered.');
        }
    }

    toString(): string {
        let str = '';
        for(let className in this.classNameMap) {
            str += this.classNameMap[className].toString() + '\n';
        }
        return str;
    }
}