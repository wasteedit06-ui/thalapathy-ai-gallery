import React from 'react';
import PromptDisplay from './PromptDisplay';
import './ImageCard.css';
import watermarkImg from '../assets/watermark.png';

import { Trash2 } from 'lucide-react';

const ImageCard = ({ image, prompt, onClick, style, isAdmin, onDelete }) => {
    return (
        <div
            className="image-card"
            onClick={onClick}
            style={{
                ...style,
                animation: 'fadeInUp 0.8s cubic-bezier(0.22, 1, 0.36, 1) both'
            }}
        >
            <div className="image-wrapper">
                <img src={watermarkImg} className="watermark-img" alt="watermark" />
                <img
                    src={image}
                    alt="AI Generated"
                    loading="lazy"
                    className="card-image"
                    onContextMenu={(e) => e.preventDefault()}
                    draggable="false"
                />
                <div className="image-overlay">
                    <span>View Fullscreen</span>
                </div>
                {isAdmin && (
                    <button
                        className="card-delete-btn"
                        onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm('Are you sure you want to delete this image permanently?')) {
                                onDelete();
                            }
                        }}
                        title="Delete Image"
                    >
                        <Trash2 size={20} />
                    </button>
                )}
            </div>
            <PromptDisplay prompt={prompt} />
        </div>
    );
};

export default ImageCard;
