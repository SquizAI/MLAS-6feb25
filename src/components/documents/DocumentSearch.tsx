import React, { useState, useEffect } from 'react';
import { Search, Filter, SortAsc, Tag } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { logger } from '../../lib/logger';

interface SearchFilters {
  type?: string[];
  dateRange?: [Date | null, Date | null];
  tags?: string[];
}

interface DocumentSearchProps {
  onSearch: (results: any[]) => void;
}

export default function DocumentSearch({ onSearch }: DocumentSearchProps) {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(false);
  const [availableTags, setAvailableTags] = useState<string[]>([]);

  useEffect(() => {
    // Load available tags from documents
    const loadTags = async () => {
      const { data } = await supabase
        .from('documents')
        .select('metadata->tags')
        .not('metadata->tags', 'is', null);

      const tags = new Set<string>();
      data?.forEach(doc => {
        if (Array.isArray(doc.metadata?.tags)) {
          doc.metadata.tags.forEach((tag: string) => tags.add(tag));
        }
      });
      setAvailableTags(Array.from(tags));
    };

    loadTags();
  }, []);

  const handleSearch = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false });

      // Apply text search
      if (query.trim()) {
        query = query.textSearch('name', query);
      }

      // Apply filters
      if (filters.type?.length) {
        query = query.in('mime_type', filters.type);
      }

      if (filters.dateRange?.[0]) {
        query = query.gte('created_at', filters.dateRange[0].toISOString());
      }

      if (filters.dateRange?.[1]) {
        query = query.lte('created_at', filters.dateRange[1].toISOString());
      }

      if (filters.tags?.length) {
        query = query.contains('metadata->tags', filters.tags);
      }

      const { data, error } = await query;

      if (error) throw error;
      onSearch(data || []);

      logger.info({ 
        query,
        filters,
        resultCount: data?.length 
      }, 'Document search completed');

    } catch (error) {
      logger.error({ error }, 'Document search failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search documents..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          <Filter className="w-5 h-5" />
          Filters
        </button>
        <button
          onClick={handleSearch}
          disabled={loading}
          className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            'Search'
          )}
        </button>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
          {/* File Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              File Type
            </label>
            <div className="flex flex-wrap gap-2">
              {['PDF', 'Document', 'Image', 'Text'].map(type => (
                <label key={type} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={filters.type?.includes(type.toLowerCase())}
                    onChange={(e) => {
                      const types = new Set(filters.type || []);
                      if (e.target.checked) {
                        types.add(type.toLowerCase());
                      } else {
                        types.delete(type.toLowerCase());
                      }
                      setFilters(prev => ({ ...prev, type: Array.from(types) }));
                    }}
                    className="rounded text-blue-600"
                  />
                  <span className="text-sm text-gray-600">{type}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Date Range Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date Range
            </label>
            <div className="flex gap-4">
              <input
                type="date"
                value={filters.dateRange?.[0]?.toISOString().split('T')[0] || ''}
                onChange={(e) => setFilters(prev => ({
                  ...prev,
                  dateRange: [e.target.value ? new Date(e.target.value) : null, prev.dateRange?.[1]]
                }))}
                className="px-3 py-2 border border-gray-300 rounded-lg"
              />
              <input
                type="date"
                value={filters.dateRange?.[1]?.toISOString().split('T')[0] || ''}
                onChange={(e) => setFilters(prev => ({
                  ...prev,
                  dateRange: [prev.dateRange?.[0], e.target.value ? new Date(e.target.value) : null]
                }))}
                className="px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>

          {/* Tags Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tags
            </label>
            <div className="flex flex-wrap gap-2">
              {availableTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => {
                    const tags = new Set(filters.tags || []);
                    if (tags.has(tag)) {
                      tags.delete(tag);
                    } else {
                      tags.add(tag);
                    }
                    setFilters(prev => ({ ...prev, tags: Array.from(tags) }));
                  }}
                  className={`flex items-center gap-1 px-2 py-1 rounded-full text-sm ${
                    filters.tags?.includes(tag)
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Tag className="w-3 h-3" />
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}