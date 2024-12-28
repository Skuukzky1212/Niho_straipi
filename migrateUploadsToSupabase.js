require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const strapi = require('@strapi/strapi');

// Supabase config
const SUPABASE_URL = process.env.SUPABASE_API_URL;
const SUPABASE_API_KEY = process.env.SUPABASE_API_KEY;
const BUCKET_NAME = process.env.SUPABASE_BUCKET;

if (!SUPABASE_URL || !SUPABASE_API_KEY) {
  throw new Error('Supabase URL or API Key is missing!');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_API_KEY);

async function migrateUploads() {
  const app = await strapi().load(); // Khởi tạo Strapi

  // Lấy tất cả tệp từ plugin upload của Strapi
  const files = await app.db.query('plugin::upload.file').findMany();

  for (const file of files) {
    const localFilePath = path.join(__dirname, 'public', 'uploads', file.hash + file.ext);

    if (fs.existsSync(localFilePath)) {
      const fileBuffer = fs.readFileSync(localFilePath);

      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(`files/${file.hash}${file.ext}`, fileBuffer, {
          contentType: file.mime,
        });

      if (error) {
        console.error(`Error uploading file ${file.name}:`, error.message);
        continue;
      }

      console.log(`Uploaded file: ${file.name}`);

      // Cập nhật URL mới vào Strapi
      const publicURL = supabase.storage.from(BUCKET_NAME).getPublicUrl(`files/${file.hash}${file.ext}`).data.publicUrl;

      await app.db.query('plugin::upload.file').update({
        where: { id: file.id },
        data: { url: publicURL },
      });

      console.log(`Updated file URL in Strapi: ${file.name}`);
    } else {
      console.warn(`File not found: ${localFilePath}`);
    }
  }

  console.log('Migration completed!');
}

migrateUploads().catch((error) => {
  console.error('Migration failed:', error);
});
