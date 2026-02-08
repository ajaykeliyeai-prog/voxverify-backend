
import React from 'react';
import { SupportedLanguage, SUPPORTED_LANGUAGES } from '../types';

interface LanguageSelectorProps {
  selected: SupportedLanguage;
  onSelect: (lang: SupportedLanguage) => void;
  disabled?: boolean;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ selected, onSelect, disabled }) => {
  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {SUPPORTED_LANGUAGES.map((lang) => (
        <button
          key={lang}
          onClick={() => onSelect(lang)}
          disabled={disabled}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
            selected === lang
              ? 'bg-indigo-600 text-white shadow-lg'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          {lang}
        </button>
      ))}
    </div>
  );
};

export default LanguageSelector;
