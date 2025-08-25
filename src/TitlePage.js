import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from './supabaseClient';
import './TitlePage.css';

const TitlePage = () => {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [score, setScore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  if (loading) return <div className="title-page loading">Loading…</div>;
  if (error) return <div className="title-page error">{error}</div>;
  if (!item) return <div className="title-page">Title not found.</div>;

  return (
    <div className="title-page">
      <div className="title-header">
        <h1 className="title-name">{item.title}</h1>
        <div className="title-year">{item.year}</div>
      </div>
      <div className="title-score">{score}</div>
      <div className="title-actions">
        <Link to="/" className="back-link">← Back to Rankings</Link>
      </div>
    </div>
  );
};

export default TitlePage;
