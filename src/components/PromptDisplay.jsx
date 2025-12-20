import React, { useState } from 'react';
import { Copy, Check, ChevronDown, ChevronUp } from 'lucide-react';
import './PromptDisplay.css';

const PromptDisplay = ({ prompt }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleExpand = (e) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  return (
    <div className={`prompt-display ${isExpanded ? 'expanded' : ''}`}>
      <div className="prompt-header">
        <span className="prompt-label">Image Prompt</span>
        <button 
          className="copy-button" 
          onClick={handleCopy}
          aria-label="Copy prompt"
        >
          {copied ? <Check size={16} color="#10b981" /> : <Copy size={16} />}
        </button>
      </div>
      
      <div className="prompt-content-wrapper">
        <p className="prompt-text">
          {prompt}
        </p>
      </div>

      <button className="expand-button" onClick={toggleExpand}>
        {isExpanded ? (
          <>
            Show Less <ChevronUp size={14} />
          </>
        ) : (
          <>
            Read More <ChevronDown size={14} />
          </>
        )}
      </button>
    </div>
  );
};

export default PromptDisplay;
