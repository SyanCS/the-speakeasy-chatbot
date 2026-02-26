export class FormController {
    constructor(aiService, view) {
        this.aiService = aiService;
        this.view = view;
        this.isGenerating = false;
    }

    setupEventListeners() {
        // Update display values for range inputs
        this.view.onTemperatureChange((e) => {
            this.view.updateTemperatureDisplay(e.target.value);
        });

        this.view.onTopKChange((e) => {
            this.view.updateTopKDisplay(e.target.value);
        });

        // File input handlers
        this.view.onFileChange((event) => {
            this.view.handleFilePreview(event);
        });

        this.view.onFileButtonClick(() => {
            this.view.triggerFileInput();
        });

        // Form submit handler
        this.view.onFormSubmit(async (event) => {
            event.preventDefault();

            if (this.isGenerating) {
                this.stopGeneration();
                return;
            }

            await this.handleSubmit();
        });
    }

    async handleSubmit() {
        const question = this.view.getQuestionText();
        const file = this.view.getFile();

        if (!question.trim() && !file) {
            this.view.setOutput('What\'ll it be? Ask or show a photo of the bar.');
            return;
        }

        // Get parameters from form
        const temperature = this.view.getTemperature();
        const topK = this.view.getTopK();
        const promptText = question.trim() || (file ? 'What can you suggest from what\'s in the house?' : '');

        console.log('Using parameters:', { temperature, topK });

        // Change button to stop mode
        this.toggleButton(true);

        this.view.setOutput('Mixing your drink...');

        try {
            const aiResponseChunks = await this.aiService.createSession(
                promptText,
                temperature,
                topK,
                file
            );

            this.view.setOutput('The barkeep is thinking...');

            let fullResponse = '';
            const UPDATE_INTERVAL_MS = 50;
            let lastUpdateTime = 0;
            for await (const chunk of aiResponseChunks) {
                if (this.aiService.isAborted()) {
                    break;
                }
                fullResponse += chunk;
                const now = Date.now();
                const isFirstContent = fullResponse.length > 0 && fullResponse.length === chunk.length;
                if (isFirstContent || now - lastUpdateTime >= UPDATE_INTERVAL_MS) {
                    this.view.setOutput(fullResponse);
                    lastUpdateTime = now;
                }
            }
            if (fullResponse && !this.aiService.isAborted()) {
                this.view.setOutput(fullResponse);
            }
        } catch (error) {
            console.error('Error during AI generation:', error);
            this.view.setOutput(`Error: ${error.message}`);
        }

        this.toggleButton(false);
    }

    stopGeneration() {
        this.aiService.abort();
        this.toggleButton(false);
    }

    toggleButton(isGenerating) {
        this.isGenerating = isGenerating;

        if (isGenerating) {
            this.view.setButtonToStopMode();
        } else {
            this.view.setButtonToSendMode();
        }
    }
}
