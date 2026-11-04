// V = standing upright (1 cell), H = lying along the x-axis (2 cells), S = lying along the y-axis (2 cells)
export type Orientation = "V" | "H" | "S"

export type Direction = "Up" | "Down" | "Left" | "Right"

export const DIRECTIONS: Direction[] = ["Up", "Down", "Left", "Right"]

// (x, y) is the top-left cell the block covers
export type Block = {
    x: number
    y: number
    orientation: Orientation
}

export type Move = {
    direction: Direction
    start_position: Orientation
    end_position: Orientation
}

export type Cell = { x: number; y: number }

export type Level = {
    width: number
    height: number
    tiles: boolean[][] // tiles[y][x]
    start: Block
    goal: Cell
}

// '#' tile, '.' empty, 'S' start (standing, on a tile), 'G' goal (a tile)
export function parseLevel(text: string): Level {
    const rows = text.split("\n").filter(row => row.trim().length > 0)
    const width = Math.max(...rows.map(row => row.length))
    const tiles: boolean[][] = []
    let start: Block | null = null
    let goal: Cell | null = null

    rows.forEach((row, y) => {
        tiles.push([])
        for (let x = 0; x < width; x++) {
            const ch = row[x] ?? "."
            tiles[y].push(ch === "#" || ch === "S" || ch === "G")
            if (ch === "S") start = { x, y, orientation: "V" }
            if (ch === "G") goal = { x, y }
        }
    })

    if (!start || !goal) throw new Error("Level needs one 'S' and one 'G'")
    return { width, height: rows.length, tiles, start, goal }
}

export function roll(block: Block, direction: Direction): Block {
    const { x, y, orientation } = block
    switch (orientation) {
        case "V":
            if (direction === "Right") return { x: x + 1, y, orientation: "H" }
            if (direction === "Left") return { x: x - 2, y, orientation: "H" }
            if (direction === "Down") return { x, y: y + 1, orientation: "S" }
            return { x, y: y - 2, orientation: "S" }
        case "H":
            if (direction === "Right") return { x: x + 2, y, orientation: "V" }
            if (direction === "Left") return { x: x - 1, y, orientation: "V" }
            if (direction === "Down") return { x, y: y + 1, orientation: "H" }
            return { x, y: y - 1, orientation: "H" }
        case "S":
            if (direction === "Right") return { x: x + 1, y, orientation: "S" }
            if (direction === "Left") return { x: x - 1, y, orientation: "S" }
            if (direction === "Down") return { x, y: y + 2, orientation: "V" }
            return { x, y: y - 1, orientation: "V" }
    }
}

export function cells(block: Block): Cell[] {
    const { x, y, orientation } = block
    if (orientation === "V") return [{ x, y }]
    if (orientation === "H") return [{ x, y }, { x: x + 1, y }]
    return [{ x, y }, { x, y: y + 1 }]
}

function isTile(level: Level, cell: Cell): boolean {
    return cell.y >= 0 && cell.y < level.height && cell.x >= 0 && cell.x < level.width && level.tiles[cell.y][cell.x]
}

// false means the block has fallen off the board
export function isOnBoard(level: Level, block: Block): boolean {
    return cells(block).every(cell => isTile(level, cell))
}

export function isWin(level: Level, block: Block): boolean {
    return block.orientation === "V" && block.x === level.goal.x && block.y === level.goal.y
}

export function stateKey(block: Block): string {
    return `${block.x},${block.y},${block.orientation}`
}

export function render(level: Level, block: Block): string {
    const covered = new Set(cells(block).map(cell => `${cell.x},${cell.y}`))
    const lines: string[] = []
    for (let y = 0; y < level.height; y++) {
        let line = ""
        for (let x = 0; x < level.width; x++) {
            if (covered.has(`${x},${y}`)) line += "B"
            else if (x === level.goal.x && y === level.goal.y) line += "G"
            else line += level.tiles[y][x] ? "#" : "."
        }
        lines.push(line)
    }
    return lines.join("\n")
}
