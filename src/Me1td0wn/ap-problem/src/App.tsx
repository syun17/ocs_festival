import { useState, useEffect } from 'react'
import './App.css'

type Board = number[][]

interface SolutionResult {
  path: string[]
  boards: Board[]
}

function App() {
  const [size, setSize] = useState(3)
  const [board, setBoard] = useState<Board>([])
  const [moves, setMoves] = useState(0)
  const [isComplete, setIsComplete] = useState(false)
  const [emptyPos, setEmptyPos] = useState({ row: 0, col: 0 })
  const [isSolving, setIsSolving] = useState(false)
  const [solution, setSolution] = useState<SolutionResult | null>(null)
  const [showHint, setShowHint] = useState(false)

  // ゴール盤面を生成
  const createGoalBoard = (n: number): Board => {
    const goal: Board = []
    let num = 1
    for (let i = 0; i < n; i++) {
      const row: number[] = []
      for (let j = 0; j < n; j++) {
        if (i === n - 1 && j === n - 1) {
          row.push(0) // 空白マス
        } else {
          row.push(num++)
        }
      }
      goal.push(row)
    }
    return goal
  }

  // 盤面が完成しているか判定
  const checkComplete = (currentBoard: Board): boolean => {
    const goal = createGoalBoard(size)
    return JSON.stringify(currentBoard) === JSON.stringify(goal)
  }

  // 空白マスの位置を見つける
  const findEmptyPosition = (currentBoard: Board): { row: number; col: number } => {
    for (let i = 0; i < currentBoard.length; i++) {
      for (let j = 0; j < currentBoard[i].length; j++) {
        if (currentBoard[i][j] === 0) {
          return { row: i, col: j }
        }
      }
    }
    return { row: 0, col: 0 }
  }

  // 盤面をシャッフル（解ける状態を保証）
  const shuffleBoard = (n: number) => {
    const newBoard = createGoalBoard(n)
    const shuffleMoves = n * n * 10 // 十分な回数シャッフル

    let currentBoard = newBoard.map(row => [...row])
    let emptyRow = n - 1
    let emptyCol = n - 1

    for (let i = 0; i < shuffleMoves; i++) {
      const directions = []
      if (emptyRow > 0) directions.push({ dr: -1, dc: 0 }) // 上
      if (emptyRow < n - 1) directions.push({ dr: 1, dc: 0 }) // 下
      if (emptyCol > 0) directions.push({ dr: 0, dc: -1 }) // 左
      if (emptyCol < n - 1) directions.push({ dr: 0, dc: 1 }) // 右

      const randomDir = directions[Math.floor(Math.random() * directions.length)]
      const newRow = emptyRow + randomDir.dr
      const newCol = emptyCol + randomDir.dc

      // 駒を移動
      currentBoard[emptyRow][emptyCol] = currentBoard[newRow][newCol]
      currentBoard[newRow][newCol] = 0
      emptyRow = newRow
      emptyCol = newCol
    }

    setBoard(currentBoard)
    setEmptyPos({ row: emptyRow, col: emptyCol })
    setMoves(0)
    setIsComplete(false)
  }

  // 初期化
  useEffect(() => {
    shuffleBoard(size)
  }, [size])

  // タイルをクリックしたときの処理
  const handleTileClick = (row: number, col: number) => {
    if (isComplete) return

    const rowDiff = Math.abs(row - emptyPos.row)
    const colDiff = Math.abs(col - emptyPos.col)

    // 空白マスに隣接しているか確認
    if ((rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1)) {
      const newBoard = board.map(r => [...r])
      newBoard[emptyPos.row][emptyPos.col] = newBoard[row][col]
      newBoard[row][col] = 0

      setBoard(newBoard)
      setEmptyPos({ row, col })
      setMoves(moves + 1)

      // 完成判定
      if (checkComplete(newBoard)) {
        setIsComplete(true)
      }
    }
  }

  // リセット
  const handleReset = () => {
    shuffleBoard(size)
  }

  // 難易度変更
  const handleSizeChange = (newSize: number) => {
    setSize(newSize)
  }

  // 幅優先探索（BFS）で最小解を求める（Pythonコードベース）
  const solvePuzzle = (): { path: string[], boards: Board[] } | null => {
    const goalBoard = createGoalBoard(size)
    const goalKey = JSON.stringify(goalBoard)
    const startKey = JSON.stringify(board)

    if (startKey === goalKey) return { path: [], boards: [] }

    interface QueueState {
      board: Board
      path: string[]
      boards: Board[]
    }

    const queue: QueueState[] = [{ 
      board: board.map(r => [...r]), 
      path: [],
      boards: [board.map(r => [...r])]
    }]
    const visited = new Set<string>([startKey])

    // 方向: 下, 左, 上, 右（Pythonコードと同じ順序）
    const directions = [
      { dr: 1, dc: 0, name: '↓' },
      { dr: 0, dc: -1, name: '←' },
      { dr: -1, dc: 0, name: '↑' },
      { dr: 0, dc: 1, name: '→' }
    ]

    while (queue.length > 0) {
      const current = queue.shift()!
      
      // 最大探索数制限（大きい盤面では時間がかかるため）
      if (visited.size > 100000) {
        return null
      }

      // 空白マス（0）を見つける
      let emptyR = 0, emptyC = 0
      outer: for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
          if (current.board[i][j] === 0) {
            emptyR = i
            emptyC = j
            break outer
          }
        }
      }

      // 各方向に移動を試す
      for (const dir of directions) {
        const newR = emptyR + dir.dr
        const newC = emptyC + dir.dc

        // 範囲チェック
        if (newR < 0 || newR >= size || newC < 0 || newC >= size) continue

        // 新しい盤面を作成（空白と隣接マスを交換）
        const newBoard = current.board.map(r => [...r])
        const movedTile = newBoard[newR][newC]
        newBoard[emptyR][emptyC] = movedTile
        newBoard[newR][newC] = 0

        const newKey = JSON.stringify(newBoard)

        // 既に訪問済みならスキップ
        if (visited.has(newKey)) continue

        const newPath = [...current.path, `${movedTile}を${dir.name}に移動`]
        const newBoards = [...current.boards, newBoard.map(r => [...r])]

        // ゴールに到達したか確認
        if (newKey === goalKey) {
          return { path: newPath, boards: newBoards }
        }

        visited.add(newKey)
        queue.push({ board: newBoard, path: newPath, boards: newBoards })
      }
    }

    return null // 解が見つからない
  }

  // ヒント表示
  const handleShowHint = () => {
    if (isComplete) return
    setIsSolving(true)
    
    setTimeout(() => {
      const result = solvePuzzle()
      if (result) {
        setSolution(result)
        setShowHint(true)
      } else {
        alert('この盤面は非常に複雑です。リセットして新しい盤面をお試しください。')
      }
      setIsSolving(false)
    }, 100)
  }

  // 自動解答（アニメーション付き）
  const handleAutoSolve = async () => {
    if (isComplete) return
    setIsSolving(true)
    
    const result = solvePuzzle()
    setIsSolving(false)
    
    if (!result || result.boards.length === 0) {
      alert('解が見つかりませんでした。リセットしてお試しください。')
      return
    }

    // 解答手順を自動実行（盤面を順番に適用）
    for (let i = 1; i < result.boards.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 400))
      
      const nextBoard = result.boards[i]
      const nextEmpty = findEmptyPosition(nextBoard)
      
      setBoard(nextBoard)
      setEmptyPos(nextEmpty)
      setMoves(prev => prev + 1)
      
      // 最後の手でゴール判定
      if (i === result.boards.length - 1) {
        setIsComplete(true)
      }
    }
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <h1> スライドパズル</h1>
        <p className="subtitle">学園祭へようこそ！</p>
      </header>

      <div className="game-controls">
        <div className="difficulty-buttons">
          <button
            className={`difficulty-btn ${size === 3 ? 'active' : ''}`}
            onClick={() => handleSizeChange(3)}
          >
            初級 (3×3)
          </button>
          <button
            className={`difficulty-btn ${size === 4 ? 'active' : ''}`}
            onClick={() => handleSizeChange(4)}
          >
            中級 (4×4)
          </button>
          <button
            className={`difficulty-btn ${size === 5 ? 'active' : ''}`}
            onClick={() => handleSizeChange(5)}
          >
            上級 (5×5)
          </button>
        </div>

        <div className="game-info">
          <div className="move-counter">移動回数: <span className="counter-value">{moves}</span></div>
          <button className="reset-btn" onClick={handleReset}>
            リセット
          </button>
        </div>

        <div className="solver-buttons">
          <button 
            className="hint-btn" 
            onClick={handleShowHint}
            disabled={isSolving || isComplete}
          >
            💡 ヒントを見る
          </button>
          <button 
            className="auto-solve-btn" 
            onClick={handleAutoSolve}
            disabled={isSolving || isComplete}
          >
             自動解答
          </button>
        </div>
      </div>

      {showHint && solution && solution.path.length > 0 && (
        <div className="hint-overlay" onClick={() => setShowHint(false)}>
          <div className="hint-content" onClick={(e) => e.stopPropagation()}>
            <h3> 解答手順（最小手数: {solution.path.length}手）</h3>
            <div className="hint-steps">
              {solution.path.slice(0, 5).map((step: string, index: number) => (
                <div key={index} className="hint-step">
                  {index + 1}. {step}
                </div>
              ))}
              {solution.path.length > 5 && (
                <div className="hint-more">...他 {solution.path.length - 5}手</div>
              )}
            </div>
            <button className="close-hint-btn" onClick={() => setShowHint(false)}>
              閉じる
            </button>
          </div>
        </div>
      )}

      {isComplete && (
        <div className="complete-message">
          <div className="complete-content">
            <h2>完成！おめでとうございます！</h2>
            <p className="complete-moves">移動回数: {moves}回</p>
            <button className="play-again-btn" onClick={handleReset}>
              もう一度プレイ
            </button>
          </div>
        </div>
      )}

      {isSolving && (
        <div className="solving-overlay">
          <div className="solving-content">
            <div className="loader"></div>
            <p>解析中...</p>
          </div>
        </div>
      )}

      <div className="board-container">
        <div
          className="board"
          style={{
            gridTemplateColumns: `repeat(${size}, 1fr)`,
            gridTemplateRows: `repeat(${size}, 1fr)`
          }}
        >
          {board.map((row, rowIndex) =>
            row.map((tile, colIndex) => (
              <div
                key={`${rowIndex}-${colIndex}`}
                className={`tile ${tile === 0 ? 'empty' : ''} ${
                  Math.abs(rowIndex - emptyPos.row) + Math.abs(colIndex - emptyPos.col) === 1
                    ? 'movable'
                    : ''
                }`}
                onClick={() => handleTileClick(rowIndex, colIndex)}
              >
                {tile !== 0 && tile}
              </div>
            ))
          )}
        </div>
      </div>

      <footer className="app-footer">
        <p>空白に隣接する数字をクリックして移動させよう！</p>
        <p className="small-text">目標：1から順番に数字を並べる</p>
        <p className="exam-info"> 応用情報技術者試験 令和7年春期 午後問3</p>
        <p className="exam-info-sub">幅優先探索（BFS）アルゴリズムを使用した最小解探索</p>
      </footer>
    </div>
  )
}

export default App
