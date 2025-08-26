
import type { CSSProperties } from 'react';
import React, { useEffect, useState } from 'react';

// 这是一个使用标准React的demo组件
interface ReactDemoProps {
  title?: string;
}

const ReactDemo: React.FC<ReactDemoProps> = ({ title = 'React Demo' }) => {
  const [count, setCount] = useState(0);
  const [message, setMessage] = useState('Hello from Standard React!');


  useEffect(() => {
    if (count > 0) {
      setMessage(`You clicked ${count} times!`);
    }
  }, [count]);

  const handleIncrement = () => {
    setCount((prev) => prev + 1);
  };

  const handleDecrement = () => {
    setCount((prev) => Math.max(0, prev - 1));
  };

  const handleReset = () => {
    setCount(0);
    setMessage('Hello from Standard React!');
  };

  const containerStyle = {
    padding: '20px',
    border: '2px solid #007bff',
    background: 'red',
    borderRadius: '8px',
    margin: '10px',
    backgroundColor: '#f8f9fa',
    fontFamily: 'Arial, sans-serif',
  } as CSSProperties;

  const titleStyle = {
    color: '#007bff',
    marginBottom: '15px',
  } as CSSProperties;

  const sectionStyle = {
    marginBottom: '15px',
  } as CSSProperties;

  const messageStyle = {
    fontSize: '16px',
    color: '#333',
  } as CSSProperties;

  const countStyle = {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#007bff',
  } as CSSProperties;

  const buttonsStyle = {
    display: 'flex',
    gap: '10px',
    marginBottom: '15px',
  } as CSSProperties;

  const baseButtonStyle = {
    padding: '8px 16px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    marginRight: '10px',
  } as CSSProperties;

  const infoStyle = {
    marginTop: '15px',
    fontSize: '12px',
    color: '#666',
  } as CSSProperties;

  return (
    <div style={containerStyle} className='react-demo-dom-tree'>
      <h3 style={titleStyle}>
        {title}
      </h3>

      <div style={sectionStyle}>
        <p style={messageStyle}>
          {message}
        </p>
      </div>

      <div style={sectionStyle}>
        <span style={countStyle}>
          Count:
          {' '}
          {count}
        </span>
      </div>

      <div style={buttonsStyle}>
        <button
          onClick={handleIncrement}
          style={{ ...baseButtonStyle, backgroundColor: '#28a745', color: 'white' } as CSSProperties}
        >
          +1
        </button>

        <button
          onClick={handleDecrement}
          style={{ ...baseButtonStyle, backgroundColor: '#dc3545', color: 'white' } as CSSProperties}
        >
          -1
        </button>

        <button
          onClick={handleReset}
          style={{ ...baseButtonStyle, backgroundColor: '#6c757d', color: 'white' } as CSSProperties}
        >
          Reset
        </button>
      </div>

      <div style={infoStyle}>
        <p>✅ This component uses standard React hooks (useState, useEffect)</p>
        <p>✅ This component uses React.FC type annotation</p>
        <p>✅ This component demonstrates React state management</p>
      </div>
    </div>
  );
};

export default ReactDemo;
