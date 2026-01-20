
export class VideoUnavailableError extends Error {
    constructor(message: string = 'Video unavailable') {
        super(message);
        this.name = 'VideoUnavailableError';
    }
}

export class TranscriptMissingError extends Error {
    constructor(message: string = 'Transcript not found for this video') {
        super(message);
        this.name = 'TranscriptMissingError';
    }
}

export class NetworkError extends Error {
    constructor(message: string = 'Network error') {
        super(message);
        this.name = 'NetworkError';
    }
}
