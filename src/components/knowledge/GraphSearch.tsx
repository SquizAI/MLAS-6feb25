import React, { useState } from 'react';
import { Search } from 'lucide-react';

interface GraphSearchProps {
  onSearch: (query: string) => void;
}

export default function GraphSearch({ onSearch }: GraphSearchProps) {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
  };

  return (
    <form onSubmit={handleSubmit} className="relative">
      <input
        type="text"
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Search nodes..."
        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      />
      <Search className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
    </form>
  );
}