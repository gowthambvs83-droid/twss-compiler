
import React from 'react';

interface SpinnerProps {
    small?: boolean;
}

const Spinner: React.FC<SpinnerProps> = ({ small = false }) => {
  const sizeClass = small ? 'h-4 w-4 border-2' : 'h-8 w-8 border-4';
  return (
    <div className="flex justify-center items-center">
      <div className={`${sizeClass} border-blue-400 border-t-transparent rounded-full animate-spin`}></div>
    </div>
  );
};

export default Spinner;
