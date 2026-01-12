import {
	AUTHOR_REGEX,
	CHANNEL_ID_REGEX,
	VIDEO_ID_REGEX,
} from 'src/constants';
import {
	ThumbnailQuality,
	TranscriptLine,
	TranscriptResponse,
} from 'src/types';
import { requestUrl } from 'obsidian';

/**
 * Service class for interacting with YouTube videos.
 * Provides methods to fetch video thumbnails and transcripts.
 * Uses the same approach as youtube-transcript-api (Python library).
 */
export class YouTubeService {
	/**
	 * YouTube's public InnerTube API key.
	 *
	 * IMPORTANT:
	 * - This is a *public* key used by YouTube's own web/Android clients and by
	 *   tools such as `youtube-transcript-api`. It is *not* tied to this
	 *   project’s Google Cloud account and does not grant any additional
	 *   privileges beyond what an anonymous YouTube client can do.
	 * - Because this key is public and broadly distributed, it is expected to
	 *   appear in source code and does **not** need to be treated as a secret,
	 *   managed via environment variables, or rotated by this project.
	 *
	 * Rate limiting / usage:
	 * - Requests made with this key are subject to YouTube's own internal
	 *   throttling and abuse detection for anonymous clients. Very high
	 *   volumes of requests may be rate limited or temporarily blocked by
	 *   YouTube, outside the control of this plugin.
	 * - If YouTube invalidates or changes this key in the future (e.g. 400/403
	 *   responses that cannot be explained otherwise), the value here may need
	 *   to be updated to a current public InnerTube key (for example by
	 *   inspecting network traffic from the YouTube web/Android client or by
	 *   checking updates in `youtube-transcript-api`).
	 */
	private static readonly INNERTUBE_API_KEY = "AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8";
	private static readonly INNERTUBE_PLAYER_URL = `https://www.youtube.com/youtubei/v1/player?key=${YouTubeService.INNERTUBE_API_KEY}`;

	/**
	 * Default InnerTube client configuration.
	 *
	 * These values were last verified against YouTube's API on 2026-01-12.
	 *
	 * If requests start failing with 400/403 errors or unexpected behavior,
	 * try updating to a newer Android client version / SDK level that the
	 * official YouTube Android app currently uses, then:
	 *  - Update DEFAULT_CLIENT_VERSION / DEFAULT_ANDROID_SDK_VERSION below, or
	 *  - Call YouTubeService.configureClient(...) from your plugin settings.
	 */
	private static readonly DEFAULT_CLIENT_VERSION = "19.09.37";
	private static readonly DEFAULT_ANDROID_SDK_VERSION = 30;

	// Mutable copies that can be overridden at runtime if needed.
	private static clientVersion: string = YouTubeService.DEFAULT_CLIENT_VERSION;
	private static androidSdkVersion: number = YouTubeService.DEFAULT_ANDROID_SDK_VERSION;

	/**
	 * Configure the InnerTube client version and Android SDK version used for
	 * YouTube API requests. This allows updating these values without changing
	 * the source code if YouTube deprecates the pinned defaults.
	 */
	public static configureClient(options: {
		clientVersion?: string;
		androidSdkVersion?: number;
	}): void {
		if (typeof options.clientVersion === "string" && options.clientVersion.trim().length > 0) {
			YouTubeService.clientVersion = options.clientVersion.trim();
		}
		if (typeof options.androidSdkVersion === "number" && Number.isInteger(options.androidSdkVersion)) {
			YouTubeService.androidSdkVersion = options.androidSdkVersion;
		}
	}

