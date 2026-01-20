
import { PromptService } from '../services/prompt';


describe('PromptService', () => {
    it('should build a prompt by concatenating custom prompt and transcript', () => {
        const customPrompt = 'Summarize this:';
        const service = new PromptService(customPrompt);
        const transcript = 'This is a test transcript.';
        const prompt = service.buildPrompt(transcript);

        expect(prompt).toContain(customPrompt);
        expect(prompt).toContain(transcript);
        expect(prompt).toBe(`${customPrompt}\n\nTranscript:\n${transcript}`);
    });
});
