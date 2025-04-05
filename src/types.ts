import { GEMINI_MODELS, GROK_MODELS, LLM_PROVIDERS } from './constants';

/**
 * List of supported LLM providers
 */
export type LLMProvider = typeof LLM_PROVIDERS[number];

/**
 * List of supported Gemini models
 */
export type GeminiModel = typeof GEMINI_MODELS[number];

/**
 * List of supported Grok models
 */
export type GrokModel = typeof GROK_MODELS[number];

/**
 * Unified model type that can be either Gemini or Grok
 */
export type LLMModel = GeminiModel | GrokModel;

/**
 * Represents a named prompt template
 */
export interface NamedPrompt {
	id: string;
	name: string;
	promptText: string;
}

/** Represents the plugin settings */
export interface PluginSettings {
	llmProvider: LLMProvider;
	geminiApiKey: string;
	grokApiKey: string;
	selectedGeminiModel: GeminiModel;
	selectedGrokModel: GrokModel;
	customPrompt: string;
	maxTokens: number;
	temperature: number;
	savedPrompts: NamedPrompt[];
	selectedPromptId: string | null;
}

/** Represents a single line of video transcript with timing information */
export interface TranscriptLine {
	text: string;
	duration: number;
	offset: number;
}

/** Response structure for video transcript and metadata */
export interface TranscriptResponse {
	url: string;
	videoId: string;
	title: string;
	author: string;
	channelUrl: string;
	lines: TranscriptLine[];
}

/** Available thumbnail quality options with dimensions */
export interface ThumbnailQuality {
	default: string; // 120x90
	medium: string; // 320x180
	high: string; // 480x360
	standard: string; // 640x480
	maxres: string; // 1280x720
}
