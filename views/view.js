export class View {
    constructor() {
        this.elements = {
            temperature: document.getElementById('temperature'),
            temperatureValue: document.getElementById('temp-value'),
            topKValue: document.getElementById('topk-value'),
            topK: document.getElementById('topK'),
            form: document.getElementById('question-form'),
            questionInput: document.getElementById('question'),
            output: document.getElementById('output'),
            button: document.getElementById('ask-button'),
            year: document.getElementById('year'),
            fileInput: document.getElementById('file-input'),
            filePreview: document.getElementById('file-preview'),
            fileUploadBtn: document.getElementById('file-upload-btn'),
            fileSelectedName: document.getElementById('file-selected-name'),
            modelDownloadSection: document.getElementById('model-download-section'),
            modelDownloadMessage: document.getElementById('model-download-message'),
            modelDownloadProgressWrap: document.getElementById('model-download-progress-wrap'),
            modelDownloadProgressFill: document.getElementById('model-download-progress-fill'),
            modelDownloadProgressText: document.getElementById('model-download-progress-text'),
            modelDownloadStatus: document.getElementById('model-download-status'),
            modelDownloadBtn: document.getElementById('model-download-btn'),
        };
    }

    setYear() {
        this.elements.year.textContent = new Date().getFullYear();
    }

    initializeParameters(params) {
        this.elements.topK.max = params.maxTopK;
        this.elements.topK.min = 1;
        this.elements.topK.value = params.defaultTopK;
        this.elements.topKValue.textContent = params.defaultTopK;

        this.elements.temperatureValue.textContent = params.defaultTemperature;
        this.elements.temperature.max = params.maxTemperature;
        this.elements.temperature.min = 0;
        this.elements.temperature.value = params.defaultTemperature;
    }

    updateTemperatureDisplay(value) {
        this.elements.temperatureValue.textContent = value;
    }

    updateTopKDisplay(value) {
        this.elements.topKValue.textContent = value;
    }

    getQuestionText() {
        return this.elements.questionInput.value;
    }

    getTemperature() {
        return parseFloat(this.elements.temperature.value);
    }

    getTopK() {
        return parseInt(this.elements.topK.value);
    }

    getFile() {
        return this.elements.fileInput.files[0];
    }

    setOutput(text) {
        this.elements.output.textContent = text;
    }

    appendOutput(text) {
        this.elements.output.textContent += text;
    }

    showError(errors) {
        this.elements.output.innerHTML = errors.join('<br/>');
        this.elements.button.disabled = true;
    }

    // --- Model download section (states: idle, downloading, success, error) ---

    /**
     * @param {'downloadable'|'downloading'|'available'} [modelStatus] - 'downloadable' = can click to download; 'downloading' = already downloading, show "Check again"
     */
    showModelDownloadSection(modelStatus = 'downloadable') {
        const s = this.elements.modelDownloadSection;
        const msg = this.elements.modelDownloadMessage;
        const status = this.elements.modelDownloadStatus;
        const btn = this.elements.modelDownloadBtn;
        const progressWrap = this.elements.modelDownloadProgressWrap;
        if (!s || !msg || !status || !btn) return;
        s.hidden = false;
        if (progressWrap) progressWrap.hidden = true;
        this.setDownloadProgress(0);
        if (modelStatus === 'available') {
            msg.textContent = 'The AI language model is installed and ready to use.';
            status.textContent = 'Ready';
            status.className = 'model-download-status model-download-status--success';
            btn.hidden = true;
            if (progressWrap) progressWrap.hidden = false;
            this.setDownloadProgress(100);
            this.elements.button.disabled = false;
            return;
        }
        if (modelStatus === 'downloading') {
            msg.textContent = 'The AI language model is being downloaded in the background. Please wait a few minutes and click “Check again” to continue.';
            btn.textContent = 'Check again';
        } else {
            msg.textContent = 'The AI language model needs to be downloaded. Click the button below to start (the download may take a few minutes).';
            btn.textContent = 'Download model';
        }
        status.textContent = '';
        status.className = 'model-download-status';
        btn.hidden = false;
        btn.disabled = false;
        this.elements.button.disabled = true;
    }

    setDownloadStatus(state, detail = '') {
        const status = this.elements.modelDownloadStatus;
        const btn = this.elements.modelDownloadBtn;
        const progressWrap = this.elements.modelDownloadProgressWrap;
        if (!status || !btn) return;
        switch (state) {
            case 'idle':
                status.textContent = '';
                status.className = 'model-download-status';
                btn.disabled = false;
                break;
            case 'downloading':
                status.textContent = detail || 'Loading the barkeep...';
                status.className = 'model-download-status model-download-status--downloading';
                btn.disabled = true;
                break;
            case 'success':
                status.textContent = detail || 'Bar is open. Ready when you are.';
                status.className = 'model-download-status model-download-status--success';
                btn.disabled = true;
                break;
            case 'error':
                status.textContent = detail ? `Error: ${detail}` : 'Couldn’t load the barkeep.';
                status.className = 'model-download-status model-download-status--error';
                btn.disabled = false;
                break;
            default:
                status.textContent = detail;
        }
    }

    setDownloadProgress(percent) {
        const fill = this.elements.modelDownloadProgressFill;
        const text = this.elements.modelDownloadProgressText;
        if (fill) fill.style.width = `${Math.min(100, Math.max(0, percent))}%`;
        if (text) text.textContent = `${percent}%`;
    }

    /** Keeps the section visible and sets status to "available". */
    setModelDownloadSectionReady() {
        this.showModelDownloadSection('available');
    }

    onModelDownloadClick(callback) {
        const btn = this.elements.modelDownloadBtn;
        if (!btn) return;
        btn.addEventListener('click', callback);
    }

    setButtonToStopMode() {
        this.elements.button.textContent = 'Stop';
        this.elements.button.classList.add('stop-button');
    }

    setButtonToSendMode() {
        this.elements.button.textContent = 'Ask the barkeep';
        this.elements.button.classList.remove('stop-button');
    }

    handleFilePreview(event) {
        const file = event.target.files[0];
        this.elements.filePreview.innerHTML = '';
        this.elements.fileSelectedName.textContent = '';

        if (!file) return;

        // Show selected file name
        this.elements.fileSelectedName.textContent = `✓ ${file.name}`;
        this.elements.fileSelectedName.classList.add('selected');

        const fileType = file.type.split('/')[0];
        const fileInfo = document.createElement('div');
        fileInfo.className = 'file-info';

        if (fileType === 'image') {
            const img = document.createElement('img');
            img.src = URL.createObjectURL(file);
            img.className = 'preview-image';
            fileInfo.appendChild(img);
        } else if (fileType === 'audio') {
            const audio = document.createElement('audio');
            audio.src = URL.createObjectURL(file);
            audio.controls = true;
            audio.className = 'preview-audio';
            fileInfo.appendChild(audio);
        }

        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.className = 'remove-file-btn';
        removeBtn.textContent = '× Remove';
        removeBtn.onclick = () => {
            this.elements.fileInput.value = '';
            this.elements.filePreview.innerHTML = '';
            this.elements.fileSelectedName.textContent = '';
            this.elements.fileSelectedName.classList.remove('selected');
        };
        fileInfo.appendChild(removeBtn);

        this.elements.filePreview.appendChild(fileInfo);
    }

    triggerFileInput() {
        this.elements.fileInput.click();
    }

    onTemperatureChange(callback) {
        this.elements.temperature.addEventListener('input', callback);
    }

    onTopKChange(callback) {
        this.elements.topK.addEventListener('input', callback);
    }

    onFileChange(callback) {
        this.elements.fileInput.addEventListener('change', callback);
    }

    onFileButtonClick(callback) {
        this.elements.fileUploadBtn.addEventListener('click', callback);
    }

    onFormSubmit(callback) {
        this.elements.form.addEventListener('submit', callback);
    }
}
