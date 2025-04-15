import { toast } from "@/hooks/use-toast";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export interface DocumentContentResponse {
  document_id: string;
  title: string;
  content: string;
  source_type?: string;
  metadata?: Record<string, any>;
}

export interface MemoryQueryResult {
    results: Array<{
        memory_id: string;
        text: string;
        name: string;
        section_title?: string;
        timestamp?: string;
        metadata?: Record<string, any>;
        similarity_score?: number; // Optional score if backend adds it
    }>,
    gemini_response?: string;
    use_gemini: boolean;
    retrieved_count: number;
    threshold_used: number;
}

export interface FileQueryResult {
    results: Array<{
        memory_id: string;
        file_name: string;
        content: string;
        file_type: string;
        line_count: number;
        size_bytes: number;
        timestamp?: string;
        relevance_score?: number;
    }>
}

export async function queryFiles(_userId: string, params: {
    query_text: string;
    file_types?: string[];
    k?: number; // Keep k
}): Promise<FileQueryResult> {
     try {
        const queryParams = new URLSearchParams();
        queryParams.append("query_text", params.query_text);
        if (params.k) {
            queryParams.append("k", params.k.toString());
        }
        if (params.file_types && params.file_types.length > 0) {
            queryParams.append("file_types", params.file_types.join(','));
        }

        const response = await myFetch(`${API_BASE_URL}/files/query?${queryParams.toString()}`, {
            credentials: "include",
            method: "GET"
        });

        return handleApiResponse<FileQueryResult>(response);
    } catch (error) {
        console.error("Error querying files:", error);
        throw error;
    }
}

export async function getDocumentContent(documentId: string): Promise<DocumentContentResponse> {
  try {
    const response = await myFetch(`${API_BASE_URL}/documents/${documentId}/content`, {
      credentials: "include",
    });
    return handleApiResponse<DocumentContentResponse>(response);
  } catch (error) {
    console.error(`Error fetching content for document ${documentId}:`, error);
    throw error; // Re-throw for the caller to handle
  }
}

// API Error handling
class ApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = "ApiError";
  }
}

// Handle API responses and errors
async function handleApiResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorMessage = "An error occurred";
    try {
      const errorData = await response.json();
      errorMessage = errorData.detail || errorData.message || errorMessage;
    } catch (e) {
      // If we can't parse the JSON, just use the status text
      errorMessage = response.statusText || errorMessage;
    }
    throw new ApiError(errorMessage, response.status);
  }
  return response.json() as Promise<T>;
}

// User Authentication
export async function checkSession() {
  try {
    const response = await myFetch(`${API_BASE_URL}/auth/session`, {
      credentials: "include",
    });
    return handleApiResponse<{ authenticated: boolean; user?: any }>(response);
  } catch (error) {
    console.error("Session check error:", error);
    return { authenticated: false };
  }
}

