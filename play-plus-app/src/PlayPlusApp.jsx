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
      // Check if touch is on a glossary term
      const isGlossaryTouch = e.target.closest('[data-glossary-term]');
      if (!isGlossaryTouch) {
        setActiveGlossaryTerm(null);
      }
    };

    // Add listener with a delay to avoid same touch that opened it
    const timeoutId = setTimeout(() => {
      document.addEventListener('touchstart', handleTouchOutside);
    }, 150);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('touchstart', handleTouchOutside);
    };
  }, [activeGlossaryTerm]);

  // Helper function to parse markdown-style formatting (*bold* and _italic_)
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

  // Glossary Terms
  const glossaryTerms = {
    "Actions": "Discrete, uncoupled units of movement or response, often context-specific and spontaneous. Actions are the building blocks of skills.",
    "Action Capacities": "The range of physical and mental abilities available to an individual or team during play. These capacities determine the feasibility and scope of actions, influencing the fluidity and effectiveness of interactions.",
    // ... (I'll include just a few for brevity, you can add the rest)
    "Awareness": "The broader perception that enables recognition of opportunities and informs attention; a foundational element in Play+.",
    "Behavior": "A combination of actions and skills. Play+ avoids the term due to its broad, sometimes ambiguous usage.",
  };

  // Parse text and add glossary tooltips (first instance only per section)
  const parseGlossaryTerms = (text, sectionId = 'default') => {
    if (!text || typeof text !== 'string') return text;

    const markedTermsKey = `marked_${sectionId}`;

    // Track which terms we've already marked in this section
    if (!window[markedTermsKey]) {
      window[markedTermsKey] = new Set();
    }

    const parts = [];
    let remaining = text;
    let key = 0;

    const handleTermInteraction = (term, event) => {
      const termKey = `${sectionId}-${term}`;
      setActiveGlossaryTerm(activeGlossaryTerm === termKey ? null : termKey);
    };

    const handleTouchStart = (term, event) => {
      event.preventDefault();
      event.stopPropagation();
      const termKey = `${sectionId}-${term}`;
      setActiveGlossaryTerm(activeGlossaryTerm === termKey ? null : termKey);
    };

    while (remaining.length > 0) {
      let earliestMatch = null;
      let earliestIndex = remaining.length;
      let matchedTerm = null;

      // Find the earliest unmarked glossary term
      Object.keys(glossaryTerms).forEach(term => {
        if (window[markedTermsKey].has(term)) return;

        const index = remaining.indexOf(term);
        if (index !== -1 && index < earliestIndex) {
          earliestIndex = index;
          earliestMatch = term;
          matchedTerm = term;
        }
      });

      if (!earliestMatch) {
        // No more glossary terms, apply markdown to remaining text
        const parsed = parseMarkdown(remaining);
        parts.push(...(Array.isArray(parsed) ? parsed : [parsed]));
        break;
      }

      // Add text before term (with markdown parsing)
      if (earliestIndex > 0) {
        const beforeText = remaining.substring(0, earliestIndex);
        const parsed = parseMarkdown(beforeText);
        parts.push(...(Array.isArray(parsed) ? parsed : [parsed]));
      }

      // Mark this term as used in this section
      window[markedTermsKey].add(matchedTerm);

      const termKey = `${sectionId}-${matchedTerm}`;
      const isActive = activeGlossaryTerm === termKey;

      // Add term with custom tooltip
      parts.push(
        <span
          key={`glossary-${sectionId}-${key++}`}
          style={{
            position: 'relative',
            display: 'inline-block'
          }}
        >
          <span
            data-glossary-term="true"
            onTouchStart={(e) => handleTouchStart(matchedTerm, e)}
            onMouseEnter={(e) => {
              // Only show on hover for desktop (non-touch devices)
              if (!('ontouchstart' in window)) {
                handleTermInteraction(matchedTerm, e);
              }
            }}
            onMouseLeave={(e) => {
              // Only hide on mouse leave for desktop
              if (!('ontouchstart' in window)) {
                setActiveGlossaryTerm(null);
              }
            }}
            style={{
              borderBottom: '2px dotted #8b5cf6',
              cursor: 'help',
              background: isActive ? 'rgba(139, 92, 246, 0.1)' : 'transparent',
              padding: '2px 4px',
              display: 'inline',
              boxDecorationBreak: 'clone',
              WebkitBoxDecorationBreak: 'clone',
              whiteSpace: 'normal',
              WebkitTapHighlightColor: 'transparent'
            }}
          >
            {matchedTerm}
          </span>
          {isActive && (
            <span
              className="glossary-tooltip"
              style={{
                position: 'absolute',
                bottom: '100%',
                left: '50%',
                transform: 'translateX(-50%)',
                marginBottom: '8px',
                background: 'rgba(0, 0, 0, 0.95)',
                color: '#e2e8f0',
                padding: '12px 16px',
                borderRadius: '8px',
                fontSize: '14px',
                lineHeight: '1.6',
                maxWidth: 'min(300px, 90vw)',
                width: 'max-content',
                zIndex: 10000,
                border: '1px solid #8b5cf6',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
                pointerEvents: 'none',
                whiteSpace: 'normal',
                wordWrap: 'break-word'
              }}
            >
              {glossaryTerms[matchedTerm]}
              <span
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 0,
                  height: 0,
                  borderLeft: '6px solid transparent',
                  borderRight: '6px solid transparent',
                  borderTop: '6px solid #8b5cf6'
                }}
              />
            </span>
          )}
        </span>
      );

      remaining = remaining.substring(earliestIndex + earliestMatch.length);
    }

    return parts;
  };

  const handleButtonHover = (key, event) => {
    // Clear any existing timeout
    if (tooltipTimeout) {
      clearTimeout(tooltipTimeout);
    }

    // Set a delay before showing tooltip
    const timeout = setTimeout(() => {
      const rect = event.currentTarget.getBoundingClientRect();
      setHoveredDimension(key);
      setTooltipPosition({
        x: rect.left + rect.width / 2,
        y: rect.bottom + 8
      });
    }, 300); // 300ms delay

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
    setHoveredDimension(null); // Clear tooltip when clicking game
  };

  const navigateToGame = (gameName) => {
    setCurrentPage(gameName);
    setHoveredDimension(null); // Clear tooltip when navigating
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
        whatYouLearn: "You'll learn how to create a clean gap between cue and trigger for cooperative action.",
        whatDogLearns: "Your dog learns to settle into calm expectancy and scan for the trigger moment.",
        howItHappens: "You cue, pause, and trigger. The dog's awareness opens during the pause.",
        videoUrl: "https://www.youtube.com/embed/VQ6x-oKUxJ0",
      }
    },
    // Add more games as needed...
  ];

  const foundationGames = [
    {
      name: "Luring Game",
      category: "Default Games",
      description: "Following targets",
      icon: "🍪",
      details: {
        whatYouLearn: "How to lure with gamified, attuned affect.",
        whatDogLearns: "That opportunities must be seized!",
        howItHappens: "Taking actions and skills you have and attempting to lure the dog.",
      }
    },
    // Add more games...
  ];

  // Home Page Component
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

        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '16px',
          padding: '30px',
          minHeight: '400px'
        }}>
          <h2 style={{ color: 'white', fontSize: '32px', marginBottom: '16px' }}>
            {dimensions[activeTab].name}
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '16px' }}>
            {dimensions[activeTab].definition}
          </p>

          {activeTab === 'presence' && (
            <div style={{ marginTop: '24px' }}>
              {primalGames.map((game, idx) => (
                <div key={idx} style={{
                  background: 'rgba(6, 182, 212, 0.1)',
                  padding: '16px',
                  borderRadius: '8px',
                  marginBottom: '12px'
                }}>
                  <h3 style={{ color: '#06b6d4', marginBottom: '8px' }}>{game.game}</h3>
                  <p style={{ color: '#cbd5e1', fontSize: '14px' }}>{game.definition}</p>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'action' && (
            <div style={{ marginTop: '24px' }}>
              {foundationGames.map((game, idx) => (
                <div key={idx} style={{
                  background: 'rgba(16, 185, 129, 0.1)',
                  padding: '16px',
                  borderRadius: '8px',
                  marginBottom: '12px'
                }}>
                  <h3 style={{ color: '#10b981', marginBottom: '8px' }}>{game.name}</h3>
                  <p style={{ color: '#cbd5e1', fontSize: '14px' }}>{game.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return currentPage === 'home' ? <HomePage /> : <div>Game Page Coming Soon...</div>;
};

export default PlayPlusApp;
