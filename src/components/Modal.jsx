import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import './Modal.css';

const Modal = ({ image, prompt, onClose }) => {
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
                <button className="modal-close" onClick={onClose}>
                    <X size={24} />
                </button>
                <div className="modal-image-container">
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
