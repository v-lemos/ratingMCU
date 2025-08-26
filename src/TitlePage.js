import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import './TitlePage.css';

const TitlePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [score, setScore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [seasonCount, setSeasonCount] = useState(1);
  const [seasons, setSeasons] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formYear, setFormYear] = useState('');
  const [formBase, setFormBase] = useState('5');
  const [formMod, setFormMod] = useState('');

  const baseScoreOptions = Array.from({ length: 12 }, (_, i) => String(i));
  const supportsModifier = (base) => {
    const n = parseInt(base, 10);
    return n >= 1 && n <= 9;
  };
  const parseScore = (scoreStr) => {
    if (!scoreStr) return { base: '5', mod: '' };
    const m = scoreStr.match(/^(\d{1,2})([+-])?$/);
    if (!m) return { base: '5', mod: '' };
    const base = m[1];
    const mod = m[2] || '';
    return { base, mod };
  };
  const composeScore = (base, mod) => `${base}${mod || ''}`;

  useEffect(() => {
    const load = async () => {
      try {
        setError(null);
        setLoading(true);
        // Try movies/specials first
        const movieReq = supabase.from('mcu_movies_specials').select('*').eq('id', id).maybeSingle();
        const movieRes = await movieReq;

        if (movieRes.error) throw movieRes.error;

        if (movieRes.data) {
          setItem({ ...movieRes.data, item_type: movieRes.data.is_special ? 'special' : 'film' });
          const { data: rankData, error: rankErr } = await supabase
            .from('mcu_movie_special_rankings')
            .select('*')
            .eq('item_id', id)
            .maybeSingle();
          if (rankErr) throw rankErr;
          setScore(rankData?.score ?? '5');
        } else {
          // Fallback to shows
          const { data: showData, error: showErr } = await supabase
            .from('mcu_shows')
            .select('*')
            .eq('id', id)
            .single();
          if (showErr) throw showErr;
          setItem({ ...showData, item_type: 'show' });
          // Fetch all seasons for this show_key globally to build a switcher
          const { data: allSeasons, error: seasonsErr } = await supabase
            .from('mcu_shows')
            .select('id, season_number')
            .eq('show_key', showData.show_key)
            .order('season_number', { ascending: true });
          if (seasonsErr) throw seasonsErr;
          setSeasons(allSeasons || []);
          setSeasonCount((allSeasons || []).length);
          const { data: rankData, error: rankErr } = await supabase
            .from('mcu_show_rankings')
            .select('*')
            .eq('item_id', id)
            .maybeSingle();
          if (rankErr) throw rankErr;
          setScore(rankData?.score ?? '5');
        }
      } catch (e) {
        console.error(e);
        setError('Failed to load title');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  // Helper to re-fetch current item + score from DB after saving
  const refetchCurrent = async () => {
    try {
      if (!item) return;
      if (item.item_type !== 'show') {
        const { data: movieData, error: mErr } = await supabase
          .from('mcu_movies_specials')
          .select('*')
          .eq('id', id)
          .single();
        if (mErr) throw mErr;
        setItem(movieData ? { ...movieData, item_type: movieData.is_special ? 'special' : 'film' } : item);
        const { data: rankData } = await supabase
          .from('mcu_movie_special_rankings')
          .select('*')
          .eq('item_id', id)
          .maybeSingle();
        setScore(rankData?.score ?? '5');
      } else {
        const { data: showData, error: sErr } = await supabase
          .from('mcu_shows')
          .select('*')
          .eq('id', id)
          .single();
        if (sErr) throw sErr;
        setItem(showData ? { ...showData, item_type: 'show' } : item);
        const { data: rankData } = await supabase
          .from('mcu_show_rankings')
          .select('*')
          .eq('item_id', id)
          .maybeSingle();
        setScore(rankData?.score ?? '5');
      }
    } catch (e) {
      console.error('Refetch after save failed', e);
    }
  };

  const openEditor = () => {
    if (!item) return;
    setFormTitle(item.title || '');
    setFormYear(String(item.year || ''));
    const { base, mod } = parseScore(score);
    setFormBase(base);
    setFormMod(mod);
    setIsEditing(true);
  };

  const closeEditor = () => setIsEditing(false);

  const saveEdits = async () => {
    try {
      setLoading(true);
      // Basic validation
      const y = parseInt(formYear, 10);
      if (Number.isNaN(y) || y < 1900 || y > 3000) {
        alert('Please enter a valid release year.');
        setLoading(false);
        return;
      }
      // Update title/year in appropriate table
      if (item.item_type === 'show') {
        const { data: updatedShow, error: updErr } = await supabase
          .from('mcu_shows')
          .update({ title: formTitle, year: y })
          .eq('id', item.id)
          .select('*')
          .maybeSingle();
        if (updErr) throw updErr;
        // Reflect locally from returned row
        if (updatedShow) {
          setItem(prev => prev ? { ...prev, ...updatedShow, item_type: 'show' } : prev);
        }
      } else {
        const { data: updatedMovie, error: updErr } = await supabase
          .from('mcu_movies_specials')
          .update({ title: formTitle, year: y })
          .eq('id', item.id)
          .select('*')
          .maybeSingle();
        if (updErr) throw updErr;
        if (updatedMovie) {
          setItem(prev => prev ? { ...prev, ...updatedMovie, item_type: updatedMovie.is_special ? 'special' : 'film' } : prev);
        }
      }
      // Update score in appropriate rankings table
      const newScore = composeScore(formBase, supportsModifier(formBase) ? formMod : '');
      const table = item.item_type === 'show' ? 'mcu_show_rankings' : 'mcu_movie_special_rankings';
      const { error: rankErr } = await supabase
        .from(table)
        .upsert({ item_id: item.id, score: newScore, updated_at: new Date().toISOString() }, { onConflict: 'item_id' })
        .select('*');
      if (rankErr) throw rankErr;

      // Reflect locally
      setScore(newScore);
      setIsEditing(false);
      // Re-fetch from DB to ensure persistence
      await refetchCurrent();
    } catch (e) {
      console.error('Failed to save edits', e);
      alert(`Failed to save edits: ${e.message || e}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="title-page loading">Loading…</div>;
  if (error) return <div className="title-page error">{error}</div>;
  if (!item) return <div className="title-page">Title not found.</div>;

  return (
    <div className="title-page">
      <div className="title-header">
        <h1 className="title-name">
          {item.item_type === 'show' && seasonCount > 1 && item.season_number ? (
            <>
              {item.title}
              <span className="season-badge"><em>Season {item.season_number}</em></span>
            </>
          ) : (
            item.title
          )}
          <button type="button" className="edit-btn" onClick={openEditor}>✏️</button>
        </h1>
        <div className="title-year">{item.year}</div>
        {item.item_type === 'show' && seasons.length > 1 && (
          <div className="season-switcher">
            <select
              aria-label="Switch season"
              value={item.id}
              onChange={(e) => navigate(`/title/${e.target.value}`)}
            >
              {(seasons || []).map((s) => (
                <option key={s.id} value={s.id}>
                  Season {s.season_number}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
      <div className="title-score">{score}</div>
      

      {isEditing && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal">
            <div className="modal-header">
              <h2>Edit Title</h2>
              <button type="button" className="close-btn" onClick={closeEditor} aria-label="Close">×</button>
            </div>
            <div className="modal-body">
              <label>
                <span>Title</span>
                <input type="text" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} />
              </label>
              <label>
                <span>Release Year</span>
                <input type="number" value={formYear} onChange={(e) => setFormYear(e.target.value)} />
              </label>
              <div className="score-row">
                <span>Score</span>
                <div className={`score-controls ${supportsModifier(formBase) ? '' : 'no-modifier'}`}>
                  <select
                    value={formBase}
                    onChange={(e) => {
                      const nb = e.target.value;
                      setFormBase(nb);
                      if (!supportsModifier(nb)) setFormMod('');
                    }}
                    className="score-select"
                  >
                    {baseScoreOptions.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                  {supportsModifier(formBase) && (
                    <button
                      type="button"
                      className={`modifier-btn ${formMod === '+' ? 'mod-plus' : formMod === '-' ? 'mod-minus' : 'mod-none'}`}
                      onClick={() => setFormMod(formMod === '' ? '+' : formMod === '+' ? '-' : '')}
                    >
                      {formMod}
                    </button>
                  )}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" onClick={closeEditor} className="btn-secondary">Cancel</button>
              <button type="button" onClick={saveEdits} className="btn-primary">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TitlePage;
