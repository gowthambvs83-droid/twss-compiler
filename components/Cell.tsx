
import React from 'react';
import { Cell as CellType, Language } from '../types';
import { PlayIcon } from '../constants';
import ChartRenderer from './ChartRenderer';
import Spinner from './Spinner';

interface CellProps {
  cell: CellType;
  cellNumber: number;
  onUpdate: (id: string, content: string) => void;
  onRun: (id:string) => void;
  language: Language;
}

const Cell: React.FC<CellProps> = ({ cell, cellNumber, onUpdate, onRun, language }) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.currentTarget.selectionStart;
      const end = e.currentTarget.selectionEnd;
      const value = e.currentTarget.value;
      e.currentTarget.value = value.substring(0, start) + '  ' + value.substring(end);
      e.currentTarget.selectionStart = e.currentTarget.selectionEnd = start + 2;
    }
  };

  const getOutputComponent = () => {
    if (cell.status === 'running') {
      return <Spinner />;
    }
    if (!cell.output) {
      return null;
    }
    if (typeof cell.output === 'string') {
      return <pre className="whitespace-pre-wrap break-words">{cell.output}</pre>;
    }
    // It's a ChartData object
    return <ChartRenderer chartData={cell.output} />;
  };

  const outputBgColor = cell.status === 'error' ? 'bg-red-900/20 border-red-500/50' : 'bg-gray-800/50 border-gray-700';

  return (
    <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
      <div className="flex items-start">
        <div className="flex-shrink-0 flex items-center p-4">
          <span className="text-gray-400 text-sm mr-2 font-mono">In [{cellNumber}]:</span>
          <button
            onClick={() => onRun(cell.id)}
            disabled={cell.status === 'running'}
            className="bg-blue-600 text-white rounded-full p-2 hover:bg-blue-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
            aria-label="Run cell"
          >
            {cell.status !== 'running' ? <PlayIcon /> : <Spinner small={true} />}
          </button>
        </div>
        <div className="flex-grow p-4">
          <textarea
            value={cell.content}
            onChange={(e) => onUpdate(cell.id, e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full bg-transparent text-gray-200 resize-none outline-none font-mono text-sm leading-relaxed"
            placeholder={`Enter ${language} code here...`}
            rows={Math.max(3, cell.content.split('\n').length)}
            spellCheck="false"
          />
        </div>
      </div>
      {cell.output && (
        <div className={`border-t ${outputBgColor} p-4 mt-2`}>
           <div className="text-gray-400 text-sm mb-2 font-mono">Out [{cellNumber}]:</div>
          <div className="text-gray-200 font-mono text-sm">
            {getOutputComponent()}
          </div>
        </div>
      )}
    </div>
  );
};

export default Cell;
