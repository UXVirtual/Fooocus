// From A1111

function closeModal() {
    gradioApp().getElementById("lightboxModal").style.display = "none";
}

function showModal(event) {
    const source = event.target || event.srcElement;
    const modalImage = gradioApp().getElementById("modalImage");
    const lb = gradioApp().getElementById("lightboxModal");
    modalImage.src = source.src;
    if (modalImage.style.display === 'none') {
        lb.style.setProperty('background-image', 'url(' + source.src + ')');
    }
    lb.style.display = "flex";
    lb.focus();

    event.stopPropagation();
}

function negmod(n, m) {
    return ((n % m) + m) % m;
}

function updateOnBackgroundChange() {
    const modalImage = gradioApp().getElementById("modalImage");
    if (modalImage && modalImage.offsetParent) {
        let currentButton = selected_gallery_button();

        if (currentButton?.children?.length > 0 && modalImage.src != currentButton.children[0].src) {
            modalImage.src = currentButton.children[0].src;
            if (modalImage.style.display === 'none') {
                const modal = gradioApp().getElementById("lightboxModal");
                modal.style.setProperty('background-image', `url(${modalImage.src})`);
            }
        }
    }
}

function all_gallery_buttons() {
    var allGalleryButtons = gradioApp().querySelectorAll('.image_gallery .thumbnails > .thumbnail-item.thumbnail-small');
    var visibleGalleryButtons = [];
    allGalleryButtons.forEach(function(elem) {
        if (elem.parentElement.offsetParent) {
            visibleGalleryButtons.push(elem);
        }
    });
    return visibleGalleryButtons;
}

function selected_gallery_button() {
    return all_gallery_buttons().find(elem => elem.classList.contains('selected')) ?? null;
}

function selected_gallery_index() {
    return all_gallery_buttons().findIndex(elem => elem.classList.contains('selected'));
}

function modalImageSwitch(offset) {
    var galleryButtons = all_gallery_buttons();

    if (galleryButtons.length > 1) {
        var currentButton = selected_gallery_button();

        var result = -1;
        galleryButtons.forEach(function(v, i) {
            if (v == currentButton) {
                result = i;
            }
        });

        if (result != -1) {
            var nextButton = galleryButtons[negmod((result + offset), galleryButtons.length)];
            nextButton.click();
            const modalImage = gradioApp().getElementById("modalImage");
            const modal = gradioApp().getElementById("lightboxModal");
            modalImage.src = nextButton.children[0].src;
            if (modalImage.style.display === 'none') {
                modal.style.setProperty('background-image', `url(${modalImage.src})`);
            }
            setTimeout(function() {
                modal.focus();
            }, 10);
        }
    }
}

function saveImage() {
    const currentButton = selected_gallery_button();
    const currentImage = currentButton?.querySelector('img') ?? gradioApp().getElementById('modalImage');

    if (!currentImage?.src) {
        return;
    }

    saveImageFromUrl(currentImage.src).catch((error) => {
        console.error('Failed to save image', error);
        window.open(currentImage.src, '_blank', 'noopener');
    });
}

function modalSaveImage(event) {
    saveImage();
    event.stopPropagation();
}

function getFilenameFromUrl(url) {
    try {
        const parsedUrl = new URL(url, window.location.href);
        const rawPathname = decodeURIComponent(parsedUrl.pathname || '');
        const filePathMatch = rawPathname.match(/file=(.+)$/);
        const pathname = filePathMatch ? filePathMatch[1] : rawPathname;
        const segments = pathname.split('/').filter(Boolean);
        const lastSegment = (segments[segments.length - 1] || pathname).split('\\').filter(Boolean).pop();

        if (lastSegment) {
            return lastSegment;
        }
    } catch (error) {
        console.warn('Could not derive filename from URL', error);
    }

    return 'image.png';
}

