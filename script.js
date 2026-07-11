document.addEventListener('DOMContentLoaded', () => {
    const generateBtn = document.getElementById('generate-btn');
    const statusMessage = document.getElementById('status-message');
    const loadingSpinner = document.getElementById('loading-spinner');
    const monthSelect = document.getElementById('cert-month');

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
            
            // Initialize Cropper
            if (cropper) {
                cropper.destroy();
            }
            // Small timeout to allow modal to display and image to load
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

    // Ensure fonts are loaded before drawing on canvas
    document.fonts.load('bold 50px "GoogleSans"').then(() => {
        console.log("Font loaded");
    });

    // Probe and populate available months dynamically
    probeAvailableMonths();

    async function probeAvailableMonths() {
        const months = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
        
        const promises = months.map(month => {
            return new Promise((resolve) => {
                const img = new Image();
                img.onload = () => resolve(month);
                img.onerror = () => resolve(null);
                img.src = `./Certificates/${month}/part.jpg`;
            });
        });

        const results = await Promise.all(promises);
        const validMonths = results.filter(m => m !== null);
        
        monthSelect.innerHTML = ''; // Clear loading text

        if (validMonths.length === 0) {
            monthSelect.innerHTML = '<option value="">Deadass no folders found 💀</option>';
            generateBtn.disabled = true;
        } else {
            validMonths.forEach(m => {
                const option = document.createElement('option');
                option.value = m;
                option.textContent = m.charAt(0).toUpperCase() + m.slice(1);
                monthSelect.appendChild(option);
            });
            generateBtn.disabled = false;
        }
    }

    generateBtn.addEventListener('click', async () => {
        const certMonth = document.getElementById('cert-month').value;
        const certDate = document.getElementById('cert-date').value.trim();
        const studentsData = document.getElementById('students-data').value.trim();

        if (!certDate || !studentsData) {
            showStatus('Bro, you forgot the date or the student list. Do better. 💀', 'error');
            return;
        }

        try {
            setLoading(true);
            showStatus('Let him cook... 🍳', 'info');

            const students = parseStudents(studentsData);
            if (students.length === 0) {
                showStatus("Ain't no valid students here. Check the formatting chief. 🧢", 'error');
                setLoading(false);
                return;
            }

            // Load signature image if provided
            let signatureImg = null;
            if (croppedSignatureBlob) {
                signatureImg = await loadImage(URL.createObjectURL(croppedSignatureBlob));
            } else if (signatureUpload.files[0]) {
                signatureImg = await loadImage(URL.createObjectURL(signatureUpload.files[0]));
            }

            // Pre-load only required certificate templates
            const requiredTypes = new Set(students.map(s => s.type));
            const templates = {};
            const displayMonth = certMonth.charAt(0).toUpperCase() + certMonth.slice(1);

            if (requiredTypes.has('winner')) {
                try {
                    templates.winner = await loadImage(`./Certificates/${certMonth}/win.jpg`);
                } catch (e) {
                    throw new Error(`Big yikes. No winner certificate found for ${displayMonth}. 📉`);
                }
            }

            if (requiredTypes.has('participant')) {
                try {
                    templates.participant = await loadImage(`./Certificates/${certMonth}/part.jpg`);
                } catch (e) {
                    throw new Error(`Big yikes. No participant certificate found for ${displayMonth}. 📉`);
                }
            }

            const zip = new JSZip();
            const canvas = document.getElementById('cert-canvas');
            const ctx = canvas.getContext('2d');

            for (const student of students) {
                const template = templates[student.type];
                if (!template) {
                    console.error(`Invalid type for ${student.name}`);
                    continue;
                }

                // Set canvas size to match template
                canvas.width = template.width;
                canvas.height = template.height;

                // Draw background
                ctx.drawImage(template, 0, 0);

                // Configure Text
                ctx.fillStyle = '#000000';
                ctx.textAlign = 'center';

                // --- Draw Name ---
                // Approximate position based on visual inspection
                ctx.font = 'bold 200px "GoogleSans", sans-serif';
                const nameY = canvas.height * 0.542; // Adjusted down to fit the line
                ctx.fillText(student.name, canvas.width / 2, nameY);

                // --- Draw Date ---
                ctx.font = 'bold 110px "GoogleSans", sans-serif';
                ctx.textAlign = 'center';
                const dateX = canvas.width * 0.182; // Left side
                const bottomY = canvas.height * 0.847; // Adjusted down to fit the line
                ctx.fillText(certDate, dateX, bottomY);

                // --- Draw Signature ---
                const sigXCenter = canvas.width * 0.817; // Right side
                if (signatureImg) {
                    // Draw image centered at the signature line
                    const sigWidth = 1100; // Increased size even more
                    const sigHeight = (signatureImg.height / signatureImg.width) * sigWidth;
                    // Moved the signature down by increasing the Y-offset (+ 50)
                    ctx.drawImage(signatureImg, sigXCenter - (sigWidth / 2), bottomY - sigHeight + 50, sigWidth, sigHeight);
                }

                // Convert to Blob and add to zip
                const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.95));
                const filename = `${student.name.replace(/[^a-zA-Z0-9 ]/g, '').replace(/ /g, '_')}_${student.type.charAt(0).toUpperCase() + student.type.slice(1)}.jpg`;
                zip.file(filename, blob);
            }

            // Generate ZIP
            showStatus('Stuffing it in the ZIP... 📦', 'info');
            const zipContent = await zip.generateAsync({ type: 'blob' });
            saveAs(zipContent, 'Certificates.zip');

            showStatus(`Massive W! Secured ${students.length} certificates! 🎉`, 'success');
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

            // Assume format: "Name, Type"
            const parts = line.split(',');
            if (parts.length >= 2) {
                const nameRaw = parts[0].trim();
                const name = capitalizeName(nameRaw);
                const typeRaw = parts[1].trim().toLowerCase();

                // Determine type: allow 'w', 'p', or empty
                let type = '';
                if (typeRaw === 'w' || typeRaw === 'winner') {
                    type = 'winner';
                } else if (typeRaw === 'p' || typeRaw === 'participant' || typeRaw === '') {
                    type = 'participant';
                } else {
                    throw new Error(`Bro what is "${parts[1].trim()}"? Use W or P for "${nameRaw}". Ain't that deep. 🤦‍♂️`);
                }

                if (name) {
                    students.push({ name, type });
                }
            } else if (parts.length === 1 && parts[0].trim()) {
                // If they just typed a name, default to participant
                students.push({ name: capitalizeName(parts[0].trim()), type: 'participant' });
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
