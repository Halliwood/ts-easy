import * as fs from 'fs';
import { Accessibility, ArrayExpression, ArrayPattern, ArrowFunctionExpression, AssignmentExpression, AssignmentPattern, AwaitExpression, BigIntLiteral, BinaryExpression, BlockStatement, BreakStatement, CallExpression, CatchClause, ClassBody, ClassDeclaration, ClassExpression, ClassProperty, ConditionalExpression, ContinueStatement, DebuggerStatement, Decorator, DoWhileStatement, EmptyStatement, ExportAllDeclaration, ExportDefaultDeclaration, ExportNamedDeclaration, ExportSpecifier, ExpressionStatement, ForInStatement, ForOfStatement, ForStatement, FunctionDeclaration, FunctionExpression, Identifier, IfStatement, ImportDeclaration, ImportDefaultSpecifier, ImportNamespaceSpecifier, ImportSpecifier, LabeledStatement, Literal, LogicalExpression, MemberExpression, MetaProperty, MethodDefinition, NewExpression, ObjectExpression, ObjectPattern, Program, Property, RestElement, ReturnStatement, SequenceExpression, SpreadElement, Super, SwitchCase, SwitchStatement, TaggedTemplateExpression, TemplateElement, TemplateLiteral, ThisExpression, ThrowStatement, TryStatement, UnaryExpression, UpdateExpression, VariableDeclaration, VariableDeclarator, WhileStatement, WithStatement, YieldExpression, TSEnumDeclaration, BindingName, TSAsExpression, TSClassImplements, TSInterfaceDeclaration, TSTypeAssertion, TSModuleDeclaration, TSModuleBlock, TSDeclareFunction, TSAbstractMethodDefinition, TSImportEqualsDeclaration, TSInterfaceBody, TSMethodSignature, TSParenthesizedType, TSTypeAnnotation, TSTypeParameterInstantiation, TSTypeReference, TSVoidKeyword, BaseNode } from '@typescript-eslint/types/dist/ts-estree';
import { AST_NODE_TYPES } from '@typescript-eslint/typescript-estree';
import util = require('util');
import path = require('path');
import { TsEasyHints } from '../Strings';
import { TsAnalysor } from './TsAnalysor';
import { TsEasyOption } from '../../typings';

export class TsImporter {
    private readonly builtInTypes: string[] = ['number', 'string', 'boolean', 'any', 'Array', '[]', 'Object', 'void', 'Function', 'RegExp', 'Date', 'Error'];
    
    private option: TsEasyOption;
    private analysor: TsAnalysor;

    private inputFolder: string;
    private filePath: string;
    private dirname: string;
    private relativePath: string;
    private fileModule: string;

    private importedMap: {[key: string]: string};
    private declaredMap: {[name: string]: boolean};
    private allTypes: string[];

    constructor(analysor: TsAnalysor, option: TsEasyOption) {
        this.analysor = analysor;
        this.option = option;
    }

