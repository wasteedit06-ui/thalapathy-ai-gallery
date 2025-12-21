import React, { useState, useEffect } from 'react';
import { Copy, ChevronDown, ChevronUp, Check, Eye } from 'lucide-react';
import './PromptDisplay.css';

const PromptDisplay = ({ prompt }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    if (isExpanded && displayedText.length < prompt.length) {
      setIsTyping(true);
      const timer = setTimeout(() => {
        setDisplayedText(prompt.slice(0, displayedText.length + 1));
      }, 15);
      return () => clearTimeout(timer);
    } else {
      setIsTyping(false);
    }
  }, [isExpanded, displayedText, prompt]);

  const handleCopy = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(prompt);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const toggleExpand = (e) => {
    e.stopPropagation();
    if (!isExpanded) setDisplayedText('');
    setIsExpanded(!isExpanded);
  };

  return (
    <div className={`prompt-display ${isExpanded ? 'expanded' : ''}`}>
      <div className="prompt-header">
        <span className="prompt-label">Generation Prompt</span>
        <button
          className={`copy-btn ${isCopied ? 'copied' : ''}`}
          onClick={handleCopy}
          title="Copy Prompt"
        >
          {isCopied ? <Check size={16} /> : <Copy size={16} />}
        </button>
      </div>

      <div className="prompt-content-wrapper">
        <p className="prompt-text">
          {isExpanded ? displayedText : prompt}
          {isTyping && <span className="type-cursor">|</span>}
        </p>
      </div>

      <button className="action-button-main" onClick={toggleExpand}>
        <div className="btn-glow"></div>
        {isExpanded ? (
          <>
            <ChevronUp size={18} /> Hide Prompt
          </>
        ) : (
          <>
            <Eye size={18} /> View Prompt
          </>
        )}
      </button>
    </div>
  );
};

export default PromptDisplay;
