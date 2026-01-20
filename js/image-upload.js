/**
 * Image Upload Module
 * Handles image upload to Supabase Storage
 */

import { supabase } from './supabase-client.js';

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
 * Create image preview
 * @param {File} file - The image file
 * @param {HTMLImageElement} imgElement - The img element to display preview
 * @param {HTMLElement} containerElement - The container element
 */
export function createImagePreview(file, imgElement, containerElement) {
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
 * Clear image preview
 * @param {HTMLImageElement} imgElement - The img element
 * @param {HTMLElement} containerElement - The container element
 */
export function clearImagePreview(imgElement, containerElement) {
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
 * Initialize image upload for a form
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
      clearImagePreview(previewImg, previewContainer);
      return;
    }

    // Validate file
    const validation = validateImageFile(file);
    if (!validation.valid) {
      alert(validation.error);
      fileInput.value = '';
      clearImagePreview(previewImg, previewContainer);
      return;
    }

    // Show preview
    createImagePreview(file, previewImg, previewContainer);
  });
}
