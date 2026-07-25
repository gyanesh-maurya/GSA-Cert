document.addEventListener('DOMContentLoaded', () => {
    const generateBtn = document.getElementById('generate-btn');
    const statusMessage = document.getElementById('status-message');
    const loadingSpinner = document.getElementById('loading-spinner');

    const downloadSection = document.getElementById('download-section');
    const manualDownloadBtn = document.getElementById('manual-download-btn');
    let latestZipContent = null;

    if (manualDownloadBtn) {
        manualDownloadBtn.addEventListener('click', () => {
            if (latestZipContent) {
                saveAs(latestZipContent, 'Interview_Certificates.zip');
            }
        });
    }

    // Cropper elements
    const cropperModal = document.getElementById('cropper-modal');
    const imageToCrop = document.getElementById('image-to-crop');
    const cancelCropBtn = document.getElementById('cancel-crop-btn');
    const saveCropBtn = document.getElementById('save-crop-btn');
    const signatureUpload = document.getElementById('signature-upload');
    let cropper = null;
    let croppedSignatureBlob = null;

    signatureUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const url = URL.createObjectURL(file);
            imageToCrop.src = url;
            cropperModal.style.display = 'flex';

            if (cropper) {
                cropper.destroy();
            }
            setTimeout(() => {
                cropper = new Cropper(imageToCrop, {
                    aspectRatio: 1660 / 678,
                    viewMode: 1,
                    autoCropArea: 1,
                });
            }, 100);
        }
    });

    cancelCropBtn.addEventListener('click', () => {
        cropperModal.style.display = 'none';
        signatureUpload.value = ''; // Reset input
        croppedSignatureBlob = null;
        if (cropper) {
            cropper.destroy();
            cropper = null;
        }
    });

    saveCropBtn.addEventListener('click', () => {
        if (cropper) {
            const canvas = cropper.getCroppedCanvas({
                width: 1660,
                height: 678
            });
            canvas.toBlob((blob) => {
                croppedSignatureBlob = blob;
                cropperModal.style.display = 'none';
                showStatus('Signature snatched and cropped! W. 💅', 'success');
            }, 'image/png');
        }
    });

    document.fonts.load('bold 50px "GoogleSans"').then(() => {
        console.log("Font loaded");
    });

    generateBtn.addEventListener('click', async () => {
        const certDate = document.getElementById('cert-date').value.trim();
        const certInitiative = document.getElementById('cert-initiative').value.trim();
        const certInstitute = document.getElementById('cert-institute').value.trim();
        const studentsData = document.getElementById('students-data').value.trim();

        if (!certDate || !studentsData || !certInitiative || !certInstitute) {
            showStatus('Bro, you forgot some details. Fill everything up. 💀', 'error');
            return;
        }

        try {
            if (downloadSection) downloadSection.style.display = 'none';
            setLoading(true);
            showStatus('Let him cook... 🍳', 'info');

            const students = parseStudents(studentsData);
            if (students.length === 0) {
                showStatus("Ain't no valid students here. Check the formatting chief. 🧢", 'error');
                setLoading(false);
                return;
            }

            let signatureImg = null;
            if (croppedSignatureBlob) {
                signatureImg = await loadImage(URL.createObjectURL(croppedSignatureBlob));
            } else if (signatureUpload.files[0]) {
                signatureImg = await loadImage(URL.createObjectURL(signatureUpload.files[0]));
            }

            let template;
            try {
                template = await loadImage(`./Certificates/ai.jpg`);
            } catch (e) {
                throw new Error(`Big yikes. No Interview certificate template found. 📉`);
            }

            const zip = new JSZip();
            const canvas = document.getElementById('cert-canvas');
            const ctx = canvas.getContext('2d');

            for (const student of students) {
                canvas.width = template.width;
                canvas.height = template.height;

                ctx.drawImage(template, 0, 0);

                ctx.fillStyle = '#000000';

                // --- Draw Name ---
                ctx.font = `bold ${canvas.height * 0.038}px "GoogleSans", sans-serif`;
                ctx.textAlign = 'center';
                const nameY = canvas.height * 0.413;
                ctx.fillText(student.name, canvas.width * 0.495, nameY);

                // --- Draw Initiative (Inline) ---
                ctx.font = `bold ${canvas.height * 0.026}px "GoogleSans", sans-serif`;
                const initInlineX = canvas.width * 0.465;
                const initInlineY = canvas.height * 0.546;

                const initWidth = ctx.measureText(certInitiative).width;
                ctx.fillStyle = 'rgba(255, 240, 180, 0.8)'; // Yellow highlight
                ctx.fillRect(initInlineX - initWidth / 2 - (canvas.width * 0.005), initInlineY - (canvas.height * 0.025), initWidth + (canvas.width * 0.01), canvas.height * 0.032);

                ctx.fillStyle = '#000000';
                ctx.fillText(certInitiative, initInlineX, initInlineY);

                // --- Draw Institute (Inline) ---
                ctx.textAlign = 'left';
                const instInlineX = canvas.width * 0.515; // Start just after "at "
                const instInlineY = canvas.height * 0.607;
                ctx.fillText(certInstitute, instInlineX, instInlineY, canvas.width * 0.38); // Max width to prevent going off-edge
                ctx.textAlign = 'center'; // Reset for next fields

                // --- Draw Date (Bottom) ---
                const dateX = canvas.width * 0.228;
                const bottomY = canvas.height * 0.840;
                ctx.fillText(certDate, dateX, bottomY);

                // --- Draw Initiative (Bottom) ---
                const initBottomX = canvas.width * 0.495;
                ctx.fillText(certInitiative, initBottomX, bottomY);

                // --- Draw Signature ---
                const sigXCenter = canvas.width * 0.77;
                if (signatureImg) {
                    const sigWidth = canvas.width * 0.18;
                    const sigHeight = (signatureImg.height / signatureImg.width) * sigWidth;
                    // Moved the signature slightly up
                    ctx.drawImage(signatureImg, sigXCenter - (sigWidth / 2), bottomY - sigHeight + (canvas.height * 0.02), sigWidth, sigHeight);
                }

                // Convert to Blob and add to zip
                const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.95));
                const filename = `${student.name.replace(/[^a-zA-Z0-9 ]/g, '').replace(/ /g, '_')}_Interview.jpg`;
                zip.file(filename, blob);
            }

            // Generate ZIP
            showStatus('Stuffing it in the ZIP... 📦', 'info');
            latestZipContent = await zip.generateAsync({ type: 'blob' });
            saveAs(latestZipContent, 'Interview_Certificates.zip');

            if (downloadSection) downloadSection.style.display = 'block';
            showStatus(`Massive W! Secured ${students.length} Interview certificates! 🎉`, 'success');
        } catch (error) {
            console.error(error);
            showStatus(error.message || 'An error occurred during generation.', 'error');
        } finally {
            setLoading(false);
        }
    });

    function parseStudents(data) {
        const lines = data.split('\n');
        const students = [];
        for (const line of lines) {
            if (!line.trim()) continue;
            const nameRaw = line.trim();
            const parts = nameRaw.split(',');
            const name = capitalizeName(parts[0].trim());
            if (name) {
                students.push({ name });
            }
        }
        return students;
    }

    function capitalizeName(name) {
        return name.split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    }

    function loadImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'Anonymous';
            img.onload = () => resolve(img);
            img.onerror = (e) => reject(new Error('Failed to load image: ' + src));
            img.src = src;
        });
    }

    function showStatus(message, type) {
        statusMessage.textContent = message;
        statusMessage.className = type;
    }

    function setLoading(isLoading) {
        generateBtn.disabled = isLoading;
        loadingSpinner.style.display = isLoading ? 'block' : 'none';
        generateBtn.querySelector('span').textContent = isLoading ? 'Cooking... 🔥' : 'Cook & Secure the Bag (ZIP) 🎒';
    }
});
