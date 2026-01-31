export const config = {
  brandfetch: {
    clientId: 'UeWfS4VlX7', // Hardcoding for the extension as it's the client-side ID used in the frontend
  },
  clearbit: {
    autocompleteUrl: 'https://autocomplete.clearbit.com/v1/companies/suggest',
  },
  backendUrl: import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000',
  frontendUrl: import.meta.env.VITE_FRONTEND_URL || 'http://localhost:3001',
} as const;
