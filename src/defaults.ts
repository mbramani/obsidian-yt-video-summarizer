import { StoredProvider } from './types';

// List of supported Gemini models
const DEFAULT_GEMINI_MODELS = [
	{
		name: 'gemini-3.1-pro-preview',
		displayName: 'Gemini 3.1 Pro Preview',
		pricing: 'Check Google pricing page; preview pricing may change'
	},
	{
		name: 'gemini-3-flash-preview',
		displayName: 'Gemini 3 Flash Preview',
		pricing: 'Check Google pricing page; preview pricing may change'
	},
	{
		name: 'gemini-3.1-flash-lite-preview',
		displayName: 'Gemini 3.1 Flash-Lite Preview',
		pricing: 'Check Google pricing page; preview pricing may change'
	},
	{
		name: 'gemini-2.5-pro',
		displayName: 'Gemini 2.5 Pro',
		pricing: 'Input $1.25 / Output $10.00 per 1M tokens <=200k; Input $2.50 / Output $15.00 >200k'
	},
	{
		name: 'gemini-2.5-flash',
		displayName: 'Gemini 2.5 Flash',
		pricing: 'Input $0.30 / Output $2.50 per 1M tokens'
	},
	{
		name: 'gemini-2.5-flash-lite',
		displayName: 'Gemini 2.5 Flash-Lite',
		pricing: 'Input $0.10 / Output $0.40 per 1M tokens'
	},

	// Legacy / deprecated
	{
		name: 'gemini-2.0-flash',
		displayName: 'Gemini 2.0 Flash Deprecated',
		pricing: 'Input $0.10 / Output $0.40 per 1M tokens; deprecated'
	},
	{
		name: 'gemini-2.0-flash-lite',
		displayName: 'Gemini 2.0 Flash-Lite Deprecated',
		pricing: 'Input $0.075 / Output $0.30 per 1M tokens; deprecated'
	}
];

const DEFAULT_OPENAI_MODELS = [
	{
		name: 'gpt-5.5',
		displayName: 'GPT-5.5',
		pricing: 'Input $5.00 / Cached input $0.50 / Output $30.00 per 1M tokens; long context $10.00/$1.00/$45.00'
	},
	{
		name: 'gpt-5.5-pro',
		displayName: 'GPT-5.5 Pro',
		pricing: 'Input $30.00 / Output $180.00 per 1M tokens; long context $60.00/$270.00'
	},
	{
		name: 'gpt-5.4',
		displayName: 'GPT-5.4',
		pricing: 'Input $2.50 / Cached input $0.25 / Output $15.00 per 1M tokens; long context $5.00/$0.50/$22.50'
	},
	{
		name: 'gpt-5.4-mini',
		displayName: 'GPT-5.4 Mini',
		pricing: 'Input $0.75 / Cached input $0.075 / Output $4.50 per 1M tokens'
	},
	{
		name: 'gpt-5.4-nano',
		displayName: 'GPT-5.4 Nano',
		pricing: 'Input $0.20 / Cached input $0.02 / Output $1.25 per 1M tokens'
	},
	{
		name: 'gpt-5.4-pro',
		displayName: 'GPT-5.4 Pro',
		pricing: 'Input $30.00 / Output $180.00 per 1M tokens; long context $60.00/$270.00'
	},
	{
		name: 'gpt-5.3-chat-latest',
		displayName: 'GPT-5.3 Chat Latest',
		pricing: 'Input $1.75 / Cached input $0.175 / Output $14.00 per 1M tokens'
	},
	{
		name: 'gpt-5.3-codex',
		displayName: 'GPT-5.3 Codex',
		pricing: 'Input $1.75 / Cached input $0.175 / Output $14.00 per 1M tokens'
	},
	{
		name: 'gpt-4.1',
		displayName: 'GPT-4.1',
		pricing: 'Input $2.00 / Output $8.00 per 1M tokens'
	},
	{
		name: 'gpt-4.1-mini',
		displayName: 'GPT-4.1 Mini',
		pricing: 'Input $0.40 / Output $1.60 per 1M tokens'
	},
	{
		name: 'gpt-4.1-nano',
		displayName: 'GPT-4.1 Nano',
		pricing: 'Input $0.10 / Output $0.40 per 1M tokens'
	},
	{
		name: 'gpt-4o',
		displayName: 'GPT-4o',
		pricing: 'Input $2.50 / Output $10.00 per 1M tokens'
	},
	{
		name: 'gpt-4o-mini',
		displayName: 'GPT-4o Mini',
		pricing: 'Input $0.15 / Output $0.60 per 1M tokens'
	},
	{
		name: 'o1',
		displayName: 'o1',
		pricing: 'Input $15.00 / Output $60.00 per 1M tokens'
	},
	{
		name: 'o1-mini',
		displayName: 'o1-mini',
		pricing: 'Input $1.10 / Output $4.40 per 1M tokens'
	},
	{
		name: 'o3-mini',
		displayName: 'o3-mini',
		pricing: 'Input $1.10 / Output $4.40 per 1M tokens'
	},
	{
		name: 'o4-mini',
		displayName: 'o4-mini',
		pricing: 'Input $1.10 / Output $4.40 per 1M tokens'
	}
];

