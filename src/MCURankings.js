import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { useTheme } from './ThemeContext';
import './MCURankings.css';

const MCURankings = ({ isReadOnly = false }) => {
  const [rankings, setRankings] = useState([]);
  const [films, setFilms] = useState([]);
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
    options.push('10');
    return options;
  };

  const scoreOptions = generateScoreOptions();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setError(null);
      // First fetch score colors, then films
      await fetchScoreColors();
      await fetchFilms();
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

    // Convert array to object for easy lookup
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

  const fetchFilms = async () => {
    const { data: filmsData, error: filmsError } = await supabase
      .from('mcu_films')
      .select('*')
      .order('phase, phase_order');

    if (filmsError) throw filmsError;

    setFilms(filmsData || []);
    
    // After films are loaded, fetch rankings
    await fetchRankings(filmsData || []);
  };

  const fetchRankings = async (filmsData) => {
    try {
      const { data, error } = await supabase
        .from('mcu_rankings')
        .select('*')
        .order('film_id');

      if (error) throw error;

      // Initialize rankings with existing data or default values
      const initialRankings = filmsData.map(film => {
        const existingRanking = data?.find(r => r.film_id === film.id);
        return {
          film_id: film.id,
          title: film.title,
          year: film.year,
          phase: film.phase,
          phase_order: film.phase_order,
          score: existingRanking?.score || '5'
        };
      });

      setRankings(initialRankings);
    } catch (error) {
      console.error('Error fetching rankings:', error);
      throw error; // Re-throw to be caught by fetchData
    } finally {
      setLoading(false);
    }
  };

  // Group rankings by phase
  const groupRankingsByPhase = () => {
    const phases = {};
    rankings.forEach(ranking => {
      const phase = ranking.phase || 1; // fallback for old data
      if (!phases[phase]) {
        phases[phase] = [];
      }
      phases[phase].push(ranking);
    });
    return phases;
  };

  // Get color for a score based on current theme
  const getScoreColor = (score) => {
    const colorData = scoreColors[score];
    if (!colorData) return isDarkMode ? '#4A5568' : '#F8F9FA'; // fallback to white/gray
    return isDarkMode ? colorData.dark : colorData.light;
  };

  // Get text color for score (ensure readability)
  const getScoreTextColor = (score) => {
    const colorData = scoreColors[score];
    if (!colorData) return isDarkMode ? '#E2E8F0' : '#333333';
    
    // For white/light colors, use dark text in light mode, light text in dark mode
    if (colorData.name === 'white') {
      return isDarkMode ? '#E2E8F0' : '#333333';
    }
    
    // For yellow, use dark text in both modes for better readability
    if (colorData.name === 'yellow') {
      return '#1A202C';
    }
    
    // For all other colors, use white text
    return '#FFFFFF';
  };

  const updateScore = async (filmId, newScore) => {
    try {
      console.log('Attempting to update:', { filmId, newScore });
      
      const { data, error } = await supabase
        .from('mcu_rankings')
        .upsert({
          film_id: filmId,
          score: newScore,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'film_id'
        });

      if (error) {
        console.error('Supabase error details:', error);
        throw error;
      }

      console.log('Update successful:', data);

      // Update local state
      setRankings(prev => prev.map(ranking => 
        ranking.film_id === filmId 
          ? { ...ranking, score: newScore }
          : ranking
      ));
    } catch (error) {
      console.error('Error updating score:', error);
      alert(`Failed to update score: ${error.message || 'Unknown error'}`);
    }
  };

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

  const phasesByNumber = groupRankingsByPhase();
  const sortedPhases = Object.keys(phasesByNumber).sort((a, b) => parseInt(a) - parseInt(b));

  return (
    <div className="mcu-rankings">
      <div className="header-section">
        <h1>MCU Infinity Saga Rankings</h1>
        <p>
          {isReadOnly 
            ? "Viewing rankings in guest mode" 
            : "Rate each film from 0 to 10 (with +/- modifiers for 1-9)"
          }
        </p>
      </div>
      
      {sortedPhases.map(phaseNumber => (
        <div key={phaseNumber} className="phase-section">
          <h2 className="phase-title">Phase {phaseNumber}</h2>
          <div className="table-container">
            <table className="rankings-table">
              <tbody>
                {phasesByNumber[phaseNumber].map(ranking => (
                  <tr key={ranking.film_id}>
                    <td className="film-title">{ranking.title}</td>
                    <td className="film-year">{ranking.year}</td>
                    <td className="score-cell">
                      {isReadOnly ? (
                        <span 
                          className="score-display"
                          style={{
                            backgroundColor: getScoreColor(ranking.score),
                            color: getScoreTextColor(ranking.score)
                          }}
                        >
                          {ranking.score}
                        </span>
                      ) : (
                        <select
                          value={ranking.score}
                          onChange={(e) => updateScore(ranking.film_id, e.target.value)}
                          className="score-select"
                          style={{
                            backgroundColor: getScoreColor(ranking.score),
                            color: getScoreTextColor(ranking.score),
                            borderColor: getScoreColor(ranking.score)
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
      ))}
    </div>
  );
};

export default MCURankings;