function getPickerType(filename, mimeType) {
    const extension = filename.includes('.') ? `.${filename.split('.').pop().toLowerCase()}` : '.png';
    const resolvedMimeType = mimeType || `image/${extension.slice(1)}`;

    return {
        description: 'Image',
        accept: {
            [resolvedMimeType]: [extension],
        },
    };
}

async function writeBlobWithPicker(blob, filename) {
    const fileHandle = await window.showSaveFilePicker({
        suggestedName: filename,
        types: [getPickerType(filename, blob.type)],
    });

    const writable = await fileHandle.createWritable();

    try {
        await writable.write(blob);
    } finally {
        await writable.close();
    }
}

async function saveImageFromUrl(url, filename) {
    const response = await fetch(url, {
        credentials: 'same-origin',
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status}`);
    }

    const blob = await response.blob();
    const resolvedFilename = filename && filename.includes('.') ? filename : getFilenameFromUrl(url);

    if (typeof window.showSaveFilePicker === 'function') {
        await writeBlobWithPicker(blob, resolvedFilename);
        return;
    }

    if (navigator.msSaveOrOpenBlob) {
        navigator.msSaveOrOpenBlob(blob, resolvedFilename);
        return;
    }

    const objectUrl = URL.createObjectURL(blob);

    try {
        const link = document.createElement('a');
        link.href = objectUrl;
        link.download = resolvedFilename;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        link.remove();
    } finally {
        URL.revokeObjectURL(objectUrl);
    }
}

async function interceptDownloadClick(event) {
    const downloadLink = event.target.closest('.image_gallery a[download], .image_gallery .icon-buttons a[download]');

    if (!downloadLink?.href || !downloadLink.href.startsWith('http')) {
        return;
    }

    event.preventDefault();
    event.stopPropagation();

    try {
        await saveImageFromUrl(downloadLink.href, downloadLink.getAttribute('download') || undefined);
    } catch (error) {
        console.error('Intercepted image download failed', error);
        window.open(downloadLink.href, '_blank', 'noopener');
    }
}

async function interceptImageContextMenu(event) {
    const image = event.target.closest('.image_gallery img, #modalImage');

    if (!image?.src) {
        return;
    }

    event.preventDefault();
    event.stopPropagation();

    try {
        await saveImageFromUrl(image.src);
    } catch (error) {
        console.error('Intercepted image context menu save failed', error);
        window.open(image.src, '_blank', 'noopener');
    }
}

function modalNextImage(event) {
    modalImageSwitch(1);
    event.stopPropagation();
}

function modalPrevImage(event) {
    modalImageSwitch(-1);
    event.stopPropagation();
}

function modalKeyHandler(event) {
    switch (event.key) {
    case "s":
        saveImage();
        break;
    case "ArrowLeft":
        modalPrevImage(event);
        break;
    case "ArrowRight":
        modalNextImage(event);
        break;
    case "Escape":
        closeModal();
        break;
    }
}

function setupImageForLightbox(e) {
    if (e.dataset.modded) {
        return;
    }

    e.dataset.modded = true;
    e.style.cursor = 'pointer';
    e.style.userSelect = 'none';

    var isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;

    // For Firefox, listening on click first switched to next image then shows the lightbox.
    // If you know how to fix this without switching to mousedown event, please.
    // For other browsers the event is click to make it possiblr to drag picture.
    var event = isFirefox ? 'mousedown' : 'click';

    e.addEventListener(event, function(evt) {
        if (evt.button == 1) {
            open(evt.target.src);
            evt.preventDefault();
            return;
        }
        if (evt.button != 0) return;

        modalZoomSet(gradioApp().getElementById('modalImage'), true);
        evt.preventDefault();
        showModal(evt);
    }, true);

    e.addEventListener('contextmenu', interceptImageContextMenu, true);

}

function modalZoomSet(modalImage, enable) {
    if (modalImage) modalImage.classList.toggle('modalImageFullscreen', !!enable);
}

function modalZoomToggle(event) {
    var modalImage = gradioApp().getElementById("modalImage");
    modalZoomSet(modalImage, !modalImage.classList.contains('modalImageFullscreen'));
    event.stopPropagation();
}

function modalTileImageToggle(event) {
    const modalImage = gradioApp().getElementById("modalImage");
    const modal = gradioApp().getElementById("lightboxModal");
    const isTiling = modalImage.style.display === 'none';
    if (isTiling) {
        modalImage.style.display = 'block';
        modal.style.setProperty('background-image', 'none');
    } else {
        modalImage.style.display = 'none';
        modal.style.setProperty('background-image', `url(${modalImage.src})`);
    }

    event.stopPropagation();
}

onAfterUiUpdate(function() {
    var fullImg_preview = gradioApp().querySelectorAll('.image_gallery > div > img');
    if (fullImg_preview != null) {
        fullImg_preview.forEach(setupImageForLightbox);
    }
    updateOnBackgroundChange();
});

document.addEventListener("DOMContentLoaded", function() {
    document.addEventListener('click', interceptDownloadClick, true);
    document.addEventListener('contextmenu', interceptImageContextMenu, true);

    //const modalFragment = document.createDocumentFragment();
    const modal = document.createElement('div');
    modal.onclick = closeModal;
    modal.id = "lightboxModal";
    modal.tabIndex = 0;
    modal.addEventListener('keydown', modalKeyHandler, true);

    const modalControls = document.createElement('div');
    modalControls.className = 'modalControls gradio-container';
    modal.append(modalControls);

    const modalZoom = document.createElement('span');
    modalZoom.className = 'modalZoom cursor';
    modalZoom.innerHTML = '&#10529;';
    modalZoom.addEventListener('click', modalZoomToggle, true);
    modalZoom.title = "Toggle zoomed view";
    modalControls.appendChild(modalZoom);

    // const modalTileImage = document.createElement('span');
    // modalTileImage.className = 'modalTileImage cursor';
    // modalTileImage.innerHTML = '&#8862;';
    // modalTileImage.addEventListener('click', modalTileImageToggle, true);
    // modalTileImage.title = "Preview tiling";
    // modalControls.appendChild(modalTileImage);
    //
    // const modalSave = document.createElement("span");
    // modalSave.className = "modalSave cursor";
    // modalSave.id = "modal_save";
    // modalSave.innerHTML = "&#x1F5AB;";
    // modalSave.addEventListener("click", modalSaveImage, true);
    // modalSave.title = "Save Image(s)";
    // modalControls.appendChild(modalSave);

    const modalClose = document.createElement('span');
    modalClose.className = 'modalClose cursor';
    modalClose.innerHTML = '&times;';
    modalClose.onclick = closeModal;
    modalClose.title = "Close image viewer";
    modalControls.appendChild(modalClose);

    const modalImage = document.createElement('img');
    modalImage.id = 'modalImage';
    modalImage.onclick = closeModal;
    modalImage.tabIndex = 0;
    modalImage.addEventListener('keydown', modalKeyHandler, true);
    modalImage.addEventListener('contextmenu', interceptImageContextMenu, true);
    modal.appendChild(modalImage);

    const modalPrev = document.createElement('a');
    modalPrev.className = 'modalPrev';
    modalPrev.innerHTML = '&#10094;';
    modalPrev.tabIndex = 0;
    modalPrev.addEventListener('click', modalPrevImage, true);
    modalPrev.addEventListener('keydown', modalKeyHandler, true);
    modal.appendChild(modalPrev);

    const modalNext = document.createElement('a');
    modalNext.className = 'modalNext';
    modalNext.innerHTML = '&#10095;';
    modalNext.tabIndex = 0;
    modalNext.addEventListener('click', modalNextImage, true);
    modalNext.addEventListener('keydown', modalKeyHandler, true);

    modal.appendChild(modalNext);

    try {
        gradioApp().appendChild(modal);
    } catch (e) {
        gradioApp().body.appendChild(modal);
    }

    document.body.appendChild(modal);

});
