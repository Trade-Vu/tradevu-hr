/**
 * fileFormatUtils.js
 * Helpers for file size formatting, file type recognition, icons, and validation.
 */

export function formatBytes(bytes, decimals = 1) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function getFileExtension(filename = '') {
  if (!filename) return '';
  const parts = filename.split('.');
  return parts.length > 1 ? parts.pop().toLowerCase() : '';
}

export function getFileTypeBadge(fileType = '') {
  const ext = String(fileType || '').toLowerCase().replace(/^\./, '');
  switch (ext) {
    case 'pdf':
      return { label: 'PDF', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' };
    case 'doc':
    case 'docx':
      return { label: 'Word', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' };
    case 'xls':
    case 'xlsx':
    case 'csv':
      return { label: 'Excel / CSV', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' };
    case 'ppt':
    case 'pptx':
      return { label: 'Slides', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' };
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'webp':
      return { label: 'Image', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' };
    case 'zip':
    case 'rar':
    case '7z':
      return { label: 'Archive', bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-300' };
    default:
      return { label: ext ? ext.toUpperCase() : 'Document', bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' };
  }
}

export const ALLOWED_COMPANY_ASSET_EXTENSIONS = [
  'pdf',
  'doc',
  'docx',
  'xls',
  'xlsx',
  'csv',
  'ppt',
  'pptx',
  'png',
  'jpg',
  'jpeg',
  'webp',
  'txt',
  'zip',
];

export const MAX_ASSET_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB

export function validateAssetFile(file, maxBytes = MAX_ASSET_SIZE_BYTES) {
  if (!file) {
    return { valid: false, error: 'No file selected' };
  }
  if (file.size > maxBytes) {
    return {
      valid: false,
      error: `File is too large (${formatBytes(file.size)}). Maximum allowed size is ${formatBytes(maxBytes)}.`,
    };
  }
  const ext = getFileExtension(file.name);
  if (!ALLOWED_COMPANY_ASSET_EXTENSIONS.includes(ext)) {
    return {
      valid: false,
      error: `Unsupported file format (.${ext}). Allowed formats: ${ALLOWED_COMPANY_ASSET_EXTENSIONS.join(', ')}.`,
    };
  }
  return { valid: true, error: null };
}
