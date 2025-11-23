// Tab switching
document.querySelectorAll('.tab-button').forEach(button => {
    button.addEventListener('click', () => {
        const tabName = button.dataset.tab;
        
        // Update buttons
        document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        
        // Update content
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        document.getElementById(`${tabName}-tab`).classList.add('active');
        
        // Clear messages
        clearMessages();
    });
});

// File handling
let selectedFile = null;
let selectedImage = null;

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        selectedFile = file;
        showFileSelected(file.name);
        document.getElementById('file-convert-btn').disabled = false;
    }
}

function handleImageSelect(event) {
    const file = event.target.files[0];
    if (file) {
        selectedImage = file;
        showImagePreview(file);
        document.getElementById('image-convert-btn').disabled = false;
    }
}

function showFileSelected(fileName) {
    document.getElementById('file-name').textContent = fileName;
    document.querySelector('.file-upload-placeholder').style.display = 'none';
    document.getElementById('file-selected').style.display = 'flex';
}

function showImagePreview(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        document.getElementById('preview-img').src = e.target.result;
        document.querySelector('.image-upload-placeholder').style.display = 'none';
        document.getElementById('image-preview').style.display = 'block';
    };
    reader.readAsDataURL(file);
}

function clearFile() {
    selectedFile = null;
    document.getElementById('file-input').value = '';
    document.querySelector('.file-upload-placeholder').style.display = 'block';
    document.getElementById('file-selected').style.display = 'none';
    document.getElementById('file-convert-btn').disabled = true;
}

function clearImage() {
    selectedImage = null;
    document.getElementById('image-input').value = '';
    document.querySelector('.image-upload-placeholder').style.display = 'block';
    document.getElementById('image-preview').style.display = 'none';
    document.getElementById('image-convert-btn').disabled = true;
}

// Drag and drop
const fileUploadArea = document.getElementById('file-upload-area');
const imageUploadArea = document.getElementById('image-upload-area');

['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    fileUploadArea.addEventListener(eventName, preventDefaults, false);
    imageUploadArea.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

['dragenter', 'dragover'].forEach(eventName => {
    fileUploadArea.addEventListener(eventName, () => fileUploadArea.classList.add('dragover'), false);
    imageUploadArea.addEventListener(eventName, () => imageUploadArea.classList.add('dragover'), false);
});

['dragleave', 'drop'].forEach(eventName => {
    fileUploadArea.addEventListener(eventName, () => fileUploadArea.classList.remove('dragover'), false);
    imageUploadArea.addEventListener(eventName, () => imageUploadArea.classList.remove('dragover'), false);
});

fileUploadArea.addEventListener('drop', (e) => {
    const file = e.dataTransfer.files[0];
    if (file) {
        selectedFile = file;
        document.getElementById('file-input').files = e.dataTransfer.files;
        showFileSelected(file.name);
        document.getElementById('file-convert-btn').disabled = false;
    }
}, false);

imageUploadArea.addEventListener('drop', (e) => {
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
        selectedImage = file;
        document.getElementById('image-input').files = e.dataTransfer.files;
        showImagePreview(file);
        document.getElementById('image-convert-btn').disabled = false;
    }
}, false);

// Conversion functions
async function convertText() {
    const text = document.getElementById('text-input').value.trim();
    
    if (!text) {
        showError('Please enter some text to convert');
        return;
    }
    
    clearMessages();
    showLoading();
    
    try {
        const response = await fetch('/api/convert/text', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ text })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to convert text');
        }
        
        const blob = await response.blob();
        downloadFile(blob, 'calendar.ics');
        showSuccess();
    } catch (error) {
        showError(error.message);
    } finally {
        hideLoading();
    }
}

async function convertFile() {
    if (!selectedFile) {
        showError('Please select a file');
        return;
    }
    
    clearMessages();
    showLoading();
    
    try {
        const formData = new FormData();
        formData.append('file', selectedFile);
        
        const response = await fetch('/api/convert/file', {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to convert file');
        }
        
        const blob = await response.blob();
        downloadFile(blob, 'calendar.ics');
        showSuccess();
    } catch (error) {
        showError(error.message);
    } finally {
        hideLoading();
    }
}

async function convertImage() {
    if (!selectedImage) {
        showError('Please select an image');
        return;
    }
    
    clearMessages();
    showLoading();
    
    try {
        const formData = new FormData();
        formData.append('file', selectedImage);
        
        const response = await fetch('/api/convert/file', {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to convert image');
        }
        
        const blob = await response.blob();
        downloadFile(blob, 'calendar.ics');
        showSuccess();
    } catch (error) {
        showError(error.message);
    } finally {
        hideLoading();
    }
}

// Utility functions
function downloadFile(blob, filename) {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
}

function showLoading() {
    document.getElementById('loading').style.display = 'block';
}

function hideLoading() {
    document.getElementById('loading').style.display = 'none';
}

function showError(message) {
    const errorDiv = document.getElementById('error-message');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
}

function showSuccess() {
    document.getElementById('success-message').style.display = 'block';
}

function clearMessages() {
    document.getElementById('error-message').style.display = 'none';
    document.getElementById('success-message').style.display = 'none';
}

