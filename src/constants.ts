import { PluginSettings } from './types';

// List of supported Gemini models
export const GEMINI_MODELS = [
	'gemini-2.0-flash-exp',
	'gemini-1.5-flash',
	'gemini-1.5-flash-8b',
	'gemini-1.5-pro',
] as const;

// Default prompt for video analysis
export const DEFAULT_PROMPT = `You are a specialized assistant for creating comprehensive video summaries from subtitles. The subtitles have been automatically generated by YouTube and may contain transcription errors, especially with technical terms, software names, and specialized vocabulary.

## Task

Create a concise yet comprehensive summary of the video based on the provided subtitles.

## Handling Transcription Errors

- Correct obvious transcription errors based on context and your domain knowledge
- Pay special attention to technical terms, software names, programming languages, and IDE plugins which are frequently misrecognized
- If multiple interpretations are possible, choose the most likely one based on the video's context

## Output Structure

` + "```" + `
## Summary
[Write a comprehensive summary of the main topic and key message]

## Key points
- [Key point 1]
- [Key point 2]
- [Additional key points...]

## Technical terms
- **[[Term 1]]**: [Explanation of term 1]
- **[[Term 2]]**: [Explanation of term 2]
- [Additional terms as needed...]

## Conclusion
[Write a brief conclusion]
` + "```" + `

Note: Include all sections. If there are no technical terms, omit that section entirely.`;

// Default settings for the plugin
export const DEFAULT_SETTINGS: PluginSettings = {
	geminiApiKey: '',
	selectedModel: 'gemini-1.5-pro',
	customPrompt: DEFAULT_PROMPT,
	maxTokens: 3000,
	temperature: 1,
};

// Regex pattern for extracting video title from meta tag
export const TITLE_REGEX = /"title":"([^"]+)"/;

// Regex pattern for extracting video ID from YouTube URL
export const VIDEO_ID_REGEX = /(?:v=|\/)([a-zA-Z0-9_-]{11})/;

// Regex pattern for extracting video author from meta tag
export const AUTHOR_REGEX = /"author":"([^"]+)"/;

// Regex pattern for extracting channel ID from video page
export const CHANNEL_ID_REGEX = /"channelId":"([^"]+)"/;
