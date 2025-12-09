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

  // Close glossary tooltip when clicking outside (mobile)
  useEffect(() => {
    if (!activeGlossaryTerm || !('ontouchstart' in window)) return;
    
    const handleTouchOutside = (e) => {
      const isGlossaryTouch = e.target.closest('[data-glossary-term]');
      if (!isGlossaryTouch) {
        setActiveGlossaryTerm(null);
      }
    };
    
    const timeoutId = setTimeout(() => {
      document.addEventListener('touchstart', handleTouchOutside);
    }, 150);
    
    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('touchstart', handleTouchOutside);
    };
  }, [activeGlossaryTerm]);

  // Helper function to parse markdown-style formatting
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

  const handleButtonHover = (key, event) => {
    if (tooltipTimeout) {
      clearTimeout(tooltipTimeout);
    }
    
    const timeout = setTimeout(() => {
      const rect = event.currentTarget.getBoundingClientRect();
      setHoveredDimension(key);
      setTooltipPosition({
        x: rect.left + rect.width / 2,
        y: rect.bottom + 8
      });
    }, 300);
    
    setTooltipTimeout(timeout);
  };

  const handleButtonLeave = () => {
    if (tooltipTimeout) {
      clearTimeout(tooltipTimeout);
    }
    setHoveredDimension(null);
  };

  const toggleGameDetails = (gameName) => {
    setExpandedGame(expandedGame === gameName ? null : gameName);
    setHoveredDimension(null);
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

  const dimensions = {
    presence: {
      name: 'PRIMAL GAMES',
      tagline: 'Start here → learn the game mechanics.',
      color: '#06b6d4',
      darkColor: '#164e63',
      definition: 'Nine foundational games that teach you and your dog how to be present together. These are the building blocks for everything else.'
    },
    action: {
      name: 'FOUNDATION GAMES',
      tagline: 'Do things intentionally together.',
      color: '#10b981',
      darkColor: '#1e5f3f',
      definition: 'Learn specific actions and skills through structured games. Build your basic repertoire of things you can do together.'
    },
    adapt: {
      name: 'ADAPTIVE GAMES',
      tagline: 'Learn how to flow and adjust.',
      color: '#06b6d4',
      darkColor: '#164e63',
      definition: 'Take your skills into different contexts and situations. Learn to read each other and adjust on the fly.'
    },
    perform: {
      name: 'PERFORMANCE GAMES',
      tagline: 'Show it, express it, play at level.',
      color: '#10b981',
      darkColor: '#1e5f3f',
      definition: 'Put it all together with purpose. Compete, demonstrate, or express your partnership at its highest level.'
    },
    quests: {
      name: 'QUESTS',
      tagline: 'Explore worlds of Play',
      color: '#fbbf24',
      darkColor: '#92400e',
      definition: 'Journey through structured learning paths that weave games together into meaningful narratives. Quests guide your exploration of the PLAY+ framework.'
    },
    glossary: {
      name: 'GLOSSARY',
      tagline: 'Key terms and concepts.',
      color: '#8b5cf6',
      darkColor: '#4c1d95',
      definition: 'Essential PLAY+ terminology. Capitalization matters - these terms have specific meanings in the PLAY+ framework.'
    }
  };

  const primalGames = [
    { 
      game: "Where is the Trigger?", 
      skill: "Awareness/Attention", 
      icon: "?",
      definition: "Scanning the whole environment vs. locking onto one thing",
      details: {
        whatYouLearn: "You'll learn how to hold a clean gap between your cue and your trigger so your dog has a moment to feel you, read the field, and prepare for cooperative action.",
        whatDogLearns: "Your dog learns to settle into a calm Expectancy after the cue and use that pause to scan for the specifying information that tells them the Trigger has arrived.",
        howItHappens: "You cue, pause, and Trigger. In the pause, the dog's Awareness opens; they tune into you and start actively searching for the Trigger.",
        videoUrl: "https://www.youtube.com/embed/VQ6x-oKUxJ0",
      }
    },
    { 
      game: "This-Wait...Next!", 
      skill: "Initiative/Anticipation", 
      icon: "⏸",
      definition: "Making it happen vs. getting ready for what's coming",
      details: {
        whatYouLearn: "How to create tension and resolution through expectant marking.",
        whatDogLearns: "How to follow the handler and to give Attention in anticipation of the Trigger.",
        howItHappens: "Through a simple sequence of gated performance using two behaviors with Wait cue as an Expectant Marker.",
        videoUrl: "https://www.youtube.com/embed/FYIXBLpSS30",
      }
    },
    { 
      game: "Where is the Handler?", 
      skill: "Dismissal/Engagement", 
      icon: "🏃",
      definition: "Checking out vs. being all-in",
      details: {
        whatYouLearn: "How to create space through dismissal and activate as a handler when your dog offers attention.",
        whatDogLearns: "That their attention activates the handler and creates opportunities.",
        howItHappens: "Through a cycle of dismissal, capturing ambient attention, activating as handler to afford game opportunities.",
        videoUrl: "https://www.youtube.com/embed/DU4kOBeLwpA",
      }
    },
    { 
      game: "Why is the Handler?", 
      skill: "Affordance/Partnership", 
      icon: "🎮",
      definition: "Reading what's possible vs. working together as a team",
      details: {
        whatYouLearn: "How to become an affordance for your dog - a gateway to the world.",
        whatDogLearns: "That the handler affords access to all the amazing things in the environment.",
        howItHappens: "Through two stages: Transport (Choose to Heel) and Interaction (Affordance Identification).",
      }
    },
    { 
      game: "This, That, the Other", 
      skill: "Flow/Function", 
      icon: "⚫",
      definition: "Moving smoothly vs. getting the job done",
      details: {
        whatYouLearn: "How to maintain intentionality across skills while creating flow.",
        whatDogLearns: "How to flow between different skills and recouple after each transition.",
        howItHappens: "Through practicing three known skills in three different sequences.",
        videoUrl: "https://www.youtube.com/embed/G3LcmFHUGPk",
      }
    },
    { 
      game: "Which Way?", 
      skill: "Coupled Movement/Team Movement", 
      icon: "↔️",
      definition: "Moving in sync vs. moving as one unit",
      details: {
        whatYouLearn: "How to use pressure in team movement - Push, Pull, Block, and Give to Pressure.",
        whatDogLearns: "How to read and respond to pressure from the handler.",
        howItHappens: "Through Front Crosses and Rear Crosses using pressure dynamics.",
      }
    },
    { 
      game: "What's Next?", 
      skill: "Coupling/Opportunity", 
      icon: "🔄",
      definition: "Being connected vs. seeing your chance",
      details: {
        whatYouLearn: "How to read orientation, commitment, and coupling in real time.",
        whatDogLearns: "That every approach holds opportunity and that orientation creates access.",
        howItHappens: "Through a 5-step sequence: Toss cookie, Mark orientation, Cue on commitment, Trigger on coupling, Flow into game.",
      }
    },
    { 
      game: "What Am I Doing Here?", 
      skill: "Presence/Synergy", 
      icon: "⭐",
      definition: "Showing up fully vs. everything clicking together",
      details: {
        whatYouLearn: "Intentional attention - marking your own coupling moments during skill performance.",
        whatDogLearns: "Coupling moments within skills become conscious and repeatable.",
        howItHappens: "Through marking key coupling moments in both dog's and handler's performance.",
        videoUrl: "https://www.youtube.com/embed/G3LcmFHUGPk",
      }
    },
    { 
      game: "Give & Take", 
      skill: "Passing/Possession", 
      icon: "⇄",
      definition: "Giving it up vs. holding onto control",
      details: {
        whatYouLearn: "Bite mechanics, the dialectic of the drop, and flow throttle through bitework.",
        whatDogLearns: "Bite, Drop, and Give as discriminated skills with patience and attention for access.",
        howItHappens: "Through Can You? and You Can't... stages with progressive challenge.",
      }
    }
  ];

  const HomePage = () => (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
      padding: '40px 20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '50px' }}>
          <h1 style={{ 
            color: 'white', 
            fontSize: '48px', 
            marginBottom: '10px',
            fontWeight: '700',
            letterSpacing: '-1px'
          }}>
            PLAY+
          </h1>
          <p style={{ 
            color: '#94a3b8', 
            fontSize: '20px',
            fontWeight: '300',
            marginBottom: '8px'
          }}>
            The four dimensions of training your dog as a partner
          </p>
          <p style={{ 
            color: '#64748b', 
            fontSize: '16px',
            fontWeight: '400',
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
          marginBottom: '40px',
          position: 'relative',
          zIndex: 1
        }}>
          {Object.entries(dimensions).map(([key, dim]) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              onMouseEnter={(e) => handleButtonHover(key, e)}
              onMouseLeave={handleButtonLeave}
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
                position: 'relative',
                zIndex: 1,
                textAlign: 'left',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}
            >
              <span style={{
                fontSize: '22px',
                fontWeight: '700',
                letterSpacing: '-0.5px'
              }}>
                {dim.name}
              </span>
              <span style={{
                fontSize: '14px',
                fontWeight: '300',
                color: 'rgba(255, 255, 255, 0.85)',
                lineHeight: '1.4'
              }}>
                {dim.tagline}
              </span>
            </button>
          ))}
        </div>

        {activeTab === 'presence' && (
          <div style={{ background: 'rgba(255, 255, 255, 0.05)', borderRadius: '12px', padding: '24px' }}>
            <h3 style={{ color: '#06b6d4', fontSize: '24px', marginBottom: '16px' }}>Primal Games</h3>
            <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '20px' }}>
              Building the ground of being through nine foundational pairings
            </p>
            
            {primalGames.map((game, idx) => (
              <div key={idx}>
                <div
                  onClick={() => navigateToGame(game.game)}
                  style={{
                    background: 'rgba(6, 182, 212, 0.1)',
                    padding: '16px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    marginBottom: '8px',
                    transition: 'background 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '24px' }}>{game.icon}</span>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ color: 'white', fontSize: '16px', fontWeight: '600', margin: 0, marginBottom: '4px' }}>{game.game}</h4>
                      <p style={{ color: '#fbbf24', fontSize: '14px', margin: 0 }}>{game.skill}</p>
                      <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0, marginTop: '4px' }}>{game.definition}</p>
                    </div>
                    <span style={{ color: '#06b6d4', fontSize: '20px' }}>▶</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'action' && (
          <div style={{ background: 'rgba(255, 255, 255, 0.05)', borderRadius: '12px', padding: '24px' }}>
            <h3 style={{ color: '#10b981', fontSize: '24px', marginBottom: '16px' }}>Foundation Games</h3>
            <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '20px' }}>Coming soon!</p>
          </div>
        )}

        {activeTab === 'adapt' && (
          <div style={{ background: 'rgba(255, 255, 255, 0.05)', borderRadius: '12px', padding: '24px', textAlign: 'center' }}>
            <h3 style={{ color: '#06b6d4', fontSize: '24px', marginBottom: '16px' }}>Adaptive Games</h3>
            <p style={{ color: '#cbd5e1' }}>Coming soon!</p>
          </div>
        )}

        {activeTab === 'perform' && (
          <div style={{ background: 'rgba(255, 255, 255, 0.05)', borderRadius: '12px', padding: '24px', textAlign: 'center' }}>
            <h3 style={{ color: '#10b981', fontSize: '24px', marginBottom: '16px' }}>Performance Games</h3>
            <p style={{ color: '#cbd5e1' }}>Coming soon!</p>
          </div>
        )}

        {activeTab === 'quests' && (
          <div style={{ background: 'rgba(255, 255, 255, 0.05)', borderRadius: '12px', padding: '24px', textAlign: 'center' }}>
            <h3 style={{ color: '#fbbf24', fontSize: '24px', marginBottom: '16px' }}>Quests</h3>
            <p style={{ color: '#cbd5e1' }}>Coming soon!</p>
          </div>
        )}

        {activeTab === 'glossary' && (
          <div style={{ background: 'rgba(255, 255, 255, 0.05)', borderRadius: '12px', padding: '24px', textAlign: 'center' }}>
            <h3 style={{ color: '#8b5cf6', fontSize: '24px', marginBottom: '16px' }}>Glossary</h3>
            <p style={{ color: '#cbd5e1' }}>Coming soon!</p>
          </div>
        )}
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
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
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
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 0'
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
                  fontWeight: '600',
                  letterSpacing: '0.5px'
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

          {game.details?.videoUrl && (
            <div style={{
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '12px',
              padding: '32px',
              marginBottom: '24px'
            }}>
              <h2 style={{
                color: '#fbbf24',
                fontSize: '24px',
                fontWeight: '700',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <span>🎥</span> Watch & Learn
              </h2>
              <p style={{ color: '#cbd5e1', fontSize: '16px', marginBottom: '16px' }}>
                Watch this video demonstration to see the game in action.
              </p>
              <a
                href={game.details.videoUrl.replace('/embed/', '/watch?v=')}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-block',
                  background: '#06b6d4',
                  color: 'white',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                ▶ Watch Video on YouTube
              </a>
            </div>
          )}

          {game.details && (
            <>
              <div style={{
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '12px',
                padding: '32px',
                marginBottom: '24px'
              }}>
                <h2 style={{
                  color: '#fbbf24',
                  fontSize: '24px',
                  fontWeight: '700',
                  marginBottom: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <span>👤</span> What You'll Learn
                </h2>
                <p style={{
                  color: '#cbd5e1',
                  fontSize: '16px',
                  lineHeight: '1.7',
                  margin: 0
                }}>
                  {game.details.whatYouLearn}
                </p>
              </div>

              <div style={{
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '12px',
                padding: '32px',
                marginBottom: '24px'
              }}>
                <h2 style={{
                  color: '#fbbf24',
                  fontSize: '24px',
                  fontWeight: '700',
                  marginBottom: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <span>🐕</span> What Your Dog Will Learn
                </h2>
                <p style={{
                  color: '#cbd5e1',
                  fontSize: '16px',
                  lineHeight: '1.7',
                  margin: 0
                }}>
                  {game.details.whatDogLearns}
                </p>
              </div>

              <div style={{
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '12px',
                padding: '32px',
                marginBottom: '24px'
              }}>
                <h2 style={{
                  color: '#fbbf24',
                  fontSize: '24px',
                  fontWeight: '700',
                  marginBottom: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <span>⚡</span> How It Happens
                </h2>
                <p style={{
                  color: '#cbd5e1',
                  fontSize: '16px',
                  lineHeight: '1.7',
                  margin: 0
                }}>
                  {game.details.howItHappens}
                </p>
              </div>
            </>
          )}

          <div style={{
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(16, 185, 129, 0.1) 100%)',
            border: '2px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            padding: '32px',
            textAlign: 'center'
          }}>
            <h2 style={{
              color: '#10b981',
              fontSize: '28px',
              fontWeight: '700',
              marginBottom: '16px'
            }}>
              Ready to Play?
            </h2>
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
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
      </div>
    );
  };

  return currentPage === 'home' ? <HomePage /> : <GamePage />;
};

export default PlayPlusApp;