	// Use ANDROID client like youtube-transcript-api does - it's less restricted
	private static get INNERTUBE_CONTEXT() {
		return {
			client: {
				clientName: "ANDROID",
				clientVersion: YouTubeService.clientVersion,
				androidSdkVersion: YouTubeService.androidSdkVersion,
				hl: "en",
				gl: "US",
			},
		};
	}
	/**
	 * Gets the thumbnail URL for a YouTube video
	 * @param videoId - The YouTube video identifier
	 * @param quality - Desired thumbnail quality (default: 'maxres')
	 * @returns URL string for the video thumbnail
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
	 */
	static isYouTubeUrl(url: string): boolean {
		return (
			url.startsWith('https://www.youtube.com/') ||
			url.startsWith('https://youtu.be/')
		);
	}

	/**
	 * Fetches and processes a YouTube video transcript using the player API approach
	 * This mimics how youtube-transcript-api (Python) works:
	 * 1. Fetch player data with ANDROID client to get caption tracks
	 * 2. Fetch transcript directly from caption track baseUrl
	 * 
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

			console.log(`Fetching transcript for video: ${videoId}`);

			// Step 1: Fetch player data to get caption tracks
			const playerData = await this.fetchPlayerData(videoId);
			
			// Extract video metadata
			const title = playerData.videoDetails?.title || 'Unknown';
			const author = playerData.videoDetails?.author || 'Unknown';
			const channelId = playerData.videoDetails?.channelId || '';

			// Step 2: Get caption tracks
			const captionsData = playerData.captions?.playerCaptionsTracklistRenderer;
			if (!captionsData || !captionsData.captionTracks) {
				throw new Error('No captions available for this video');
			}

			// Step 3: Find the best matching caption track
			const captionTrack = this.findCaptionTrack(captionsData.captionTracks, langCode);
			if (!captionTrack) {
				const availableLangs = captionsData.captionTracks.map((t: any) => t.languageCode).join(', ');
				throw new Error(`No transcript found for language '${langCode}'. Available: ${availableLangs}`);
			}

			console.log(`Found caption track: ${captionTrack.name?.runs?.[0]?.text || captionTrack.languageCode}`);

			// Step 4: Fetch the actual transcript from the caption URL
			const transcriptUrl = captionTrack.baseUrl;
			const lines = await this.fetchTranscriptFromUrl(transcriptUrl);

			return {
				url,
				videoId,
				title: this.decodeHTML(title),
				author: this.decodeHTML(author),
				channelUrl: channelId ? `https://www.youtube.com/channel/${channelId}` : '',
				lines,
			};
		} catch (error: any) {
			throw new Error(`Failed to fetch transcript: ${error.message}`);
		}
	}

	/**
	 * Fetches player data from YouTube's InnerTube API
	 */
	private async fetchPlayerData(videoId: string): Promise<any> {
		const requestBody = {
			context: YouTubeService.INNERTUBE_CONTEXT,
			videoId: videoId,
		};

		const response = await requestUrl({
			url: YouTubeService.INNERTUBE_PLAYER_URL,
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"User-Agent": `com.google.android.youtube/${YouTubeService.DEFAULT_CLIENT_VERSION} (Linux; U; Android 11) gzip`,
			},
			body: JSON.stringify(requestBody),
		});

		let data: any;
		try {
			data = JSON.parse(response.text);
		} catch (error) {
			throw new Error(
				`Failed to parse YouTube player data JSON: ${
					error instanceof Error ? error.message : String(error)
				}`,
			);
		}

		// Check playability status
		const playabilityStatus = data.playabilityStatus;
		if (playabilityStatus) {
			if (playabilityStatus.status === 'ERROR') {
				throw new Error(playabilityStatus.reason || 'Video unavailable');
			}
			if (playabilityStatus.status === 'LOGIN_REQUIRED') {
				throw new Error('This video requires login to view');
			}
			if (playabilityStatus.status === 'UNPLAYABLE') {
				throw new Error(playabilityStatus.reason || 'Video is unplayable');
			}
		}

