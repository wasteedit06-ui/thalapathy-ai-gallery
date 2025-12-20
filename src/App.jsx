import React, { useState, useEffect } from 'react';
import { Plus, LogIn, LogOut } from 'lucide-react';
import Grid from './components/Grid';
import ImageCard from './components/ImageCard';
import Modal from './components/Modal';
import UploadModal from './components/UploadModal';
import LoginModal from './components/LoginModal';
import { supabase } from './supabaseClient';

function App() {
  const [cards, setCards] = useState([]);
  const [selectedCard, setSelectedCard] = useState(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isBlurred, setIsBlurred] = useState(false);

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

  return (
    <div className="app" style={{ filter: isBlurred ? 'blur(20px)' : 'none', transition: 'filter 0.3s ease' }}>
      <header style={{
        padding: '2rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1rem',
        position: 'relative'
      }}>
        <div style={{ position: 'absolute', top: '2rem', right: '2rem' }}>
          {session ? (
            <button
              onClick={handleLogout}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                backgroundColor: 'var(--bg-card)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-color)',
                fontSize: '0.9rem'
              }}
            >
              <LogOut size={16} /> Logout
            </button>
          ) : (
            <button
              onClick={() => setIsLoginModalOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                backgroundColor: 'var(--bg-card)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-color)',
                fontSize: '0.9rem',
                fontWeight: '500'
              }}
            >
              <LogIn size={16} /> Admin Login
            </button>
          )}
        </div>

        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '0.5rem' }}>Thalapathy AI Image Prompt</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Explore the prompts behind the imagination</p>
        </div>

        {session && (
          <button
            onClick={() => setIsUploadModalOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'var(--accent-color)',
              color: 'white',
              padding: '0.75rem 1.5rem',
              borderRadius: '50px',
              fontWeight: '600',
              boxShadow: 'var(--shadow-md)',
              transition: 'transform 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <Plus size={20} /> Add New
          </button>
        )}
      </header>

      <main>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
            Loading gallery...
          </div>
        ) : cards.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
            No images yet. Be the first to upload one!
          </div>
        ) : (
          <Grid>
            {cards.map((item) => (
              <ImageCard
                key={item.id}
                image={item.image_url}
                prompt={item.prompt}
                onClick={() => setSelectedCard(item)}
              />
            ))}
          </Grid>
        )}
      </main>

      {selectedCard && (
        <Modal
          image={selectedCard.image_url}
          prompt={selectedCard.prompt}
          onClose={() => setSelectedCard(null)}
        />
      )}

      {isUploadModalOpen && (
        <UploadModal
          onClose={() => setIsUploadModalOpen(false)}
          onUploadSuccess={handleUploadSuccess}
        />
      )}

      {isLoginModalOpen && (
        <LoginModal
          onClose={() => setIsLoginModalOpen(false)}
          onLoginSuccess={(user) => {
            setSession({ user });
          }}
        />
      )}
    </div>
  );
}

export default App;
