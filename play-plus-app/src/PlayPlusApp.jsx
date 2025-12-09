import React, { useState, useEffect } from 'react';

const PlayPlusApp = () => {
  const [currentPage, setCurrentPage] = useState('home');
  const [activeTab, setActiveTab] = useState('presence');
  const [hoveredDimension, setHoveredDimension] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [expandedGame, setExpandedGame] = useState(null);
  const [tooltipTimeout, setTooltipTimeout] = useState(null);
  const [activeGlossaryTerm, setActiveGlossaryTerm] = useState(null);
  const [currentQuest, setCurrentQuest] = useState(null);
  const [currentWorld, setCurrentWorld] = useState(null);

  // Helper functions
  const parseMarkdown = (text) => {
    if (!text) return text;
    const parts = [];
    let currentText = text;
    let key = 0;
    
    while (currentText.length > 0) {
      const boldMatch = currentText.match(/\*([^*]+)\*/);
      const italicMatch = currentText.match(/_([^_]+)_/);
      
      let nextMatch = null;
      let isBold = false;
      
      if (boldMatch && italicMatch) {
        if (currentText.indexOf(boldMatch[0]) < currentText.indexOf(italicMatch[0])) {
          nextMatch = boldMatch;
          isBold = true;
        } else {
          nextMatch = italicMatch;
        }
      } else if (boldMatch) {
        nextMatch = boldMatch;
        isBold = true;
      } else if (italicMatch) {
        nextMatch = italicMatch;
      }
      
      if (!nextMatch) {
        parts.push(<span key={key++}>{currentText}</span>);
        break;
      }
      
      const beforeText = currentText.substring(0, currentText.indexOf(nextMatch[0]));
      if (beforeText) parts.push(<span key={key++}>{beforeText}</span>);
      
      if (isBold) {
        parts.push(<strong key={key++} style={{ fontWeight: '700', color: '#fbbf24' }}>{nextMatch[1]}</strong>);
      } else {
        parts.push(<em key={key++} style={{ fontStyle: 'italic' }}>{nextMatch[1]}</em>);
      }
      
      currentText = currentText.substring(currentText.indexOf(nextMatch[0]) + nextMatch[0].length);
    }
    
    return parts.length > 0 ? parts : text;
  };

  const navigateToGame = (gameName) => {
    setCurrentPage(gameName);
    setHoveredDimension(null);
    window.scrollTo(0, 0);
  };

  const navigateHome = () => {
    setCurrentPage('home');
    window.scrollTo(0, 0);
  };

  const toggleGameDetails = (gameName) => {
    setExpandedGame(expandedGame === gameName ? null : gameName);
    setHoveredDimension(null);
  };

  // Dimensions
  const dimensions = {
    presence: {
      name: 'PRIMAL GAMES',
      tagline: 'Start here → learn the game mechanics.',
      color: '#06b6d4',
      darkColor: '#164e63',
      definition: 'Nine foundational games that teach you and your dog how to be present together.'
    },
    action: {
      name: 'FOUNDATION GAMES',
      tagline: 'Do things intentionally together.',
      color: '#10b981',
      darkColor: '#1e5f3f',
      definition: 'Learn specific actions and skills through structured games.'
    },
    adapt: {
      name: 'ADAPTIVE GAMES',
      tagline: 'Learn how to flow and adjust.',
      color: '#06b6d4',
      darkColor: '#164e63',
      definition: 'Take your skills into different contexts and situations.'
    },
    perform: {
      name: 'PERFORMANCE GAMES',
      tagline: 'Show it, express it, play at level.',
      color: '#10b981',
      darkColor: '#1e5f3f',
      definition: 'Put it all together with purpose.'
    },
    quests: {
      name: 'QUESTS',
      tagline: 'Explore worlds of Play',
      color: '#fbbf24',
      darkColor: '#92400e',
      definition: 'Journey through structured learning paths.'
    },
    glossary: {
      name: 'GLOSSARY',
      tagline: 'Key terms and concepts.',
      color: '#8b5cf6',
      darkColor: '#4c1d95',
      definition: 'Essential PLAY+ terminology.'
    }
  };

  // Primal Games - ALL 9 with full data
  const primalGames = [
    { 
      game: "Where is the Trigger?", 
      skill: "Awareness/Attention", 
      icon: "?",
      definition: "Learning to read the moment of action"
    },
    { 
      game: "This-Wait...Next!", 
      skill: "Initiative/Anticipation", 
      icon: "⏸",
      definition: "Building tension and resolution"
    },
    { 
      game: "Where is the Handler?", 
      skill: "Dismissal/Engagement", 
      icon: "🏃",
      definition: "Creating value through attention"
    },
    { 
      game: "Why is the Handler?", 
      skill: "Affordance/Partnership", 
      icon: "🎮",
      definition: "Handler as gateway to opportunities"
    },
    { 
      game: "This, That, the Other", 
      skill: "Flow/Function", 
      icon: "⚫",
      definition: "Sequencing skills smoothly"
    },
    { 
      game: "Which Way?", 
      skill: "Coupled Movement/Team Movement", 
      icon: "↔️",
      definition: "Reading and responding to pressure"
    },
    { 
      game: "What's Next?", 
      skill: "Coupling/Opportunity", 
      icon: "🔄",
      definition: "Reading transitions and flow"
    },
    { 
      game: "What Am I Doing Here?", 
      skill: "Presence/Synergy", 
      icon: "⭐",
      definition: "Handler awareness and intentionality"
    },
    { 
      game: "Give & Take", 
      skill: "Passing/Possession", 
      icon: "⇄",
      definition: "Bite mechanics and possession flow"
    }
  ];

  // Foundation Games
  const foundationGames = [
    { name: "Luring Game", category: "Default Games", description: "Following targets", icon: "🍪" },
    { name: "Take It!", category: "Default Games", description: "Basic object interaction", icon: "🎯" },
    { name: "Bite Game", category: "Default Games", description: "Grip and release control", icon: "🦷" },
    { name: "Drop Game", category: "Default Games", description: "Clean disc release", icon: "💿" },
    { name: "Give Game", category: "Default Games", description: "Voluntary surrender", icon: "🤝" },
    { name: "Attention Game", category: "Default Games", description: "Focus and connection", icon: "👁️" },
    { name: "Find It!", category: "Games", description: "Search and locate", icon: "🔍" },
    { name: "Capturing Game", category: "Default Games", description: "Marking natural behaviors", icon: "📸" },
    { name: "Shaping Game", category: "Default Games", description: "Progressive approximation", icon: "🎯" },
    { name: "Duration Game", category: "Games", description: "Sustained positions", icon: "⏱️" },
    { name: "Chasing Game", category: "Games", description: "Pursuit dynamics", icon: "🏃" },
    { name: "It's Yer Choice", category: "Games", description: "Impulse control foundation", icon: "✋" },
    { name: "Pressure Game", category: "Games", description: "Working through pressure", icon: "💪" },
    { name: "Threshold Game", category: "Games", description: "Boundary awareness", icon: "🚪" }
  ];

  // Home Page
  const HomePage = () => (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
      padding: '40px 20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '50px' }}>
          <h1 style={{ 
            color: 'white', 
            fontSize: '48px', 
            marginBottom: '10px',
            fontWeight: '700'
          }}>
            PLAY+
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '20px', marginBottom: '8px' }}>
            The four dimensions of training your dog as a partner
          </p>
          <p style={{ 
            color: '#64748b', 
            fontSize: '16px',
            fontFamily: 'monospace',
            letterSpacing: '2px'
          }}>
            PRESENCE → ACTION → ADAPT → PERFORM
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '20px',
          marginBottom: '40px'
        }}>
          {Object.entries(dimensions).map(([key, dim]) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              style={{
                padding: '24px',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                backgroundColor: activeTab === key ? dim.color : dim.darkColor,
                color: 'white',
                transform: activeTab === key ? 'translateY(-4px)' : 'translateY(0)',
                boxShadow: activeTab === key 
                  ? `0 10px 30px ${dim.color}80` 
                  : '0 4px 6px rgba(0, 0, 0, 0.3)',
                textAlign: 'left',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}
            >
              <span style={{ fontSize: '22px', fontWeight: '700' }}>
                {dim.name}
              </span>
              <span style={{ fontSize: '14px', fontWeight: '300', opacity: 0.85 }}>
                {dim.tagline}
              </span>
            </button>
          ))}
        </div>

        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '16px',
          padding: '30px',
          minHeight: '400px'
        }}>
          {activeTab === 'presence' && (
            <div>
              <h3 style={{ color: '#06b6d4', fontSize: '24px', marginBottom: '16px' }}>Primal Games</h3>
              <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '20px' }}>
                Nine foundational games that teach you and your dog how to be present together
              </p>
              {primalGames.map((game, idx) => (
                <div key={idx} style={{
                  background: 'rgba(6, 182, 212, 0.1)',
                  padding: '16px',
                  borderRadius: '8px',
                  marginBottom: '12px',
                  cursor: 'pointer'
                }}
                onClick={() => navigateToGame(game.game)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '24px' }}>{game.icon}</span>
                    <div>
                      <h4 style={{ color: 'white', margin: 0, marginBottom: '4px' }}>{game.game}</h4>
                      <p style={{ color: '#fbbf24', fontSize: '14px', margin: 0 }}>{game.skill}</p>
                      <p style={{ color: '#cbd5e1', fontSize: '13px', margin: 0, marginTop: '4px' }}>{game.definition}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'action' && (
            <div>
              <h3 style={{ color: '#10b981', fontSize: '24px', marginBottom: '16px' }}>Foundation Games</h3>
              <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '20px' }}>
                Learn specific actions and skills through structured games
              </p>
              {foundationGames.map((game, idx) => (
                <div key={idx} style={{
                  background: 'rgba(16, 185, 129, 0.1)',
                  padding: '16px',
                  borderRadius: '8px',
                  marginBottom: '12px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '24px' }}>{game.icon}</span>
                    <div>
                      <h4 style={{ color: 'white', margin: 0, marginBottom: '4px' }}>{game.name}</h4>
                      <p style={{ color: '#10b981', fontSize: '14px', margin: 0 }}>{game.category}</p>
                      <p style={{ color: '#cbd5e1', fontSize: '13px', margin: 0, marginTop: '4px' }}>{game.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'adapt' && (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <h3 style={{ color: '#06b6d4', fontSize: '24px', marginBottom: '16px' }}>Adaptive Games</h3>
              <p style={{ color: '#cbd5e1' }}>Coming soon! These games will teach you how to adapt and flow in different contexts.</p>
            </div>
          )}

          {activeTab === 'perform' && (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <h3 style={{ color: '#10b981', fontSize: '24px', marginBottom: '16px' }}>Performance Games</h3>
              <p style={{ color: '#cbd5e1' }}>Coming soon! Put it all together with purpose and skill.</p>
            </div>
          )}

          {activeTab === 'quests' && (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <h3 style={{ color: '#fbbf24', fontSize: '24px', marginBottom: '16px' }}>Quests</h3>
              <p style={{ color: '#cbd5e1' }}>Coming soon! Structured learning paths through the PLAY+ framework.</p>
            </div>
          )}

          {activeTab === 'glossary' && (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <h3 style={{ color: '#8b5cf6', fontSize: '24px', marginBottom: '16px' }}>Glossary</h3>
              <p style={{ color: '#cbd5e1' }}>Coming soon! Essential PLAY+ terminology and concepts.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const GamePage = () => {
    const game = primalGames.find(g => g.game === currentPage);
    
    if (!game) {
      return (
        <div style={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
          padding: '40px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{ textAlign: 'center', color: 'white' }}>
            <h1>Game not found</h1>
            <button onClick={navigateHome} style={{
              background: '#06b6d4',
              color: 'white',
              border: 'none',
              padding: '14px 28px',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              marginTop: '20px'
            }}>
              ← Back to All Games
            </button>
          </div>
        </div>
      );
    }

    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
        padding: '40px 20px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          
          <button 
            onClick={navigateHome}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#64748b',
              fontSize: '14px',
              cursor: 'pointer',
              marginBottom: '20px'
            }}
          >
            ← Back to Primal Games
          </button>

          <div style={{
            background: 'rgba(6, 182, 212, 0.1)',
            border: '2px solid #06b6d4',
            borderRadius: '16px',
            padding: '40px',
            marginBottom: '40px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
              {game.icon && <span style={{ fontSize: '48px' }}>{game.icon}</span>}
              <div>
                <h1 style={{ color: 'white', fontSize: '42px', margin: '0 0 8px 0', fontWeight: '700' }}>
                  {game.game}
                </h1>
                <div style={{
                  display: 'inline-block',
                  background: '#06b6d4',
                  color: 'white',
                  padding: '6px 16px',
                  borderRadius: '20px',
                  fontSize: '14px',
                  fontWeight: '600'
                }}>
                  PRIMAL GAME
                </div>
              </div>
            </div>
            
            {game.skill && (
              <div style={{ color: '#fbbf24', fontSize: '20px', fontWeight: '600', marginTop: '20px' }}>
                Primal Skill: {game.skill}
              </div>
            )}
            {game.definition && (
              <div style={{ color: '#94a3b8', fontSize: '16px', marginTop: '8px', fontStyle: 'italic' }}>
                {game.definition}
              </div>
            )}
          </div>

          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '12px',
            padding: '32px',
            marginBottom: '24px'
          }}>
            <h2 style={{ color: '#fbbf24', fontSize: '24px', fontWeight: '700', marginBottom: '20px' }}>
              📖 About This Game
            </h2>
            <p style={{ color: '#cbd5e1', fontSize: '16px', lineHeight: '1.7' }}>
              This is one of the nine foundational Primal Games in the PLAY+ framework. 
              Each game teaches a specific skill that builds the foundation for advanced play and partnership with your dog.
            </p>
          </div>

          <div style={{ textAlign: 'center', marginTop: '32px' }}>
            <button
              onClick={navigateHome}
              style={{
                background: '#06b6d4',
                color: 'white',
                border: 'none',
                padding: '14px 28px',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              ← Back to All Games
            </button>
          </div>
        </div>
      </div>
    );
  };

  return currentPage === 'home' ? <HomePage /> : <GamePage />;
};

export default PlayPlusApp;
