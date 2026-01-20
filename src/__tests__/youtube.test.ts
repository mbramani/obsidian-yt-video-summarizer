
import { YouTubeService } from '../services/youtube';

describe('YouTubeService', () => {
    describe('isYouTubeUrl', () => {
        it('should return true for valid YouTube URLs', () => {
            expect(YouTubeService.isYouTubeUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(true);
            expect(YouTubeService.isYouTubeUrl('https://youtu.be/dQw4w9WgXcQ')).toBe(true);
        });

        it('should return false for invalid URLs', () => {
            expect(YouTubeService.isYouTubeUrl('https://google.com')).toBe(false);
            expect(YouTubeService.isYouTubeUrl('not a url')).toBe(false);
            expect(YouTubeService.isYouTubeUrl('https://www.youtube.com/watch?v=')).toBe(false);
            expect(YouTubeService.isYouTubeUrl('https://www.youtube.com')).toBe(false);
        });
    });

    describe('fetchTranscript', () => {
        it('should throw error for invalid URL', async () => {
            const service = new YouTubeService();
            await expect(service.fetchTranscript('invalid-url')).rejects.toThrow('Invalid YouTube URL');
        });
    });
});
