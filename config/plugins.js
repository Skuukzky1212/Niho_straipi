module.exports = ({ env }) => ({
  upload: {
    config: {
      provider: 'strapi-provider-upload-supabase',
      providerOptions: {
        apiUrl: env('SUPABASE_API_URL'), // Ensure this is the correct Supabase URL
        apiKey: env('SUPABASE_API_KEY'),
        bucket: env('SUPABASE_BUCKET'),
        directory: env('SUPABASE_DIRECTORY'),
        options: {
          public: true,
        },
      },
      actionOptions: {
        upload: {}, // Keep only the upload action since `uploadStream` is not implemented
        delete: {}, // Keep the delete action
      },
    },
  },
});
