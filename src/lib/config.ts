export const config = {
  brandfetch: {
    clientId: 'UeWfS4VlX7', // Hardcoding for the extension as it's the client-side ID used in the frontend
  },
  clearbit: {
    autocompleteUrl: 'https://autocomplete.clearbit.com/v1/companies/suggest',
  },
  backendUrl: 'http://localhost:3000',
} as const;
