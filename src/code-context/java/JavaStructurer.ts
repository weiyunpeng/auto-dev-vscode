import Parser, { Query } from "web-tree-sitter";
import { injectable } from "inversify";

import { createFunction, createVariable, insertLocation, Structurer } from "../_base/BaseStructurer";
import { JavaLangConfig } from "./JavaLangConfig";
import { SupportedLanguage } from "../../editor/language/SupportedLanguage";
import { CodeFile, CodeFunction, CodeStructure, CodeVariable } from "../../editor/codemodel/CodeFile";
import { LanguageConfig } from "../_base/LanguageConfig";
import { TSLanguageService } from "../../editor/language/service/TSLanguageService";
import { TSLanguageUtil } from "../ast/TSLanguageUtil";

@injectable()
export class JavaStructurer implements Structurer {
	protected langId: SupportedLanguage = "java";
	protected config: LanguageConfig = JavaLangConfig;
	protected parser: Parser | undefined;
	protected language: Parser.Language | undefined;

	isApplicable(lang: string) {
		return lang === "java";
	}

	constructor() {
	}

	async init(langService: TSLanguageService): Promise<Query | undefined> {
		const tsConfig = TSLanguageUtil.fromId(this.langId)!!;
		const _parser = langService.getParser() ?? new Parser();
		const language = await tsConfig.grammar(langService, this.langId);
		_parser.setLanguage(language);
		this.parser = _parser;
		this.language = language;
		return language?.query(tsConfig.structureQuery.queryStr);
	}

	/**
	 * Parses the given code string and generates a CodeFile object representing the structurer of the code.
	 *
	 * @param code The code string to be parsed.
	 * @param filepath
	 * @returns A Promise that resolves to the generated CodeFile object, or undefined if the parsing fails.
	 */
	async parseFile(code: string, filepath: string): Promise<CodeFile | undefined> {
		const tree = this.parser!!.parse(code);
		const query = this.config.structureQuery.query(this.language!!);
		const captures = query!!.captures(tree.rootNode);

		let filename = filepath.split('/')[filepath.split('/').length - 1];
		const codeFile: CodeFile = {
			name: filename,
			filepath: filepath,
			language: this.langId,
			functions: [],
			path: "",
			package: '',
			imports: [],
			classes: []
		};
		let classObj: CodeStructure = {
			canonicalName: '',
			constant: [],
			extends: [],
			methods: [],
			name: '',
			package: '',
			implements: [],
			start: { row: 0, column: 0 },
			end: { row: 0, column: 0 }
		};
		let isLastNode = false;
		const methods: CodeFunction[] = [];
		let methodReturnType = '';
		let methodName = '';

		for (const element of captures) {
			const capture: Parser.QueryCapture = element!!;
			const text = capture.node.text;

			switch (capture.name) {
				case 'package-name':
					codeFile.package = text;
					break;
				case 'import-name':
					codeFile.imports.push(text);
					break;
				case 'class-name':
					if (classObj.name !== '') {
						codeFile.classes.push({ ...classObj });
						classObj = {
							canonicalName: "",
							package: codeFile.package, implements: [],
							constant: [], extends: [], methods: [], name: '',
							start: { row: 0, column: 0 },
							end: { row: 0, column: 0 }
						};
					}
					classObj.name = text;
					classObj.canonicalName = codeFile.package + "." + classObj.name;
					const classNode: Parser.SyntaxNode | null = capture.node?.parent ?? null;
					if (classNode !== null) {
						insertLocation(classObj, classNode);
						if (!isLastNode) {
							isLastNode = true;
						}
					}
					break;
				case 'method-returnType':
					methodReturnType = text;
					break;
				case 'method-name':
					methodName = text;
					break;
				case 'method-body':
					if (methodName !== '') {
						const methodNode = capture.node;
						const methodObj = createFunction(capture, methodName);
						if (methodReturnType !== '') {
							methodObj.returnType = methodReturnType;
						}
						if (methodNode !== null) {
							insertLocation(classObj, methodNode);
						}

						methods.push(methodObj);
					}

					methodReturnType = '';
					methodName = '';
					break;
				case 'impl-name':
					classObj.implements.push(text);
					break;
				default:
					break;
			}
		}

		classObj.methods = methods;

		if (isLastNode) {
			codeFile.classes.push({ ...classObj });
		}

		return codeFile;
	}

	async extractMethodInputOutput(code: string): Promise<string[] | undefined> {
		const tree = this.parser!!.parse(code);
		const query = this.config.methodIOQuery!!.query(this.language!!);
		const captures = query!!.captures(tree.rootNode);

		let methodObj: CodeFunction = {
			name: '',
			returnType: '',
			vars: [],
			start: { row: 0, column: 0 },
			end: { row: 0, column: 0 }
		};
		let paramObj: CodeVariable = {
			name: '',
			typ: ''
		};

		for (const element of captures) {
			const capture: Parser.QueryCapture = element!!;
			const text = capture.node.text;

			// todo: handle for array;
			switch (capture.name) {
				case 'method-name':
					methodObj.name = text;
					break;
				case 'method-returnType':
					methodObj.returnType = text;
					break;
				case 'method-param.type':
					paramObj.typ = text;
					break;
				case 'method-param.value':
					paramObj.name = text;
					methodObj.vars.push(paramObj);
					// reset paramObj
					paramObj = { name: '', typ: '' };
					break;
				default:
					break;
			}
		}

		const inputAndOutput: string[] = [];

		const pushIfNotBuiltInType = (type: string) => {
			if (!this.config.builtInTypes.includes(type)) {
				inputAndOutput.push(type);
			}
		};

		if (methodObj.returnType) {
			pushIfNotBuiltInType(methodObj.returnType);
		}

		methodObj.vars.forEach((param) => {
			pushIfNotBuiltInType(param.typ);
		});

		return inputAndOutput;
	}

	getIfTypeInImport() {
	}
}
