# YouTube Video Summarizer for Obsidian

Generate AI-powered summaries of YouTube videos directly in Obsidian using Google's Gemini AI or Grok.

## Inspired by the plugin from @mbramani


## Features

-   🎥 Extract transcripts from YouTube videos
-   🤖 Generate summaries using either Gemini AI or Grok
-   📝 Create structured notes with key points
-   🔍 Identify and explain technical terms
-   📊 Format summaries with metadata and tags
-   💾 Save and manage multiple prompt templates
-   🔄 Easily switch between different AI providers

## Installation

1. Open Obsidian Settings
2. Go to Community Plugins and disable Safe Mode
3. Click Browse and search for "YouTube Video Summarizer"
4. Install and enable the plugin

## Requirements

-   Obsidian v0.15.0+
-   Either:
    -   Google Gemini API key ([Get one here](https://aistudio.google.com/app/apikey))
    -   Grok API key ([Get one here](https://www.grok.com/))

## Configuration

1. Open plugin settings
2. Choose your preferred AI provider (Gemini or Grok)
3. Enter the appropriate API key
4. Select your preferred model
5. Customize summary prompts or use the provided templates
6. Adjust generation settings (max tokens, temperature)

### Managing Prompt Templates

This plugin allows you to create and manage multiple prompt templates:

- **Add New Prompts**: Create custom templates for different summarization styles
- **Select Prompts**: Quickly switch between templates in settings
- **Edit & Delete**: Manage your saved templates
- **Default Templates**: Use the built-in templates or reset to defaults

## Usage

### Method 1: Command Palette

1. Copy YouTube URL
2. Open command palette (`Ctrl/Cmd + P`)
3. Search for "Summarize YouTube Video"
4. Paste URL when prompted

### Method 2: Selection

1. Paste YouTube URL in note
2. Select the URL
3. Use command palette or context menu to summarize

## Sample of the Default Output Format

```markdown
# Video Title

[Video thumbnail]

## Summary

[AI-generated summary]

## Key Points

-   Point 1
-   Point 2

## Technical Terms

-   Term 1: Definition
-   Term 2: Definition

## Conclusion

[Summary conclusion]
```

## License

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
