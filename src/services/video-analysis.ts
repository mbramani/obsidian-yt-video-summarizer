import { PluginSettings, VideoMetadata } from 'src/types';
import { LLMService } from './llm-service';

/**
 * Service for analyzing video content directly when captions aren't available.
 * This class provides methods for generating video summaries using multimodal AI.
 */
export class VideoAnalysisService {
    private settings: PluginSettings;
    private llmService: LLMService;

    /**
     * Creates an instance of VideoAnalysisService.
     * @param settings - The plugin settings
     * @param llmService - The LLM service to use for generating summaries
     */
    constructor(settings: PluginSettings, llmService: LLMService) {
        this.settings = settings;
        this.llmService = llmService;
    }

    /**
     * Generates a summary of a video based on its metadata when captions aren't available
     * @param metadata - The video metadata
     * @returns Promise containing the generated summary
     */
    async generateMetadataSummary(metadata: VideoMetadata): Promise<string> {
        // Build a comprehensive prompt based on video metadata
        const metadataPrompt = `
I need you to create a comprehensive summary of a YouTube video based only on its metadata.

## Video Metadata
- Title: ${metadata.title}
- Author: ${metadata.author}
- Channel: ${metadata.channelUrl}
- Published: ${metadata.publishDate}
- Tags: ${metadata.tags.join(', ')}

## Video Description
${metadata.description}

## Task
Based on the title, description, tags, and other metadata, create a comprehensive summary of what this video likely contains.
Since no transcript is available, use your knowledge about the topic and the video creator to make educated inferences.

Your summary should:
1. Identify the main topic of the video
2. Outline likely key points based on the description and tags
3. Mention relevant technologies or concepts referenced in the metadata
4. Clearly indicate that this summary is based on metadata only, not on the actual video content

Please structure your response in markdown format with appropriate sections, including a summary, key points, and related concepts.`;

        // Generate the summary using the LLM service
        return await this.llmService.summarize(metadataPrompt);
    }

    /**
     * Generates a summary of a video using multimodal AI when captions aren't available
     * This approach sends the video URL directly to a multimodal model for analysis
     * @param videoUrl - URL of the video to analyze
     * @param metadata - The video metadata for additional context
     * @returns Promise containing the generated summary
     */
    async generateMultimodalSummary(videoUrl: string, metadata: VideoMetadata): Promise<string> {
        // For Gemini models that support multimodal input
        if (this.settings.llmProvider === 'gemini') {
            const multimodalPrompt = `
Please analyze this YouTube video and create a comprehensive summary.

## Video Details
- Title: ${metadata.title}
- Author: ${metadata.author}
- URL: ${videoUrl}

## Task
Create a detailed summary of the video content. Focus on:
1. The main topic and purpose of the video
2. Key points discussed or demonstrated
3. Important visual elements or demonstrations
4. Any technical concepts presented
5. The overall message or conclusion

Format your response in markdown with appropriate headings.

The video is available at: ${videoUrl}`;

            // Generate the summary using the LLM service
            return await this.llmService.summarize(multimodalPrompt);
        } 
        // For Grok's vision models
        else if (this.settings.llmProvider === 'grok' && this.settings.selectedGrokModel.includes('vision')) {
            const multimodalPrompt = `
Please analyze this YouTube video and create a comprehensive summary.

## Video Details
- Title: ${metadata.title}
- Author: ${metadata.author}
- URL: ${videoUrl}

## Task
Create a detailed summary of the video content. Focus on:
1. The main topic and purpose of the video
2. Key points discussed or demonstrated
3. Important visual elements or demonstrations
4. Any technical concepts presented
5. The overall message or conclusion

Format your response in markdown with appropriate headings.

The video is available at: ${videoUrl}`;

            // Generate the summary using the LLM service
            return await this.llmService.summarize(multimodalPrompt);
        }
        // Fallback to metadata-based summary if multimodal not supported
        else {
            return await this.generateMetadataSummary(metadata);
        }
    }
}