    check(ast: any, inputFolder: string, filePath: string) {
        this.allTypes = [];
        this.inputFolder = inputFolder;
        this.filePath = filePath;
        this.relativePath = path.relative(inputFolder, filePath);
        this.dirname = path.dirname(filePath);
        this.fileModule = path.relative(inputFolder, this.dirname).replace(/\\+/g, '.').replace(/\.$/, '');
        this.importedMap = this.analysor.getImportedMap(filePath);
        this.declaredMap = {};
        this.processAST(ast);

        let importStr = '';
        let usedTypeMap: {[typeName: string]: boolean} = {};
        for(let i = 0, len = this.allTypes.length; i < len; i++) {
            let type = this.allTypes[i];
            usedTypeMap[type] = true;
            if(!this.declaredMap[type] && !(type in this.importedMap) && !this.builtInTypes.includes(type)) {
                let classInfo = this.analysor.classNameMap[type];
                if(classInfo) {
                    // 需要import
                    if(!this.option.module) {
                        let mstr = path.relative(this.dirname, classInfo.file).replace(/\\+/g, '/');
                        if(!mstr) {
                            mstr = '.';
                        }
                        else if(mstr.charAt(0) != '.') {
                            mstr = './' + mstr;
                        }
                        mstr = mstr.replace(/\.(d\.)?ts$/, '');
                        importStr += 'import {' + type + '} from "' + mstr + '";\n';
                    } else {
                        let mstr = classInfo.module.replace(/\//g, '.');
                        if(mstr.charAt(mstr.length - 1) != '.') {
                            mstr += '.';
                        }
                        importStr += 'import ' + type + ' = ' + mstr + type + ';\n';
                    }
                } else {
                    console.warn('class not found: %s\n', type);
                }
            } 
        }
        if(importStr && this.option.module) {
            importStr = this.indent(importStr);
        }
        if(importStr) {
            let fileContent = fs.readFileSync(filePath, 'utf-8');
            // 查找import语句
            let importPos = fileContent.search(/\bimport\b /);
            if(importPos >= 0) {
                fileContent = fileContent.substr(0, importPos) + importStr + fileContent.substr(importPos);
            } else {
                fileContent = importStr + fileContent;
            }
            fs.writeFileSync(filePath, fileContent, 'utf-8');
        }
    }

    private processAST(ast: any) {
        this.assert(ast != null, ast, 'ast is null');
        switch (ast.type) {

            case AST_NODE_TYPES.ArrayExpression:
                this.processArrayExpression(ast);
                break;

            case AST_NODE_TYPES.ArrayPattern:
                this.processArrayPattern(ast);
                break;

            case AST_NODE_TYPES.ArrowFunctionExpression:
                this.processArrowFunctionExpression(ast);
                break;

            case AST_NODE_TYPES.AssignmentExpression:
                this.processAssignmentExpression(ast);
                break;

            case AST_NODE_TYPES.AssignmentPattern:
                this.processAssignmentPattern(ast);
                break;

            case AST_NODE_TYPES.AwaitExpression:
                this.processAwaitExpression(ast);
                break;

            // case AST_NODE_TYPES.BigIntLiteral:
            //     this.processBigIntLiteral(ast);
            //     break;

            case AST_NODE_TYPES.BinaryExpression:
                this.processBinaryExpression(ast);
                break;

            case AST_NODE_TYPES.BlockStatement:
                this.processBlockStatement(ast);
                break;

            case AST_NODE_TYPES.BreakStatement:
                this.processBreakStatement(ast);
                break;

            case AST_NODE_TYPES.CallExpression:
                this.processCallExpression(ast);
                break;

            case AST_NODE_TYPES.CatchClause:
                this.processCatchClause(ast);
                break;

            case AST_NODE_TYPES.ClassBody:
                this.processClassBody(ast);
                break;

            case AST_NODE_TYPES.ClassDeclaration:
                this.processClassDeclaration(ast);
                break;

            case AST_NODE_TYPES.ClassExpression:
                this.processClassExpression(ast);
                break;

            case AST_NODE_TYPES.ClassProperty:
                this.processClassProperty(ast);
                break;

            case AST_NODE_TYPES.ConditionalExpression:
                this.processConditionalExpression(ast);
                break;

            case AST_NODE_TYPES.ContinueStatement:
                this.processContinueStatement(ast);
                break;

            case AST_NODE_TYPES.DebuggerStatement:
                this.processDebuggerStatement(ast);
                break;

            case AST_NODE_TYPES.Decorator:
                this.processDecorator(ast);
                break;

            case AST_NODE_TYPES.DoWhileStatement:
                this.processDoWhileStatement(ast);
                break;

            case AST_NODE_TYPES.EmptyStatement:
                this.processEmptyStatement(ast);
                break;

            case AST_NODE_TYPES.ExportAllDeclaration:
                this.processExportAllDeclaration(ast);
                break;

            case AST_NODE_TYPES.ExportDefaultDeclaration:
                this.processExportDefaultDeclaration(ast);
                break;

            case AST_NODE_TYPES.ExportNamedDeclaration:
                this.processExportNamedDeclaration(ast);
                break;

            case AST_NODE_TYPES.ExportSpecifier:
                this.processExportSpecifier(ast);
                break;

            case AST_NODE_TYPES.ExpressionStatement:
                this.processExpressionStatement(ast);
                break;

            case AST_NODE_TYPES.ForInStatement:
                this.processForInStatement(ast);
                break;

            case AST_NODE_TYPES.ForOfStatement:
                this.processForOfStatement(ast);
                break;

            case AST_NODE_TYPES.ForStatement:
                this.processForStatement(ast);
                break;

            case AST_NODE_TYPES.FunctionDeclaration:
                this.processFunctionDeclaration(ast);
                break;

            case AST_NODE_TYPES.FunctionExpression:
                this.processFunctionExpression(ast);
                break;

            case AST_NODE_TYPES.Identifier:
                this.processIdentifier(ast);
                break;

            case AST_NODE_TYPES.IfStatement:
                this.processIfStatement(ast);
                break;

            case AST_NODE_TYPES.ImportDeclaration:
                this.processImportDeclaration(ast);
                break;

            case AST_NODE_TYPES.ImportDefaultSpecifier:
                this.processImportDefaultSpecifier(ast);
                break;

            case AST_NODE_TYPES.ImportNamespaceSpecifier:
                this.processImportNamespaceSpecifier(ast);
                break;

            case AST_NODE_TYPES.ImportSpecifier:
                this.processImportSpecifier(ast);
                break;

            case AST_NODE_TYPES.LabeledStatement:
                this.processLabeledStatement(ast);
                break;

            case AST_NODE_TYPES.Literal:
                this.processLiteral(ast);
                break;

            case AST_NODE_TYPES.LogicalExpression:
                this.processLogicalExpression(ast);
                break;

            case AST_NODE_TYPES.MemberExpression:
                this.processMemberExpression(ast);
                break;

            case AST_NODE_TYPES.MetaProperty:
                this.processMetaProperty(ast);
                break;

            case AST_NODE_TYPES.MethodDefinition:
                this.processMethodDefinition(ast);
                break;

            case AST_NODE_TYPES.NewExpression:
                this.processNewExpression(ast);
                break;

            case AST_NODE_TYPES.ObjectExpression:
                this.processObjectExpression(ast);
                break;

            case AST_NODE_TYPES.ObjectPattern:
                this.processObjectPattern(ast);
                break;

            case AST_NODE_TYPES.Program:
                this.processProgram(ast);
                break;

            case AST_NODE_TYPES.Property:
                this.processProperty(ast);
                break;

            case AST_NODE_TYPES.RestElement:
                this.processRestElement(ast);
                break;

            case AST_NODE_TYPES.ReturnStatement:
                this.processReturnStatement(ast);
                break;

            case AST_NODE_TYPES.SequenceExpression:
                this.processSequenceExpression(ast);
                break;

            case AST_NODE_TYPES.SpreadElement:
                this.processSpreadElement(ast);
                break;

            case AST_NODE_TYPES.Super:
                this.processSuper(ast);
                break;

            case AST_NODE_TYPES.SwitchCase:
                this.processSwitchCase(ast);
                break;

            case AST_NODE_TYPES.SwitchStatement:
                this.processSwitchStatement(ast);
                break;

            case AST_NODE_TYPES.TaggedTemplateExpression:
                this.processTaggedTemplateExpression(ast);
                break;

            case AST_NODE_TYPES.TemplateElement:
                this.processTemplateElement(ast);
                break;

            case AST_NODE_TYPES.TemplateLiteral:
                this.processTemplateLiteral(ast);
                break;

            case AST_NODE_TYPES.ThisExpression:
                this.processThisExpression(ast);
                break;

            case AST_NODE_TYPES.ThrowStatement:
                this.processThrowStatement(ast);
                break;

            case AST_NODE_TYPES.TryStatement:
                this.processTryStatement(ast);
                break;

            case AST_NODE_TYPES.TSClassImplements:
                this.processTSClassImplements(ast);
                break;

            case AST_NODE_TYPES.TSParenthesizedType:
                this.processTSParenthesizedType(ast);
                break;

            case AST_NODE_TYPES.UnaryExpression:
                this.processUnaryExpression(ast);
                break;

            case AST_NODE_TYPES.UpdateExpression:
                this.processUpdateExpression(ast);
                break;

            case AST_NODE_TYPES.VariableDeclaration:
                this.processVariableDeclaration(ast);
                break;

            case AST_NODE_TYPES.VariableDeclarator:
                this.processVariableDeclarator(ast);
                break;

            case AST_NODE_TYPES.WhileStatement:
                this.processWhileStatement(ast);
                break;

            case AST_NODE_TYPES.WithStatement:
                this.processWithStatement(ast);
                break;

            case AST_NODE_TYPES.YieldExpression:
                this.processYieldExpression(ast);
                break;

            case AST_NODE_TYPES.TSAbstractMethodDefinition:
                this.processTSAbstractMethodDefinition(ast);
                break;

            case AST_NODE_TYPES.TSAsExpression:
                this.processTSAsExpression(ast);
                break;

            case AST_NODE_TYPES.TSDeclareFunction:
                this.processTSDeclareFunction(ast);
                break;

            case AST_NODE_TYPES.TSEnumDeclaration:
                this.processTSEnumDeclaration(ast);
                break;

            case AST_NODE_TYPES.TSInterfaceBody:
                this.processTSInterfaceBody(ast);
                break;

            case AST_NODE_TYPES.TSMethodSignature:
                this.processTSMethodSignature(ast);
                break;

            case AST_NODE_TYPES.TSModuleBlock:
                this.processTSModuleBlock(ast);
                break;

            case AST_NODE_TYPES.TSModuleDeclaration:
                this.processTSModuleDeclaration(ast);
                break;

            case AST_NODE_TYPES.TSImportEqualsDeclaration:
                this.processTSImportEqualsDeclaration(ast);
                break;

            case AST_NODE_TYPES.TSInterfaceDeclaration:
                this.processTSInterfaceDeclaration(ast);
                break;

            case AST_NODE_TYPES.TSTypeAssertion:
                this.processTSTypeAssertion(ast);
                break;

            case AST_NODE_TYPES.TSTypeAnnotation:
                this.processTSTypeAnnotation(ast);
                break;

            case AST_NODE_TYPES.TSTypeParameterInstantiation:
                this.processTSTypeParameterInstantiation(ast);
                break;

            case AST_NODE_TYPES.TSTypeReference:
                this.processTSTypeReference(ast);
                break;
            
            case AST_NODE_TYPES.TSVoidKeyword:
                this.processTSVoidKeyword(ast);
                break;
        }
    }

    private processArrayExpression(ast: ArrayExpression) {
        for (let i = 0, len = ast.elements.length; i < len; i++) {
            this.processAST(ast.elements[i]);
        }
    }

    private processArrayPattern(ast: ArrayPattern) {
        // this.assert(false, ast, 'Not support ArrayPattern yet!');
    }

    private processArrowFunctionExpression(ast: ArrowFunctionExpression) {
        if (ast.params) {
            for (let i = 0, len = ast.params.length; i < len; i++) {
                let oneParam = ast.params[i];
                (oneParam as any).__parent = ast;
                this.processAST(oneParam);
            }
        }
        if (ast.body) {
            this.processAST(ast.body);
        }
    }

    private processAssignmentExpression(ast: AssignmentExpression) {
        this.processBinaryExpression(ast as any);
    }

    private processAssignmentPattern(ast: AssignmentPattern) {
        this.processAST(ast.left);
        this.processAST(ast.right);
    }

    private processAwaitExpression(ast: AwaitExpression) {
    }

    private processBinaryExpression(ast: BinaryExpression) {
        (ast.left as any).__parent = ast;
        (ast.right as any).__parent = ast;
        this.processAST(ast.left);
        this.processAST(ast.right);
    }

    private processBlockStatement(ast: BlockStatement) {
        for (let i = 0, len = ast.body.length; i < len; i++) {
            let bodyEle = ast.body[i];
            this.processAST(bodyEle);
        }
    }

    private processBreakStatement(ast: BreakStatement) {
    }

    private processCallExpression(ast: CallExpression) {
        // 没有基类的去掉super
        (ast.callee as any).__parent = ast;
        this.processAST(ast.callee);
        for (let i = 0, len = ast.arguments.length; i < len; i++) {
            let arg = ast.arguments[i];
            this.processAST(arg);
        }
    }

    private processCatchClause(ast: CatchClause) {
        (ast.param as any).__parent = ast;
        this.processAST(ast.param);
        this.processBlockStatement(ast.body);
    }

    private processClassBody(ast: ClassBody) {
        for (let i = 0, len = ast.body.length; i < len; i++) {
            this.processAST(ast.body[i]);
        }
    }

    private processClassDeclaration(ast: ClassDeclaration) {
        if (ast.typeParameters) {
            // typeParameters?: TSTypeParameterDeclaration;
        }
        if (ast.superTypeParameters) {
            // TSTypeParameterInstantiation;
        }
        let className = this.codeFromAST(ast.id);
        this.declaredMap[className] = true;
        if (ast.superClass) {
            (ast.superClass as any).__isType = true;
            this.processAST(ast.superClass);
        }
        if(ast.implements) {
            for(let i = 0, len = ast.implements.length; i < len; i++) {
                (ast.implements[i] as any).__isType = true;
                this.processAST(ast.implements[i]);
            }
        }
        this.processClassBody(ast.body);
    }

    private processClassExpression(ast: ClassExpression) {
        // this.pintHit(ast);
        return this.processClassDeclaration(ast as any);
    }

    private processClassProperty(ast: ClassProperty) {
        this.processAST(ast.key);
        if(ast.typeAnnotation) {
            this.processAST(ast.typeAnnotation);
        }
        if (ast.value) {
            this.processAST(ast.value);
        }
    }

    private processConditionalExpression(ast: ConditionalExpression) {
        this.processAST(ast.test);
        this.processAST(ast.consequent);
        this.processAST(ast.alternate);
    }

    private processContinueStatement(ast: ContinueStatement) {
    }

    private processDebuggerStatement(ast: DebuggerStatement) {
    }

    private processDecorator(ast: Decorator) {
    }

    private processDoWhileStatement(ast: DoWhileStatement) {
        this.processAST(ast.test);
        this.processAST(ast.body);
    }

    private processEmptyStatement(ast: EmptyStatement) {
    }

    private processExportAllDeclaration(ast: ExportAllDeclaration) {
    }

    private processExportDefaultDeclaration(ast: ExportDefaultDeclaration) {
    }

    private processExportNamedDeclaration(ast: ExportNamedDeclaration) {
        (ast.declaration as any).__exported = true;
        if ((ast as any).__module) {
            (ast.declaration as any).__module = (ast as any).__module;
        }
        this.processAST(ast.declaration);
    }

    private processExportSpecifier(ast: ExportSpecifier) {
    }

    private processExpressionStatement(ast: ExpressionStatement) {
        this.processAST(ast.expression);
    }

    private processForInStatement(ast: ForInStatement) {
        (ast.left as any).__parent = ast;
        this.processAST(ast.left);
        this.processAST(ast.right);
        this.processAST(ast.body);
    }

    private processForOfStatement(ast: ForOfStatement) {
        (ast.left as any).__parent = ast;
        this.processAST(ast.left);
        this.processAST(ast.right);
        this.processAST(ast.body);
    }

    private processForStatement(ast: ForStatement) {
        if (ast.init) {
            this.processAST(ast.init);
        }
        if (ast.test) {
            this.processAST(ast.test);
        } 
        if (ast.update) {
            this.processAST(ast.update);
        } 
        this.processAST(ast.body);
    }

    private processFunctionDeclaration(ast: FunctionDeclaration) {
        this.processFunctionExpression(ast as any);
    }

    private processFunctionExpression(ast: FunctionExpression) {
        this.processFunctionExpressionInternal(ast);
    }

    private processFunctionExpressionInternal(ast: FunctionExpression) {
        if(ast.typeParameters) {
            for(let i = 0, len = ast.typeParameters.params.length; i < len; i++) {
                this.declaredMap[this.codeFromAST(ast.typeParameters.params[i].name)] = true;
            }
        }
        if (ast.params) {
            for (let i = 0, len = ast.params.length; i < len; i++) {
                let oneParam = ast.params[i];
                (oneParam as any).__parent = ast;
                (oneParam as any).__isFuncParam = true;
                this.processAST(oneParam);
            }
        }
        if(ast.returnType) {
            this.processAST(ast.returnType);
        }

        if (ast.body) {
            this.processAST(ast.body);
        }
    }

    private processIdentifier(ast: Identifier) {
        let str = ast.name;
        if(ast.typeAnnotation) {
            if(!(ast as any).__parent || ((ast as any).__parent.type != AST_NODE_TYPES.CatchClause && (!(ast as any).__parent.__parent || !(ast as any).__parent.__parent.__parent || AST_NODE_TYPES.ForInStatement != (ast as any).__parent.__parent.__parent.type))) {
                this.processAST(ast.typeAnnotation);
            }
        } else if((ast as any).__isType || this.option.checkTypes.includes(str)) {
            if(this.allTypes.indexOf(str) < 0) {
                this.allTypes.push(str);
            }
        }
    }

    private processIfStatement(ast: IfStatement) {
        this.processAST(ast.test);
        this.processAST(ast.consequent);
        if (ast.alternate && (ast.alternate.type != AST_NODE_TYPES.BlockStatement || (ast.alternate as BlockStatement).body.length > 0)) {
            this.processAST(ast.alternate);
        } 
    }

    private processImportDeclaration(ast: ImportDeclaration) {
    }

    private processImportDefaultSpecifier(ast: ImportDefaultSpecifier) {
    }

    private processImportNamespaceSpecifier(ast: ImportNamespaceSpecifier) {
    }

    private processImportSpecifier(ast: ImportSpecifier) {
        this.processAST(ast.imported);
    }

    private processLabeledStatement(ast: LabeledStatement) {
    }

    private processLiteral(ast: Literal) {
    }

    private processLogicalExpression(ast: LogicalExpression) {
        this.processAST(ast.left);
        this.processAST(ast.right);
    }

    private processMemberExpression(ast: MemberExpression) {
        (ast.object as any).__memberExp_is_object = true;
        (ast.object as any).__parent = ast;
        this.processAST(ast.object);
        (ast.property as any).__parent = ast;
        (ast.property as any).__memberExp_is_computed_property = ast.computed;
        this.processAST(ast.property);
    }

    private processMetaProperty(ast: MetaProperty) {
    }

    private processMethodDefinition(ast: MethodDefinition) {
        this.processAST(ast.key);
        return this.processFunctionExpressionInternal(ast.value as FunctionExpression);
    }

    private processNewExpression(ast: NewExpression) {
        this.processAST(ast.callee);
        for (let i = 0, len = ast.arguments.length; i < len; i++) {
            this.processAST(ast.arguments[i]);
        }
    }

    private processObjectExpression(ast: ObjectExpression) {
        for (let i = 0, len = ast.properties.length; i < len; i++) {
            this.processAST(ast.properties[i]);
        }
    }

    private processObjectPattern(ast: ObjectPattern) {
    }

    private processProgram(ast: Program) {
        for (let i = 0, len = ast.body.length; i < len; i++) {
            let stm = ast.body[i];
            this.processAST(stm);
        }
    }

    private processProperty(ast: Property) {
        (ast.key as any).__parent = ast;
        this.processAST(ast.key);
        this.processAST(ast.value);
    }

    private processRestElement(ast: RestElement) {
        this.processAST(ast.argument);
    }

    private processReturnStatement(ast: ReturnStatement) {
        if(ast.argument) {
            this.processAST(ast.argument);
        }
    }

    private processSequenceExpression(ast: SequenceExpression) {
        for (var i = 0, len = ast.expressions.length; i < len; i++) {
            this.processAST(ast.expressions[i]);
        }
    }

    private processSpreadElement(ast: SpreadElement) {
    }

    private processSuper(ast: Super) {
    }

    private processSwitchCase(ast: SwitchCase) {
        if(ast.test) {
            this.processAST(ast.test);
        }
        for (let i = 0, len = ast.consequent.length; i < len; i++) {
            if (ast.consequent[i].type != AST_NODE_TYPES.BreakStatement) {
                this.processAST(ast.consequent[i]);
            }
        }
    }

    private processSwitchStatement(ast: SwitchStatement) {
        this.processAST(ast.discriminant);
        for (let i = 0, len = ast.cases.length; i < len; i++) {
            this.processSwitchCase(ast.cases[i]);
        }
    }

    private processTaggedTemplateExpression(ast: TaggedTemplateExpression) {
    }

    private processTemplateElement(ast: TemplateElement) {
    }

    private processTemplateLiteral(ast: TemplateLiteral) {
    }

    private processThisExpression(ast: ThisExpression) {
    }

    private processThrowStatement(ast: ThrowStatement) {
        this.processAST(ast.argument);
    }

    private processTryStatement(ast: TryStatement) {
        this.processAST(ast.block);
        if (ast.handler) {
            this.processAST(ast.handler);
        }
        if (ast.finalizer) {
            this.processAST(ast.finalizer);
        }
    }

    private processTSClassImplements(ast: TSClassImplements) {
        (ast.expression as any).__isType = true;
        this.processAST(ast.expression);
        if(ast.typeParameters) {
            this.processAST(ast.typeParameters) + '>';
        }
    }

    private processTSParenthesizedType(ast: TSParenthesizedType) {
        this.processAST(ast.typeAnnotation);
    }

    private processUnaryExpression(ast: UnaryExpression) {
        this.processAST(ast.argument);
    }

    private processUpdateExpression(ast: UpdateExpression) {
        this.processAST(ast.argument);
    }

    private processVariableDeclaration(ast: VariableDeclaration) {
        for (let i = 0, len = ast.declarations.length; i < len; i++) {
            let d = ast.declarations[i];
            (d as any).__parent = ast;
            this.processVariableDeclarator(d);
        }
    }

    private processVariableDeclarator(ast: VariableDeclarator) {
        if (ast.init) {
            this.processAST(ast.init);
        }
    }

    private processWhileStatement(ast: WhileStatement) {
        this.processAST(ast.test);
        this.processAST(ast.body);
    }

    private processWithStatement(ast: WithStatement) {
        this.processAST(ast.object);
        this.processAST(ast.body);
    }

    private processYieldExpression(ast: YieldExpression) {
        if(ast.argument) {
            this.processAST(ast.argument);
        }
    }

    private processTSAbstractMethodDefinition(ast: TSAbstractMethodDefinition) {
        this.processMethodDefinition(ast as any);
    }

    private processTSAsExpression(ast: TSAsExpression) {
        this.processAST(ast.expression);
        this.processAST(ast.typeAnnotation);
    }

    private processTSDeclareFunction(ast: TSDeclareFunction) {
    }

    private processTSEnumDeclaration(ast: TSEnumDeclaration) {
    }

    private processTSInterfaceBody(ast: TSInterfaceBody) {
        let str = '';
        for(let i = 0, len = ast.body.length; i < len; i++) {
            if(i > 0) {
                str += '\n';
            }
            str += this.processAST(ast.body[i]);
        }
        return str;
    }

    private processTSMethodSignature(ast: TSMethodSignature) {
        if (ast.params) {
            for (let i = 0, len = ast.params.length; i < len; i++) {
                let oneParam = ast.params[i];
                (oneParam as any).__parent = ast;
                (oneParam as any).__isFuncParam = true;
                this.processAST(oneParam);
            }
        }
        if(ast.returnType) {
            this.processAST(ast.returnType);
        }
    }

    private processTSModuleBlock(ast: TSModuleBlock) {
        for(let i = 0, len = ast.body.length; i < len; i++) {
            this.processAST(ast.body[i]);
        }
    }

    private processTSModuleDeclaration(ast: TSModuleDeclaration) {
        (ast.body as any).__parent = ast;
        this.processAST(ast.body);
    }

    private processTSImportEqualsDeclaration(ast: TSImportEqualsDeclaration) {

    }

    private processTSInterfaceDeclaration(ast: TSInterfaceDeclaration) {
        let className = this.codeFromAST(ast.id);
        this.declaredMap[className] = true;
        if(ast.extends) {
            for(let i = 0, len = ast.extends.length; i < len; i++) {
                this.processAST(ast.extends[i]);
            }
        }
        this.processAST(ast.body);
    }

    private processTSTypeAssertion(ast: TSTypeAssertion) {
    }

    private processTSTypeAnnotation(ast: TSTypeAnnotation) {
        this.processAST(ast.typeAnnotation);
    }

    private processTSTypeParameterInstantiation(ast: TSTypeParameterInstantiation) {
        for(let i = 0, len = ast.params.length; i < len; i++) {
            (ast.params[i] as any).__isType = true;
            this.processAST(ast.params[i]);
        }
    }

    private processTSTypeReference(ast: TSTypeReference) {
        (ast.typeName as any).__isType = true;
        this.processAST(ast.typeName);
        if(ast.typeParameters) {
            this.processAST(ast.typeParameters);
        } 
    }

    private processTSVoidKeyword(ast: TSVoidKeyword) {
    }

    private codeFromAST(ast: any): string {
        let str = '';
        switch(ast.type) {
            case AST_NODE_TYPES.Identifier:
                str += this.codeFromIdentifier(ast);
                break;
            
            case AST_NODE_TYPES.ImportSpecifier:
                str += this.codeFromImportSpecifier(ast);
                break;

            case AST_NODE_TYPES.MemberExpression:
                str += this.codeFromMemberExpression(ast);
                break;
            
            default:
                this.assert(false, ast, '[ERROR]Analyse import error, not support: ' + (ast as any).type);
                break;
        }
        return str;
    }
    
    private codeFromIdentifier(ast: Identifier): string {
        return ast.name;
    }

    private codeFromImportSpecifier(ast: ImportSpecifier): string {
        let str = this.codeFromAST(ast.imported);
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

    private indent(str: string, fromLine: number = 0): string {
        let indentStr = '    ';
        let endWithNewLine = str.substr(str.length - 1) == '\n';
        let lines = str.split(/\n/);
        let newStr = '';
        for (let i = 0, len = lines.length; i < len; i++) {
            if (i > 0) {
                newStr += '\n';
            }
            if (i >= fromLine) {
                newStr += indentStr;
            }
            newStr += lines[i];
        }
        if (endWithNewLine) {
            newStr += '\n';
        }
        return newStr;
    }
  
    private assert(cond: boolean, ast: BaseNode, message: string = null) {
        if (!cond) {
            if (ast) {
                console.log(util.inspect(ast, true, 6));
            }
            console.log('\x1B[36m%s\x1B[0m(tmp/tmp.ts:\x1B[33m%d:%d\x1B[0m) - \x1B[31merror\x1B[0m: %s', this.relativePath, 
                ast && ast.loc ? ast.loc.start.line : -1, 
                ast && ast.loc ? ast.loc.start.column : -1, 
                message ? message : 'Error');
            console.log(TsEasyHints.ContactMsg);
            throw new Error('[As2TS]Something wrong encountered.');
        }
    }
}