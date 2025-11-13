import React, { useState } from 'react';

export interface SearchFiltersProps {
  onFilterChange: (filters: {
    types: Array<'note' | 'image' | 'webpage'>;
    dateRange: { start: Date | null; end: Date | null };
    tags: string[];
  }) => void;
}

export const SearchFilters: React.FC<SearchFiltersProps> = ({ onFilterChange }) => {
  const [selectedTypes, setSelectedTypes] = useState<Array<'note' | 'image' | 'webpage'>>([]);
  const [dateStart, setDateStart] = useState<string>('');
  const [dateEnd, setDateEnd] = useState<string>('');
  const [tagInput, setTagInput] = useState<string>('');
  const [tags, setTags] = useState<string[]>([]);

  const handleTypeToggle = (type: 'note' | 'image' | 'webpage') => {
    const newTypes = selectedTypes.includes(type)
      ? selectedTypes.filter(t => t !== type)
      : [...selectedTypes, type];
    
    setSelectedTypes(newTypes);
    emitFilterChange(newTypes, dateStart, dateEnd, tags);
  };

  const handleDateStartChange = (value: string) => {
    setDateStart(value);
    emitFilterChange(selectedTypes, value, dateEnd, tags);
  };

  const handleDateEndChange = (value: string) => {
    setDateEnd(value);
    emitFilterChange(selectedTypes, dateStart, value, tags);
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      const newTags = [...tags, tagInput.trim()];
      setTags(newTags);
      setTagInput('');
      emitFilterChange(selectedTypes, dateStart, dateEnd, newTags);
    }
  };

  const handleRemoveTag = (tag: string) => {
    const newTags = tags.filter(t => t !== tag);
    setTags(newTags);
    emitFilterChange(selectedTypes, dateStart, dateEnd, newTags);
  };

  const handleClearFilters = () => {
    setSelectedTypes([]);
    setDateStart('');
    setDateEnd('');
    setTags([]);
    setTagInput('');
    onFilterChange({
      types: [],
      dateRange: { start: null, end: null },
      tags: []
    });
  };

  const emitFilterChange = (
    types: Array<'note' | 'image' | 'webpage'>,
    start: string,
    end: string,
    tagList: string[]
  ) => {
    onFilterChange({
      types,
      dateRange: {
        start: start ? new Date(start) : null,
        end: end ? new Date(end) : null
      },
      tags: tagList
    });
  };

  const hasActiveFilters = selectedTypes.length > 0 || dateStart || dateEnd || tags.length > 0;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h3 style={styles.title}>Filters</h3>
        {hasActiveFilters && (
          <button onClick={handleClearFilters} style={styles.clearButton}>
            Clear All
          </button>
        )}
      </div>

      {/* Content Type Filter */}
      <div style={styles.section}>
        <label style={styles.label}>Content Type</label>
        <div style={styles.checkboxGroup}>
          {(['note', 'image', 'webpage'] as const).map(type => (
            <label key={type} style={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={selectedTypes.includes(type)}
                onChange={() => handleTypeToggle(type)}
                style={styles.checkbox}
              />
              <span style={styles.checkboxText}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Date Range Filter */}
      <div style={styles.section}>
        <label style={styles.label}>Date Range</label>
        <div style={styles.dateInputs}>
          <div style={styles.dateField}>
            <label style={styles.dateLabel}>From</label>
            <input
              type="date"
              value={dateStart}
              onChange={(e) => handleDateStartChange(e.target.value)}
              style={styles.dateInput}
            />
          </div>
          <div style={styles.dateField}>
            <label style={styles.dateLabel}>To</label>
            <input
              type="date"
              value={dateEnd}
              onChange={(e) => handleDateEndChange(e.target.value)}
              style={styles.dateInput}
            />
          </div>
        </div>
      </div>

      {/* Tag Filter */}
      <div style={styles.section}>
        <label style={styles.label}>Tags</label>
        <div style={styles.tagInputContainer}>
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
            placeholder="Add tag..."
            style={styles.tagInput}
          />
          <button onClick={handleAddTag} style={styles.addButton}>
            Add
          </button>
        </div>
        {tags.length > 0 && (
          <div style={styles.tagList}>
            {tags.map(tag => (
              <span key={tag} style={styles.tag}>
                {tag}
                <button
                  onClick={() => handleRemoveTag(tag)}
                  style={styles.tagRemove}
                  aria-label={`Remove ${tag}`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    backgroundColor: '#f9f9f9',
    border: '1px solid #ddd',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '20px'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px'
  },
  title: {
    margin: 0,
    fontSize: '18px',
    fontWeight: 600
  },
  clearButton: {
    backgroundColor: 'transparent',
    border: 'none',
    color: '#0066cc',
    cursor: 'pointer',
    fontSize: '14px',
    padding: '4px 8px'
  },
  section: {
    marginBottom: '16px'
  },
  label: {
    display: 'block',
    fontWeight: 600,
    marginBottom: '8px',
    fontSize: '14px'
  },
  checkboxGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer'
  },
  checkbox: {
    marginRight: '8px',
    cursor: 'pointer'
  },
  checkboxText: {
    fontSize: '14px'
  },
  dateInputs: {
    display: 'flex',
    gap: '12px'
  },
  dateField: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column'
  },
  dateLabel: {
    fontSize: '12px',
    color: '#666',
    marginBottom: '4px'
  },
  dateInput: {
    padding: '8px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px'
  },
  tagInputContainer: {
    display: 'flex',
    gap: '8px',
    marginBottom: '8px'
  },
  tagInput: {
    flex: 1,
    padding: '8px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    fontSize: '14px'
  },
  addButton: {
    padding: '8px 16px',
    backgroundColor: '#0066cc',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px'
  },
  tagList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px'
  },
  tag: {
    display: 'inline-flex',
    alignItems: 'center',
    backgroundColor: '#e0e0e0',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '13px'
  },
  tagRemove: {
    marginLeft: '6px',
    backgroundColor: 'transparent',
    border: 'none',
    color: '#666',
    cursor: 'pointer',
    fontSize: '18px',
    lineHeight: '1',
    padding: '0 2px'
  }
};
