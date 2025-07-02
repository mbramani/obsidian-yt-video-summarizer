import {
	AUTHOR_REGEX,
	CANONICAL_URL_REGEX,
	CHANNEL_ID_REGEX,
	TITLE_META_REGEX,
	VIDEO_ID_REGEX,
	VISITOR_DATA_REGEX_1,
	VISITOR_DATA_REGEX_2,
	YT_INITIAL_DATA_ALT_REGEX_1,
	YT_INITIAL_DATA_ALT_REGEX_2,
	YT_INITIAL_DATA_ALT_REGEX_3,
	YT_INITIAL_DATA_REGEX,
} from 'src/constants';
import {
	ThumbnailQuality,
	TranscriptConfig,
	TranscriptLine,
	TranscriptResponse,
	VideoData,
} from 'src/types';
import { request, requestUrl } from 'obsidian';
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
	 * Fetches and processes a YouTube video transcript using advanced API approach
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

			// Fetch video page
			const videoPageBody = await request(url);
			if (!videoPageBody) throw new Error('Failed to fetch video page');

			// Parse video page to get title and transcript requests
			const videoData = this.parseVideoPageWithFallbacks(videoPageBody, {
				lang: langCode,
				country: "US",
			});

			// Try each parameter combination until one succeeds
			for (let i = 0; i < videoData.transcriptRequests.length; i++) {
				const transcriptRequest = videoData.transcriptRequests[i];

				// Extract and show params info
				let paramsInfo = "UNKNOWN";
				let paramsSource = "UNKNOWN";
				try {
					const requestBodyObj = JSON.parse(transcriptRequest.body);
					const currentParams = requestBodyObj.params;
					if (i === 0 && videoData.title) {
						paramsSource = currentParams && currentParams.length > 50 ? "PAGE" : "GENERATED";
					} else {
						paramsSource = "GENERATED";
					}
					paramsInfo = `${currentParams.substring(0, 30)}... (${currentParams.length} chars)`;
				} catch (parseError) {
					paramsInfo = "PARSE_ERROR";
				}

				try {
					console.log(
						`Attempt ${i + 1}/${videoData.transcriptRequests.length}: Trying ${paramsSource} params: ${paramsInfo}`
					);

					const response = await requestUrl({
						url: transcriptRequest.url,
						method: "POST",
						headers: {
							...transcriptRequest.headers,
							"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
							"Origin": "https://www.youtube.com",
							"Referer": url,
						},
						body: transcriptRequest.body,
					});

					const lines = this.parseTranscript(response.text);

					// If we got valid transcript lines, return success
					if (lines && lines.length > 0) {
						// Extract additional metadata
						const author = this.extractMatch(videoPageBody, AUTHOR_REGEX);
						const channelId = this.extractMatch(videoPageBody, CHANNEL_ID_REGEX);

						return {
							url,
							videoId,
							title: this.decodeHTML(videoData.title || 'Unknown'),
							author: this.decodeHTML(author || 'Unknown'),
							channelUrl: channelId
								? `https://www.youtube.com/channel/${channelId}`
								: '',
							lines,
						};
					}
				} catch (requestError: any) {
					// Continue to next attempt unless this was the last one
					if (i === videoData.transcriptRequests.length - 1) {
						throw requestError;
					}
				}
			}

			throw new Error(
				"All parameter combinations failed to fetch transcript"
			);
		} catch (error: any) {
			throw new Error(`Failed to fetch transcript: ${error.message}`);
		}
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
	private extractMatch(text: string, regex: RegExp): string | null {
		const match = text.match(regex);
		return match ? match[1] : null;
	}

	/**
	 * Generates transcript parameters using protobuf-like encoding
	 */
	private generateTranscriptParams(
		videoId: string,
		useAsrStyle: boolean,
		field6Value: number,
		lang = "en"
	): string {
		// Simple implementation without protobufjs dependency
		// Uses base64 encoded parameter patterns that work with YouTube API
		const variations = [
			"CgNhc3ISAmVuGgASAggBMAE%3D", // ASR style pattern
			"CgASAmVuGgA%3D", // Non-ASR style pattern
			"CgNhc3ISAmVuGgA%3D", // Alternative ASR pattern
			"CgASAmVuGgASAggBMAE%3D", // Alternative non-ASR pattern
		];
		
		const baseIndex = useAsrStyle ? 0 : 1;
		const variantIndex = (baseIndex + field6Value) % variations.length;
		return variations[variantIndex];
	}

	/**
	 * Generates alternative transcript parameter combinations
	 */
	private generateAlternativeTranscriptParams(
		videoId: string,
		lang = "en"
	): string[] {
		const variations = [
			{ useAsrStyle: true, field6Value: 1 },
			{ useAsrStyle: false, field6Value: 0 },
			{ useAsrStyle: true, field6Value: 0 },
			{ useAsrStyle: false, field6Value: 1 },
		];

		return variations.map((variant) =>
			this.generateTranscriptParams(
				videoId,
				variant.useAsrStyle,
				variant.field6Value,
				lang
			)
		);
	}

	/**
	 * Extracts transcript parameters from the video page
	 */
	private extractParamsFromPage(htmlContent: string): string | null {
		
		// Try to find ytInitialData script
		let ytInitialDataMatch = htmlContent.match(YT_INITIAL_DATA_REGEX);

		if (!ytInitialDataMatch) {
			// Try alternative patterns
			const altPatterns = [
				YT_INITIAL_DATA_ALT_REGEX_1,
				YT_INITIAL_DATA_ALT_REGEX_2,
				YT_INITIAL_DATA_ALT_REGEX_3,
			];

			for (let i = 0; i < altPatterns.length; i++) {
				const match = htmlContent.match(altPatterns[i]);
				if (match) {
					ytInitialDataMatch = match;
					break;
				}
			}

			if (!ytInitialDataMatch) {
				return null;
			}
		}

		try {
			const ytInitialData = JSON.parse(ytInitialDataMatch[1]);

			// Recursively search for getTranscriptEndpoint
			const findGetTranscriptEndpoint = (obj: any, path = "", depth = 0): string | null => {
				if (!obj || typeof obj !== "object") return null;

				if (obj.getTranscriptEndpoint?.params) {
					return obj.getTranscriptEndpoint.params;
				}

				// Recursively search in all properties
				for (const [key, value] of Object.entries(obj)) {
					if (value && typeof value === "object") {
						const result = findGetTranscriptEndpoint(value, path ? `${path}.${key}` : key, depth + 1);
						if (result) return result;
					}
				}

				return null;
			};

			const params = findGetTranscriptEndpoint(ytInitialData);

			if (params && typeof params === "string" && params.length > 50) {
				return params;
			} 
		} catch (error) {
			console.log("Failed to parse ytInitialData JSON:", error);
		}

		return null;
	}

	/**
	 * Extracts visitor data from the page
	 */
	private extractVisitorData(htmlContent: string): string {
		const visitorDataMatch =
			htmlContent.match(VISITOR_DATA_REGEX_1) ||
			htmlContent.match(VISITOR_DATA_REGEX_2);

		if (visitorDataMatch) {
			return visitorDataMatch[1];
		}

		return "Cgs5LXVQa0I1YnhHOCjZ7ZDDBjInCgJQTBIhEh0SGwsMDg8QERITFBUWFxgZGhscHR4fICEiIyQlJiAS";
	}

	/**
	 * Parses video page and generates multiple transcript request combinations
	 */
	private parseVideoPageWithFallbacks(
		htmlContent: string,
		config?: TranscriptConfig
	): VideoData {
		// Extract title
		const titleMatch = htmlContent.match(TITLE_META_REGEX);
		const title = titleMatch ? titleMatch[1] : "";

		// Extract video ID
		const videoIdMatch = htmlContent.match(CANONICAL_URL_REGEX);
		const videoId = videoIdMatch ? videoIdMatch[1].split("?v=")[1] : "";

		// Extract visitor data
		const visitorData = this.extractVisitorData(htmlContent);

		// Try to extract params from page first
		const pageParams = this.extractParamsFromPage(htmlContent);

		// Generate alternative parameters
		const generatedParams = this.generateAlternativeTranscriptParams(
			videoId,
			config?.lang || "en"
		);

		// Combine page params (if found) with generated ones
		const allParams = pageParams ? [pageParams, ...generatedParams] : generatedParams;

		const transcriptRequests = allParams.map((params) => {
			const requestBody = {
				context: {
					client: {
						clientName: "WEB",
						clientVersion: "2.20250701.01.00",
						hl: config?.lang || "en",
						gl: config?.country || "US",
						userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
						platform: "DESKTOP",
						clientFormFactor: "UNKNOWN_FORM_FACTOR",
						visitorData: visitorData,
						deviceMake: "Microsoft",
						deviceModel: "",
						osName: "Windows",
						osVersion: "10.0",
						browserName: "Chrome",
						browserVersion: "91.0.4472.124",
						acceptHeader: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
						userInterfaceTheme: "USER_INTERFACE_THEME_LIGHT",
						timeZone: "America/New_York",
						utcOffsetMinutes: -240,
						screenWidthPoints: 1920,
						screenHeightPoints: 1080,
						screenPixelDensity: 1,
						screenDensityFloat: 1,
						mainAppWebInfo: {
							graftUrl: `https://www.youtube.com/watch?v=${videoId}`,
							webDisplayMode: "WEB_DISPLAY_MODE_BROWSER",
							isWebNativeShareAvailable: true,
						},
					},
					user: {
						lockedSafetyMode: false,
					},
					request: {
						useSsl: true,
						internalExperimentFlags: [],
						consistencyTokenJars: [],
					},
					clickTracking: {
						clickTrackingParams: "CBUQ040EGAgiEwi43tyvspyOAxUxa3oFHaiXLzM=",
					},
					adSignalsInfo: {
						params: [
							{ key: "dt", value: Date.now().toString() },
							{ key: "flash", value: "0" },
							{ key: "frm", value: "0" },
							{ key: "u_tz", value: "-240" },
							{ key: "u_his", value: "2" },
							{ key: "u_h", value: "1080" },
							{ key: "u_w", value: "1920" },
							{ key: "u_ah", value: "1040" },
							{ key: "u_aw", value: "1920" },
							{ key: "u_cd", value: "24" },
							{ key: "bc", value: "31" },
							{ key: "bih", value: "1040" },
							{ key: "biw", value: "1903" },
							{ key: "brdim", value: "0,0,0,0,1920,0,1920,1040,1920,1040" },
							{ key: "vis", value: "1" },
							{ key: "wgl", value: "true" },
							{ key: "ca_type", value: "image" },
						],
					},
				},
				externalVideoId: videoId,
				params: params,
			};

			return {
				url: "https://www.youtube.com/youtubei/v1/get_transcript?prettyPrint=false",
				headers: {
					"Content-Type": "application/json",
					"Accept": "*/*",
					"Accept-Language": "en-US,en;q=0.9",
					"X-Youtube-Client-Name": "1",
					"X-Youtube-Client-Version": "2.20250701.01.00",
					"X-Goog-EOM-Visitor-Id": visitorData,
					"X-Youtube-Bootstrap-Logged-In": "false",
					"X-Origin": "https://www.youtube.com",
				},
				body: JSON.stringify(requestBody),
			};
		});

		return {
			title,
			transcriptRequests,
		};
	}

	/**
	 * Parses the transcript JSON response into structured format
	 */
	private parseTranscript(responseContent: string): TranscriptLine[] {
		try {
			const response = JSON.parse(responseContent);

			// Extract transcript from YouTube API response
			const transcriptEvents =
				response?.actions?.[0]?.updateEngagementPanelAction?.content
					?.transcriptRenderer?.content?.transcriptSearchPanelRenderer?.body
					?.transcriptSegmentListRenderer?.initialSegments;

			if (!transcriptEvents || !Array.isArray(transcriptEvents)) {
				return [];
			}

			return transcriptEvents.map((segment: any) => {
				const cue = segment.transcriptSegmentRenderer;
				if (!cue || !cue.snippet || !cue.startMs || !cue.endMs) {
					return {
						text: "",
						duration: 0,
						offset: 0,
					};
				}
				return {
					text: cue.snippet?.runs?.[0]?.text || "",
					duration: parseInt(cue.endMs) - parseInt(cue.startMs),
					offset: parseInt(cue.startMs),
				};
			});
		} catch (error) {
			throw new Error(`Failed to parse API response: ${error}`);
		}
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
