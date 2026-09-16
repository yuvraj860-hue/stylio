import env from '../config/env.js';

const apiClient = {
  async post(path, body, options = {}) {
    const url = `${env.ML_SERVICE_URL}${path}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: options.signal,
    });
    if (!response.ok) {
      throw new Error(`ML service responded with ${response.status}`);
    }
    return response.json();
  },

  async get(path, options = {}) {
    const url = `${env.ML_SERVICE_URL}${path}`;
    const response = await fetch(url, { signal: options.signal });
    if (!response.ok) {
      throw new Error(`ML service responded with ${response.status}`);
    }
    return response.json();
  },
};

export default apiClient;
