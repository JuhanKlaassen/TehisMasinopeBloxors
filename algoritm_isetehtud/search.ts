import { DIRECTIONS, isOnBoard, isWin, roll, stateKey } from "./game.ts"
import type { Block, Direction, Level } from "./game.ts"

// Minimax with only MAX levels (there is no MIN player), which reduces to a depth-first
// shortest-path search (branch and bound): every route is explored, longer ones are cut off.
// The search runs until every branch ends, so the only scores are a win (WIN_SCORE - moves)
// or a dead end (-Infinity). No evaluation function is needed.
export const WIN_SCORE = 1000

export type SearchResult = {
    move: Direction | null // null when the goal cannot be reached
    movesToGoal: number
    nodes: number
}

type SearchContext = {
    level: Level
    alpha: number // best score found so far, a lower bound on the root's value
    shallowestPly: Map<string, number> // transposition table: state -> shallowest ply it was expanded at
    nodes: number
}

export function bestMove(level: Level, block: Block): SearchResult {
    const ctx: SearchContext = { level, alpha: -Infinity, shallowestPly: new Map([[stateKey(block), 0]]), nodes: 1 }
    let bestScore = -Infinity
    let bestDirection: Direction | null = null

    for (const direction of DIRECTIONS) {
        const next = roll(block, direction)
        if (!isOnBoard(level, next)) continue
        const score = maximize(ctx, next, 1)
        if (score > bestScore) {
            bestScore = score
            bestDirection = direction
        }
    }
    return { move: bestDirection, movesToGoal: WIN_SCORE - bestScore, nodes: ctx.nodes }
}

function maximize(ctx: SearchContext, block: Block, ply: number): number {
    // Pruning: the best this subtree can ever give is a win right here (WIN_SCORE - ply).
    // If a win at least that short has already been found, this branch cannot change the decision.
    if (ctx.alpha >= WIN_SCORE - ply) return -Infinity

    // Transposition / cycle check: a state already expanded at the same or a shallower ply
    // can already reach everything this one can, in fewer moves.
    const key = stateKey(block)
    const seenAt = ctx.shallowestPly.get(key)
    if (seenAt !== undefined && seenAt <= ply) return -Infinity
    ctx.shallowestPly.set(key, ply)
    ctx.nodes++

    if (isWin(ctx.level, block)) {
        const score = WIN_SCORE - ply // faster wins score higher
        ctx.alpha = Math.max(ctx.alpha, score)
        return score
    }

    let best = -Infinity // stays -Infinity for a dead end
    for (const direction of DIRECTIONS) {
        const next = roll(block, direction)
        if (!isOnBoard(ctx.level, next)) continue // falling off is never chosen
        best = Math.max(best, maximize(ctx, next, ply + 1))
    }
    return best
}
