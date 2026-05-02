import React, { createContext, useContext, useState } from 'react';

const VoterContext = createContext();

export const VoterProvider = ({ children }) => {
  const [showLangSelector, setShowLangSelector] = useState(() => !localStorage.getItem('voterLanguage'));

  return (
    <VoterContext.Provider value={{ showLangSelector, setShowLangSelector }}>
      {children}
    </VoterContext.Provider>
  );
};

export const useVoterContext = () => useContext(VoterContext);
