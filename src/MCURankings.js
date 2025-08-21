import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import './MCURankings.css';

const MCURankings = ({ isReadOnly = false }) => {
  const [rankings, setRankings] = useState([]);
  const [films, setFilms] = useState([]);
  const [loading, setLoading] = useState(true);

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
      // First fetch films from database
      await fetchFilms();
    } catch (error) {
      console.error('Error in fetchData:', error);
      setLoading(false);
    }
  };

  const fetchFilms = async () => {
    try {
      const { data: filmsData, error: filmsError } = await supabase
        .from('mcu_films')
        .select('*')
        .order('id');

      if (filmsError) throw filmsError;

      setFilms(filmsData || []);
      
      // After films are loaded, fetch rankings
      await fetchRankings(filmsData || []);
    } catch (error) {
      console.error('Error fetching films:', error);
      // Fallback to hardcoded films if database table doesn't exist
      const fallbackFilms = [
        { id: 1, title: 'Iron Man', year: 2008 },
        { id: 2, title: 'The Incredible Hulk', year: 2008 },
        { id: 3, title: 'Iron Man 2', year: 2010 },
        { id: 4, title: 'Thor', year: 2011 },
        { id: 5, title: 'Captain America: The First Avenger', year: 2011 },
        { id: 6, title: 'The Avengers', year: 2012 },
        { id: 7, title: 'Iron Man 3', year: 2013 },
        { id: 8, title: 'Thor: The Dark World', year: 2013 },
        { id: 9, title: 'Captain America: The Winter Soldier', year: 2014 },
        { id: 10, title: 'Guardians of the Galaxy', year: 2014 },
        { id: 11, title: 'Avengers: Age of Ultron', year: 2015 },
        { id: 12, title: 'Ant-Man', year: 2015 },
        { id: 13, title: 'Captain America: Civil War', year: 2016 },
        { id: 14, title: 'Doctor Strange', year: 2016 },
        { id: 15, title: 'Guardians of the Galaxy Vol. 2', year: 2017 },
        { id: 16, title: 'Spider-Man: Homecoming', year: 2017 },
        { id: 17, title: 'Thor: Ragnarok', year: 2017 },
        { id: 18, title: 'Black Panther', year: 2018 },
        { id: 19, title: 'Avengers: Infinity War', year: 2018 },
        { id: 20, title: 'Ant-Man and the Wasp', year: 2018 },
        { id: 21, title: 'Captain Marvel', year: 2019 },
        { id: 22, title: 'Avengers: Endgame', year: 2019 },
        { id: 23, title: 'Spider-Man: Far From Home', year: 2019 }
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
        score: '5'
      }));
      setRankings(defaultRankings);
    } finally {
      setLoading(false);
    }
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
      
      <div className="table-container">
        <table className="rankings-table">
          <thead>
            <tr>
              <th>Film</th>
              <th>Year</th>
              <th>{isReadOnly ? 'Rating' : 'Your Rating'}</th>
            </tr>
          </thead>
          <tbody>
            {rankings.map(ranking => (
              <tr key={ranking.film_id}>
                <td className="film-title">{ranking.title}</td>
                <td className="film-year">{ranking.year}</td>
                <td className="score-cell">
                  {isReadOnly ? (
                    <span className="score-display">{ranking.score}</span>
                  ) : (
                    <select
                      value={ranking.score}
                      onChange={(e) => updateScore(ranking.film_id, e.target.value)}
                      className="score-select"
                    >
                      {scoreOptions.map(option => (
                        <option key={option} value={option}>
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
};

export default MCURankings;