import { useContext, createContext, useState, ReactNode } from 'react';

interface AlertState {
  visible: boolean;
  title: string;
  message: string;
}

interface AlertContextType {
  alert: AlertState;
  showAlert: (title: string, message: string) => void;
  hideAlert: () => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export function AlertProvider({ children }: { children: ReactNode }) {
  const [alert, setAlert] = useState<AlertState>({
    visible: false,
    title: '',
    message: '',
  });

  const showAlert = (title: string, message: string) => {
    setAlert({ visible: true, title, message });
  };

  const hideAlert = () => {
    setAlert({ visible: false, title: '', message: '' });
  };

  return (
    <AlertContext.Provider value={{ alert, showAlert, hideAlert }}>
      {children}
    </AlertContext.Provider>
  );
}

export function useAlert() {
  const context = useContext(AlertContext);
  if (context === undefined) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
}
