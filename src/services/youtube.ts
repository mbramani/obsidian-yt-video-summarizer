import {
	AUTHOR_REGEX,
	CHANNEL_ID_REGEX,
	TITLE_REGEX,
	VIDEO_ID_REGEX,
} from 'src/constants';
import {
	ThumbnailQuality,
	TranscriptLine,
	TranscriptResponse,
	VideoMetadata,
} from 'src/types';

import { Notice } from 'obsidian';
import { parse } from 'node-html-parser';
import { request } from 'obsidian';

/**
 * Service class for interacting with YouTube videos.
 * Provides methods to fetch video thumbnails and transcripts.
 */
export class YouTubeService {
	/**
	 * Gets the thumbnail URL for a YouTube video
	 * @param videoId - The YouTube video identifier
	 * @param quality - Desired thumbnail quality (default: 'maxres')
	 * @returns URL string for the video thumbnail
	 * @example
	 * const thumbnailUrl = YouTubeService.getThumbnailUrl('dQw4w9WgXcQ', 'maxres');
	 * console.log(thumbnailUrl); // 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg'
	 */
	static getThumbnailUrl(
		videoId: string,
		quality: keyof ThumbnailQuality = 'maxres'
	): string {
		const qualities: ThumbnailQuality = {
			default: `https://img.youtube.com/vi/${videoId}/default.jpg`,
			medium: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
			high: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
			standard: `https://img.youtube.com/vi/${videoId}/sddefault.jpg`,
			maxres: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
		};
		return qualities[quality];
	}

	/**
	 * Checks if a URL is a valid YouTube URL
	 * @param url - The URL to check
	 * @returns True if the URL is a YouTube URL, false otherwise
	 * @example
	 * const isYoutube = YouTubeService.isYouTubeUrl('https://youtube.com/watch?v=dQw4w9WgXcQ');
	 * console.log(isYoutube); // true
	 */
	static isYouTubeUrl(url: string): boolean {
		return (
			url.startsWith('https://www.youtube.com/') ||
			url.startsWith('https://youtu.be/')
		);
	}

	/**
	 * Fetches and processes a YouTube video transcript
	 * @param url - Full YouTube video URL
	 * @param langCode - Language code for caption track (default: 'en')
	 * @returns Promise containing video metadata and transcript
	 * @throws Error if transcript cannot be fetched or processed
	 */
	async fetchTranscript(
		url: string,
		langCode = 'en'
	): Promise<TranscriptResponse> {
		try {
			// Extract video ID from URL
			const videoId = this.extractMatch(url, VIDEO_ID_REGEX);
			if (!videoId) throw new Error('Invalid YouTube URL');

			// Fetch the video page content
			const videoPageBody = await request(url);

			// Extract video metadata from page content
			const title = this.extractMatch(videoPageBody, TITLE_REGEX);
			const author = this.extractMatch(videoPageBody, AUTHOR_REGEX);
			const channelId = this.extractMatch(
				videoPageBody,
				CHANNEL_ID_REGEX
			);
			
			try {
				const captions = await this.extractCaptions(
					videoPageBody,
					langCode
				);
				
				const response = {
					url,
					videoId,
					title: this.decodeHTML(title || 'Unknown'),
					author: this.decodeHTML(author || 'Unknown'),
					channelUrl: channelId
						? `https://www.youtube.com/channel/${channelId}`
						: '',
					lines: this.parseCaptions(captions),
				};
	
				return response;
			} catch (captionError) {
				// If captions are not available, create a minimal transcript response
				// with empty lines array, so the calling code can handle appropriately
				return {
					url,
					videoId,
					title: this.decodeHTML(title || 'Unknown'),
					author: this.decodeHTML(author || 'Unknown'),
					channelUrl: channelId
						? `https://www.youtube.com/channel/${channelId}`
						: '',
					lines: [],
				};
			}
		} catch (error) {
			throw new Error(`Failed to fetch transcript: ${error.message}`);
		}
	}

