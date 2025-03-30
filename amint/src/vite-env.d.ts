/// <reference types="vite/client" />

// Google Sign-In API
interface Window {
  google?: {
    accounts: {
      id: {
        initialize: (config: {
          client_id: string;
          callback: (response: { credential: string }) => void;
          auto_select?: boolean;
          context?: string;
        }) => void;
        prompt: () => void;
        renderButton: (
          element: HTMLElement,
          options?: {
            theme?: 'outline' | 'filled_blue' | 'filled_black';
            size?: 'large' | 'medium' | 'small';
            text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
            shape?: 'rectangular' | 'pill' | 'circle' | 'square';
            logo_alignment?: 'left' | 'center';
            width?: string | number;
            locale?: string;
          }
        ) => void;
        disableAutoSelect: () => void;
      };
    };
  };
}
