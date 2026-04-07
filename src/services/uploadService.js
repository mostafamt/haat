import { config } from '../config/env';

export async function uploadImage(file, folder = 'haat/misc') {
  const form = new FormData();
  form.append('file', file);
  form.append('upload_preset', config.cloudinary.preset);
  form.append('folder', folder);
  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${config.cloudinary.cloud}/image/upload`,
    { method: 'POST', body: form }
  );
  if (!res.ok) throw new Error('Upload failed');
  return (await res.json()).secure_url;
}
