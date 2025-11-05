
import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Language, Cell as CellType } from './types';
import { executeCode } from './services/geminiService';
import { AddIcon, PythonIcon, CppIcon, UploadIcon } from './constants';
import Cell from './components/Cell';
import { supabase } from './services/supabaseClient';
import Spinner from './components/Spinner';

const App: React.FC = () => {
  const [language, setLanguage] = useState<Language>('python');
  const [cells, setCells] = useState<CellType[]>([]);
  const [csvFile, setCsvFile] = useState<{ name: string; content: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  const initialCell = (lang: Language): CellType => ({
    id: uuidv4(),
    content: lang === 'python' ? '# If you have uploaded a CSV, it is available as `df`\n# For example:\n# print(df.head())\n\nx = [i for i in range(10)]\nprint(x)' : '#include <iostream>\n\nint main() {\n    std::cout << "Hello, C++ World!" << std::endl;\n    return 0;\n}',
    output: null,
    status: 'idle'
  });

  useEffect(() => {
    const loadNotebook = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('notebook')
        .select('recentdata')
        .eq('id', 1)
        .single();
      
      if (data?.recentdata) {
        setCells(data.recentdata.cells || [initialCell('python')]);
        setLanguage(data.recentdata.language || 'python');
        setCsvFile(data.recentdata.csvFile || null);
      } else {
        setCells([initialCell('python')]);
      }

      if (error && error.code !== 'PGRST116') {
        console.error("Error loading notebook:", error.message);
      }
      setIsLoading(false);
    };
    loadNotebook();
  }, []);

  const notebookStateToSave = useMemo(() => ({
    cells, language, csvFile
  }), [cells, language, csvFile]);

  useEffect(() => {
    if (isLoading || !cells.length) return;

    setSaveStatus('saving');
    const handler = setTimeout(async () => {
      const { error } = await supabase
        .from('notebook')
        .upsert({ id: 1, recentdata: notebookStateToSave });
      
      if (error) {
        console.error("Error saving notebook:", error.message);
      } else {
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      }
    }, 1500);

    return () => clearTimeout(handler);
  }, [notebookStateToSave, isLoading, cells.length]);


  const switchLanguage = (newLang: Language) => {
    setLanguage(newLang);
    if (newLang === 'cpp') {
      setCsvFile(null);
    }
    setCells([initialCell(newLang)]);
  };
  
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setCsvFile({ name: file.name, content });
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const addCell = useCallback(() => {
    setCells(prev => [...prev, { id: uuidv4(), content: language === 'python' ? '# The variable `x` from the cell above is available here.\n# print([i*2 for i in x])' : '', output: null, status: 'idle' }]);
  }, [language]);

  const updateCell = useCallback((id: string, content: string) => {
    setCells(prev => prev.map(cell => cell.id === id ? { ...cell, content } : cell));
  }, []);

  const runCell = useCallback(async (id: string) => {
    const cellIndex = cells.findIndex(cell => cell.id === id);
    if (cellIndex < 0) return;
    const cellToRun = cells[cellIndex];

    setCells(prev => prev.map(cell => cell.id === id ? { ...cell, status: 'running', output: null } : cell));

    try {
      const historyCode = language === 'python' ? cells.slice(0, cellIndex).map(c => c.content) : [];
      const csvContentForPython = language === 'python' ? csvFile?.content : undefined;
      const result = await executeCode(cellToRun.content, historyCode, language, csvContentForPython);
      setCells(prev => prev.map(cell => cell.id === id ? { ...cell, status: 'success', output: result } : cell));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      setCells(prev => prev.map(cell => cell.id === id ? { ...cell, status: 'error', output: errorMessage } : cell));
    }
  }, [cells, language, csvFile]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex justify-center items-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 font-sans">
      <header className="sticky top-0 z-10 bg-gray-800/80 backdrop-blur-sm border-b border-gray-700 p-4 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <h1 className="text-2xl font-bold text-white">AI CodeBook</h1>
          {saveStatus === 'saving' && <span className="text-sm text-gray-400">Saving...</span>}
          {saveStatus === 'saved' && <span className="text-sm text-green-400">✓ Saved</span>}
        </div>
        <div className="flex items-center space-x-4">
           <button
            onClick={handleUploadClick}
            disabled={language !== 'python'}
            className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-md transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
          >
            <UploadIcon />
            <span>Upload CSV</span>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".csv"
            className="hidden"
          />
          <div className="flex items-center bg-gray-700 rounded-md p-1">
            <button
              onClick={() => switchLanguage('python')}
              className={`flex items-center space-x-2 px-3 py-1 rounded-md text-sm transition-colors ${language === 'python' ? 'bg-blue-600 text-white' : 'hover:bg-gray-600'}`}
            >
              <PythonIcon />
              <span>Python</span>
            </button>
            <button
              onClick={() => switchLanguage('cpp')}
              className={`flex items-center space-x-2 px-3 py-1 rounded-md text-sm transition-colors ${language === 'cpp' ? 'bg-blue-600 text-white' : 'hover:bg-gray-600'}`}
            >
              <CppIcon />
              <span>C++</span>
            </button>
          </div>
          <button
            onClick={addCell}
            className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-md transition-colors"
          >
            <AddIcon />
            <span>Add Cell</span>
          </button>
        </div>
      </header>

      <main className="p-4 md:p-8">
        {csvFile && language === 'python' && (
          <div className="bg-gray-700/50 border border-gray-600 rounded-lg p-3 mb-6 text-center text-sm">
            <p className="text-gray-300">
              File <span className="font-semibold text-green-400">{csvFile.name}</span> is loaded and available as the pandas DataFrame: <code className="bg-gray-800 px-1.5 py-0.5 rounded-md text-green-300 font-mono">df</code>
            </p>
          </div>
        )}
        <div className="flex flex-col space-y-6">
          {cells.map((cell, index) => (
            <Cell
              key={cell.id}
              cell={cell}
              cellNumber={index + 1}
              onUpdate={updateCell}
              onRun={runCell}
              language={language}
            />
          ))}
        </div>
      </main>
    </div>
  );
};

export default App;
