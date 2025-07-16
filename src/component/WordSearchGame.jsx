import { useState, useEffect, useRef } from 'react';

const WordSearchGame = () => {
  const [grid, setGrid] = useState([]);
  const [words, setWords] = useState([]);
  const [foundWords, setFoundWords] = useState(new Set());
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectedCells, setSelectedCells] = useState([]);
  const [startCell, setStartCell] = useState(null);
  const [currentCell, setCurrentCell] = useState(null);
  const [wordPlacements, setWordPlacements] = useState([]);
  const [wordList, setWordList] = useState([]); // Make this state
  const [loading, setLoading] = useState(true);
  const gridRef = useRef(null);

  const GRID_SIZE = 15;

  // Generate random letter
  const getRandomLetter = () => String.fromCharCode(65 + Math.floor(Math.random() * 26));

  // Check if position is valid
  const isValidPosition = (row, col) => row >= 0 && row < GRID_SIZE && col >= 0 && col < GRID_SIZE;

  // Get direction vectors
  const getDirections = () => [
    [-1, -1], [-1, 0], [-1, 1],  // Up-left, Up, Up-right
    [0, -1], [0, 1],   // Left, Right
    [1, -1], [1, 0], [1, 1]    // Down-left, Down, Down-right
  ];

  // Check if word can be placed at position
  const canPlaceWord = (grid, word, row, col, direction) => {
    const [dRow, dCol] = direction;

    for (let i = 0; i < word.length; i++) {
      const newRow = row + i * dRow;
      const newCol = col + i * dCol;

      if (!isValidPosition(newRow, newCol)) return false;

      const currentChar = grid[newRow][newCol];
      if (currentChar !== '' && currentChar !== word[i]) return false;
    }
    return true;
  };

  // Place word in grid
  const placeWord = (grid, word, row, col, direction) => {
    const [dRow, dCol] = direction;
    const positions = [];

    for (let i = 0; i < word.length; i++) {
      const newRow = row + i * dRow;
      const newCol = col + i * dCol;
      grid[newRow][newCol] = word[i];
      positions.push({ row: newRow, col: newCol });
    }

    return positions;
  };

  // Generate word search grid
  const generateGrid = (availableWords = wordList) => {
    if (availableWords.length === 0) return; // Don't generate if no words available

    // Initialize empty grid
    const newGrid = Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(''));

    // Select random words
    const selectedWords = [...availableWords]
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.floor(Math.random() * 5) + 12) // 12-16 words
      .filter(word => word.length >= 3 && word.length <= 12);

    const placements = [];
    const directions = getDirections();

    // Place words
    selectedWords.forEach(word => {
      let placed = false;
      let attempts = 0;

      while (!placed && attempts < 100) {
        const row = Math.floor(Math.random() * GRID_SIZE);
        const col = Math.floor(Math.random() * GRID_SIZE);
        const direction = directions[Math.floor(Math.random() * directions.length)];

        if (canPlaceWord(newGrid, word, row, col, direction)) {
          const positions = placeWord(newGrid, word, row, col, direction);
          placements.push({ word, positions });
          placed = true;
        }
        attempts++;
      }
    });

    // Fill empty spaces with random letters
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        if (newGrid[row][col] === '') {
          newGrid[row][col] = getRandomLetter();
        }
      }
    }

    setGrid(newGrid);
    setWords(selectedWords);
    setWordPlacements(placements);
    setFoundWords(new Set());
  };

  // Get cells in selection line
  const getCellsInLine = (start, end) => {
    if (!start || !end) return [];

    const cells = [];
    const rowDiff = end.row - start.row;
    const colDiff = end.col - start.col;
    const distance = Math.max(Math.abs(rowDiff), Math.abs(colDiff));

    if (distance === 0) return [start];

    // Check if it's a valid straight line (horizontal, vertical, or diagonal)
    const isValidLine = (rowDiff === 0) || (colDiff === 0) || (Math.abs(rowDiff) === Math.abs(colDiff));

    if (!isValidLine) return [];

    const rowStep = distance === 0 ? 0 : rowDiff / distance;
    const colStep = distance === 0 ? 0 : colDiff / distance;

    for (let i = 0; i <= distance; i++) {
      const row = start.row + Math.round(i * rowStep);
      const col = start.col + Math.round(i * colStep);
      cells.push({ row, col });
    }

    return cells;
  };

  // Handle mouse/touch start
  const handleCellStart = (row, col) => {
    setIsSelecting(true);
    setStartCell({ row, col });
    setCurrentCell({ row, col });
    setSelectedCells([{ row, col }]);
  };

  // Handle mouse/touch move
  const handleCellMove = (row, col) => {
    if (!isSelecting || !startCell) return;

    setCurrentCell({ row, col });
    const cells = getCellsInLine(startCell, { row, col });
    setSelectedCells(cells);
  };

  // Handle mouse/touch end
  const handleCellEnd = () => {
    if (!isSelecting || selectedCells.length === 0) {
      setIsSelecting(false);
      setSelectedCells([]);
      setStartCell(null);
      setCurrentCell(null);
      return;
    }

    // Check if selected cells form a valid word
    const selectedWord = selectedCells.map(cell => grid[cell.row][cell.col]).join('');
    const reversedWord = selectedWord.split('').reverse().join('');

    // Check if it matches any word in our list
    const matchedWord = words.find(word => word === selectedWord || word === reversedWord);

    if (matchedWord && !foundWords.has(matchedWord)) {
      setFoundWords(prev => new Set([...prev, matchedWord]));
    }

    setIsSelecting(false);
    setSelectedCells([]);
    setStartCell(null);
    setCurrentCell(null);
  };

  // Check if cell is part of a found word
  const isCellInFoundWord = (row, col) => {
    return wordPlacements.some(placement =>
      foundWords.has(placement.word) &&
      placement.positions.some(pos => pos.row === row && pos.col === col)
    );
  };

  // Check if cell is currently selected
  const isCellSelected = (row, col) => {
    return selectedCells.some(cell => cell.row === row && cell.col === col);
  };

  // Fetch words from API
  const fetchWords = async () => {
    try {
      setLoading(true);
      const response = await fetch('https://random-word-api.vercel.app/api?words=20&type=uppercase');
      const data = await response.json();
      console.log("Fetch call: ", data);
      setWordList(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching words:', error);
      // Fallback to default words if API fails
      const fallbackWords = [
        'JAVASCRIPT', 'REACT', 'COMPONENT', 'FUNCTION', 'VARIABLE', 'ARRAY',
        'OBJECT', 'STRING', 'NUMBER', 'BOOLEAN', 'METHOD', 'CLASS',
        'ELEMENT', 'RENDER', 'STATE', 'PROPS', 'HOOK', 'EVENT'
      ];
      setWordList(fallbackWords);
      setLoading(false);
    }
  };

  // Initialize game
  useEffect(() => {
    fetchWords();
  }, []);

  // Generate grid when words are available
  useEffect(() => {
    if (wordList.length > 0) {
      generateGrid(wordList);
    }
  }, [wordList]);

  // Handle new game button
  const handleNewGame = () => {
    generateGrid(wordList);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-xl font-semibold text-gray-600">Loading words...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center p-6 bg-gradient-to-br from-blue-50 to-purple-50 min-h-screen">
      <h1 className="text-4xl font-bold text-gray-800 mb-6">Word Search</h1>

      <div className="flex gap-8 items-start">
        {/* Game Grid */}
        <div className="flex flex-col items-center">
          <div
            ref={gridRef}
            className="grid grid-cols-15 gap-0 border-2 border-gray-400 bg-white p-2 rounded-lg shadow-lg"
            style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)` }}
          >
            {grid.map((row, rowIndex) =>
              row.map((letter, colIndex) => (
                <div
                  key={`${rowIndex}-${colIndex}`}
                  className={`
                    w-8 h-8 flex items-center justify-center text-sm font-bold cursor-pointer
                    select-none transition-colors duration-200
                    ${isCellInFoundWord(rowIndex, colIndex) ? 'bg-green-200 text-green-800' : ''}
                    ${isCellSelected(rowIndex, colIndex) ? 'bg-blue-200 text-blue-800' : ''}
                    ${!isCellInFoundWord(rowIndex, colIndex) && !isCellSelected(rowIndex, colIndex) ? 'hover:bg-gray-100' : ''}
                  `}
                  onMouseDown={() => handleCellStart(rowIndex, colIndex)}
                  onMouseEnter={() => handleCellMove(rowIndex, colIndex)}
                  onMouseUp={handleCellEnd}
                  onTouchStart={(e) => {
                    e.preventDefault();
                    handleCellStart(rowIndex, colIndex);
                  }}
                  onTouchMove={(e) => {
                    e.preventDefault();
                    const touch = e.touches[0];
                    const element = document.elementFromPoint(touch.clientX, touch.clientY);
                    if (element) {
                      const row = parseInt(element.getAttribute('data-row') || rowIndex);
                      const col = parseInt(element.getAttribute('data-col') || colIndex);
                      handleCellMove(row, col);
                    }
                  }}
                  onTouchEnd={(e) => {
                    e.preventDefault();
                    handleCellEnd();
                  }}
                  data-row={rowIndex}
                  data-col={colIndex}
                >
                  {letter}
                </div>
              ))
            )}
          </div>

          <button
            onClick={handleNewGame}
            className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            New Game
          </button>
        </div>

        {/* Word List */}
        <div className="bg-white p-4 rounded-lg shadow-lg">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Find These Words:</h2>
          <div className="grid grid-cols-1 gap-2">
            {words.map((word, index) => (
              <div
                key={index}
                className={`
                  px-3 py-1 rounded text-sm font-medium transition-colors
                  ${foundWords.has(word)
                    ? 'bg-green-100 text-green-800 line-through'
                    : 'bg-gray-100 text-gray-800'
                  }
                `}
              >
                {word}
              </div>
            ))}
          </div>

          <div className="mt-4 text-sm text-gray-600">
            Found: {foundWords.size} / {words.length}
          </div>

          {foundWords.size === words.length && (
            <div className="mt-4 text-center">
              <div className="text-green-600 font-bold text-lg">🎉 Congratulations! 🎉</div>
              <div className="text-green-600">You found all words!</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WordSearchGame;