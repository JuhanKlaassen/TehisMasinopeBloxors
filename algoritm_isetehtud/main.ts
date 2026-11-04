import { isWin, parseLevel, render, roll } from "./game.ts"
import type { Move } from "./game.ts"
import { bestMove } from "./minimax.ts"

// Bloxorz level 1
const LEVEL_1 = `
###.......
#S####....
#########.
.#########
.....##G##
......###.
`

const MAX_STEPS = 100

const level = parseLevel(LEVEL_1)
let block = level.start
const moves: Move[] = []

console.log("Start:")
console.log(render(level, block))

while (!isWin(level, block) && moves.length < MAX_STEPS) {
    const result = bestMove(level, block)
    if (!result.move) {
        console.log("The goal cannot be reached from here.")
        break
    }

    const next = roll(block, result.move)
    moves.push({ direction: result.move, start_position: block.orientation, end_position: next.orientation })
    block = next

    console.log(`\nStep ${moves.length}: ${result.move} (${moves.at(-1)!.start_position} -> ${block.orientation}), ` +
        `goal ${result.movesToGoal} moves away, ${result.nodes} nodes`)
    console.log(render(level, block))
}

console.log(isWin(level, block)
    ? `\nSolved in ${moves.length} moves: ${moves.map(m => m.direction).join(", ")}`
    : `\nNot solved after ${moves.length} moves.`)
