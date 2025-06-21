import React from 'react';
import './Cube.css';

const Cube = () => {
  return (
    <div className="cube">
        <div className="top"></div>
        <div>
            <span style={{ '--i': 0 } as React.CSSProperties}></span>
            <span style={{ '--i': 1 } as React.CSSProperties}></span>
            <span style={{ '--i': 2 } as React.CSSProperties}></span>
            <span style={{ '--i': 3 } as React.CSSProperties}></span>
        </div>
    </div>
  );
};

export default Cube