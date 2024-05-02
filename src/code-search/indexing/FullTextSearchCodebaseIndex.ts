import { CodebaseIndex, IndexTag, IndexingProgressUpdate } from "./_base/CodebaseIndex";

export class FullTextSearchCodebaseIndex implements CodebaseIndex {
	artifactId: string = "sqlite";

	update(tag: IndexTag, repoName: string | undefined): AsyncGenerator<IndexingProgressUpdate> {
		throw new Error("Method not implemented.");
	}
}