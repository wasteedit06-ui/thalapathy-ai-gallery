import React from 'react';
import PromptDisplay from './PromptDisplay';
import './ImageCard.css';

const ImageCard = ({ image, prompt, onClick }) => {
    return (
        <div className="image-card" onClick={onClick}>
            <div className="image-wrapper">
                <img
                    src={image}
                    alt="AI Generated"
                    loading="lazy"
                    className="card-image"
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
