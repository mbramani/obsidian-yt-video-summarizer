import { GEMINI_MODELS, GROK_MODELS, LLM_PROVIDERS, VIDEO_ANALYSIS_METHODS } from './constants';

/**
 * List of supported video analysis methods
 */
export type VideoAnalysisMethod = typeof VIDEO_ANALYSIS_METHODS[number];

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
	videoAnalysisMethod: VideoAnalysisMethod;
	fallbackToMetadata: boolean;
	multimodalEnabled: boolean;
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

/** Video metadata when captions aren't available */
export interface VideoMetadata {
	title: string;
	description: string;
	author: string;
	channelUrl: string;
	tags: string[];
	publishDate: string;
	videoId: string;
	url: string;
}

/** Available thumbnail quality options with dimensions */
export interface ThumbnailQuality {
	default: string; // 120x90
	medium: string; // 320x180
	high: string; // 480x360
	standard: string; // 640x480
	maxres: string; // 1280x720
}
