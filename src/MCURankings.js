import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { useTheme } from './ThemeContext';
import './MCURankings.css';

const MCURankings = ({ isReadOnly = false }) => {
  const [items, setItems] = useState([]);
  const [rankings, setRankings] = useState([]);
  const [scoreColors, setScoreColors] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { isDarkMode } = useTheme();

  // Generate score options (0, 1-, 1, 1+, 2-, 2, 2+, ..., 9-, 9, 9+, 10)
  const generateScoreOptions = () => {
    const options = ['0'];
    for (let i = 1; i <= 9; i++) {
      options.push(`${i}-`, `${i}`, `${i}+`);
    }
    options.push('10', '11');
    return options;
  };

  const scoreOptions = generateScoreOptions();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setError(null);
      await fetchScoreColors();
      await fetchItems();
    } catch (error) {
      console.error('Error in fetchData:', error);
      setError('Failed to load data from Supabase');
      setLoading(false);
    }
  };

  const fetchScoreColors = async () => {
    const { data: colorsData, error: colorsError } = await supabase
      .from('score_colors')
      .select('*');

    if (colorsError) throw colorsError;

    const colorsMap = {};
    colorsData?.forEach(colorData => {
      colorsMap[colorData.score] = {
        light: colorData.hex_color_light,
        dark: colorData.hex_color_dark,
        name: colorData.color_name
      };
    });

    setScoreColors(colorsMap);
  };

  const fetchItems = async () => {
    const { data: itemsData, error: itemsError } = await supabase
      .from('mcu_items')
      .select('*')
      .order('phase, phase_order');

    if (itemsError) throw itemsError;

    setItems(itemsData || []);
    await fetchItemRankings(itemsData || []);
  };

  const fetchItemRankings = async (itemsData) => {
    try {
      const { data, error } = await supabase
        .from('mcu_item_rankings')
        .select('*')
        .order('item_id');

      if (error) throw error;

      const byId = new Map(data?.map(r => [r.item_id, r]) || []);

      const merged = itemsData.map(it => ({
        ...it,
        score: byId.get(it.id)?.score || '5'
      }));

      setRankings(merged);
    } catch (error) {
      console.error('Error fetching item rankings:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Group by phase
  const groupByPhase = (list) => {
    const phases = {};
    list.forEach(item => {
      const phase = item.phase || 1;
      if (!phases[phase]) phases[phase] = [];
      phases[phase].push(item);
    });
    return phases;
  };

  // Build a map of show_key -> season count to decide when to show season number
  const getShowCounts = (list) => {
    const counts = new Map();
    for (const item of list) {
      if (item.item_type === 'show' && item.show_key) {
        counts.set(item.show_key, (counts.get(item.show_key) || 0) + 1);
      }
    }
    return counts;
  };

  const getDisplayTitle = (item, showCounts) => {
    if (item.item_type === 'show' && item.season_number) {
      const count = showCounts.get(item.show_key) || 0;
      // Only show season number if show has multiple seasons
      return count > 1 ? `${item.title} — S${item.season_number}` : item.title;
    }
    return item.title;
  };

  // Colors
  const getScoreColor = (score) => {
    const colorData = scoreColors[score];
    if (!colorData) return isDarkMode ? '#4A5568' : '#F8F9FA';
    return isDarkMode ? colorData.dark : colorData.light;
  };

  const getScoreTextColor = (score) => {
    const colorData = scoreColors[score];
    if (!colorData) return isDarkMode ? '#E2E8F0' : '#333333';
    if (colorData.name === 'white') return isDarkMode ? '#E2E8F0' : '#333333';
    if (colorData.name === 'yellow') return '#1A202C';
    return '#FFFFFF';
  };

  const updateScore = async (item, newScore) => {
    try {
      const { error } = await supabase
        .from('mcu_item_rankings')
        .upsert({
          item_id: item.id,
          score: newScore,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'item_id'
        });
      if (error) throw error;
      setRankings(prev => prev.map(r => r.id === item.id ? { ...r, score: newScore } : r));
    } catch (error) {
      console.error('Error updating score:', error);
      alert(`Failed to update score: ${error.message || 'Unknown error'}`);
    }
  };

  const phases = groupByPhase(rankings);
  const allPhaseNumbers = Object.keys(phases).map(n => parseInt(n, 10)).sort((a, b) => a - b);

  if (loading) {
    return <div className="loading">Loading your MCU rankings...</div>;
  }

  if (error) {
    return (
      <div className="error-container">
        <h2>Unable to Load Rankings</h2>
        <p>{error}</p>
        <button onClick={fetchData}>Retry</button>
      </div>
    );
  }

  return (
    <div className="mcu-rankings">
      {allPhaseNumbers.map(phaseNumber => {
        const itemsInPhase = (phases[phaseNumber] || []).sort((a, b) => a.phase_order - b.phase_order);
        const showCounts = getShowCounts(itemsInPhase);
        return (
          <div key={phaseNumber} className="phase-section">
            <h2 className="phase-title">Phase {phaseNumber}</h2>
            <div className="table-container">
              <table className="rankings-table">
                <tbody>
                  {itemsInPhase.map(item => (
                    <tr key={`item-${item.id}`}>
                      <td className="film-title">{getDisplayTitle(item, showCounts)}</td>
                      <td className="film-year">{item.year}</td>
                      <td className="score-cell">
                        {isReadOnly ? (
                          <span
                            className="score-display"
                            style={{
                              backgroundColor: getScoreColor(item.score),
                              color: getScoreTextColor(item.score)
                            }}
                          >
                            {item.score}
                          </span>
                        ) : (
                          <select
                            value={item.score}
                            onChange={(e) => updateScore(item, e.target.value)}
                            className="score-select"
                            style={{
                              backgroundColor: getScoreColor(item.score),
                              color: getScoreTextColor(item.score),
                              borderColor: getScoreColor(item.score)
                            }}
                          >
                            {scoreOptions.map(option => (
                              <option
                                key={option}
                                value={option}
                                style={{
                                  backgroundColor: getScoreColor(option),
                                  color: getScoreTextColor(option)
                                }}
                              >
                                {option}
                              </option>
                            ))}
                          </select>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MCURankings;