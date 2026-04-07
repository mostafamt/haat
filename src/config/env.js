export const config = {
  whatsappNumber:  import.meta.env.VITE_WHATSAPP_NUMBER  || '201000000000',
  vodafoneCashNum: import.meta.env.VITE_VODAFONE_CASH_NUM || '01XXXXXXXXX',
  instaPayIPA:     import.meta.env.VITE_INSTAPAY_IPA     || 'youripa@bank',
  cloudinary: {
    cloud:  import.meta.env.VITE_CLOUDINARY_CLOUD_NAME,
    preset: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET,
  },
};
