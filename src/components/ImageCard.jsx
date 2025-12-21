import React from 'react';
import PromptDisplay from './PromptDisplay';
import './ImageCard.css';
import watermarkImg from '../assets/watermark.png';

const ImageCard = ({ image, prompt, onClick, style }) => {
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
            </div>
            <PromptDisplay prompt={prompt} />
        </div>
    );
};

export default ImageCard;
