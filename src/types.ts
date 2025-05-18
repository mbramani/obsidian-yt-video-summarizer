import { GEMINI_MODELS } from './constants';

/**
 * List of supported Gemini models
 */
export type GeminiModel = typeof GEMINI_MODELS[number];

/** Represents the plugin settings */
export interface PluginSettings {
	geminiApiKey: string;
	selectedModel: GeminiModel;
	customPrompt: string;
	maxTokens: number;
	temperature: number;
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
