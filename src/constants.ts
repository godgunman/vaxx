require('dotenv').config();

export const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY ?? 'GOOGLE_API_KEY';
export const AIRTABLE_API_KEY =
  process.env.AIRTABLE_API_KEY ?? 'AIRTABLE_API_KEY';
