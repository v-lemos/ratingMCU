import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { useTheme } from './ThemeContext';
import './MCURankings.css';

const MCURankings = ({ isReadOnly = false }) => {
  const [rankings, setRankings] = useState([]);
  const [films, setFilms] = useState([]);
  const [scoreColors, setScoreColors] = useState({});
  const [loading, setLoading] = useState(true);
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
      // First fetch score colors, then films
      await fetchScoreColors();
      await fetchFilms();
    } catch (error) {
      console.error('Error in fetchData:', error);
      setLoading(false);
    }
  };

  const fetchScoreColors = async () => {
    try {
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
    } catch (error) {
      console.error('Error fetching score colors:', error);
      // Fallback colors if database doesn't have the colors table
      const fallbackColors = {
        '0': { light: '#8B5CF6', dark: '#A78BFA', name: 'purple' },
        '1-': { light: '#EF4444', dark: '#F87171', name: 'red' },
        '1': { light: '#EF4444', dark: '#F87171', name: 'red' },
        '1+': { light: '#EF4444', dark: '#F87171', name: 'red' },
        '2-': { light: '#EF4444', dark: '#F87171', name: 'red' },
        '2': { light: '#EF4444', dark: '#F87171', name: 'red' },
        '2+': { light: '#EF4444', dark: '#F87171', name: 'red' },
        '3-': { light: '#EF4444', dark: '#F87171', name: 'red' },
        '3': { light: '#EF4444', dark: '#F87171', name: 'red' },
        '3+': { light: '#EF4444', dark: '#F87171', name: 'red' },
        '4-': { light: '#EF4444', dark: '#F87171', name: 'red' },
        '4': { light: '#EF4444', dark: '#F87171', name: 'red' },
        '4+': { light: '#EF4444', dark: '#F87171', name: 'red' },
        '5-': { light: '#F8F9FA', dark: '#4A5568', name: 'white' },
        '5': { light: '#F8F9FA', dark: '#4A5568', name: 'white' },
        '5+': { light: '#F8F9FA', dark: '#4A5568', name: 'white' },
        '6-': { light: '#FCD34D', dark: '#FBBF24', name: 'yellow' },
        '6': { light: '#FCD34D', dark: '#FBBF24', name: 'yellow' },
        '6+': { light: '#FCD34D', dark: '#FBBF24', name: 'yellow' },
        '7-': { light: '#FB923C', dark: '#F97316', name: 'orange' },
        '7': { light: '#FB923C', dark: '#F97316', name: 'orange' },
        '7+': { light: '#FB923C', dark: '#F97316', name: 'orange' },
        '8-': { light: '#3B82F6', dark: '#60A5FA', name: 'blue' },
        '8': { light: '#3B82F6', dark: '#60A5FA', name: 'blue' },
        '8+': { light: '#3B82F6', dark: '#60A5FA', name: 'blue' },
        '9-': { light: '#10B981', dark: '#34D399', name: 'light-green' },
        '9': { light: '#10B981', dark: '#34D399', name: 'light-green' },
        '9+': { light: '#059669', dark: '#10B981', name: 'dark-green' },
        '10': { light: '#059669', dark: '#10B981', name: 'dark-green' }
      };
      setScoreColors(fallbackColors);
    }
  };

  const fetchFilms = async () => {
    try {
      const { data: filmsData, error: filmsError } = await supabase
        .from('mcu_films')
        .select('*')
        .order('phase, phase_order');

      if (filmsError) throw filmsError;

      setFilms(filmsData || []);
      
      // After films are loaded, fetch rankings
      await fetchRankings(filmsData || []);
    } catch (error) {
      console.error('Error fetching films:', error);
      // Fallback to hardcoded films with phase information if database table doesn't exist
      const fallbackFilms = [
        // Phase 1
        { id: 1, title: 'Iron Man', year: 2008, phase: 1, phase_order: 1 },
        { id: 2, title: 'The Incredible Hulk', year: 2008, phase: 1, phase_order: 2 },
        { id: 3, title: 'Iron Man 2', year: 2010, phase: 1, phase_order: 3 },
        { id: 4, title: 'Thor', year: 2011, phase: 1, phase_order: 4 },
        { id: 5, title: 'Captain America: The First Avenger', year: 2011, phase: 1, phase_order: 5 },
        { id: 6, title: 'The Avengers', year: 2012, phase: 1, phase_order: 6 },
        // Phase 2
        { id: 7, title: 'Iron Man 3', year: 2013, phase: 2, phase_order: 1 },
        { id: 8, title: 'Thor: The Dark World', year: 2013, phase: 2, phase_order: 2 },
        { id: 9, title: 'Captain America: The Winter Soldier', year: 2014, phase: 2, phase_order: 3 },
        { id: 10, title: 'Guardians of the Galaxy', year: 2014, phase: 2, phase_order: 4 },
        { id: 11, title: 'Avengers: Age of Ultron', year: 2015, phase: 2, phase_order: 5 },
        { id: 12, title: 'Ant-Man', year: 2015, phase: 2, phase_order: 6 },
        // Phase 3
        { id: 13, title: 'Captain America: Civil War', year: 2016, phase: 3, phase_order: 1 },
        { id: 14, title: 'Doctor Strange', year: 2016, phase: 3, phase_order: 2 },
        { id: 15, title: 'Guardians of the Galaxy Vol. 2', year: 2017, phase: 3, phase_order: 3 },
        { id: 16, title: 'Spider-Man: Homecoming', year: 2017, phase: 3, phase_order: 4 },
        { id: 17, title: 'Thor: Ragnarok', year: 2017, phase: 3, phase_order: 5 },
        { id: 18, title: 'Black Panther', year: 2018, phase: 3, phase_order: 6 },
        { id: 19, title: 'Avengers: Infinity War', year: 2018, phase: 3, phase_order: 7 },
        { id: 20, title: 'Ant-Man and the Wasp', year: 2018, phase: 3, phase_order: 8 },
        { id: 21, title: 'Captain Marvel', year: 2019, phase: 3, phase_order: 9 },
        { id: 22, title: 'Avengers: Endgame', year: 2019, phase: 3, phase_order: 10 },
        { id: 23, title: 'Spider-Man: Far From Home', year: 2019, phase: 3, phase_order: 11 }
      ];
      setFilms(fallbackFilms);
      await fetchRankings(fallbackFilms);
    }
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
      // Initialize with default values if table doesn't exist yet
      const defaultRankings = filmsData.map(film => ({
        film_id: film.id,
        title: film.title,
        year: film.year,
        phase: film.phase,
        phase_order: film.phase_order,
        score: '5'
      }));
      setRankings(defaultRankings);
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