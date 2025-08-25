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
        const [{ data: itemsData, error: itemErr }, { data: rankData, error: rankErr }] = await Promise.all([
          supabase.from('mcu_items').select('*').eq('id', id).single(),
          supabase.from('mcu_item_rankings').select('*').eq('item_id', id).maybeSingle(),
        ]);
        if (itemErr) throw itemErr;
        if (rankErr) throw rankErr;
        setItem(itemsData);
        setScore(rankData?.score ?? '5');
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
