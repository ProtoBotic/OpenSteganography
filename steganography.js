document.addEventListener('DOMContentLoaded', function () {
    const carrierImageInput = document.getElementById('carrierImage');
    const fileToEncodeInput = document.getElementById('fileToEncode');
    const imageToDecodeInput = document.getElementById('imageToDecode');

    const carrierImageDropZone = document.getElementById('carrierImageDropZone');
    const fileToEncodeDropZone = document.getElementById('fileToEncodeDropZone');
    const imageToDecodeDropZone = document.getElementById('imageToDecodeDropZone');

    setUpDropZone(carrierImageDropZone, carrierImageInput);
    setUpDropZone(fileToEncodeDropZone, fileToEncodeInput);
    setUpDropZone(imageToDecodeDropZone, imageToDecodeInput);

    carrierImageInput.addEventListener('change', handleCarrierImage, false);
    fileToEncodeInput.addEventListener('change', handleFileToEncode, false);
    document.getElementById('encodeButton').addEventListener('click', encodeData, false);
    imageToDecodeInput.addEventListener('change', handleImageToDecode, false);
    document.getElementById('decodeButton').addEventListener('click', decodeData, false);

    let carrierImageCanvas = document.createElement('canvas');
    let carrierImageCtx = carrierImageCanvas.getContext('2d');
    let fileToEncode;
    let imageToDecodeCanvas = document.createElement('canvas');
    let imageToDecodeCtx = imageToDecodeCanvas.getContext('2d');

    function setUpDropZone(dropZone, inputElement) {
        dropZone.addEventListener('dragover', event => handleDropZoneEvent(dropZone, inputElement, event));
        dropZone.addEventListener('dragleave', event => handleDropZoneEvent(dropZone, inputElement, event));
        dropZone.addEventListener('drop', event => handleDropZoneEvent(dropZone, inputElement, event));
        dropZone.addEventListener('click', () => inputElement.click());
        inputElement.addEventListener('change', () => {
            dropZone.querySelector('label').textContent = inputElement.files[0].name;
        });
    }

    function handleDropZoneEvent(dropZone, inputElement, event) {
        event.preventDefault();
        if (event.type === 'dragover') {
            dropZone.classList.add('dragover');
        } else {
            dropZone.classList.remove('dragover');
            if (event.type === 'drop') {
                const files = event.dataTransfer.files;
                if (files.length) {
                    inputElement.files = files;
                    inputElement.dispatchEvent(new Event('change'));
                }
            }
        }
    }

    function handleCarrierImage(event) {
        const file = event.target.files[0];
        if (!file) return;

        const img = new Image();
        img.onload = function () {
            carrierImageCanvas.width = img.width;
            carrierImageCanvas.height = img.height;
            carrierImageCtx.drawImage(img, 0, 0);
            document.getElementById('carrierPreview').src = carrierImageCanvas.toDataURL();
            document.getElementById('carrierPreview').style.display = 'block';

            const availablePixels = img.width * img.height * 3;
            const maxSize = Math.floor((availablePixels / 8) - (20));
            document.getElementById('maxSize').innerText = `Max file size to encode: ${maxSize} bytes`;
        };
        img.src = URL.createObjectURL(file);
    }

    function handleFileToEncode(event) {
        fileToEncode = event.target.files[0];
        if (!fileToEncode) return;

        const previewImage = document.getElementById('filePreviewImage');
        const previewVideo = document.getElementById('filePreviewVideo');
        const previewText = document.getElementById('filePreviewText');

        previewImage.style.display = 'none';
        previewVideo.style.display = 'none';
        previewText.style.display = 'none';

        document.getElementById('fileToEncodeInfo').innerText = `File to encode: ${fileToEncode.name} (${fileToEncode.size} bytes)`;

        const fileReader = new FileReader();
        fileReader.onload = function (e) {
            if (fileToEncode.type.startsWith('image/')) {
                previewImage.src = e.target.result;
                previewImage.style.display = 'block';
            } else if (fileToEncode.type === 'text/plain') {
                previewText.textContent = e.target.result;
                previewText.style.display = 'block';
            } else if (fileToEncode.type.startsWith('video/')) {
                previewVideo.src = e.target.result;
                previewVideo.style.display = 'block';
            } else {
                alert('Unsupported file type for preview.');
            }
        };

        if (fileToEncode.type.startsWith('image/') || fileToEncode.type.startsWith('video/')) {
            fileReader.readAsDataURL(fileToEncode);
        } else if (fileToEncode.type === 'text/plain') {
            fileReader.readAsText(fileToEncode);
        }
    }

    // XOR encryption and decryption functions (as previously defined)
    function xorEncrypt(data, key) {
        const result = new Uint8Array(data.length);
        for (let i = 0; i < data.length; i++) {
            result[i] = data[i] ^ key.charCodeAt(i % key.length);
        }
        return result;
    }

    function xorDecrypt(data, key) {
        return xorEncrypt(data, key); // XOR encryption is symmetric
    }

    // Vigenere encryption and decryption functions (as previously defined)
    function vigenereEncrypt(data, key) {
        const result = new Uint8Array(data.length);
        for (let i = 0; i < data.length; i++) {
            result[i] = (data[i] + key.charCodeAt(i % key.length)) % 256;
        }
        return result;
    }

    function vigenereDecrypt(data, key) {
        const result = new Uint8Array(data.length);
        for (let i = 0; i < data.length; i++) {
            result[i] = (data[i] - key.charCodeAt(i % key.length) + 256) % 256;
        }
        return result;
    }

    // add more encryption methods here

    function encodeData() {
        const encryptionType = document.getElementById('encryptionType').value;
        const encryptionPassword = document.getElementById('encryptionPassword').value;

        if (!carrierImageCanvas || !fileToEncode) {
            alert('Please select both carrier image and file to encode.');
            return;
        }

        const reader = new FileReader();
        reader.onload = function (e) {
            let fileData = new Uint8Array(e.target.result);

            if (encryptionType !== 'none' && encryptionPassword) {
                switch (encryptionType) {
                    case 'xor':
                        fileData = xorEncrypt(fileData, encryptionPassword);
                        break;
                    case 'vigenere':
                        fileData = vigenereEncrypt(fileData, encryptionPassword);
                        break;
                    default:
                        return alert('Unsupported encryption type.');
                }
            }

            const header = new TextEncoder().encode(`HEADER:${fileToEncode.name}:${fileToEncode.type}:`);
            const footer = new TextEncoder().encode(":FOOTER");
            const fullData = new Uint8Array(header.length + fileData.length + footer.length);
            fullData.set(header);
            fullData.set(fileData, header.length);
            fullData.set(footer, header.length + fileData.length);

            const imageData = carrierImageCtx.getImageData(0, 0, carrierImageCanvas.width, carrierImageCanvas.height);
            const pixels = imageData.data;

            if (fullData.length > (pixels.length / 8)) {
                alert('File too large to encode in selected image.');
                return;
            }

            for (let i = 0; i < fullData.length; i++) {
                for (let bit = 0; bit < 8; bit++) {
                    pixels[(i * 8 + bit) * 4] = (pixels[(i * 8 + bit) * 4] & 0xFE) | ((fullData[i] >> (7 - bit)) & 1);
                }
            }

            carrierImageCtx.putImageData(imageData, 0, 0);
            const encodedImageUrl = carrierImageCanvas.toDataURL();
            const downloadLink = document.getElementById('encodedImageDownload');
            downloadLink.href = encodedImageUrl;
            downloadLink.download = 'encoded_image.png';
            downloadLink.style.display = 'block';
        };
        reader.readAsArrayBuffer(fileToEncode);
    }

    function handleImageToDecode(event) {
        const file = event.target.files[0];
        if (!file) return;

        const img = new Image();
        img.onload = function () {
            imageToDecodeCanvas.width = img.width;
            imageToDecodeCanvas.height = img.height;
            imageToDecodeCtx.drawImage(img, 0, 0);

            document.getElementById('decodePreview').src = imageToDecodeCanvas.toDataURL();
            document.getElementById('decodePreview').style.display = 'block';
        };
        img.src = URL.createObjectURL(file);
    }

    function decodeData() {
        const decryptionPassword = document.getElementById('decryptionPassword').value;

        if (!imageToDecodeCanvas) {
            alert('Please select an image to decode.');
            return;
        }

        const imageData = imageToDecodeCtx.getImageData(0, 0, imageToDecodeCanvas.width, imageToDecodeCanvas.height);
        const pixels = imageData.data;

        let binaryData = [];
        for (let i = 0; i < pixels.length; i += 4) {
            binaryData.push(pixels[i] & 1);
        }

        const byteData = [];
        for (let i = 0; i < binaryData.length; i += 8) {
            let byte = 0;
            for (let bit = 0; bit < 8; bit++) {
                byte = (byte << 1) | binaryData[i + bit];
            }
            byteData.push(byte);
        }

        const fullData = new Uint8Array(byteData);
        const header = new TextEncoder().encode("HEADER:");
        const footer = new TextEncoder().encode(":FOOTER");
        const headerIndex = fullData.indexOf(header[0]);

        let fileDataStart = -1;
        let fileDataEnd = -1;
        let fileInfo = "";

        if (headerIndex !== -1) {
            let isHeader = true;
            for (let i = 0; i < header.length; i++) {
                if (fullData[headerIndex + i] !== header[i]) {
                    isHeader = false;
                    break;
                }
            }
            if (isHeader) {
                let headerData = new TextDecoder().decode(fullData.slice(headerIndex + header.length, fullData.length));
                let headerParts = headerData.split(":");
                if (headerParts.length >= 3) {
                    fileInfo = {
                        name: headerParts[0],
                        type: headerParts[1]
                    };
                    fileDataStart = headerIndex + header.length + fileInfo.name.length + fileInfo.type.length + 2;
                }
            }
        }

        if (fileDataStart !== -1) {
            for (let i = fileDataStart; i < fullData.length - footer.length; i++) {
                let isFooter = true;
                for (let j = 0; j < footer.length; j++) {
                    if (fullData[i + j] !== footer[j]) {
                        isFooter = false;
                        break;
                    }
                }
                if (isFooter) {
                    fileDataEnd = i;
                    break;
                }
            }
        }

        if (fileDataStart !== -1 && fileDataEnd !== -1) {
            let fileData = fullData.slice(fileDataStart, fileDataEnd);

            if (decryptionPassword) {
                switch (document.getElementById('decryptionType').value) {
                    case 'xor':
                        fileData = xorDecrypt(fileData, decryptionPassword);
                        break;
                    case 'vigenere':
                        fileData = vigenereDecrypt(fileData, decryptionPassword);
                        break;
                }
            }

            const blob = new Blob([fileData], { type: fileInfo.type });
            const url = URL.createObjectURL(blob);

            const previewImage = document.getElementById('decodedPreviewImage');
            const previewVideo = document.getElementById('decodedPreviewVideo');
            const previewText = document.getElementById('decodedPreviewText');

            previewImage.style.display = 'none';
            previewVideo.style.display = 'none';
            previewText.style.display = 'none';

            if (fileInfo.type.startsWith('image/')) {
                previewImage.src = url;
                previewImage.style.display = 'block';
            } else if (fileInfo.type === 'text/plain') {
                const reader = new FileReader();
                reader.onload = function (e) {
                    previewText.textContent = e.target.result;
                    previewText.style.display = 'block';
                };
                reader.readAsText(blob);
            } else if (fileInfo.type.startsWith('video/')) {
                previewVideo.src = url;
                previewVideo.style.display = 'block';
            } else {
                alert('Unsupported file type');
            }

            const downloadLink = document.getElementById('decodedFileDownload');
            downloadLink.href = url;
            downloadLink.download = fileInfo.name;
            downloadLink.style.display = 'block';
        } else {
            alert('No encoded data found.');
        }
    }
});
