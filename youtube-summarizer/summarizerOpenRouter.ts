import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { ChatOpenRouter } from "./llmClients.js";
import { getLangchainSummaryPrompt } from "./prompts.js";
import { type Summary, SummarySchema } from "./schemas.js";
import { getSettings } from "./settings.js";

export async function summarizerOpenRouter(
	transcript: string,
	targetLanguage: string | null = null,
): Promise<Summary> {
	const settings = getSettings();
	const cleanTranscript = transcript.trim();

	if (!cleanTranscript) {
		throw new Error("Transcript cannot be empty");
	}

	const model = settings.openrouterSummaryModel;
	const llm = ChatOpenRouter({
		model,
		reasoningEffort: settings.openrouterReasoningEffort,
		temperature: 0,
		timeoutMs: settings.llmTimeoutSeconds * 1000,
	}).withStructuredOutput(SummarySchema);

	const messages = [
		new SystemMessage(getLangchainSummaryPrompt(targetLanguage)),
		new HumanMessage(`Transcript:\n${cleanTranscript}`),
	];

	return await llm.invoke(messages);
}
