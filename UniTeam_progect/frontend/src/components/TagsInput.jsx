// src/components/TagsInput.jsx
import { useState, useRef } from 'react';
import './TagsInput.css';

const TagsInput = ({ tags = [], onChange, placeholder = 'Add tag...' }) => {
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef(null);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      const newTags = [...tags, inputValue.trim()];
      onChange(newTags);
      setInputValue('');
    }
  };

  const removeTag = (indexToRemove) => {
    const newTags = tags.filter((_, index) => index !== indexToRemove);
    onChange(newTags);
  };

  return (
    <div className="tags-wrap" onClick={() => inputRef.current?.focus()}>
      {tags.map((tag, index) => (
        <span key={index} className="tag-chip">
          {tag}
          <button onClick={(e) => {
            e.stopPropagation();
            removeTag(index);
          }}>×</button>
        </span>
      ))}
      <input
        ref={inputRef}
        type="text"
        className="tags-input"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={tags.length === 0 ? placeholder : ''}
      />
    </div>
  );
};

export default TagsInput;