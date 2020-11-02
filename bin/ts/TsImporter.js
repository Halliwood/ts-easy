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
exports.TsImporter = void 0;
var fs = __importStar(require("fs"));
var typescript_estree_1 = require("@typescript-eslint/typescript-estree");
var util = require("util");
var path = require("path");
var Strings_1 = require("../Strings");
var TsImporter = /** @class */ (function () {
    function TsImporter(analysor, option) {
        this.builtInTypes = ['number', 'string', 'boolean', 'any', 'Array', '[]', 'Object', 'void', 'Function', 'RegExp', 'Date', 'Error'];
        this.analysor = analysor;
        this.option = option;
    }
    TsImporter.prototype.check = function (ast, inputFolder, filePath) {
        this.allTypes = [];
        this.inputFolder = inputFolder;
        this.filePath = filePath;
        this.relativePath = path.relative(inputFolder, filePath);
        this.dirname = path.dirname(filePath);
        this.fileModule = path.relative(inputFolder, this.dirname).replace(/\\+/g, '.').replace(/\.$/, '');
        this.importedMap = this.analysor.getImportedMap(filePath);
        if (filePath.includes('CommonForm')) {
            for (var key in this.importedMap) {
                console.log('read imported map: %s -> %s in %s', key, this.importedMap[key], filePath);
            }
        }
        this.declaredMap = {};
        this.processAST(ast);
        if (filePath.includes('CommonForm')) {
            console.log('allTypes: %s\n', this.allTypes.join(', '));
        }
        var importStr = '';
        var usedTypeMap = {};
        for (var i = 0, len = this.allTypes.length; i < len; i++) {
            var type = this.allTypes[i];
            usedTypeMap[type] = true;
            if (!this.declaredMap[type] && !(type in this.importedMap) && !this.builtInTypes.includes(type)) {
                var classInfo = this.analysor.classNameMap[type];
                if (filePath.includes('CommonForm')) {
                    console.log('add import %s for %s', type, this.relativePath);
                }
                if (classInfo) {
                    // 需要import
                    if (!this.option.module) {
                        var mstr = path.relative(this.dirname, classInfo.file).replace(/\\+/g, '/');
                        if (!mstr) {
                            mstr = '.';
                        }
                        else if (mstr.charAt(0) != '.') {
                            mstr = './' + mstr;
                        }
                        mstr = mstr.replace(/\.(d\.)?ts$/, '');
                        importStr += 'import {' + type + '} from "' + mstr + '";\n';
                    }
                    else {
                        var mstr = classInfo.module.replace(/\//g, '.');
                        if (mstr.charAt(mstr.length - 1) != '.') {
                            mstr += '.';
                        }
                        importStr += 'import ' + type + ' = ' + mstr + type + ';\n';
                    }
                }
                else {
                    console.warn('class not found: %s\n', type);
                }
            }
        }
        if (importStr && this.option.module) {
            importStr = this.indent(importStr);
        }
        if (importStr) {
            var fileContent = fs.readFileSync(filePath, 'utf-8');
            // 查找import语句
            var importPos = fileContent.search(/\bimport\b /);
            if (importPos >= 0) {
                fileContent = fileContent.substr(0, importPos) + importStr + fileContent.substr(importPos);
            }
            else {
                fileContent = importStr + fileContent;
            }
            fs.writeFileSync(filePath, fileContent, 'utf-8');
        }
    };
    TsImporter.prototype.processAST = function (ast) {
        this.assert(ast != null, ast, 'ast is null');
        switch (ast.type) {
            case typescript_estree_1.AST_NODE_TYPES.ArrayExpression:
                this.processArrayExpression(ast);
                break;
            case typescript_estree_1.AST_NODE_TYPES.ArrayPattern:
                this.processArrayPattern(ast);
                break;
            case typescript_estree_1.AST_NODE_TYPES.ArrowFunctionExpression:
                this.processArrowFunctionExpression(ast);
                break;
            case typescript_estree_1.AST_NODE_TYPES.AssignmentExpression:
                this.processAssignmentExpression(ast);
                break;
            case typescript_estree_1.AST_NODE_TYPES.AssignmentPattern:
                this.processAssignmentPattern(ast);
                break;
            case typescript_estree_1.AST_NODE_TYPES.AwaitExpression:
                this.processAwaitExpression(ast);
                break;
            // case AST_NODE_TYPES.BigIntLiteral:
            //     this.processBigIntLiteral(ast);
            //     break;
            case typescript_estree_1.AST_NODE_TYPES.BinaryExpression:
                this.processBinaryExpression(ast);
                break;
            case typescript_estree_1.AST_NODE_TYPES.BlockStatement:
                this.processBlockStatement(ast);
                break;
            case typescript_estree_1.AST_NODE_TYPES.BreakStatement:
                this.processBreakStatement(ast);
                break;
            case typescript_estree_1.AST_NODE_TYPES.CallExpression:
                this.processCallExpression(ast);
                break;
            case typescript_estree_1.AST_NODE_TYPES.CatchClause:
                this.processCatchClause(ast);
                break;
            case typescript_estree_1.AST_NODE_TYPES.ClassBody:
                this.processClassBody(ast);
                break;
            case typescript_estree_1.AST_NODE_TYPES.ClassDeclaration:
                this.processClassDeclaration(ast);
                break;
            case typescript_estree_1.AST_NODE_TYPES.ClassExpression:
                this.processClassExpression(ast);
                break;
            case typescript_estree_1.AST_NODE_TYPES.ClassProperty:
                this.processClassProperty(ast);
                break;
            case typescript_estree_1.AST_NODE_TYPES.ConditionalExpression:
                this.processConditionalExpression(ast);
                break;
            case typescript_estree_1.AST_NODE_TYPES.ContinueStatement:
                this.processContinueStatement(ast);
                break;
            case typescript_estree_1.AST_NODE_TYPES.DebuggerStatement:
                this.processDebuggerStatement(ast);
                break;
            case typescript_estree_1.AST_NODE_TYPES.Decorator:
                this.processDecorator(ast);
                break;
            case typescript_estree_1.AST_NODE_TYPES.DoWhileStatement:
                this.processDoWhileStatement(ast);
                break;
            case typescript_estree_1.AST_NODE_TYPES.EmptyStatement:
                this.processEmptyStatement(ast);
                break;
            case typescript_estree_1.AST_NODE_TYPES.ExportAllDeclaration:
                this.processExportAllDeclaration(ast);
                break;
            case typescript_estree_1.AST_NODE_TYPES.ExportDefaultDeclaration:
                this.processExportDefaultDeclaration(ast);
                break;
            case typescript_estree_1.AST_NODE_TYPES.ExportNamedDeclaration:
                this.processExportNamedDeclaration(ast);
                break;
            case typescript_estree_1.AST_NODE_TYPES.ExportSpecifier:
                this.processExportSpecifier(ast);
                break;
            case typescript_estree_1.AST_NODE_TYPES.ExpressionStatement:
                this.processExpressionStatement(ast);
                break;
            case typescript_estree_1.AST_NODE_TYPES.ForInStatement:
                this.processForInStatement(ast);
                break;
            case typescript_estree_1.AST_NODE_TYPES.ForOfStatement:
                this.processForOfStatement(ast);
                break;
            case typescript_estree_1.AST_NODE_TYPES.ForStatement:
                this.processForStatement(ast);
                break;
            case typescript_estree_1.AST_NODE_TYPES.FunctionDeclaration:
                this.processFunctionDeclaration(ast);
                break;
            case typescript_estree_1.AST_NODE_TYPES.FunctionExpression:
                this.processFunctionExpression(ast);
                break;
            case typescript_estree_1.AST_NODE_TYPES.Identifier:
                this.processIdentifier(ast);
                break;
            case typescript_estree_1.AST_NODE_TYPES.IfStatement:
                this.processIfStatement(ast);
                break;
            case typescript_estree_1.AST_NODE_TYPES.ImportDeclaration:
                this.processImportDeclaration(ast);
                break;
            case typescript_estree_1.AST_NODE_TYPES.ImportDefaultSpecifier:
                this.processImportDefaultSpecifier(ast);
                break;
            case typescript_estree_1.AST_NODE_TYPES.ImportNamespaceSpecifier:
                this.processImportNamespaceSpecifier(ast);
                break;
            case typescript_estree_1.AST_NODE_TYPES.ImportSpecifier:
                this.processImportSpecifier(ast);
                break;
            case typescript_estree_1.AST_NODE_TYPES.LabeledStatement:
                this.processLabeledStatement(ast);
                break;
            case typescript_estree_1.AST_NODE_TYPES.Literal:
                this.processLiteral(ast);
                break;
            case typescript_estree_1.AST_NODE_TYPES.LogicalExpression:
                this.processLogicalExpression(ast);
                break;
            case typescript_estree_1.AST_NODE_TYPES.MemberExpression:
                this.processMemberExpression(ast);
                break;
            case typescript_estree_1.AST_NODE_TYPES.MetaProperty:
                this.processMetaProperty(ast);
                break;
            case typescript_estree_1.AST_NODE_TYPES.MethodDefinition:
                this.processMethodDefinition(ast);
                break;
            case typescript_estree_1.AST_NODE_TYPES.NewExpression:
                this.processNewExpression(ast);
                break;
            case typescript_estree_1.AST_NODE_TYPES.ObjectExpression:
                this.processObjectExpression(ast);
                break;
            case typescript_estree_1.AST_NODE_TYPES.ObjectPattern:
                this.processObjectPattern(ast);
                break;
            case typescript_estree_1.AST_NODE_TYPES.Program:
                this.processProgram(ast);
                break;
            case typescript_estree_1.AST_NODE_TYPES.Property:
                this.processProperty(ast);
                break;
            case typescript_estree_1.AST_NODE_TYPES.RestElement:
                this.processRestElement(ast);
                break;
            case typescript_estree_1.AST_NODE_TYPES.ReturnStatement:
                this.processReturnStatement(ast);
                break;
            case typescript_estree_1.AST_NODE_TYPES.SequenceExpression:
                this.processSequenceExpression(ast);
                break;
            case typescript_estree_1.AST_NODE_TYPES.SpreadElement:
                this.processSpreadElement(ast);
                break;
            case typescript_estree_1.AST_NODE_TYPES.Super:
                this.processSuper(ast);
                break;
            case typescript_estree_1.AST_NODE_TYPES.SwitchCase:
                this.processSwitchCase(ast);
                break;
            case typescript_estree_1.AST_NODE_TYPES.SwitchStatement:
                this.processSwitchStatement(ast);
                break;
            case typescript_estree_1.AST_NODE_TYPES.TaggedTemplateExpression:
                this.processTaggedTemplateExpression(ast);
                break;
            case typescript_estree_1.AST_NODE_TYPES.TemplateElement:
                this.processTemplateElement(ast);
                break;
            case typescript_estree_1.AST_NODE_TYPES.TemplateLiteral:
                this.processTemplateLiteral(ast);
                break;
            case typescript_estree_1.AST_NODE_TYPES.ThisExpression:
                this.processThisExpression(ast);
                break;
            case typescript_estree_1.AST_NODE_TYPES.ThrowStatement:
                this.processThrowStatement(ast);
                break;
            case typescript_estree_1.AST_NODE_TYPES.TryStatement:
                this.processTryStatement(ast);
                break;
            case typescript_estree_1.AST_NODE_TYPES.TSClassImplements:
                this.processTSClassImplements(ast);
                break;
            case typescript_estree_1.AST_NODE_TYPES.TSParenthesizedType:
                this.processTSParenthesizedType(ast);
                break;
            case typescript_estree_1.AST_NODE_TYPES.UnaryExpression:
                this.processUnaryExpression(ast);
                break;
            case typescript_estree_1.AST_NODE_TYPES.UpdateExpression:
                this.processUpdateExpression(ast);
                break;
            case typescript_estree_1.AST_NODE_TYPES.VariableDeclaration:
                this.processVariableDeclaration(ast);
                break;
            case typescript_estree_1.AST_NODE_TYPES.VariableDeclarator:
                this.processVariableDeclarator(ast);
                break;
            case typescript_estree_1.AST_NODE_TYPES.WhileStatement:
                this.processWhileStatement(ast);
                break;
            case typescript_estree_1.AST_NODE_TYPES.WithStatement:
                this.processWithStatement(ast);
                break;
            case typescript_estree_1.AST_NODE_TYPES.YieldExpression:
                this.processYieldExpression(ast);
                break;
            case typescript_estree_1.AST_NODE_TYPES.TSAbstractMethodDefinition:
                this.processTSAbstractMethodDefinition(ast);
                break;
            case typescript_estree_1.AST_NODE_TYPES.TSAsExpression:
                this.processTSAsExpression(ast);
                break;
            case typescript_estree_1.AST_NODE_TYPES.TSDeclareFunction:
                this.processTSDeclareFunction(ast);
                break;
            case typescript_estree_1.AST_NODE_TYPES.TSEnumDeclaration:
                this.processTSEnumDeclaration(ast);
                break;
            case typescript_estree_1.AST_NODE_TYPES.TSInterfaceBody:
                this.processTSInterfaceBody(ast);
                break;
            case typescript_estree_1.AST_NODE_TYPES.TSMethodSignature:
                this.processTSMethodSignature(ast);
                break;
            case typescript_estree_1.AST_NODE_TYPES.TSModuleBlock:
                this.processTSModuleBlock(ast);
                break;
            case typescript_estree_1.AST_NODE_TYPES.TSModuleDeclaration:
                this.processTSModuleDeclaration(ast);
                break;
            case typescript_estree_1.AST_NODE_TYPES.TSImportEqualsDeclaration:
                this.processTSImportEqualsDeclaration(ast);
                break;
            case typescript_estree_1.AST_NODE_TYPES.TSInterfaceDeclaration:
                this.processTSInterfaceDeclaration(ast);
                break;
            case typescript_estree_1.AST_NODE_TYPES.TSTypeAssertion:
                this.processTSTypeAssertion(ast);
                break;
            case typescript_estree_1.AST_NODE_TYPES.TSTypeAnnotation:
                this.processTSTypeAnnotation(ast);
                break;
            case typescript_estree_1.AST_NODE_TYPES.TSTypeParameterInstantiation:
                this.processTSTypeParameterInstantiation(ast);
                break;
            case typescript_estree_1.AST_NODE_TYPES.TSTypeReference:
                this.processTSTypeReference(ast);
                break;
            case typescript_estree_1.AST_NODE_TYPES.TSVoidKeyword:
                this.processTSVoidKeyword(ast);
                break;
        }
    };
    TsImporter.prototype.processArrayExpression = function (ast) {
        for (var i = 0, len = ast.elements.length; i < len; i++) {
            this.processAST(ast.elements[i]);
        }
    };
    TsImporter.prototype.processArrayPattern = function (ast) {
        // this.assert(false, ast, 'Not support ArrayPattern yet!');
    };
    TsImporter.prototype.processArrowFunctionExpression = function (ast) {
        if (ast.params) {
            for (var i = 0, len = ast.params.length; i < len; i++) {
                var oneParam = ast.params[i];
                oneParam.__parent = ast;
                this.processAST(oneParam);
            }
        }
        if (ast.body) {
            this.processAST(ast.body);
        }
    };
    TsImporter.prototype.processAssignmentExpression = function (ast) {
        this.processBinaryExpression(ast);
    };
    TsImporter.prototype.processAssignmentPattern = function (ast) {
        this.processAST(ast.left);
        this.processAST(ast.right);
    };
    TsImporter.prototype.processAwaitExpression = function (ast) {
    };
    TsImporter.prototype.processBinaryExpression = function (ast) {
        ast.left.__parent = ast;
        ast.right.__parent = ast;
        this.processAST(ast.left);
        this.processAST(ast.right);
    };
    TsImporter.prototype.processBlockStatement = function (ast) {
        for (var i = 0, len = ast.body.length; i < len; i++) {
            var bodyEle = ast.body[i];
            this.processAST(bodyEle);
        }
    };
    TsImporter.prototype.processBreakStatement = function (ast) {
    };
    TsImporter.prototype.processCallExpression = function (ast) {
        // 没有基类的去掉super
        ast.callee.__parent = ast;
        this.processAST(ast.callee);
        for (var i = 0, len = ast.arguments.length; i < len; i++) {
            var arg = ast.arguments[i];
            this.processAST(arg);
        }
    };
    TsImporter.prototype.processCatchClause = function (ast) {
        ast.param.__parent = ast;
        this.processAST(ast.param);
        this.processBlockStatement(ast.body);
    };
    TsImporter.prototype.processClassBody = function (ast) {
        for (var i = 0, len = ast.body.length; i < len; i++) {
            this.processAST(ast.body[i]);
        }
    };
    TsImporter.prototype.processClassDeclaration = function (ast) {
        if (ast.typeParameters) {
            // typeParameters?: TSTypeParameterDeclaration;
        }
        if (ast.superTypeParameters) {
            // TSTypeParameterInstantiation;
        }
        var className = this.codeFromAST(ast.id);
        this.declaredMap[className] = true;
        if (ast.superClass) {
            ast.superClass.__isType = true;
            this.processAST(ast.superClass);
        }
        if (ast.implements) {
            for (var i = 0, len = ast.implements.length; i < len; i++) {
                ast.implements[i].__isType = true;
                this.processAST(ast.implements[i]);
            }
        }
        this.processClassBody(ast.body);
    };
    TsImporter.prototype.processClassExpression = function (ast) {
        // this.pintHit(ast);
        return this.processClassDeclaration(ast);
    };
    TsImporter.prototype.processClassProperty = function (ast) {
        this.processAST(ast.key);
        if (ast.typeAnnotation) {
            this.processAST(ast.typeAnnotation);
        }
        if (ast.value) {
            this.processAST(ast.value);
        }
    };
    TsImporter.prototype.processConditionalExpression = function (ast) {
        this.processAST(ast.test);
        this.processAST(ast.consequent);
        this.processAST(ast.alternate);
    };
    TsImporter.prototype.processContinueStatement = function (ast) {
    };
    TsImporter.prototype.processDebuggerStatement = function (ast) {
    };
    TsImporter.prototype.processDecorator = function (ast) {
    };
    TsImporter.prototype.processDoWhileStatement = function (ast) {
        this.processAST(ast.test);
        this.processAST(ast.body);
    };
    TsImporter.prototype.processEmptyStatement = function (ast) {
    };
    TsImporter.prototype.processExportAllDeclaration = function (ast) {
    };
    TsImporter.prototype.processExportDefaultDeclaration = function (ast) {
    };
    TsImporter.prototype.processExportNamedDeclaration = function (ast) {
        ast.declaration.__exported = true;
        if (ast.__module) {
            ast.declaration.__module = ast.__module;
        }
        this.processAST(ast.declaration);
    };
    TsImporter.prototype.processExportSpecifier = function (ast) {
    };
    TsImporter.prototype.processExpressionStatement = function (ast) {
        this.processAST(ast.expression);
    };
    TsImporter.prototype.processForInStatement = function (ast) {
        ast.left.__parent = ast;
        this.processAST(ast.left);
        this.processAST(ast.right);
        this.processAST(ast.body);
    };
    TsImporter.prototype.processForOfStatement = function (ast) {
        ast.left.__parent = ast;
        this.processAST(ast.left);
        this.processAST(ast.right);
        this.processAST(ast.body);
    };
    TsImporter.prototype.processForStatement = function (ast) {
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
    };
    TsImporter.prototype.processFunctionDeclaration = function (ast) {
        this.processFunctionExpression(ast);
    };
    TsImporter.prototype.processFunctionExpression = function (ast) {
        this.processFunctionExpressionInternal(ast);
    };
    TsImporter.prototype.processFunctionExpressionInternal = function (ast) {
        if (ast.typeParameters) {
            for (var i = 0, len = ast.typeParameters.params.length; i < len; i++) {
                this.declaredMap[this.codeFromAST(ast.typeParameters.params[i].name)] = true;
            }
        }
        if (ast.params) {
            for (var i = 0, len = ast.params.length; i < len; i++) {
                var oneParam = ast.params[i];
                oneParam.__parent = ast;
                oneParam.__isFuncParam = true;
                this.processAST(oneParam);
            }
        }
        if (ast.returnType) {
            this.processAST(ast.returnType);
        }
        if (ast.body) {
            this.processAST(ast.body);
        }
    };
    TsImporter.prototype.processIdentifier = function (ast) {
        var str = ast.name;
        if (ast.typeAnnotation) {
            if (!ast.__parent || (ast.__parent.type != typescript_estree_1.AST_NODE_TYPES.CatchClause && (!ast.__parent.__parent || !ast.__parent.__parent.__parent || typescript_estree_1.AST_NODE_TYPES.ForInStatement != ast.__parent.__parent.__parent.type))) {
                this.processAST(ast.typeAnnotation);
            }
        }
        else if (ast.__isType) {
            if (this.allTypes.indexOf(str) < 0) {
                this.allTypes.push(str);
            }
        }
    };
    TsImporter.prototype.processIfStatement = function (ast) {
        this.processAST(ast.test);
        this.processAST(ast.consequent);
        if (ast.alternate && (ast.alternate.type != typescript_estree_1.AST_NODE_TYPES.BlockStatement || ast.alternate.body.length > 0)) {
            this.processAST(ast.alternate);
        }
    };
    TsImporter.prototype.processImportDeclaration = function (ast) {
    };
    TsImporter.prototype.processImportDefaultSpecifier = function (ast) {
    };
    TsImporter.prototype.processImportNamespaceSpecifier = function (ast) {
    };
    TsImporter.prototype.processImportSpecifier = function (ast) {
        this.processAST(ast.imported);
    };
    TsImporter.prototype.processLabeledStatement = function (ast) {
    };
    TsImporter.prototype.processLiteral = function (ast) {
    };
    TsImporter.prototype.processLogicalExpression = function (ast) {
        this.processAST(ast.left);
        this.processAST(ast.right);
    };
    TsImporter.prototype.processMemberExpression = function (ast) {
        ast.object.__memberExp_is_object = true;
        ast.object.__parent = ast;
        this.processAST(ast.object);
        ast.property.__parent = ast;
        ast.property.__memberExp_is_computed_property = ast.computed;
        this.processAST(ast.property);
    };
    TsImporter.prototype.processMetaProperty = function (ast) {
    };
    TsImporter.prototype.processMethodDefinition = function (ast) {
        this.processAST(ast.key);
        return this.processFunctionExpressionInternal(ast.value);
    };
    TsImporter.prototype.processNewExpression = function (ast) {
        this.processAST(ast.callee);
        for (var i = 0, len = ast.arguments.length; i < len; i++) {
            this.processAST(ast.arguments[i]);
        }
    };
    TsImporter.prototype.processObjectExpression = function (ast) {
        for (var i = 0, len = ast.properties.length; i < len; i++) {
            this.processAST(ast.properties[i]);
        }
    };
    TsImporter.prototype.processObjectPattern = function (ast) {
    };
    TsImporter.prototype.processProgram = function (ast) {
        for (var i = 0, len = ast.body.length; i < len; i++) {
            var stm = ast.body[i];
            this.processAST(stm);
        }
    };
    TsImporter.prototype.processProperty = function (ast) {
        ast.key.__parent = ast;
        this.processAST(ast.key);
        this.processAST(ast.value);
    };
    TsImporter.prototype.processRestElement = function (ast) {
        this.processAST(ast.argument);
    };
    TsImporter.prototype.processReturnStatement = function (ast) {
        if (ast.argument) {
            this.processAST(ast.argument);
        }
    };
    TsImporter.prototype.processSequenceExpression = function (ast) {
        for (var i = 0, len = ast.expressions.length; i < len; i++) {
            this.processAST(ast.expressions[i]);
        }
    };
    TsImporter.prototype.processSpreadElement = function (ast) {
    };
    TsImporter.prototype.processSuper = function (ast) {
    };
    TsImporter.prototype.processSwitchCase = function (ast) {
        if (ast.test) {
            this.processAST(ast.test);
        }
        for (var i = 0, len = ast.consequent.length; i < len; i++) {
            if (ast.consequent[i].type != typescript_estree_1.AST_NODE_TYPES.BreakStatement) {
                this.processAST(ast.consequent[i]);
            }
        }
    };
    TsImporter.prototype.processSwitchStatement = function (ast) {
        this.processAST(ast.discriminant);
        for (var i = 0, len = ast.cases.length; i < len; i++) {
            this.processSwitchCase(ast.cases[i]);
        }
    };
    TsImporter.prototype.processTaggedTemplateExpression = function (ast) {
    };
    TsImporter.prototype.processTemplateElement = function (ast) {
    };
    TsImporter.prototype.processTemplateLiteral = function (ast) {
    };
    TsImporter.prototype.processThisExpression = function (ast) {
    };
    TsImporter.prototype.processThrowStatement = function (ast) {
        this.processAST(ast.argument);
    };
    TsImporter.prototype.processTryStatement = function (ast) {
        this.processAST(ast.block);
        if (ast.handler) {
            this.processAST(ast.handler);
        }
        if (ast.finalizer) {
            this.processAST(ast.finalizer);
        }
    };
    TsImporter.prototype.processTSClassImplements = function (ast) {
        ast.expression.__isType = true;
        this.processAST(ast.expression);
        if (ast.typeParameters) {
            this.processAST(ast.typeParameters) + '>';
        }
    };
    TsImporter.prototype.processTSParenthesizedType = function (ast) {
        this.processAST(ast.typeAnnotation);
    };
    TsImporter.prototype.processUnaryExpression = function (ast) {
        this.processAST(ast.argument);
    };
    TsImporter.prototype.processUpdateExpression = function (ast) {
        this.processAST(ast.argument);
    };
    TsImporter.prototype.processVariableDeclaration = function (ast) {
        for (var i = 0, len = ast.declarations.length; i < len; i++) {
            var d = ast.declarations[i];
            d.__parent = ast;
            this.processVariableDeclarator(d);
        }
    };
    TsImporter.prototype.processVariableDeclarator = function (ast) {
        if (ast.init) {
            this.processAST(ast.init);
        }
    };
    TsImporter.prototype.processWhileStatement = function (ast) {
        this.processAST(ast.test);
        this.processAST(ast.body);
    };
    TsImporter.prototype.processWithStatement = function (ast) {
        this.processAST(ast.object);
        this.processAST(ast.body);
    };
    TsImporter.prototype.processYieldExpression = function (ast) {
        if (ast.argument) {
            this.processAST(ast.argument);
        }
    };
    TsImporter.prototype.processTSAbstractMethodDefinition = function (ast) {
        this.processMethodDefinition(ast);
    };
    TsImporter.prototype.processTSAsExpression = function (ast) {
        this.processAST(ast.expression);
        this.processAST(ast.typeAnnotation);
    };
    TsImporter.prototype.processTSDeclareFunction = function (ast) {
    };
    TsImporter.prototype.processTSEnumDeclaration = function (ast) {
    };
    TsImporter.prototype.processTSInterfaceBody = function (ast) {
        var str = '';
        for (var i = 0, len = ast.body.length; i < len; i++) {
            if (i > 0) {
                str += '\n';
            }
            str += this.processAST(ast.body[i]);
        }
        return str;
    };
    TsImporter.prototype.processTSMethodSignature = function (ast) {
        if (ast.params) {
            for (var i = 0, len = ast.params.length; i < len; i++) {
                var oneParam = ast.params[i];
                oneParam.__parent = ast;
                oneParam.__isFuncParam = true;
                this.processAST(oneParam);
            }
        }
        if (ast.returnType) {
            this.processAST(ast.returnType);
        }
    };
    TsImporter.prototype.processTSModuleBlock = function (ast) {
        for (var i = 0, len = ast.body.length; i < len; i++) {
            this.processAST(ast.body[i]);
        }
    };
    TsImporter.prototype.processTSModuleDeclaration = function (ast) {
        ast.body.__parent = ast;
        this.processAST(ast.body);
    };
    TsImporter.prototype.processTSImportEqualsDeclaration = function (ast) {
    };
    TsImporter.prototype.processTSInterfaceDeclaration = function (ast) {
        var className = this.codeFromAST(ast.id);
        this.declaredMap[className] = true;
        if (ast.extends) {
            for (var i = 0, len = ast.extends.length; i < len; i++) {
                this.processAST(ast.extends[i]);
            }
        }
        this.processAST(ast.body);
    };
    TsImporter.prototype.processTSTypeAssertion = function (ast) {
    };
    TsImporter.prototype.processTSTypeAnnotation = function (ast) {
        this.processAST(ast.typeAnnotation);
    };
    TsImporter.prototype.processTSTypeParameterInstantiation = function (ast) {
        for (var i = 0, len = ast.params.length; i < len; i++) {
            ast.params[i].__isType = true;
            this.processAST(ast.params[i]);
        }
    };
    TsImporter.prototype.processTSTypeReference = function (ast) {
        ast.typeName.__isType = true;
        this.processAST(ast.typeName);
        if (ast.typeParameters) {
            this.processAST(ast.typeParameters);
        }
    };
    TsImporter.prototype.processTSVoidKeyword = function (ast) {
    };
    TsImporter.prototype.codeFromAST = function (ast) {
        var str = '';
        switch (ast.type) {
            case typescript_estree_1.AST_NODE_TYPES.Identifier:
                str += this.codeFromIdentifier(ast);
                break;
            case typescript_estree_1.AST_NODE_TYPES.ImportSpecifier:
                str += this.codeFromImportSpecifier(ast);
                break;
            case typescript_estree_1.AST_NODE_TYPES.MemberExpression:
                str += this.codeFromMemberExpression(ast);
                break;
            default:
                this.assert(false, ast, '[ERROR]Analyse import error, not support: ' + ast.type);
                break;
        }
        return str;
    };
    TsImporter.prototype.codeFromIdentifier = function (ast) {
        return ast.name;
    };
    TsImporter.prototype.codeFromImportSpecifier = function (ast) {
        var str = this.codeFromAST(ast.imported);
        return str;
    };
    TsImporter.prototype.codeFromMemberExpression = function (ast) {
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
    TsImporter.prototype.indent = function (str, fromLine) {
        if (fromLine === void 0) { fromLine = 0; }
        var indentStr = '    ';
        var endWithNewLine = str.substr(str.length - 1) == '\n';
        var lines = str.split(/\n/);
        var newStr = '';
        for (var i = 0, len = lines.length; i < len; i++) {
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
    };
    TsImporter.prototype.assert = function (cond, ast, message) {
        if (message === void 0) { message = null; }
        if (!cond) {
            if (ast) {
                console.log(util.inspect(ast, true, 6));
            }
            console.log('\x1B[36m%s\x1B[0m(tmp/tmp.ts:\x1B[33m%d:%d\x1B[0m) - \x1B[31merror\x1B[0m: %s', this.relativePath, ast && ast.loc ? ast.loc.start.line : -1, ast && ast.loc ? ast.loc.start.column : -1, message ? message : 'Error');
            console.log(Strings_1.TsEasyHints.ContactMsg);
            throw new Error('[As2TS]Something wrong encountered.');
        }
    };
    return TsImporter;
}());
exports.TsImporter = TsImporter;
