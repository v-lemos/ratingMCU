import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import './SearchBar.css';

const SearchBar = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  const navigate = useNavigate();
  const boxRef = useRef(null);
  const timeoutRef = useRef(null);

  useEffect(() => {
    // click outside to close
    const onDocClick = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) {
        setOpen(false);
        setHighlight(-1);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (!query || query.trim().length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }
    timeoutRef.current = setTimeout(async () => {
      try {
        const [movieRes, showRes] = await Promise.all([
          supabase
            .from('mcu_movies_specials')
            .select('id, title, is_special, year')
            .ilike('title', `%${query}%`)
            .order('title')
            .limit(8),
          supabase
            .from('mcu_shows')
            .select('id, title, show_key, season_number, year')
            .ilike('title', `%${query}%`)
            .order('title')
            .limit(8)
        ]);

        if (movieRes.error) throw movieRes.error;
        if (showRes.error) throw showRes.error;

        const movies = (movieRes.data || []).map(m => ({
          id: m.id,
          title: m.title,
          year: m.year,
          item_type: m.is_special ? 'special' : 'film',
          season_number: null,
          show_key: null
        }));
        const shows = (showRes.data || []).map(s => ({
          id: s.id,
          title: s.title,
          year: s.year,
          item_type: 'show',
          season_number: s.season_number,
          show_key: s.show_key
        }));

        const merged = [...movies, ...shows]
          .sort((a, b) => a.title.localeCompare(b.title))
          .slice(0, 8);

        setResults(merged);
        setOpen(true);
        setHighlight(-1);
      } catch (e) {
        console.error('Search error:', e);
        setResults([]);
        setOpen(false);
      }
    }, 200);
    return () => clearTimeout(timeoutRef.current);
  }, [query]);

  const gotoItem = (id) => {
    setOpen(false);
    setQuery('');
    setResults([]);
    setHighlight(-1);
    navigate(`/title/${id}`);
  };

  const onKeyDown = (e) => {
    if (!open || results.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlight((h) => (h + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight((h) => (h - 1 + results.length) % results.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const idx = highlight === -1 ? 0 : highlight;
      const picked = results[idx];
      if (picked) gotoItem(picked.id);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  const displayTitle = (item) => {
    if (item.item_type === 'show' && item.season_number) {
      return `${item.title}${item.season_number ? ` — S${item.season_number}` : ''}`;
    }
    return item.title;
  };

  return (
    <div className="searchbar" ref={boxRef}>
      <input
        type="text"
        className="search-input"
        placeholder="Search titles…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={onKeyDown}
        onFocus={() => query.length >= 2 && setOpen(true)}
        aria-label="Search by title"
      />
      {open && results.length > 0 && (
        <ul className="search-suggestions" role="listbox">
          {results.map((item, idx) => (
            <li
              key={item.id}
              className={`suggestion ${idx === highlight ? 'active' : ''}`}
              onMouseEnter={() => setHighlight(idx)}
              onMouseLeave={() => setHighlight(-1)}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => gotoItem(item.id)}
              role="option"
              aria-selected={idx === highlight}
            >
              <span className="suggestion-title">{displayTitle(item)}</span>
              <span className="suggestion-year">{item.year}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default SearchBar;
