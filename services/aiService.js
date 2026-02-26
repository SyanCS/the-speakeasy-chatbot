export class AIService {
    constructor() {
        this.session = null;
        this.abortController = null;
    }

    async checkRequirements() {
        const errors = [];

        // @ts-ignore
        const isChrome = !!window.chrome;
        if (!isChrome) {
            errors.push("⚠️ This feature only works in Google Chrome or Chrome Canary (recent version).");
        }

        if (!('LanguageModel' in self)) {
            errors.push("⚠️ The native AI APIs are not active.");
            errors.push("Activate the following flag in chrome://flags/:");
            errors.push("- Prompt API for Gemini Nano (chrome://flags/#prompt-api-for-gemini-nano)");
            errors.push("Then restart Chrome and try again.");
            return errors;
        }

        if (errors.length > 0) {
            return errors;
        }

        const availability = await LanguageModel.availability({ languages: ["en"] });
        console.log('Language Model Availability:', availability);

        if (availability === 'available') {
            return null;
        }

        if (availability === 'unavailable') {
            errors.push(`⚠️ Your device does not support native AI language models.`);
        }

        if (availability === 'downloading') {
            return { downloadable: true, status: 'downloading' };
        }

        if (availability === 'downloadable') {
            return { downloadable: true, status: 'downloadable' };
        }

        return errors.length > 0 ? errors : null;
    }

    /**
     * Inicia o download do modelo. PRECISA ser chamado de forma síncrona no handler do clique
     * (sem nenhum await antes), senão o Chrome bloqueia por falta de "user gesture".
     * @param {(percent: number) => void} [onProgress] - Chamado com 0–100 durante o download
     * @returns {Promise<{ session: object }>} - Resolve com { session } para depois chamar finishModelDownload
     */
    startModelDownload(onProgress) {
        if (!('LanguageModel' in self)) {
            return Promise.reject(new Error('LanguageModel API not available.'));
        }
        const createPromise = LanguageModel.create({
            expectedInputLanguages: ["en"],
            monitor(m) {
                m.addEventListener('downloadprogress', (e) => {
                    const percent = e.total ? Math.round((e.loaded / e.total) * 100) : 0;
                    if (onProgress) onProgress(percent);
                    console.log(`Downloaded ${percent}%`);
                });
            }
        });
        return createPromise.then(session => ({ session }));
    }

    /**
     * Finaliza o download (prompt de teste + destroy) e verifica disponibilidade.
     * Chamar depois de await startModelDownload().
     */
    async finishModelDownload(session) {
        await session.prompt('Hello');
        session.destroy();
        return await LanguageModel.availability({ languages: ["en"] });
    }

    async getParams() {
        const params = await LanguageModel.params();
        console.log('Language Model Params:', params);
        return params;
    }

    async* createSession(question, temperature, topK, file = null) {
        this.abortController?.abort();
        this.abortController = new AbortController();

        // Destroy previous session and create new one with updated parameters
        if (this.session) {
            this.session.destroy();
        }

        this.session = await LanguageModel.create({
            expectedInputs: [
                { type: "text", languages: ["en"] },
                { type: "audio" },
                { type: "image" },
            ],
            expectedOutputs: [{ type: "text", languages: ["en"] }],
            temperature: temperature,
            topK: topK,
            initialPrompts: [
                {
                    role: 'system',
                    content: [{
                        type: "text",
                        value: `You are the barkeep at a 1920s speakeasy. You help with: (1) suggesting cocktails from spirits and mixers they have (list or photo of the bar), (2) ingredient substitutions with exact ratios when they're missing something, (3) scaling recipes for a crowd or batching, (4) fixing drinks that went wrong (too strong, too sweet, too weak, etc.). Keep the tone warm and period-appropriate but concise. Give short, actionable answers. Use plain text only, no markdown. For substitutions give exact ratios; for scaling give new amounts clearly. If they send an image of bottles or a bar, suggest what to make or name what you see. Stay in character; avoid long essays.`
                    }]
                },
            ],
        });

        // Build content array with text and optional file
        const contentArray = [{ type: "text", value: question }];

        if (file) {
            const fileType = file.type.split('/')[0];
            if (fileType === 'image' || fileType === 'audio') {
                // Convert file to blob for proper handling
                const blob = new Blob([await file.arrayBuffer()], { type: file.type });
                contentArray.push({ type: fileType, value: blob });
                console.log(`Adding ${fileType} to prompt:`, file.name);
            }
        }

        const responseStream = await this.session.promptStreaming(
            [
                {
                    role: 'user',
                    content: contentArray,
                },
            ],
            {
                signal: this.abortController.signal,
            }
        );

        for await (const chunk of responseStream) {
            if (this.abortController.signal.aborted) {
                break;
            }
            yield chunk;
        }
    }

    abort() {
        this.abortController?.abort();
    }

    isAborted() {
        return this.abortController?.signal.aborted;
    }
}
