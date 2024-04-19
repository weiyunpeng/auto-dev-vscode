import { SupportedLanguage } from "../editor/language/SupportedLanguage";
import { BaseStructurer } from "./_base/BaseStructurer";
import { JavaStructurer } from "./java/JavaStructurer";
import { DefaultLanguageService } from "../editor/language/service/DefaultLanguageService";

export class StructurerProviderManager {
	private structureMap: Map<SupportedLanguage, BaseStructurer> = new Map();

	async init() {
		let map: Map<string, BaseStructurer> = new Map();
		const structurer = new JavaStructurer();
		await structurer.init(new DefaultLanguageService());
		map.set("java", structurer);
		this.structureMap = map;
	}

	getStructurer(lang: SupportedLanguage): BaseStructurer | undefined {
		return this.structureMap.get(lang);
	}
}
