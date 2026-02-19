/**
 * CloudFlare ImgBed (Telegraph-Image) 上传工具类
 */

const IMGBED_BASE_URL = 'https://cfbed.sanyue.de';
const UPLOAD_ENDPOINT = `${IMGBED_BASE_URL}/upload`;

/**
 * 将文件上传到 CloudFlare ImgBed
 * @param file 文件对象 (Blob, File, 或 Buffer)
 * @param folder 上传目录 (可选)
 * @param fileName 文件名 (可选)
 * @returns 上传后的完整 URL
 */
export async function uploadToImgBed(
  file: Blob | File | Buffer,
  folder?: string,
  fileName?: string
): Promise<string> {
  try {
    // 使用本地代理以规避 CORS 问题
    const url = new URL('/api/upload-proxy', typeof window !== 'undefined' ? window.location.origin : '');
    
    if (fileName) {
      url.searchParams.append('uploadNameType', 'index');
      const fullPath = folder ? (folder.endsWith('/') ? `${folder}${fileName}` : `${folder}/${fileName}`) : fileName;
      url.searchParams.append('uploadFolder', fullPath);
    } else if (folder) {
      url.searchParams.append('uploadFolder', folder);
    }

    const formData = new FormData();
    
    let fileBlob: Blob;
    if (file instanceof Blob) {
      fileBlob = file;
    } else if (Buffer.isBuffer(file)) {
      fileBlob = new Blob([new Uint8Array(file)]);
    } else {
      fileBlob = file;
    }

    formData.append('file', fileBlob);

    // 在客户端，我们不直接发送 token，由代理服务器在服务端注入
    const response = await fetch(url.toString(), {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`上传失败: ${response.status} ${errorData.error || response.statusText}`);
    }

    const result = await response.json();

    // 代理返回的结果格式与直接调用一致
    if (Array.isArray(result) && result.length > 0 && result[0].src) {
      return `${IMGBED_BASE_URL}${result[0].src}`;
    } else {
      console.error('ImgBed 响应格式异常:', result);
      throw new Error('解析上传结果失败');
    }
  } catch (error) {
    console.error('ImgBed 上传出错:', error);
    throw error;
  }
}
