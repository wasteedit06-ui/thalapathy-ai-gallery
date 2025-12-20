import React from 'react';
import './Grid.css';

const Grid = ({ children }) => {
    return (
        <div className="grid-container">
            {children}
        </div>
    );
};

export default Grid;
