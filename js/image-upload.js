/**
 * Image Upload Module
 * Handles image upload to Supabase Storage
 */

import { supabase } from './supabase-client.js';

/**
 * Upload multiple images to Supabase Storage
 * @param {File[]} files - The image files to upload
 * @param {string} bucket - The storage bucket name
 * @returns {Promise<{success: boolean, urls?: string[], error?: string}>}
 */
export async function uploadImages(files, bucket = 'guitar-images') {
  if (!files || files.length === 0) {
    return { success: true, urls: [] };
  }

  const urls = [];
  const errors = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const result = await uploadImage(file, bucket);
    if (result.success) {
      urls.push(result.url);
    } else {
      errors.push(`文件 ${i + 1}: ${result.error}`);
    }
  }

  if (errors.length > 0) {
    return { success: false, error: errors.join('; ') };
  }

  return { success: true, urls };
}

/**
 * Upload image to Supabase Storage
 * @param {File} file - The image file to upload
 * @param {string} bucket - The storage bucket name
 * @returns {Promise<{success: boolean, url?: string, error?: string}>}
 */
export async function uploadImage(file, bucket = 'guitar-images') {
  try {
    // Validate file
    const validation = validateImageFile(file);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `repairs/${fileName}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Upload error:', error);
      return { success: false, error: '图片上传失败，请重试' };
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return { success: true, url: publicUrl };
  } catch (error) {
    console.error('Upload error:', error);
    return { success: false, error: '图片上传失败，请重试' };
  }
}

/**
 * Validate image file
 * @param {File} file - The file to validate
 * @returns {{valid: boolean, error?: string}}
 */
export function validateImageFile(file) {
  // Check if file exists
  if (!file) {
    return { valid: false, error: '请选择图片或视频文件' };
  }

  // Check file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'video/mp4'];
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: '只支持 JPG、PNG、WEBP、MP4 格式的文件' };
  }

  // Check file size (10MB max)
  const maxSize = 10 * 1024 * 1024; // 10MB in bytes
  if (file.size > maxSize) {
    return { valid: false, error: '文件大小不能超过 10MB' };
  }

  return { valid: true };
}

/**
 * Validate multiple image files
 * @param {File[]} files - The files to validate
 * @returns {{valid: boolean, error?: string}}
 */
export function validateImageFiles(files) {
  if (!files || files.length === 0) {
    return { valid: true }; // Empty is valid (optional field)
  }

  if (files.length > 5) {
    return { valid: false, error: '最多只能上传5个文件' };
  }

  for (let i = 0; i < files.length; i++) {
    const validation = validateImageFile(files[i]);
    if (!validation.valid) {
      return { valid: false, error: `文件 ${i + 1}: ${validation.error}` };
    }
  }

  return { valid: true };
}

/**
 * Create image preview for a single file
 * @param {File} file - The image file
 * @param {number} index - The file index
 * @param {HTMLElement} containerElement - The container element
 * @returns {HTMLElement} - The preview element
 */
export function createImagePreview(file, index, containerElement) {
  if (!file || !containerElement) {
    return null;
  }

  const reader = new FileReader();

  // Create preview wrapper
  const previewWrapper = document.createElement('div');
  previewWrapper.className = 'image-preview-item';
  previewWrapper.style.cssText = 'position: relative; display: inline-block; margin: 10px; border: 1px solid #ddd; border-radius: 8px; padding: 5px;';

  // Create media element
  let mediaElement;
  if (file.type === 'video/mp4') {
    mediaElement = document.createElement('video');
    mediaElement.controls = true;
    mediaElement.style.cssText = 'max-width: 200px; max-height: 200px; display: block;';
  } else {
    mediaElement = document.createElement('img');
    mediaElement.alt = `预览 ${index + 1}`;
    mediaElement.style.cssText = 'max-width: 200px; max-height: 200px; display: block;';
  }

  // Create remove button
  const removeBtn = document.createElement('button');
  removeBtn.type = 'button';
  removeBtn.textContent = '×';
  removeBtn.className = 'image-preview-remove';
  removeBtn.style.cssText = 'position: absolute; top: 5px; right: 5px; background: #ef4444; color: white; border: none; border-radius: 50%; width: 24px; height: 24px; cursor: pointer; font-size: 16px; line-height: 1;';
  removeBtn.setAttribute('data-index', index);
  removeBtn.onclick = () => {
    previewWrapper.remove();
    updateFileList();
  };

  previewWrapper.appendChild(mediaElement);
  previewWrapper.appendChild(removeBtn);
  containerElement.appendChild(previewWrapper);

  reader.onload = (e) => {
    mediaElement.src = e.target.result;
  };

  reader.onerror = () => {
    console.error('Failed to read file');
    previewWrapper.remove();
  };

  reader.readAsDataURL(file);
  containerElement.style.display = 'block';

  return previewWrapper;
}

/**
 * Clear all image previews
 * @param {HTMLElement} containerElement - The container element
 */
export function clearImagePreviews(containerElement) {
  if (containerElement) {
    containerElement.innerHTML = '';
    containerElement.style.display = 'none';
  }
}

/**
 * Update file list after removing a preview
 */
function updateFileList() {
  const fileInput = document.getElementById('guitar-image');
  const container = document.getElementById('image-preview-container');
  if (!fileInput || !container) return;

  // Get DataTransfer object to modify files
  const dt = new DataTransfer();
  const previews = container.querySelectorAll('.image-preview-item');

  // Reconstruct file list based on remaining previews
  // Note: We can't directly modify FileList, so this is a workaround
  // The actual file removal will be handled during form submission
}

/**
 * Initialize multi-file image upload for a form
 * @param {string} inputId - The file input element ID
 * @param {string} previewContainerId - The preview container element ID
 */
export function initMultiImageUpload(inputId, previewContainerId) {
  const fileInput = document.getElementById(inputId);
  const previewContainer = document.getElementById(previewContainerId);

  if (!fileInput || !previewContainer) {
    console.error('Image upload elements not found');
    return;
  }

  fileInput.addEventListener('change', (e) => {
    const files = Array.from(e.target.files);

    if (files.length === 0) {
      clearImagePreviews(previewContainer);
      return;
    }

    // Validate files
    const validation = validateImageFiles(files);
    if (!validation.valid) {
      alert(validation.error);
      fileInput.value = '';
      clearImagePreviews(previewContainer);
      return;
    }

    // Clear previous previews
    clearImagePreviews(previewContainer);

    // Create previews for all files
    files.forEach((file, index) => {
      createImagePreview(file, index, previewContainer);
    });
  });
}

/**
 * Create image preview (legacy, for single file)
 * @param {File} file - The image file
 * @param {HTMLImageElement} imgElement - The img element to display preview
 * @param {HTMLElement} containerElement - The container element
 */
export function createImagePreviewLegacy(file, imgElement, containerElement) {
  if (!file || !imgElement || !containerElement) {
    return;
  }

  const reader = new FileReader();

  reader.onload = (e) => {
    // Check if it's a video
    if (file.type === 'video/mp4') {
      // Hide image, show video
      imgElement.style.display = 'none';
      const videoElement = document.getElementById('preview-video');
      if (videoElement) {
        videoElement.src = e.target.result;
        videoElement.style.display = 'block';
      }
    } else {
      // Hide video, show image
      const videoElement = document.getElementById('preview-video');
      if (videoElement) {
        videoElement.style.display = 'none';
        videoElement.src = '';
      }
      imgElement.src = e.target.result;
      imgElement.style.display = 'block';
    }
    containerElement.style.display = 'block';
  };

  reader.onerror = () => {
    console.error('Failed to read file');
    containerElement.style.display = 'none';
  };

  reader.readAsDataURL(file);
}

/**
 * Clear image preview (legacy, for single file)
 * @param {HTMLImageElement} imgElement - The img element
 * @param {HTMLElement} containerElement - The container element
 */
export function clearImagePreviewLegacy(imgElement, containerElement) {
  if (imgElement) {
    imgElement.src = '';
    imgElement.style.display = 'none';
  }
  const videoElement = document.getElementById('preview-video');
  if (videoElement) {
    videoElement.src = '';
    videoElement.style.display = 'none';
  }
  if (containerElement) {
    containerElement.style.display = 'none';
  }
}

/**
 * Initialize image upload for a form (legacy, for single file)
 * @param {string} inputId - The file input element ID
 * @param {string} previewImgId - The preview img element ID
 * @param {string} previewContainerId - The preview container element ID
 */
export function initImageUpload(inputId, previewImgId, previewContainerId) {
  const fileInput = document.getElementById(inputId);
  const previewImg = document.getElementById(previewImgId);
  const previewContainer = document.getElementById(previewContainerId);

  if (!fileInput || !previewImg || !previewContainer) {
    console.error('Image upload elements not found');
    return;
  }

  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];

    if (!file) {
      clearImagePreviewLegacy(previewImg, previewContainer);
      return;
    }

    // Validate file
    const validation = validateImageFile(file);
    if (!validation.valid) {
      alert(validation.error);
      fileInput.value = '';
      clearImagePreviewLegacy(previewImg, previewContainer);
      return;
    }

    // Show preview
    createImagePreviewLegacy(file, previewImg, previewContainer);
  });
}