	/**
	 * Fetches detailed metadata for a YouTube video
	 * @param url - Full YouTube video URL
	 * @returns Promise containing video metadata
	 * @throws Error if metadata cannot be fetched or processed
	 */
	async fetchVideoMetadata(url: string): Promise<VideoMetadata> {
		try {
			// Extract video ID from URL
			const videoId = this.extractMatch(url, VIDEO_ID_REGEX);
			if (!videoId) throw new Error('Invalid YouTube URL');

			// Fetch the video page content
			const videoPageBody = await request(url);
			
			// Extract basic metadata from page content
			const title = this.extractMatch(videoPageBody, TITLE_REGEX);
			const author = this.extractMatch(videoPageBody, AUTHOR_REGEX);
			const channelId = this.extractMatch(videoPageBody, CHANNEL_ID_REGEX);
			
			// Find the script containing player data to extract more metadata
			const parsedBody = parse(videoPageBody);
			const playerScript = parsedBody
				.getElementsByTagName('script')
				.find((script) =>
					script.textContent.includes('var ytInitialPlayerResponse = {')
				);

			if (!playerScript) throw new Error('Failed to find player data');

			// Extract player response data from script content
			const start =
				playerScript.textContent.indexOf('var ytInitialPlayerResponse = ') +
				30;
			const end = playerScript.textContent.indexOf('};', start) + 1;
			const dataString = playerScript.textContent.slice(start, end);
			const data = JSON.parse(dataString);
			
			// Extract additional metadata from player data
			const videoDetails = data?.videoDetails || {};
			const description = videoDetails.shortDescription || '';
			const tags = videoDetails.keywords || [];
			const publishDate = data?.microformat?.playerMicroformatRenderer?.publishDate || '';
			
			return {
				title: this.decodeHTML(title || videoDetails.title || 'Unknown'),
				description: this.decodeHTML(description),
				author: this.decodeHTML(author || videoDetails.author || 'Unknown'),
				channelUrl: channelId
					? `https://www.youtube.com/channel/${channelId}`
					: '',
				tags,
				publishDate,
				videoId,
				url
			};
		} catch (error) {
			throw new Error(`Failed to fetch video metadata: ${error.message}`);
		}
	}

	/**
	 * Gets direct video URL for multimodal AI processing
	 * This method provides a URL that can be used to fetch the video content
	 * @param videoId - The YouTube video ID
	 * @returns URL that can be used to access the video content
	 */
	getVideoContentUrl(videoId: string): string {
		// Return the embed URL which can be used for multimodal AI processing
		return `https://www.youtube.com/embed/${videoId}`;
	}

	/**
	 * Extracts the first match of a regex pattern from a string
	 * @param text - The text to search within
	 * @param regex - The regex pattern to match
	 * @returns The first match or null if not found
	 * @example
	 * const match = this.extractMatch('Hello World', /Hello/);
	 * console.log(match); // 'Hello'
	 */
	private extractMatch(text: string, regex: RegExp): string | null | '' {
		const match = text.match(regex);
		return match ? match[1] : null;
	}

	/**
	 * Extracts and fetches captions from the video page content
	 * @param pageBody - HTML content of the YouTube video page
	 * @param langCode - Language code for caption track
	 * @returns Promise containing raw captions XML
	 * @throws Error if captions cannot be fetched
	 */
	private async extractCaptions(
		pageBody: string,
		langCode: string
	): Promise<string> {
		// Find the script containing player data
		const parsedBody = parse(pageBody);
		const playerScript = parsedBody
			.getElementsByTagName('script')
			.find((script) =>
				script.textContent.includes('var ytInitialPlayerResponse = {')
			);

		if (!playerScript) throw new Error('Failed to find player data');

		// Extract player response data from script content
		const start =
			playerScript.textContent.indexOf('var ytInitialPlayerResponse = ') +
			30;
		const end = playerScript.textContent.indexOf('};', start) + 1;
		const dataString = playerScript.textContent.slice(start, end);
		const data = JSON.parse(dataString);

		// Find available caption tracks and select the desired language
		const captionTracks =
			data?.captions?.playerCaptionsTracklistRenderer?.captionTracks ||
			[];
		const captionTrack = langCode
					? captionTracks.find((track: any) =>
							track.languageCode.includes(langCode)
					) || captionTracks[0]
					: captionTracks[0];

		if (!captionTrack) throw new Error('No captions available');

		// Format and fetch captions URL
		const captionsUrl = captionTrack.baseUrl.startsWith('https://')
			? captionTrack.baseUrl
			: `https://www.youtube.com${captionTrack.baseUrl}`;
		return await request(captionsUrl);
	}

	/**
	 * Processes raw captions data into structured format
	 * @param captionsXML - Raw captions XML data
	 * @returns Array of structured transcript lines
	 * @example
	 * const transcriptLines = this.parseCaptions('<transcript><text start="0.5" dur="2.3">Hello</text></transcript>');
	 * console.log(transcriptLines); // [{ text: 'Hello', duration: 2300, offset: 500 }]
	 */
	private parseCaptions(captionsXML: string): TranscriptLine[] {
		const parsedXML = parse(captionsXML);
		return parsedXML.getElementsByTagName('text').map((cue) => ({
			text: this.decodeHTML(cue.textContent),
			duration: parseFloat(cue.attributes.dur) * 1000,
			offset: parseFloat(cue.attributes.start) * 1000,
		}));
	}

	/**
	 * Decodes HTML entities in a text string
	 *
	 * @param text - Text string with HTML entities
	 * @returns Decoded text string
	 * @example
	 * const decodedText = this.decodeHTML('Hello &amp; World');
	 * console.log(decodedText); // 'Hello & World'
	 */
	private decodeHTML(text: string): string {
		return text
			.replace(/&#39;/g, "'")
			.replace(/&amp;/g, '&')
			.replace(/&quot;/g, '"')
			.replace(/&apos;/g, "'")
			.replace(/&lt;/g, '<')
			.replace(/&gt;/g, '>');
	}
}
