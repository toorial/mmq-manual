// ==================== 试用次数限制 ====================
const MAX_QUOTA = 100;
let remainingQuota = MAX_QUOTA;

function updateQuotaDisplay() {
    const quota = document.getElementById('quotaLeft');
    if (quota) quota.textContent = String(remainingQuota);
    const analyzeBtn = document.getElementById('analyzeBtn1');
    if (remainingQuota <= 0) {
        if (analyzeBtn) analyzeBtn.disabled = true;
        for (let i = 1; i <= 6; i++) {
            const btn = document.getElementById('btnTest' + i);
            if (btn) btn.disabled = true;
        }
    } else if (analyzeBtn && !analyzeBtn.classList.contains('loading')) {
        analyzeBtn.disabled = !currentImageData;
    }
}

function consumeQuota() {
    if (remainingQuota > 0) {
        remainingQuota--;
        updateQuotaDisplay();
        return true;
    }
    return false;
}

// ==================== 历史记录管理 ====================
let historyRecords = [];
let historySeq = 0;

function addHistoryRecord(result, originalDataURL, imageName) {
    historySeq++;
    const now = new Date();
    const timeStr = now.toLocaleString('en-US', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
    const record = {
        seq: historySeq,
        time: timeStr,
        imageName: imageName || ('image_' + historySeq),
        fatAreaRatio: result.fatAreaRatio,
        grade: result.grade,
        originalSrc: originalDataURL,
        markedSrc: result.markedImage
    };
    historyRecords.unshift(record); // 最新在前
    renderHistoryItem(record, true);
}

function renderHistoryItem(record, prepend) {
    const body = document.getElementById('historyBody');
    const emptyEl = document.getElementById('historyEmpty');
    if (emptyEl) emptyEl.style.display = 'none';

    const item = document.createElement('div');
    item.className = 'history-item';
    item.id = 'historyItem_' + record.seq;
    item.innerHTML = `
        <div class="history-card-title">Result ${record.seq}</div>
        <div class="history-metrics">
            <div class="history-metric">
                <div class="history-metric-label">Fat Ratio</div>
                <div class="history-metric-value">${record.fatAreaRatio.toFixed(2)}%</div>
            </div>
            <div class="history-metric">
                <div class="history-metric-label">Marbling Grade</div>
                <div class="history-metric-value"><span class="grade-badge">${record.grade}</span></div>
            </div>
        </div>
        <div class="history-images-row">
            <div class="history-image-box">
                <img class="history-thumb" src="${record.originalSrc}" alt="Original">
                <div class="history-image-label">Original</div>
            </div>
            <div class="history-image-box">
                <img class="history-marked-thumb" src="${record.markedSrc}" alt="Marked">
                <div class="history-image-label">Marked Image</div>
            </div>
        </div>
        <button type="button" class="form-submit" onclick="exportSingleResult(${record.seq})">Export measurement data</button>
    `;

    if (prepend && body.firstChild && body.firstChild !== emptyEl) {
        body.insertBefore(item, body.firstChild);
    } else if (prepend) {
        body.appendChild(item);
    } else {
        body.appendChild(item);
    }
}

function exportSingleResult(seq) {
    const record = historyRecords.find(r => r.seq === seq);
    if (!record) return;
    const headers = ['No.', 'Time', 'Image Name', 'Fat Ratio(%)', 'Marbling Grade',
                     'Location', 'Operator', 'Breed', 'Gender', 'Date'];
    const location = document.getElementById('location').value || '';
    const operator = document.getElementById('operator').value || '';
    const breed = document.getElementById('breed').value || '';
    const gender = document.getElementById('gender').value || '';
    const testDate = document.getElementById('testDate').value || '';
    const rows = [[record.seq, record.time, record.imageName || '',
                   record.fatAreaRatio.toFixed(2), record.grade,
                   location, operator, breed, gender, testDate]];
    let csv = '\uFEFF' + headers.join(',') + '\n';
    rows.forEach(row => {
        csv += row.map(v => '"' + String(v).replace(/"/g, '""') + '"').join(',') + '\n';
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'PorkMS_Result_' + record.seq + '_' + (record.imageName || 'result') + '.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function clearAllHistory() {
    if (historyRecords.length === 0) { alert('No records to clear.'); return; }
    if (!confirm('Clear all measurement history? This cannot be undone.')) return;
    historyRecords = [];
    historySeq = 0;
    const body = document.getElementById('historyBody');
    body.innerHTML = '<div class="history-empty" id="historyEmpty"><div class="history-empty-icon">&#9633;</div><div>No measurement records yet. Import an image and start measuring.</div></div>';
}

function exportAllResults() {
    if (historyRecords.length === 0) { alert('No records to export.'); return; }
    const headers = ['No.', 'Time', 'Image Name', 'Fat Ratio(%)', 'Marbling Grade',
                     'Location', 'Operator', 'Breed', 'Gender', 'Date'];
    const location = document.getElementById('location').value || '';
    const operator = document.getElementById('operator').value || '';
    const breed = document.getElementById('breed').value || '';
    const gender = document.getElementById('gender').value || '';
    const testDate = document.getElementById('testDate').value || '';

    const rows = historyRecords.map(r => [
        r.seq, r.time, r.imageName,
        r.fatAreaRatio.toFixed(2), r.grade,
        location, operator, breed, gender, testDate
    ]);

    const csvContent = [headers, ...rows]
        .map(row => row.map(v => '"' + String(v).replace(/"/g, '""') + '"').join(','))
        .join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'PorkMS_results_' + (testDate || new Date().toISOString().split('T')[0]) + '.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// ==================== Help Modal ====================
function openHelp() { document.getElementById('helpModal').classList.add('show'); }
function closeHelp() { document.getElementById('helpModal').classList.remove('show'); }
function closeHelpOutside(e) { if (e.target === document.getElementById('helpModal')) closeHelp(); }

function switchHelp(panelId, btn) {
    document.querySelectorAll('.help-panel').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.help-nav-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('help-' + panelId).classList.add('active');
    btn.classList.add('active');
}

// ==================== 图像Analyze算法 ====================
let currentImageData = null;
let currentFileName = '';

function grayscale(data) {
    const g = new Uint8Array(data.length / 4);
    for (let i = 0; i < data.length; i += 4)
        g[i/4] = Math.round(0.299*data[i] + 0.587*data[i+1] + 0.114*data[i+2]);
    return g;
}

function toColorImageData(rgb, w, h) {
    const d = new Uint8ClampedArray(w * h * 4);
    d.set(rgb);
    return new ImageData(d, w, h);
}

function otsuThreshold(gray) {
    const hist = new Array(256).fill(0);
    for (let v of gray) hist[Math.round(v)]++;
    const total = gray.length;
    let sum = 0;
    for (let i = 0; i < 256; i++) sum += i * hist[i];
    let sumB = 0, wB = 0, maxVar = 0, threshold = 0;
    for (let t = 0; t < 256; t++) {
        wB += hist[t]; if (wB === 0) continue;
        const wF = total - wB; if (wF === 0) break;
        sumB += t * hist[t];
        const mB = sumB / wB, mF = (sum - sumB) / wF;
        const v = wB * wF * (mB - mF) * (mB - mF);
        if (v > maxVar) { maxVar = v; threshold = t; }
    }
    return threshold;
}

function findLargestComponent(mask, w, h) {
    const visited = new Uint8Array(w * h), labels = new Int32Array(w * h), queue = [];
    let label = 0;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const idx = y * w + x;
        if (visited[idx] || !mask[idx]) continue;
        label++; queue.push([x, y]);
        while (queue.length) {
            const [cx, cy] = queue.shift();
            const i = cy * w + cx;
            if (cx<0||cx>=w||cy<0||cy>=h||visited[i]||!mask[i]) continue;
            visited[i] = 1; labels[i] = label;
            queue.push([cx+1,cy],[cx-1,cy],[cx,cy+1],[cx,cy-1]);
        }
    }
    const areas = new Array(label + 1).fill(0);
    for (let v of labels) if (v > 0) areas[v]++;
    let maxArea = 0, maxLabel = 0;
    for (let i = 1; i <= label; i++) if (areas[i] > maxArea) { maxArea = areas[i]; maxLabel = i; }
    const result = new Uint8Array(w * h);
    for (let i = 0; i < labels.length; i++) result[i] = labels[i] === maxLabel ? 1 : 0;
    return { mask: result, area: maxArea };
}

function erode(mask, w, h, r) {
    const result = new Uint8Array(w * h);
    for (let y = r; y < h - r; y++) for (let x = r; x < w - r; x++) {
        let ok = true;
        for (let dy = -r; dy <= r && ok; dy++) for (let dx = -r; dx <= r; dx++)
            if (Math.sqrt(dx*dx+dy*dy) <= r && !mask[(y+dy)*w+(x+dx)]) ok = false;
        result[y*w+x] = ok ? 1 : 0;
    }
    return result;
}

function removeBorder(mask, w, h, bw) {
    const result = new Uint8Array(mask);
    for (let y = 0; y < h; y++) {
        let first = -1, last = -1;
        for (let x = 0; x < w; x++) { if (mask[y*w+x]) { if(first<0) first=x; last=x; } }
        if (first >= 0 && last > first) {
            for (let x = first; x < Math.min(first+bw, last+1); x++) result[y*w+x] = 0;
            for (let x = Math.max(last-bw+1, first); x <= last; x++) result[y*w+x] = 0;
        }
    }
    for (let x = 0; x < w; x++) {
        let first = -1, last = -1;
        for (let y = 0; y < h; y++) { if (mask[y*w+x]) { if(first<0) first=y; last=y; } }
        if (first >= 0 && last > first) {
            for (let y = first; y < Math.min(first+bw, last+1); y++) result[y*w+x] = 0;
            for (let y = Math.max(last-bw+1, first); y <= last; y++) result[y*w+x] = 0;
        }
    }
    return result;
}

function resizeNearest(src, sW, sH, dW, dH) {
    const result = new Uint8Array(dW * dH);
    for (let y = 0; y < dH; y++) for (let x = 0; x < dW; x++) {
        const sx = Math.min(Math.floor(x * sW / dW), sW - 1);
        const sy = Math.min(Math.floor(y * sH / dH), sH - 1);
        result[y * dW + x] = src[sy * sW + sx];
    }
    return result;
}

function rgbToLab(r, g, b) {
    let rr = r/255, gg = g/255, bb = b/255;
    rr = rr>0.04045 ? Math.pow((rr+0.055)/1.055,2.4) : rr/12.92;
    gg = gg>0.04045 ? Math.pow((gg+0.055)/1.055,2.4) : gg/12.92;
    bb = bb>0.04045 ? Math.pow((bb+0.055)/1.055,2.4) : bb/12.92;
    const x = (rr*0.4124564 + gg*0.3575761 + bb*0.1804375) * 100;
    const y = (rr*0.2126729 + gg*0.7151522 + bb*0.0721750) * 100;
    const z = (rr*0.0193339 + gg*0.1191920 + bb*0.9503041) * 100;
    const xn = x/95.047, yn = y/100, zn = z/108.883;
    const fx = xn>0.008856 ? Math.pow(xn,1/3) : 7.787*xn+16/116;
    const fy = yn>0.008856 ? Math.pow(yn,1/3) : 7.787*yn+16/116;
    const fz = zn>0.008856 ? Math.pow(zn,1/3) : 7.787*zn+16/116;
    return { L: 116*fy-16, a: 500*(fx-fy), b: 200*(fy-fz) };
}

function analyzeImageCore(originalData, width, height) {
    let scaleFactor = 0.2;
    if (Math.max(width, height) < 1000) scaleFactor = 0.5;
    if (Math.max(width, height) > 4000) scaleFactor = 0.08;
    const sW = Math.round(width * scaleFactor), sH = Math.round(height * scaleFactor);

    const gray = grayscale(originalData);
    const sGray = new Uint8Array(sW * sH);
    for (let y = 0; y < sH; y++) for (let x = 0; x < sW; x++)
        sGray[y*sW+x] = gray[Math.floor(y/scaleFactor)*width + Math.floor(x/scaleFactor)];
    const th = otsuThreshold(sGray);
    const otsuMask = new Uint8Array(sW * sH);
    for (let i = 0; i < sGray.length; i++) otsuMask[i] = sGray[i] > th ? 1 : 0;
    const imageA = findLargestComponent(otsuMask, sW, sH).mask;
    const invA = new Uint8Array(imageA.length);
    for (let i = 0; i < imageA.length; i++) invA[i] = 1 - imageA[i];
    const imageB = findLargestComponent(invA, sW, sH);
    let imageC = new Uint8Array(imageB.mask.length);
    for (let i = 0; i < imageB.mask.length; i++) imageC[i] = 1 - imageB.mask[i];

    const smallImg = new Uint8ClampedArray(sW * sH * 4);
    for (let y = 0; y < sH; y++) for (let x = 0; x < sW; x++) {
        const sx = Math.floor(x/scaleFactor), sy = Math.floor(y/scaleFactor);
        const si = (sy*width+sx)*4, di = (y*sW+x)*4;
        smallImg[di]=originalData[si]; smallImg[di+1]=originalData[si+1];
        smallImg[di+2]=originalData[si+2]; smallImg[di+3]=255;
    }

    let imageM = new Uint8ClampedArray(sW * sH * 4);
    for (let i = 0; i < imageC.length; i++) {
        const pi = i*4;
        if (imageC[i]) { imageM[pi]=smallImg[pi]; imageM[pi+1]=smallImg[pi+1]; imageM[pi+2]=smallImg[pi+2]; }
        imageM[pi+3]=255;
    }

    let imageL = new Uint8ClampedArray(sW * sH * 4);
    for (let i = 0; i < sW*sH; i++) {
        const pi = i*4, r=imageM[pi], g=imageM[pi+1], b=imageM[pi+2];
        if (!r && !g && !b) continue;
        const lab = rgbToLab(r, g, b);
        const isLight = (lab.a<10 && lab.b<10 && lab.L>60) || (lab.a<5 && lab.b<5);
        if (!isLight) { imageL[pi]=r; imageL[pi+1]=g; imageL[pi+2]=b; }
        imageL[pi+3]=255;
    }

    const grayL = new Uint8Array(sW * sH);
    for (let i = 0; i < sW*sH; i++) { const pi=i*4; grayL[i]=Math.round(0.299*imageL[pi]+0.587*imageL[pi+1]+0.114*imageL[pi+2]); }
    const h1 = new Uint8Array(sW * sH);
    for (let i = 0; i < grayL.length; i++) h1[i] = grayL[i] > 0 ? 1 : 0;
    const se = Math.max(1, Math.round(2 * scaleFactor));
    const h2 = erode(h1, sW, sH, se);
    const h3 = findLargestComponent(h2, sW, sH).mask;
    const i1 = new Uint8Array(h3.length); for (let i=0;i<h3.length;i++) i1[i]=1-h3[i];
    const j = findLargestComponent(i1, sW, sH).mask;
    let imageJ1 = new Uint8Array(j.length); for (let i=0;i<j.length;i++) imageJ1[i]=1-j[i];
    const bw = Math.round(60 * scaleFactor);
    let imageJ2 = removeBorder(imageJ1, sW, sH, bw);

    const imageCFull = resizeNearest(imageC, sW, sH, width, height);
    const imgMFull = new Uint8ClampedArray(width * height * 4);
    for (let i = 0; i < width*height; i++) {
        const pi = i*4;
        if (imageCFull[i]) { imgMFull[pi]=originalData[pi]; imgMFull[pi+1]=originalData[pi+1]; imgMFull[pi+2]=originalData[pi+2]; }
        imgMFull[pi+3]=255;
    }
    const j2Full = resizeNearest(imageJ2, sW, sH, width, height);
    let imageX = new Uint8ClampedArray(width * height * 4);
    for (let i = 0; i < width*height; i++) {
        const pi = i*4;
        if (j2Full[i]) { imageX[pi]=imgMFull[pi]; imageX[pi+1]=imgMFull[pi+1]; imageX[pi+2]=imgMFull[pi+2]; }
        imageX[pi+3]=255;
    }

    const blueChannel = new Uint8Array(width * height);
    let gmin = 255, gmax = 0;
    for (let i = 0; i < width*height; i++) {
        const pi = i*4;
        if (imageX[pi]||imageX[pi+1]||imageX[pi+2]) {
            blueChannel[i] = imageX[pi+2];
            if (blueChannel[i] > 0) {
                if (blueChannel[i] < gmin) gmin = blueChannel[i];
                if (blueChannel[i] > gmax) gmax = blueChannel[i];
            }
        }
    }
    const range = gmax - gmin + 1;
    const normalizedGray = new Float32Array(width * height);
    for (let i = 0; i < blueChannel.length; i++)
        if (blueChannel[i] > 0) normalizedGray[i] = (blueChannel[i] - gmin + 1) / range;

    const counts = {}; let maxCount = 0, I_mode = 0;
    for (let i = 0; i < normalizedGray.length; i++) {
        if (normalizedGray[i] > 0) {
            const key = Math.round(normalizedGray[i] * 1000) / 1000;
            counts[key] = (counts[key] || 0) + 1;
            if (counts[key] > maxCount) { maxCount = counts[key]; I_mode = key; }
        }
    }

    const blockSize = 350;
    const M = Math.floor(height / blockSize), N = Math.floor(width / blockSize);
    const blockInfo = [];
    for (let i = 0; i < M; i++) for (let j = 0; j < N; j++) {
        const sy = i*blockSize, sx = j*blockSize;
        const cnt = {}, mv = { mode: 0, count: 0, max: 0 };
        for (let y = 0; y < blockSize; y++) for (let x = 0; x < blockSize; x++) {
            const idx = (sy+y)*width + (sx+x);
            const val = normalizedGray[idx];
            if (val > 0) {
                if (val > mv.max) mv.max = val;
                const key = Math.round(val * 1000) / 1000;
                cnt[key] = (cnt[key] || 0) + 1;
                if (cnt[key] > mv.count) { mv.count = cnt[key]; mv.mode = key; }
            }
        }
        let level = mv.mode + mv.max * (I_mode / (mv.mode * 7));
        if (level > 1) level = 1;
        blockInfo.push({ i, j, level });
    }

    let sample = new Uint8Array(width * height);
    let blockIdx = 0;
    for (let i = 0; i < M; i++) for (let j = 0; j < N; j++) {
        const sy = i*blockSize, sx = j*blockSize;
        const level = blockInfo[blockIdx++].level;
        for (let y = 0; y < blockSize; y++) for (let x = 0; x < blockSize; x++) {
            const idx = (sy+y)*width + (sx+x);
            sample[idx] = (normalizedGray[idx] > level) ? 1 : 0;
        }
    }

    const vis2 = new Uint8Array(width * height), lbl2 = new Int32Array(width * height), q2 = [];
    let lbl = 0;
    for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
        const idx = y*width+x;
        if (vis2[idx] || !sample[idx]) continue;
        lbl++; q2.push([x,y]);
        while (q2.length) {
            const [cx,cy] = q2.shift();
            const i = cy*width+cx;
            if (cx<0||cx>=width||cy<0||cy>=height||vis2[i]||!sample[i]) continue;
            vis2[i]=1; lbl2[i]=lbl;
            q2.push([cx+1,cy],[cx-1,cy],[cx,cy+1],[cx,cy-1]);
        }
    }
    const areas2 = new Array(lbl+1).fill(0);
    for (let v of lbl2) if (v>0) areas2[v]++;

    let fatArea = 0;
    for (let i = 0; i < lbl2.length; i++) {
        if (lbl2[i] > 0 && areas2[lbl2[i]] >= 30) { sample[i] = 1; fatArea++; } else sample[i] = 0;
    }

    const targetArea = imageX.filter((v,i)=>i%4===0&&v>0).length;
    const fatAreaRatio = fatArea / targetArea;

    let grade;
    if (fatAreaRatio <= 0.00275) grade = 'Grade 1';
    else if (fatAreaRatio <= 0.02284) grade = 'Grade 2';
    else if (fatAreaRatio <= 0.05902) grade = 'Grade 3';
    else if (fatAreaRatio <= 0.08703) grade = 'Grade 4';
    else if (fatAreaRatio <= 0.12464) grade = 'Grade 5';
    else if (fatAreaRatio <= 0.18045) grade = 'Grade 6';
    else if (fatAreaRatio <= 0.23508) grade = 'Grade 7';
    else if (fatAreaRatio <= 0.28232) grade = 'Grade 8';
    else if (fatAreaRatio <= 0.33355) grade = 'Grade 9';
    else grade = 'Grade 10+';

    const markedImage = new Uint8ClampedArray(imageX);
    for (let i = 0; i < width*height; i++) {
        if (sample[i]) { const pi=i*4; markedImage[pi]=0; markedImage[pi+1]=255; markedImage[pi+2]=0; }
    }

    const canvas = document.createElement('canvas');
    canvas.width = width; canvas.height = height;
    canvas.getContext('2d').putImageData(toColorImageData(markedImage, width, height), 0, 0);

    return { fatAreaRatio: fatAreaRatio * 100, grade, fatArea, markedImage: canvas.toDataURL('image/png') };
}

// ==================== 单张图片上传交互 ====================
window.addEventListener('load', function() {
    const dateBox = document.getElementById('testDate');
    if (!dateBox) return;
    dateBox.value = new Date().toISOString().split('T')[0];
    initDropZone();
    initBatchDrop();
    updateQuotaDisplay();
});

function initDropZone() {
    const dropZone = document.getElementById('dropZone1');
    const fileInput = document.getElementById('fileInput1');
    fileInput.addEventListener('change', function() {
        if (this.files[0]) loadImage(this.files[0]);
    });
    dropZone.addEventListener('dragover', function(e) { e.preventDefault(); this.classList.add('dragover'); });
    dropZone.addEventListener('dragleave', function() { this.classList.remove('dragover'); });
    dropZone.addEventListener('drop', function(e) {
        e.preventDefault();
        this.classList.remove('dragover');
        if (e.dataTransfer.files[0]) loadImage(e.dataTransfer.files[0]);
    });
}

function loadImage(file) {
    currentFileName = file.name || '';
    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            const canvas = document.createElement('canvas');
            canvas.width = img.width; canvas.height = img.height;
            canvas.getContext('2d').drawImage(img, 0, 0);
            currentImageData = canvas.getContext('2d').getImageData(0, 0, img.width, img.height);
            const dropZone = document.getElementById('dropZone1');
            dropZone.innerHTML = '<img src="' + e.target.result + '" class="preview-img" alt="preview"><button class="remove-btn" onclick="removeImage(event)">×</button>';
            dropZone.classList.add('has-image');
            const btn = document.getElementById('analyzeBtn1');
            if (remainingQuota > 0) btn.disabled = false;
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

function removeImage(event) {
    if (event) event.stopPropagation();
    const dropZone = document.getElementById('dropZone1');
    dropZone.innerHTML = '<p class="drop-hint">Click or drag an image here</p><p class="drop-hint">JPG or PNG</p><button type="button" class="remove-btn" onclick="removeImage(event)">×</button>';
    dropZone.classList.remove('has-image');
    document.getElementById('fileInput1').value = '';
    document.getElementById('analyzeBtn1').disabled = true;
    currentImageData = null;
    currentFileName = '';
}

function setAnalyzeLoading(loading) {
    const btn = document.getElementById('analyzeBtn1');
    if (loading) {
        btn.classList.add('loading');
        btn.innerHTML = '<span class="spinner"></span>Analyzing...';
        btn.disabled = true;
    } else {
        btn.classList.remove('loading');
        btn.innerHTML = '<span class="spinner"></span>Start measurement';
        btn.disabled = (currentImageData === null || remainingQuota <= 0);
    }
}

async function analyzeImage() {
    if (!currentImageData) return;
    if (remainingQuota <= 0) { alert('Trial limit reached. Please contact the developer.'); return; }

    setAnalyzeLoading(true);
    await new Promise(r => setTimeout(r, 50));

    try {
        const result = analyzeImageCore(currentImageData.data, currentImageData.width, currentImageData.height);
        // 获取原图DataURL用于历史记录缩略图
        const oc = document.createElement('canvas');
        oc.width = currentImageData.width; oc.height = currentImageData.height;
        oc.getContext('2d').putImageData(currentImageData, 0, 0);
        const originalDataURL = oc.toDataURL('image/png');

        // 消耗次数（仅成功后）
        consumeQuota();

        // 添加到历史记录
        addHistoryRecord(result, originalDataURL, currentFileName);

    } catch(err) {
        alert('Image analysis failed. Please try again with a different image.');
        console.error(err);
    }

    setAnalyzeLoading(false);
}

// ==================== 测试图快速分析 ====================
// 注意：所有测试图片已直接嵌入HTML，无需网络加载
const testImageCache = {};

function setTestLoading(index, loading) {
    const btn = document.getElementById('btnTest' + index);
    if (!btn) return;
    if (loading) {
        btn.classList.add('loading');
        btn.innerHTML = '<span class="spinner"></span>Analyzing';
        btn.disabled = true;
    } else {
        btn.classList.remove('loading');
        btn.innerHTML = 'Analyze';
        btn.disabled = remainingQuota <= 0;
    }
}

async function analyzeTestImage(index) {
    if (remainingQuota <= 0) { alert('Trial limit reached. Please contact the developer.'); return; }
    const btn = document.getElementById('btnTest' + index);
    if (!btn) return;

    // 直接使用页面上嵌入的图片
    if (!testImageCache[index]) {
        setTestLoading(index, true);
        try {
            const thumbImg = document.querySelector(`.test-image-item[data-grade="${index}"] img`);
            const sampleSrc = window.PORKMS_SAMPLES && window.PORKMS_SAMPLES[index];
            if (!sampleSrc && !thumbImg) throw new Error('Image element not found');

            const img = new Image();
            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = () => reject(new Error('Image load failed'));
                img.src = sampleSrc || thumbImg.src;
            });
            
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            canvas.getContext('2d').drawImage(img, 0, 0);
            testImageCache[index] = {
                imgData: canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height),
                dataURL: canvas.toDataURL('image/png')
            };
        } catch(err) {
            alert('Could not read that test image. ' + err.message);
            setTestLoading(index, false);
            return;
        }
        setTestLoading(index, false);
    }

    // 执行分析
    setTestLoading(index, true);
    try {
        const cached = testImageCache[index];
        const result = analyzeImageCore(cached.imgData.data, cached.imgData.width, cached.imgData.height);
        consumeQuota();
        addHistoryRecord(result, cached.dataURL, 'test_grade' + index + '.jpeg');

        btn.innerHTML = 'Done';
        btn.classList.add('done');
        setTimeout(() => {
            btn.innerHTML = 'Analyze';
            btn.classList.remove('done');
            setTestLoading(index, false);
        }, 1500);
    } catch(err) {
        alert('Analysis of test image ' + index + ' failed: ' + err.message);
        setTestLoading(index, false);
    }
}

// ==================== 批量拖放区域初始化（保留兼容性）====================
function initBatchDrop() { /* reserved for compatibility */ }
