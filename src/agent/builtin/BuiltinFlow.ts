/**
 * AutoDev TaskFlow is the built-in Workflow for AutoDev, see in [#81](https://github.com/unit-mesh/auto-dev/issues/81)
 */
export interface TaskFlow<Tasking> {
	/**
	 * This method is used to clarify the purpose of user's requirement.
	 * It returns a string will specify format, will parse in design()
	 * For example, tableNames in SQL:
	 * ```markdown
	 * [item1, item2, item3]
	 * ```
	 * @return A string representing the documentation for the class.
	 */
	clarify(): string;

	/**
	 * This method is used to ask LLM to design the tasking flow based on the given context.
	 * It returns a string will specify format, will parse in execute()
	 *
	 * @param context The context for designing the task flow.
	 */
	design(context: any): Tasking[];

	/**
	 * Executes the last step of the task flow.
	 *
	 * Like:
	 * - Execute SQL in [cc.unitmesh.database.flow.GenSqlFlow]
	 * - Execute HTTP request in HttpRequest
	 * - Execute shell command in ShellCommand
	 *
	 * @return A string representing the result of the execution.
	 */
	execute(context: any): string;

	/**
	 * This method is used to fix the errors in the task flow.
	 *
	 * @param errors The errors that need to be fixed.
	 * @return A string representing the fixed errors.
	 */
	fix(errors: string): string;
}
