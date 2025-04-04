import { toast } from "@/hooks/use-toast";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

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
export async function loginWithGoogle(credential: string) {
  try {
    const response = await myFetch(`${API_BASE_URL}/auth/login/google`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ credential }),
      credentials: "include",
    });
    
    return handleApiResponse<{ user_id: string, email: string }>(response);
  } catch (error) {
    console.error("Login error:", error);
    toast({
      title: "Login failed",
      description: error instanceof Error ? error.message : "Failed to login",
      variant: "destructive",
    });
    throw error;
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

export async function logout() {
  try {
    const response = await myFetch(`${API_BASE_URL}/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
    
    return handleApiResponse<{ success: boolean }>(response);
  } catch (error) {
    console.error("Logout error:", error);
    throw error;
  }
}

// Document Management
export async function listDocuments(userId: string) {
  try {
    const response = await myFetch(`${API_BASE_URL}/documents?user_id=${userId}`, {
      credentials: "include",
    });
    
    return handleApiResponse<{ documents: { document_id: string, title: string, timestamp: string, source_type?: string }[] }>(response);
  } catch (error) {
    console.error("Error listing documents:", error);
    throw error;
  }
}

export async function createDocument(userId: string, data: { title: string, source_type: string }) {
  try {
    const response = await myFetch(`${API_BASE_URL}/documents`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_id: userId,
        ...data
      }),
      credentials: "include",
    });
    
    return handleApiResponse<{ document_id: string, title: string }>(response);
  } catch (error) {
    console.error("Error creating document:", error);
    throw error;
  }
}

export async function uploadDocument(userId: string, file: File, title: string) {
  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("user_id", userId);
    formData.append("title", title);
    
    console.log(`Attempting to upload to: ${API_BASE_URL}/documents/upload`);
    
    const response = await myFetch(`${API_BASE_URL}/documents/upload`, {
      method: "POST",
      body: formData,
      credentials: 'include',
    });
    
    // Log detailed response information
    console.log(`Upload response status: ${response.status}`);
    
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

export async function getNetworkStats(userId: string) {
  try {
    const response = await myFetch(`${API_BASE_URL}/network/stats?user_id=${userId}`, {
      credentials: "include",
    });
    
    return handleApiResponse<{ memory_count: number, document_count: number }>(response);
  } catch (error) {
    console.error("Error getting network stats:", error);
    throw error;
  }
}

// Memory Querying
export async function queryMemories(userId: string, params: {
  query_text: string;
  document_id?: string;
  k?: number;
  use_gemini?: boolean;
}) {
  try {
    // Build query parameters
    const queryParams = new URLSearchParams();
    queryParams.append("user_id", userId);
    queryParams.append("query_text", params.query_text);
    if (params.document_id) {
      queryParams.append("document_id", params.document_id);
    }
    if (params.k) {
      queryParams.append("k", params.k.toString());
    }
    if (params.use_gemini) {
      queryParams.append("use_gemini", "true");
    }
    
    const response = await myFetch(`${API_BASE_URL}/memories/query?${queryParams.toString()}`, {
      credentials: "include",
    });
    
    return handleApiResponse<{
      results: Array<{
        memory_id: string;
        text: string;
        name: string;
        section_title?: string;
        timestamp?: string;
        metadata?: Record<string, any>;
      }>,
      gemini_response?: string;
      use_gemini: boolean;
    }>(response);
  } catch (error) {
    console.error("Error querying memories:", error);
    throw error;
  }
}

// async function fetchWithTimeout(url: string, options: RequestInit, timeout = 10000): Promise<Response> {
//   const controller = new AbortController();
//   const id = setTimeout(() => controller.abort(), timeout);
  
//   const response = await fetch(url, {
//     ...options,
//     signal: controller.signal
//   });
  
//   clearTimeout(id);
//   return response;
// }

async function myFetch(input: RequestInfo, init?: RequestInit): Promise<Response> {
  const defaultHeaders = {
    "skip_zrok_interstitial": "true",
  };
  const mergedInit: RequestInit = {
    ...init,
    headers: {
      ...(init && init.headers ? init.headers : {}),
      ...defaultHeaders,
    },
  };
  return fetch(input, mergedInit);
}