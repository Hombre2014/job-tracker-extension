import { config } from './config';

export interface CompanySuggestion {
  name: string;
  domain: string;
  logo: string | null;
}

export const fetchCompanySuggestions = async (
  query: string,
  signal?: AbortSignal,
): Promise<CompanySuggestion[]> => {
  if (!query || query.length < 2) {
    return [];
  }

  try {
    const response = await fetch(
      `${config.clearbit.autocompleteUrl}?query=${encodeURIComponent(query)}`,
      { signal },
    );

    if (!response.ok) {
      throw new Error('Failed to fetch company suggestions');
    }

    const data: CompanySuggestion[] = await response.json();
    return data;
  } catch (error: any) {
    if (error?.name === 'AbortError') {
      throw error;
    }
    console.error('Error fetching company suggestions:', error);
    return [];
  }
};

export const fetchBoards = async (token: string): Promise<any[]> => {
  try {
    const response = await fetch(`${config.backendUrl}/boards-all`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Failed to fetch boards');
    const data = await response.json();
    return data.filter((b: any) => !b.isArchived);
  } catch (error) {
    console.error('Error fetching boards:', error);
    return [];
  }
};

export const fetchBoardColumns = async (token: string, boardId: string): Promise<any[]> => {
  try {
    const response = await fetch(`${config.backendUrl}/boards/${boardId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Failed to fetch columns');
    const data = await response.json();
    return data.boardColumns || [];
  } catch (error) {
    console.error('Error fetching columns:', error);
    return [];
  }
};