		return data;
	}

	/**
	 * Finds the best matching caption track for the requested language
	 */
	private findCaptionTrack(captionTracks: any[], langCode: string): any {
		// First try exact match
		let track = captionTracks.find((t: any) => t.languageCode === langCode);
		if (track) return track;

		// Try matching language prefix (e.g., 'en' matches 'en-US')
		track = captionTracks.find((t: any) => t.languageCode.startsWith(langCode + '-'));
		if (track) return track;

		// Try finding track where requested lang is a prefix (e.g., 'en-US' when looking for 'en')
		track = captionTracks.find((t: any) => langCode.startsWith(t.languageCode + '-'));
		if (track) return track;

		// Fall back to first available track
		if (captionTracks.length > 0) {
			console.log(`Language '${langCode}' not found, falling back to '${captionTracks[0].languageCode}'`);
			return captionTracks[0];
		}

		return null;
	}

	/**
	 * Fetches transcript XML from the caption track URL
	 */
	private async fetchTranscriptFromUrl(transcriptUrl: string): Promise<TranscriptLine[]> {
		const response = await requestUrl({
			url: transcriptUrl,
			method: "GET",
			headers: {
				"Accept-Language": "en-US,en;q=0.9",
			},
		});

		return this.parseTranscriptXml(response.text);
	}

	/**
	 * Parses the transcript XML response into structured format
	 */
	private parseTranscriptXml(xmlContent: string): TranscriptLine[] {
		const lines: TranscriptLine[] = [];

		// Parse XML manually (Obsidian doesn't have DOMParser in all contexts)
		// YouTube uses two different formats:
		// Format 1: <text start="0.0" dur="1.54">Hey there</text>
		// Format 2: <p t="1360" d="1680">Text here</p>
		
		// Try format 2 first (newer format with <p> tags, times in milliseconds)
		const pTagRegex = /<p\s+t="(\d+)"\s+d="(\d+)"[^>]*>([\s\S]*?)<\/p>/g;
		let match;
		
		while ((match = pTagRegex.exec(xmlContent)) !== null) {
			const start = parseInt(match[1]); // Already in milliseconds
			const duration = parseInt(match[2]);
			const text = this.decodeHTML(match[3].replace(/<[^>]+>/g, ' ')); // Strip any inner tags

			if (text.trim()) {
				lines.push({
					text: text.trim(),
					offset: start,
					duration,
				});
			}
		}

		// If no matches with <p> format, try <text> format (times in seconds)
		if (lines.length === 0) {
			const textRegex = /<text\s+start="([^"]+)"\s+dur="([^"]+)"[^>]*>([\s\S]*?)<\/text>/g;
			
			while ((match = textRegex.exec(xmlContent)) !== null) {
				const start = parseFloat(match[1]) * 1000; // Convert to milliseconds
				const duration = parseFloat(match[2]) * 1000;
				const text = this.decodeHTML(match[3].replace(/<[^>]+>/g, ' '));

				if (text.trim()) {
					lines.push({
						text: text.trim(),
						offset: start,
						duration,
					});
				}
			}
		}

		if (lines.length === 0) {
			throw new Error('Failed to parse transcript XML - no caption segments found');
		}

		return lines;
	}

	/**
	 * Extracts the first match of a regex pattern from a string
	 * @param text - The text to search within
	 * @param regex - The regex pattern to match
	 * @returns The first match or null if not found
	 */
	private extractMatch(text: string, regex: RegExp): string | null {
		const match = text.match(regex);
		return match ? match[1] : null;
	}

	/**
	 * Decodes HTML entities in a text string
	 *
	 * @param text - Text string with HTML entities
	 * @returns Decoded text string
	 */
	private decodeHTML(text: string): string {
		return text
			.replace(/&#39;/g, "'")
			.replace(/&amp;/g, '&')
			.replace(/&quot;/g, '"')
			.replace(/&apos;/g, "'")
			.replace(/&lt;/g, '<')
			.replace(/&gt;/g, '>')
			.replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)))
			.replace(/\\n/g, ' ')
			.replace(/\s+/g, ' ')
			.trim();
	}
}
