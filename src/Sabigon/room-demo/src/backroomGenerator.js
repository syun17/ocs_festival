// src/backroomGenerator.js
// Backroom Level 0 の迷路生成

export function generateBackroomLevel0(width, height) {
  const maze = Array.from({ length: height }, () =>
    Array.from({ length: width }, () => 0)
  );

  // バックルームは基本的に開けた空間だが、ランダムに壁を配置
  // より不規則で不気味な雰囲気を作る
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // 外周は壁
      if (x === 0 || x === width - 1 || y === 0 || y === height - 1) {
        maze[y][x] = 1;
      } 
      // ランダムに壁を配置（15%の確率）
      else if (Math.random() < 0.15) {
        maze[y][x] = 1;
      }
    }
  }

  // 壁が連続しすぎないように調整
  // 孤立した壁を作り、迷路のような雰囲気を作る
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      // 周囲の壁の数をカウント
      const surroundingWalls = 
        maze[y-1][x] + maze[y+1][x] + maze[y][x-1] + maze[y][x+1];
      
      // 周囲が全て壁の場合、この壁を削除
      if (maze[y][x] === 1 && surroundingWalls === 4) {
        maze[y][x] = 0;
      }
    }
  }

  return maze;
}

// 敵の初期配置位置を取得（今後の実装用）
export function getEnemySpawnPositions(maze, count = 3) {
  const freeSpaces = [];
  for (let y = 0; y < maze.length; y++) {
    for (let x = 0; x < maze[0].length; x++) {
      if (maze[y][x] === 0) {
        freeSpaces.push([x, y]);
      }
    }
  }

  // ランダムに敵の配置位置を選択
  const spawnPositions = [];
  for (let i = 0; i < Math.min(count, freeSpaces.length); i++) {
    const index = Math.floor(Math.random() * freeSpaces.length);
    spawnPositions.push(freeSpaces.splice(index, 1)[0]);
  }

  return spawnPositions;
}

// ジャンプスケアのトリガーポイントを取得（今後の実装用）
export function getJumpScareTriggers(maze, count = 5) {
  const freeSpaces = [];
  for (let y = 0; y < maze.length; y++) {
    for (let x = 0; x < maze[0].length; x++) {
      if (maze[y][x] === 0) {
        freeSpaces.push([x, y]);
      }
    }
  }

  // ランダムにジャンプスケアのトリガーポイントを選択
  const triggers = [];
  for (let i = 0; i < Math.min(count, freeSpaces.length); i++) {
    const index = Math.floor(Math.random() * freeSpaces.length);
    triggers.push(freeSpaces.splice(index, 1)[0]);
  }

  return triggers;
}
