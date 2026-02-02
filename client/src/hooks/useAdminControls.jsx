import React, { createContext, useContext, useState } from 'react';

export const AdminControlContext = createContext();

export const AdminControlProvider = ({ children }) => {
  const [activeAction, setActiveAction] = useState(null);

  const triggerAction = (action) => setActiveAction(action);
  const clearAction = () => setActiveAction(null);

  return (
    <AdminControlContext.Provider value={{ activeAction, triggerAction, clearAction }}>
      {children}
    </AdminControlContext.Provider>
  );
};

export const useAdminControls = () => {
  const context = useContext(AdminControlContext);
  if (!context) {
    throw new Error('useAdminControls must be used within an AdminControlProvider');
  }
  return context;
};
