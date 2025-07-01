import cloudinary from '@/lib/cloudinary';
import formidable from 'formidable';
import fs from 'fs';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  const form = new formidable.IncomingForm();
  form.parse(req, async (err, fields, files) => {
    if (err) {
      res.status(500).json({ error: 'File upload error' });
      return;
    }
    const file = files.file;
    if (!file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }
    const filePath = Array.isArray(file) ? file[0].filepath : file.filepath;
    try {
      const result = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload(
          filePath,
          { resource_type: 'auto' },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
      });
      res.status(200).json({ url: result.secure_url, type: result.resource_type });
    } catch (error) {
      res.status(500).json({ error: error.message });
    } finally {
      fs.unlink(filePath, () => {});
    }
  });
} 