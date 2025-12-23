import React, { useEffect } from 'react';
import { X, Trash2 } from 'lucide-react';
import './Modal.css';

const Modal = ({ image, prompt, onClose, onDelete, isAdmin, cardId }) => {
    const handleDelete = () => {
        if (window.confirm('Are you sure you want to delete this image? This action cannot be undone.')) {
            onDelete(cardId);
        }
    };
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        document.body.style.overflow = 'hidden';

        return () => {
            window.removeEventListener('keydown', handleEsc);
            document.body.style.overflow = 'unset';
        };
    }, [onClose]);

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div style={{
                    display: 'flex',
                    gap: '0.5rem',
                    position: 'absolute',
                    top: '1.5rem',
                    right: '1.5rem',
                    zIndex: 100
                }}>
                    {isAdmin && (
                        <button
                            className="modal-delete-btn"
                            onClick={handleDelete}
                            style={{
                                width: '48px',
                                height: '48px',
                                borderRadius: '50%',
                                background: 'rgba(220, 38, 38, 0.15)',
                                border: '1px solid rgba(220, 38, 38, 0.4)',
                                color: '#ef4444',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease'
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.background = 'rgba(220, 38, 38, 0.3)';
                                e.currentTarget.style.borderColor = '#ef4444';
                                e.currentTarget.style.transform = 'scale(1.1)';
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.background = 'rgba(220, 38, 38, 0.15)';
                                e.currentTarget.style.borderColor = 'rgba(220, 38, 38, 0.4)';
                                e.currentTarget.style.transform = 'scale(1)';
                            }}
                        >
                            <Trash2 size={24} />
                        </button>
                    )}
                    <button className="modal-close" onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>
                <div className="modal-image-container" style={{ position: 'relative' }}>
                    <div className="watermark" style={{ fontSize: '4rem', zIndex: 20 }}>THALAPATHY AI</div>
                    <img
                        src={image}
                        alt="Fullscreen"
                        className="modal-image"
                        onContextMenu={(e) => e.preventDefault()}
                        draggable="false"
                    />
                </div>
                <div className="modal-prompt">
                    <h3>Prompt</h3>
                    <p>{prompt}</p>
                </div>
            </div>
        </div>
    );
};

export default Modal;
