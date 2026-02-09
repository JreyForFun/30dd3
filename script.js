let files = [];
let convertedFiles = [];
const supportedFormats = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/bmp'];

const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const previewArea = document.getElementById('preview-area');
const convertAllBtn = document.getElementById('convert-all-btn');
const clearAllBtn = document.getElementById('clear-all-btn');
const downloadAllBtn = document.getElementById('download-all-btn');
const formatSelect = document.getElementById('format-select');
const qualitySlider = document.getElementById('quality-slider');
const qualityValue = document.getElementById('quality-value');
const qualityControl = document.getElementById('quality-control');
const statusCounter = document.getElementById('file-counter');
const statusBar = document.getElementById('status-bar');
const conversionStatus = document.getElementById('conversion-status');
const progressBar = document.getElementById('progress-bar');
const progressContainer = document.getElementById('progress-container');
const resizeWidthInput = document.getElementById('resize-width');
const resizeHeightInput = document.getElementById('resize-height');
const maintainAspectCheckbox = document.getElementById('maintain-aspect');
const keepNameCheckbox = document.getElementById('keep-name');

function init() {
  setupEventListeners();
  updateQualityLabel(0.9);
}

function setupEventListeners() {
  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('drag-over');
  });

  dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('drag-over');
  });

  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    handleFiles(e.dataTransfer.files);
  });

  fileInput.addEventListener('change', (e) => {
    handleFiles(e.target.files);
    fileInput.value = '';
  });

  qualitySlider.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value);
    updateQualityLabel(val);
  });

  formatSelect.addEventListener('change', (e) => {
    if (e.target.value === 'image/png') {
      qualityControl.classList.add('hidden');
    } else {
      qualityControl.classList.remove('hidden');
    }
    updateConvertButtonText();
  });

  clearAllBtn.addEventListener('click', clearAll);
  convertAllBtn.addEventListener('click', convertAll);
  downloadAllBtn.addEventListener('click', downloadAllZip);
}

function updateQualityLabel(val) {
  const pct = Math.round(val * 100);
  let label = "High";
  if (pct < 50) label = "Low";
  else if (pct < 80) label = "Medium";

  qualityValue.textContent = `(${pct}%) - ${label}`;
}

function updateConvertButtonText() {
  const format = formatSelect.value.split('/')[1].toUpperCase();
  convertAllBtn.textContent = `Convert All to ${format}`;
}

function handleFiles(fileList) {
  const newFiles = Array.from(fileList).filter(file => supportedFormats.includes(file.type));

  if (newFiles.length === 0 && fileList.length > 0) {
    alert('No supported image files found.');
    return;
  }

  files = [...files, ...newFiles];
  const currentConverted = convertedFiles;
  convertedFiles = new Array(files.length).fill(null);
  for (let i = 0; i < currentConverted.length; i++) {
    convertedFiles[i] = currentConverted[i];
  }

  if (files.length > 0) {
    downloadAllBtn.classList.add('hidden');
    conversionStatus.textContent = "Ready";
    progressContainer.classList.add('hidden');
    progressBar.style.width = '0%';
  }

  updateUI();
}

function updateUI() {
  if (files.length > 0) {
    convertAllBtn.classList.remove('hidden');
    clearAllBtn.classList.remove('hidden');
    statusBar.classList.remove('hidden');
    statusCounter.textContent = `${files.length} image${files.length !== 1 ? 's' : ''}`;
    updateConvertButtonText();
  } else {
    convertAllBtn.classList.add('hidden');
    clearAllBtn.classList.add('hidden');
    downloadAllBtn.classList.add('hidden');
    statusBar.classList.add('hidden');
  }

  renderPreview();
}

function renderPreview() {
  if (files.length === 0) {
    previewArea.innerHTML = `
            <div class="empty-state">
                <p>No images uploaded yet</p>
            </div>`;
    return;
  }

  previewArea.innerHTML = '';

  files.forEach((file, index) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target.result;

      img.onload = () => {
        const card = document.createElement('div');
        card.className = 'preview-card';

        const isConverted = convertedFiles[index];
        let sizeDisplay = `Original: ${formatSize(file.size)}`;
        let savingsBadge = '';
        let downloadBtn = '';

        if (isConverted) {
          const savings = Math.round(((file.size - isConverted.blob.size) / file.size) * 100);
          const savingsClass = savings > 0 ? 'positive' : 'negative';
          const savingsText = savings > 0 ? `${savings}% reduction` : `+${Math.abs(savings)}% size`;

          sizeDisplay = `<span style="color: #8b949e">${formatSize(file.size)}</span> → <span style="color: #c9d1d9">${formatSize(isConverted.blob.size)}</span>`;
          savingsBadge = `<span class="savings-badge ${savingsClass}">${savingsText}</span>`;

          downloadBtn = `
                <button class="icon-btn" onclick="downloadSingle(${index})" title="Download">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                </button>
            `;
        }

        card.innerHTML = `
            <div class="card-actions">
                ${downloadBtn}
                <button class="icon-btn delete-btn" onclick="removeFile(${index})" title="Remove">✕</button>
            </div>
            <div class="preview-img-container">
                <img src="${e.target.result}" class="preview-img" alt="${file.name}">
            </div>
            <div class="preview-details">
                <div class="preview-filename" title="${file.name}">${file.name}</div>
                <div class="preview-meta">
                    <div>${file.type.split('/')[1].toUpperCase()} • ${img.naturalWidth}x${img.naturalHeight}</div>
                    <div>${sizeDisplay}</div>
                    ${savingsBadge}
                </div>
            </div>
        `;
        previewArea.appendChild(card);
      };
    };
    reader.readAsDataURL(file);
  });
}

