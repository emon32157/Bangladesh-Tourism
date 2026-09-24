/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ImgBBUploadResponse {
  data: {
    id: string;
    title: string;
    url_viewer: string;
    url: string;
    display_url: string;
    width: number;
    height: number;
    size: number;
    time: number;
    expiration: number;
    image: {
      filename: string;
      name: string;
      mime: string;
      extension: string;
      url: string;
    };
    thumb: {
      filename: string;
      name: string;
      mime: string;
      extension: string;
      url: string;
    };
    delete_url: string;
  };
  success: boolean;
  status: number;
}

export const IMGBB_API_KEY =
  import.meta.env.VITE_IMGBB_API_KEY || '99815c3ffa136abacd724ec8487a4de8';

/**
 * Uploads an image file or base64 data to ImgBB
 * @param image File, Blob, or base64 string
 * @param title Optional title for the uploaded image
 * @returns Upload result with direct display URL
 */
export async function uploadImageToImgBB(
  image: File | Blob | string,
  title?: string
): Promise<{ success: boolean; url: string; displayUrl: string; deleteUrl?: string; error?: string }> {
  try {
    const formData = new FormData();
    formData.append('key', IMGBB_API_KEY);

    if (typeof image === 'string') {
      // Remove data:image/...;base64, prefix if present
      const base64Data = image.includes('base64,') ? image.split('base64,')[1] : image;
      formData.append('image', base64Data);
    } else {
      formData.append('image', image);
    }

    if (title) {
      formData.append('name', title);
    }

    const response = await fetch('https://api.imgbb.com/1/upload', {
      method: 'POST',
      body: formData,
    });

    const data: ImgBBUploadResponse = await response.json();

    if (response.ok && data.success) {
      return {
        success: true,
        url: data.data.url,
        displayUrl: data.data.display_url || data.data.url,
        deleteUrl: data.data.delete_url,
      };
    } else {
      const errorMsg = (data as unknown as { error?: { message: string } })?.error?.message || 'Failed to upload image to ImgBB';
      return {
        success: false,
        url: '',
        displayUrl: '',
        error: errorMsg,
      };
    }
  } catch (err: unknown) {
    console.error('ImgBB upload error:', err);
    return {
      success: false,
      url: '',
      displayUrl: '',
      error: err instanceof Error ? err.message : 'Network error uploading to ImgBB',
    };
  }
}