const DEFAULT_ANTHROPIC_MODELS = [
	// Current recommended models
	{
		name: 'claude-opus-4-7',
		displayName: 'Claude Opus 4.7',
		pricing: 'Input $5.00 / Output $25.00 per 1M tokens'
	},
	{
		name: 'claude-sonnet-4-6',
		displayName: 'Claude Sonnet 4.6',
		pricing: 'Input $3.00 / Output $15.00 per 1M tokens'
	},
	{
		name: 'claude-haiku-4-5-20251001',
		displayName: 'Claude Haiku 4.5',
		pricing: 'Input $1.00 / Output $5.00 per 1M tokens'
	},

	// Legacy / still available
	{
		name: 'claude-opus-4-6',
		displayName: 'Claude Opus 4.6 Legacy',
		pricing: 'Input $5.00 / Output $25.00 per 1M tokens'
	},
	{
		name: 'claude-sonnet-4-5-20250929',
		displayName: 'Claude Sonnet 4.5 Legacy',
		pricing: 'Input $3.00 / Output $15.00 per 1M tokens'
	},
	{
		name: 'claude-opus-4-5-20251101',
		displayName: 'Claude Opus 4.5 Legacy',
		pricing: 'Input $5.00 / Output $25.00 per 1M tokens'
	},
	{
		name: 'claude-opus-4-1-20250805',
		displayName: 'Claude Opus 4.1 Legacy',
		pricing: 'Input $15.00 / Output $75.00 per 1M tokens'
	},
	{
		name: 'claude-sonnet-4-20250514',
		displayName: 'Claude Sonnet 4 Deprecated',
		pricing: 'Input $3.00 / Output $15.00 per 1M tokens; deprecated, retires June 15, 2026'
	},
	{
		name: 'claude-opus-4-20250514',
		displayName: 'Claude Opus 4 Deprecated',
		pricing: 'Input $15.00 / Output $75.00 per 1M tokens; deprecated, retires June 15, 2026'
	}
];

export const DEFAULT_SELECTED_MODEL = 'Gemini:gemini-2.5-flash';

export const DEFAULT_PROVIDERS: StoredProvider[] = [
	{
		name: 'Gemini',
		type: 'gemini',
		isBuiltIn: true,
		apiKey: '',
		models: DEFAULT_GEMINI_MODELS
	},
	{
		name: 'OpenAI',
		type: 'openai',
		isBuiltIn: true,
		apiKey: '',
		models: DEFAULT_OPENAI_MODELS
	},
	{
		name: 'Anthropic',
		type: 'anthropic',
		isBuiltIn: true,
		apiKey: '',
		models: DEFAULT_ANTHROPIC_MODELS
	}
];

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

export const DEFAULT_MAX_TOKENS = 10000;
export const DEFAULT_TEMPERATURE = 1;