function removeFile(index) {
  files.splice(index, 1);
  convertedFiles.splice(index, 1);

  if (convertedFiles.every(f => f === null)) {
    downloadAllBtn.classList.add('hidden');
    conversionStatus.textContent = "Ready";
    progressContainer.classList.add('hidden');
  }

  if (files.length === 0) {
    clearAll();
    return;
  }
  updateUI();
}

function clearAll() {
  files = [];
  convertedFiles = [];
  progressContainer.classList.add('hidden');
  updateUI();
}

function formatSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

async function convertAll() {
  if (files.length === 0) return;

  convertAllBtn.disabled = true;
  convertAllBtn.textContent = 'Converting...';
  conversionStatus.textContent = `Converting... 0 of ${files.length}`;
  conversionStatus.className = "";

  progressContainer.classList.remove('hidden');
  progressBar.style.width = '0%';

  const targetFormat = formatSelect.value;
  const quality = parseFloat(qualitySlider.value);
  const targetWidth = parseInt(resizeWidthInput.value) || 0;
  const targetHeight = parseInt(resizeHeightInput.value) || 0;
  const maintainAspect = maintainAspectCheckbox.checked;

  try {
    for (let i = 0; i < files.length; i++) {
      const result = await processFile(files[i], targetFormat, quality, targetWidth, targetHeight, maintainAspect);
      convertedFiles[i] = result;

      const progress = Math.round(((i + 1) / files.length) * 100);
      progressBar.style.width = `${progress}%`;
      conversionStatus.textContent = `Converting... ${i + 1} of ${files.length}`;
    }

    conversionStatus.textContent = 'Images converted successfully!';
    conversionStatus.className = "text-[#c9d1d9]";
    downloadAllBtn.classList.remove('hidden');
    convertAllBtn.disabled = false;
    updateConvertButtonText();
    renderPreview();
  } catch (error) {
    console.error(error);
    conversionStatus.textContent = 'Error during conversion';
    convertAllBtn.disabled = false;
    updateConvertButtonText();
  }
}

function processFile(file, format, quality, targetW, targetH, maintainAspect) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        let w = img.width;
        let h = img.height;

        if (targetW > 0 || targetH > 0) {
          if (maintainAspect) {
            if (targetW > 0 && targetH > 0) {
              const scale = Math.min(targetW / w, targetH / h);
              w = w * scale;
              h = h * scale;
            } else if (targetW > 0) {
              const scale = targetW / w;
              w = targetW;
              h = h * scale;
            } else if (targetH > 0) {
              const scale = targetH / h;
              h = targetH;
              w = w * scale;
            }
          } else {
            if (targetW > 0) w = targetW;
            if (targetH > 0) h = targetH;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');

        if (format === 'image/jpeg' || format === 'image/bmp') {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, w, h);
        }

        ctx.drawImage(img, 0, 0, w, h);

        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('Conversion failed'));
            return;
          }

          const originalName = file.name.substring(0, file.name.lastIndexOf('.'));
          let ext = format.split('/')[1];
          if (ext === 'jpeg') ext = 'jpg';

          const nameBase = keepNameCheckbox.checked ? originalName : `image_${Date.now()}`;
          const newName = `${nameBase}.${ext}`;

          resolve({
            name: newName,
            blob: blob,
            originalSize: file.size
          });
        }, format, quality);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
}

function downloadSingle(index) {
  const file = convertedFiles[index];
  if (!file) return;

  const url = URL.createObjectURL(file.blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = file.name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

async function downloadAllZip() {
  const validFiles = convertedFiles.filter(f => f !== null);
  if (validFiles.length === 0) return;

  const zip = new JSZip();
  validFiles.forEach(file => {
    zip.file(file.name, file.blob);
  });

  const oldText = downloadAllBtn.textContent;
  downloadAllBtn.textContent = "Zipping...";

  const content = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(content);
  const a = document.createElement('a');
  a.href = url;
  a.download = "images.zip";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  downloadAllBtn.textContent = oldText;
}

window.removeFile = removeFile;
window.downloadSingle = downloadSingle;

init();