export async function loginDev() {
  try {
    const response = await myFetch(`${API_BASE_URL}/auth/dev-login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });
    return handleApiResponse<{ user_id: string, email: string, name: string }>(response);
  } catch (error) {
    console.error("Development login error:", error);
    toast({
      title: "Development login failed",
      description: error instanceof Error ? error.message : "Failed to login with development account",
      variant: "destructive",
    });
    throw error;
  }
}

export async function logoutUser() {
  try {
    const response = await myFetch(`${API_BASE_URL}/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
    return handleApiResponse<{ status: string }>(response);
  } catch (error) {
    console.error("Logout error:", error);
    throw error;
  }
}

export async function listDocuments() {
  try {
    const response = await myFetch(`${API_BASE_URL}/documents`, {
      credentials: "include",
    });
    
    if (!response.ok) {
      // Check if this is the specific SQLiteManager method error
      const errorText = await response.text();
      console.error("List documents error:", errorText);
      
      if (errorText.includes("'SQLiteManager' object has no attribute 'get_user_documents'")) {
        console.log("Method missing in backend. Using fallback documents list.");
        // Return empty documents array as fallback
        return { documents: [] };
      }
      
      throw new ApiError(`Failed to list documents: ${response.status}`, response.status);
    }
    
    return handleApiResponse<{ documents: { document_id: string, title: string, timestamp: string, source_type?: string }[] }>(response);
  } catch (error) {
    console.error("Error listing documents:", error);
    // Return empty documents array as fallback
    return { documents: [] };
  }
}

export async function createDocument(data: { title: string, source_type: string }) {
  try {
    const response = await myFetch(`${API_BASE_URL}/documents/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
      credentials: "include",
    });
    return handleApiResponse<{ document_id: string, title: string }>(response);
  } catch (error) {
    console.error("Error creating document:", error);
    throw error;
  }
}

// Memory Querying
export async function queryMemories(_userId: string, params: {
  query_text: string;
  document_id?: string;
  similarity_threshold?: number; // Use threshold
  use_gemini?: boolean;
  max_gemini_context?: number; // Optional limit for Gemini context
}) : Promise<MemoryQueryResult> { // Update return type
  try {
      // Build query parameters
      const queryParams = new URLSearchParams();
      queryParams.append("query_text", params.query_text);
      if (params.document_id) {
          queryParams.append("document_id", params.document_id);
      }
      // Add similarity_threshold (use default if not provided?)
      queryParams.append("similarity_threshold", (params.similarity_threshold ?? 0.75).toString());

      if (params.use_gemini) {
          queryParams.append("use_gemini", "true");
      }
       if (params.max_gemini_context) {
          queryParams.append("max_gemini_context", params.max_gemini_context.toString());
      }

      // Use GET endpoint defined in api.py
      const response = await myFetch(`${API_BASE_URL}/memories/query?${queryParams.toString()}`, {
          credentials: "include",
          method: "GET" // Explicitly use GET
      });

      // Use the updated return type
      return handleApiResponse<MemoryQueryResult>(response);
  } catch (error) {
      console.error("Error querying memories:", error);
      throw error; // Re-throw for UI components to handle
  }
}

export async function uploadDocument(file: File, title: string) {
  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", title);
    
    console.log(`Attempting to upload to: ${API_BASE_URL}/documents/upload`);
    console.log(`File details: Name=${file.name}, Size=${file.size}, Type=${file.type}`);
    
    const response = await myFetch(`${API_BASE_URL}/documents/upload`, {
      method: "POST",
      body: formData,
      credentials: 'include',
    });
    
    // Log detailed response information
    console.log(`Upload response status: ${response.status}`);
    
    if (!response.ok) {
      let errorMessage = "Upload failed";
      try {
        const errorData = await response.json();
        errorMessage = errorData.detail || errorData.message || errorMessage;
      } catch (e) {
        // If JSON parsing fails, try to get the text
        try {
          const errorText = await response.text();
          errorMessage = errorText || errorMessage;
        } catch (textError) {
          // If text extraction fails, just use the status text
          errorMessage = response.statusText || errorMessage;
        }
      }
      throw new ApiError(errorMessage, response.status);
    }
    
    return handleApiResponse<{ document_id: string, title: string, memories_added: number }>(response);
  } catch (error) {
    console.error("Detailed upload error:", error);
    
    if (error instanceof TypeError && error.message === "Failed to fetch") {
      toast({
        title: "Connection Error",
        description: "Cannot connect to the server. Please check your internet connection or contact support.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Unknown error uploading document",
        variant: "destructive",
      });
    }
    throw error;
  }
}

// Also update the myFetch function in api.ts with better headers
async function myFetch(input: RequestInfo, init?: RequestInit): Promise<Response> {
  const defaultHeaders = {
    "skip_zrok_interstitial": "true",
    // Add a cache-busting timestamp for GET requests to avoid browser caching
  };
  
  // For GET requests, add a timestamp parameter to the URL to avoid caching
  let url = input.toString();
  if ((!init || init.method === undefined || init.method === 'GET') && !url.includes('?')) {
    url += `?_t=${Date.now()}`;
  } else if ((!init || init.method === undefined || init.method === 'GET') && url.includes('?')) {
    url += `&_t=${Date.now()}`;
  }
  
  const mergedInit: RequestInit = {
    ...init,
    headers: {
      ...(init && init.headers ? init.headers : {}),
      ...defaultHeaders,
    },
  };
  
  return fetch(url, mergedInit);
}

// Update getNetworkStats to include better error handling
export async function getNetworkStats() {
  try {
    const response = await myFetch(`${API_BASE_URL}/network/stats`, {
      credentials: "include",
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Network stats error response:", errorText);
      throw new ApiError(`Failed to get network stats: ${response.status} ${errorText}`, response.status);
    }
    
    return handleApiResponse<{ memory_count: number, document_count: number }>(response);
  } catch (error) {
    console.error("Error getting network stats:", error);
    throw error;
  }
}