import React, { useState, useEffect } from 'react';
import { Plus, LogIn, LogOut, Instagram } from 'lucide-react';
import Grid from './components/Grid';
import ImageCard from './components/ImageCard';
import Modal from './components/Modal';
import UploadModal from './components/UploadModal';
import LoginModal from './components/LoginModal';
import { supabase } from './supabaseClient';



function App() {
  const [cards, setCards] = useState([]);
  const [activeCategory, setActiveCategory] = useState('GOAT');
  const [selectedCard, setSelectedCard] = useState(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isBlurred, setIsBlurred] = useState(false);

  // Dynamic Categories
  const DEFAULT_CATEGORIES = ['GOAT', 'Leo', 'Master', 'Beast', 'Varisu', 'Bigil', 'Mersal', 'Sarkar', 'JANA NAYAGAN'];
  const uniqueCategories = [...new Set([...DEFAULT_CATEGORIES, ...cards.map(card => card.category)])].filter(Boolean);

  const filteredCards = cards.filter(card => card.category === activeCategory);

  useEffect(() => {
    fetchCards();

    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Screenshot prevention
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Print Screen
      if (e.key === 'PrintScreen') {
        navigator.clipboard.writeText(''); // Clear clipboard (best effort)
        alert('Screenshots are disabled on this platform.');
        return;
      }

      // Ctrl+P (Print)
      if (e.ctrlKey && (e.key === 'p' || e.key === 'P')) {
        e.preventDefault();
        alert('Printing is disabled.');
        return;
      }

      // Ctrl+Shift+I (DevTools) - Optional deterrent
      if (e.ctrlKey && e.shiftKey && (e.key === 'i' || e.key === 'I')) {
        e.preventDefault();
        return;
      }

      // Ctrl+S (Save)
      if (e.ctrlKey && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        return;
      }
    };

    // Disable standard copy clipboard if not allowed
    const handleCopy = (e) => {
      // Optional: You could allow copying prompts but not images, 
      // but images are handled by oncontextmenu in components.
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('copy', handleCopy);

    const handleFocus = () => setIsBlurred(false);
    const handleBlur = () => setIsBlurred(true);

    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('copy', handleCopy);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  const fetchCards = async () => {
    try {
      const { data, error } = await supabase
        .from('cards')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCards(data || []);
    } catch (error) {
      console.error('Error fetching cards:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadSuccess = (newCard) => {
    setCards([newCard, ...cards]);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleDelete = async (cardId) => {
    try {
      // Find the card to get the image URL
      const cardToDelete = cards.find(card => card.id === cardId);
      if (!cardToDelete) {
        alert('Card not found');
        return;
      }

      console.log('Attempting to delete card:', cardId);

      // 1. Delete from Database FIRST (Optimization: if this fails, don't delete image yet)
      // We chain .select() to ensure we get the deleted record back. 
      // If RLS blocks it, this will likely return empty data or an error.
      const { data: deletedData, error: dbError } = await supabase
        .from('cards')
        .delete()
        .eq('id', cardId)
        .select();

      if (dbError) {
        console.error('Database deletion error:', dbError);
        throw dbError;
      }

      // VITAL CHECK: If no rows were returned, nothing was deleted (silent RLS failure)
      if (!deletedData || deletedData.length === 0) {
        console.error('Delete operation returned no data. Possible RLS policy violation.');
        throw new Error('Permission denied: Unable to delete this card. Please check your admin privileges.');
      }

      console.log('Database deletion successful, removed:', deletedData);

      // 2. Delete from Supabase Storage
      const imageUrl = cardToDelete.image_url;
      // ... existing filename extraction ...
      let fileName = '';
      if (imageUrl.includes('/images/')) {
        const parts = imageUrl.split('/images/');
        fileName = parts[1].split('?')[0];
      } else {
        const urlParts = imageUrl.split('/');
        fileName = urlParts[urlParts.length - 1].split('?')[0];
      }
      fileName = decodeURIComponent(fileName);

      const { data: storageData, error: storageError } = await supabase.storage
        .from('images')
        .remove([fileName]);

      if (storageError) {
        console.error('Storage deletion error:', storageError);
        // We don't throw here to avoid "undeleting" the DB record effectively 
        // (though ideally we'd use transactions, but simple flow is okay for now)
        alert('Card deleted, but image file cleanup failed: ' + storageError.message);
      } else {
        console.log('Storage deletion successful');
      }

      // 3. Update local state ONLY on success
      setCards(prevCards => prevCards.filter(card => card.id !== cardId));
      setSelectedCard(null);

      alert('Image deleted successfully and permanently!');
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete image: ' + error.message);
    }
  };

  const [isMigrating, setIsMigrating] = useState(false);
  const handleMigration = async () => {
    setIsMigrating(true);
    try {
      const { error } = await supabase
        .from('cards')
        .update({ category: 'Leo' })
        .is('category', null);

      if (error) throw error;
      alert('All existing images moved to Leo category successfully!');
      fetchCards();
    } catch (err) {
      console.error('Migration error:', err);
      alert('Failed to migrate: ' + err.message);
    } finally {
      setIsMigrating(false);
    }
  };

  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="app sweep-container" style={{
      filter: isBlurred ? 'blur(20px)' : 'none',
      transition: 'filter 0.5s ease',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Cinematic Background Effects */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: -1,
        pointerEvents: 'none',
        overflow: 'hidden'
      }}>
        {/* Golden Dust Particles */}
        {[...Array(20)].map((_, i) => (
          <div key={`p-${i}`} className="float" style={{
            position: 'absolute',
            width: Math.random() * 2 + 'px',
            height: Math.random() * 2 + 'px',
            background: 'var(--primary-gold)',
            borderRadius: '50%',
            top: Math.random() * 100 + '%',
            left: Math.random() * 100 + '%',
            opacity: 0.15,
            animationDelay: Math.random() * 5 + 's',
            animationDuration: (Math.random() * 10 + 8) + 's'
          }}></div>
        ))}
        {/* Fire Embers */}
        {[...Array(10)].map((_, i) => (
          <div key={`e-${i}`} className="ember" style={{
            left: Math.random() * 100 + '%',
            width: (Math.random() * 4 + 2) + 'px',
            height: (Math.random() * 4 + 2) + 'px',
            animationDuration: (Math.random() * 5 + 5) + 's',
            animationDelay: Math.random() * 10 + 's',
            boxShadow: '0 0 10px var(--accent-ember)'
          }}></div>
        ))}
      </div>


      <header className={`glass ${isScrolled ? 'scrolled' : ''}`} style={{
        padding: isScrolled ? '0.8rem 1.5rem' : '1.5rem',
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        zIndex: 1000,
        background: isScrolled ? 'var(--bg-glass-heavy)' : 'var(--bg-glass)',
        borderBottom: '1px solid var(--border-glass)',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        backdropFilter: 'blur(25px)'
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start'
        }}>
          <h1 className="shimmer-text" style={{
            fontSize: isScrolled ? '1.5rem' : '2.2rem',
            fontWeight: '900',
            fontFamily: 'var(--font-royal)',
            letterSpacing: '0.05em',
            lineHeight: 1.1,
            margin: 0,
            transition: 'all 0.4s ease'
          }}>
            Thalapathy AI Gallery
          </h1>
          {!isScrolled && (
            <p style={{
              color: 'var(--text-secondary)',
              fontSize: '0.8rem',
              fontWeight: '500',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              opacity: 0.8,
              margin: 0
            }}>
              GK Creation Collection
            </p>
          )}
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem'
        }}>
          {session ? (
            <button
              onClick={handleLogout}
              className="glass"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '0.6rem 1.2rem',
                borderRadius: '12px',
                color: 'var(--text-secondary)',
                fontSize: '0.9rem',
                fontWeight: '600'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.color = 'var(--secondary)';
                e.currentTarget.style.borderColor = 'var(--secondary)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.color = 'var(--text-secondary)';
                e.currentTarget.style.borderColor = 'var(--border-glass)';
              }}
            >
              <LogOut size={16} /> Logout
            </button>
          ) : (
            <button
              onClick={() => setIsLoginModalOpen(true)}
              className="glass"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '0.7rem 1.4rem',
                borderRadius: '14px',
                color: 'var(--primary-gold)',
                borderColor: 'var(--border-gold)',
                fontSize: '0.9rem',
                fontWeight: '700',
                boxShadow: '0 0 15px rgba(212, 175, 55, 0.1)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.boxShadow = '0 0 25px rgba(212, 175, 55, 0.3)';
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.borderColor = 'var(--primary-gold)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.boxShadow = '0 0 15px rgba(212, 175, 55, 0.1)';
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.borderColor = 'var(--border-gold)';
              }}
            >
              <LogIn size={18} strokeWidth={2.5} /> Admin Portal
            </button>
          )}
        </div>
      </header>

      <main style={{
        flex: 1,
        paddingTop: '100px',
        paddingBottom: '4rem',
        paddingLeft: '1.5rem',
        paddingRight: '1.5rem',
        transition: 'all 0.5s ease'
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>

          <div style={{
            textAlign: 'center',
            marginBottom: '4rem'
          }}>
            <h2 className="shimmer-text" style={{
              fontSize: 'clamp(2rem, 5vw, 3.5rem)',
              fontWeight: '900',
              fontFamily: 'var(--font-royal)',
              letterSpacing: '0.05em',
              marginBottom: '1rem'
            }}>
              {activeCategory} AI Image
            </h2>
            <div style={{
              width: '80px',
              height: '4px',
              background: 'linear-gradient(90deg, transparent, var(--primary-gold), transparent)',
              margin: '0 auto 2rem'
            }}></div>
          </div>

          {/* Cinematic Movie Categories */}
          <nav style={{
            display: 'flex',
            gap: '0.8rem',
            flexWrap: 'wrap',
            justifyContent: 'center',
            marginBottom: '3rem',
            padding: '0.5rem',
          }}>
            {uniqueCategories.map(movie => (
              <button
                key={movie}
                onClick={() => setActiveCategory(movie)}
                className="glass"
                style={{
                  padding: '0.6rem 1.4rem',
                  borderRadius: '50px',
                  fontSize: '0.8rem',
                  fontWeight: '800',
                  color: activeCategory === movie ? 'var(--bg-midnight)' : 'var(--primary-gold)',
                  background: activeCategory === movie
                    ? 'linear-gradient(135deg, var(--primary-gold), var(--accent-amber))'
                    : 'var(--bg-glass)',
                  border: activeCategory === movie
                    ? 'none'
                    : '1px solid var(--border-gold)',
                  cursor: 'pointer',
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: activeCategory === movie
                    ? '0 8px 25px rgba(212, 175, 55, 0.4)'
                    : 'none',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  fontFamily: 'var(--font-royal)'
                }}
              >
                {movie}
              </button>
            ))}
          </nav>

          {session && (
            <div style={{
              display: 'flex',
              gap: '1.5rem',
              flexWrap: 'wrap',
              justifyContent: 'center',
              marginBottom: '4rem'
            }}>
              <button
                onClick={() => setIsUploadModalOpen(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  background: 'linear-gradient(135deg, var(--primary-gold), var(--accent-amber))',
                  color: 'var(--bg-midnight)',
                  padding: '1rem 2.2rem',
                  borderRadius: '18px',
                  fontWeight: '800',
                  fontSize: '1.1rem',
                  boxShadow: '0 10px 30px rgba(245, 185, 66, 0.4)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'scale(1.05) translateY(-5px)';
                  e.currentTarget.style.boxShadow = '0 15px 40px rgba(245, 185, 66, 0.6)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'scale(1) translateY(0)';
                  e.currentTarget.style.boxShadow = '0 10px 30px rgba(245, 185, 66, 0.4)';
                }}
              >
                <Plus size={24} strokeWidth={3} /> Create New Masterpiece
              </button>
            </div>
          )}

          {loading ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '10rem 2rem',
              gap: '2rem'
            }}>
              <div className="loader" style={{
                width: '60px',
                height: '60px',
                border: '4px solid var(--border-glass)',
                borderTopColor: 'var(--primary-gold)',
                borderRadius: '50%',
                animation: 'spin 1s cubic-bezier(0.5, 0, 0.5, 1) infinite'
              }}></div>
              <style>{`
                @keyframes spin {
                  to { transform: rotate(360deg); }
                }
              `}</style>
              <span className="shimmer-text" style={{
                fontWeight: '800',
                letterSpacing: '0.3em',
                fontSize: '1.2rem',
                fontFamily: 'var(--font-royal)'
              }}>
                CHANNELLING ROYAL ENERGY...
              </span>
            </div>
          ) : filteredCards.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '10rem 2rem',
              color: 'var(--text-secondary)',
              background: 'var(--bg-glass)',
              borderRadius: '32px',
              border: '1px dashed var(--border-glass)',
              backdropFilter: 'blur(10px)'
            }}>
              <p style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem', color: 'white' }}>
                No masterpieces in {activeCategory} yet.
              </p>
              {session && <p>Begin the legacy by clicking "Create New Masterpiece".</p>}
            </div>
          ) : (
            <Grid>
              {filteredCards.map((item, index) => (
                <ImageCard
                  key={item.id}
                  image={item.image_url}
                  prompt={item.prompt}
                  onClick={() => setSelectedCard(item)}
                  style={{ animationDelay: `${index * 0.1}s` }}
                  isAdmin={!!session}
                  onDelete={() => handleDelete(item.id)}
                />
              ))}
            </Grid>
          )}
        </div>
      </main>

      {/* Floating Action Mobile / Admin */}
      {
        session && (
          <button
            onClick={() => setIsUploadModalOpen(true)}
            style={{
              position: 'fixed',
              bottom: '2rem',
              right: '2rem',
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--primary-gold), var(--accent-ember))',
              color: 'var(--bg-midnight)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 10px 25px rgba(245, 185, 66, 0.5)',
              zIndex: 1000
            }}
            className="float"
          >
            <Plus size={32} strokeWidth={3} />
          </button>
        )
      }

      <footer className="glass" style={{
        padding: '3rem',
        textAlign: 'center',
        marginTop: 'auto',
        borderTop: '1px solid var(--border-glass)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1.5rem'
      }}>
        <a
          href="https://www.instagram.com/gkcreation_6/"
          target="_blank"
          rel="noopener noreferrer"
          className="instagram-link"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            color: 'var(--primary-gold)',
            textDecoration: 'none',
            fontSize: '1.2rem',
            fontWeight: '700',
            fontFamily: 'var(--font-royal)',
            letterSpacing: '0.1em',
            padding: '1rem 2rem',
            background: 'var(--bg-glass)',
            border: '1px solid var(--border-gold)',
            borderRadius: '50px',
            transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            boxShadow: '0 0 20px rgba(212, 175, 55, 0.1)'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'scale(1.1) translateY(-5px)';
            e.currentTarget.style.boxShadow = '0 10px 30px rgba(212, 175, 55, 0.3)';
            e.currentTarget.style.background = 'var(--primary-gold)';
            e.currentTarget.style.color = 'var(--bg-midnight)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'scale(1) translateY(0)';
            e.currentTarget.style.boxShadow = '0 0 20px rgba(212, 175, 55, 0.1)';
            e.currentTarget.style.background = 'var(--bg-glass)';
            e.currentTarget.style.color = 'var(--primary-gold)';
          }}
        >
          <Instagram size={24} />
          <span>FOLLOW ON INSTAGRAM</span>
        </a>

        <div>
          <p style={{
            color: 'var(--primary-gold)',
            fontSize: '1rem',
            fontWeight: '700',
            fontFamily: 'var(--font-royal)',
            letterSpacing: '0.1em'
          }}>
            GK CREATION &copy; {new Date().getFullYear()}
          </p>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.5rem', opacity: 0.7 }}>
            Crafted for the future of digital sovereignty.
          </p>
        </div>
      </footer>

      {
        selectedCard && (
          <Modal
            image={selectedCard.image_url}
            prompt={selectedCard.prompt}
            onClose={() => setSelectedCard(null)}
            onDelete={handleDelete}
            isAdmin={!!session}
            cardId={selectedCard.id}
          />
        )
      }

      {
        isUploadModalOpen && (
          <UploadModal
            onClose={() => setIsUploadModalOpen(false)}
            onUploadSuccess={handleUploadSuccess}
          />
        )
      }

      {
        isLoginModalOpen && (
          <LoginModal
            onClose={() => setIsLoginModalOpen(false)}
            onLoginSuccess={(user) => {
              setSession({ user });
            }}
          />
        )
      }
    </div >
  );
}

export default App;
