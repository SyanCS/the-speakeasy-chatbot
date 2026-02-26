import { AIService } from './services/aiService.js';
import { View } from './views/view.js';
import { FormController } from './controllers/formController.js';

async function initializeAfterRequirements(aiService, view) {
    const params = await aiService.getParams();
    view.initializeParameters(params);

    const controller = new FormController(aiService, view);
    controller.setupEventListeners();

    view.setModelDownloadSectionReady();
    console.log('Application initialized successfully');
}

(async function main() {
    const aiService = new AIService();
    const view = new View();

    view.setYear();

    const result = await aiService.checkRequirements();

    if (result && result.downloadable === true) {
        let action = result.status === 'downloading' ? 'verify' : 'download';
        view.showModelDownloadSection(result.status || 'downloadable');

        view.onModelDownloadClick(async () => {
            if (action === 'verify') {
                view.setDownloadStatus('downloading', 'Checking the back room...');
                const newResult = await aiService.checkRequirements();
                if (!newResult) {
                    await initializeAfterRequirements(aiService, view);
                    return;
                }
                if (newResult.downloadable) {
                    action = newResult.status === 'downloadable' ? 'download' : 'verify';
                    view.showModelDownloadSection(newResult.status);
                    view.setDownloadStatus('idle', action === 'verify' ? 'Barkeep’s still loading. Try again in a minute.' : '');
                } else if (Array.isArray(newResult)) {
                    view.setDownloadStatus('error', newResult[0] || 'Couldn’t check.');
                }
                return;
            }
            const createPromise = aiService.startModelDownload((percent) => {
                view.setDownloadStatus('downloading', `Loading the barkeep... ${percent}%`);
                view.setDownloadProgress(percent);
            });
            view.setDownloadStatus('downloading', 'Opening the back room...');
            view.setDownloadProgress(0);
            try {
                const { session } = await createPromise;
                view.setDownloadStatus('downloading', 'Almost there...');
                const newAvailability = await aiService.finishModelDownload(session);
                if (newAvailability === 'available') {
                    view.setDownloadStatus('success', 'Bar is open. Ready when you are.');
                    await initializeAfterRequirements(aiService, view);
                } else {
                    view.setDownloadStatus('error', 'Something went wrong. Try loading the barkeep again.');
                }
            } catch (e) {
                view.setDownloadStatus('error', e.message);
            }
        });
        return;
    }

    if (result && Array.isArray(result)) {
        view.showError(result);
        return;
    }

    view.showModelDownloadSection('available');
    await initializeAfterRequirements(aiService, view);
})();
