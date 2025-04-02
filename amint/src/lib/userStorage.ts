interface UserInfo {
    user_id: string;
    name: string;
    email: string;
    picture: string;
  }
  
  const USER_STORAGE_KEY = 'amint-user-info';
  
  export const saveUserToStorage = (user: UserInfo): void => {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  };
  
  export const getUserFromStorage = (): UserInfo | null => {
    const storedUser = localStorage.getItem(USER_STORAGE_KEY);
    if (!storedUser) return null;
    
    try {
      return JSON.parse(storedUser) as UserInfo;
    } catch (e) {
      console.error('Failed to parse stored user info:', e);
      return null;
    }
  };
  
  export const clearUserFromStorage = (): void => {
    localStorage.removeItem(USER_STORAGE_KEY);
  };