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
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw error;
    }
    console.error('Error fetching company suggestions:', error);
    return [];
  }
};

export interface Board {
  id: string;
  name: string;
  isArchived?: boolean;
}

export interface BoardColumn {
  id: string;
  name: string;
}

export const fetchBoards = async (token: string): Promise<Board[]> => {
  const url = `${config.backendUrl}/boards-all`;
  console.log(`App: Fetching boards from ${url}`);
  
  try {
    const response = await fetch(url, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'No error body');
      console.error(`App: Boards fetch failed with status ${response.status}:`, errorText);
      throw new Error(`Server returned ${response.status}`);
    }
    
    const data: Board[] = await response.json();
    return data.filter((b) => !b.isArchived);
  } catch (error) {
    console.error('App: Error in fetchBoards:', error);
    throw error; // Let the UI handle the error
  }
};

export const fetchBoardColumns = async (token: string, boardId: string): Promise<BoardColumn[]> => {
  const url = `${config.backendUrl}/boards/${boardId}`;
  try {
    const response = await fetch(url, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) throw new Error(`Status ${response.status}`);
    
    const data = await response.json();
    return data.boardColumns || [];
  } catch (error) {
    console.error(`App: Error fetching columns for board ${boardId}:`, error);
    throw error;
  }
};
