import React, { useState } from 'react';
import { NoteInput } from './NoteInput';
import { ImageUpload } from './ImageUpload';
import { WebPageInput } from './WebPageInput';

export function ContentIngestionPanel() {
  const [activeTab, setActiveTab] = useState<'note' | 'image' | 'webpage'>('note');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{
        display: 'flex',
        borderBottom: '1px solid #ddd',
        marginBottom: '15px'
      }}>
        <button
          onClick={() => setActiveTab('note')}
          style={{
            flex: 1,
            padding: '8px',
            border: 'none',
            backgroundColor: activeTab === 'note' ? '#3498db' : 'transparent',
            color: activeTab === 'note' ? 'white' : '#666',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: activeTab === 'note' ? '500' : 'normal',
            borderBottom: activeTab === 'note' ? 'none' : '1px solid #ddd'
          }}
        >
          📝 Note
        </button>
        <button
          onClick={() => setActiveTab('image')}
          style={{
            flex: 1,
            padding: '8px',
            border: 'none',
            backgroundColor: activeTab === 'image' ? '#3498db' : 'transparent',
            color: activeTab === 'image' ? 'white' : '#666',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: activeTab === 'image' ? '500' : 'normal',
            borderBottom: activeTab === 'image' ? 'none' : '1px solid #ddd'
          }}
        >
          🖼️ Image
        </button>
        <button
          onClick={() => setActiveTab('webpage')}
          style={{
            flex: 1,
            padding: '8px',
            border: 'none',
            backgroundColor: activeTab === 'webpage' ? '#3498db' : 'transparent',
            color: activeTab === 'webpage' ? 'white' : '#666',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: activeTab === 'webpage' ? '500' : 'normal',
            borderBottom: activeTab === 'webpage' ? 'none' : '1px solid #ddd'
          }}
        >
          🌐 Web
        </button>
      </div>

      <div style={{ flex: 1, overflow: 'auto' }}>
        {activeTab === 'note' && <NoteInput />}
        {activeTab === 'image' && <ImageUpload />}
        {activeTab === 'webpage' && <WebPageInput />}
      </div>
    </div>
  );
}
