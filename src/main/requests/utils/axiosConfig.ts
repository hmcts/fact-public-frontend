import axios from 'axios';

//TODO: OAuth setup for axios requests in here

export const dataApiUrl = process.env.DATA_API_URL || 'http://localhost:8989';

export const dataApi = axios.create({
  baseURL: dataApiUrl,
  timeout: 20000,
});
