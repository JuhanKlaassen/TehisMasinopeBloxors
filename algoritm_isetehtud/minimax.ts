import { DIRECTIONS, cells, isOnBoard, isWin, roll, stateKey } from "./game.ts"
import type { Block, Direction, Level } from "./game.ts"

// Single-player minimax: every level of the tree is a MAX level (there is no MIN player).
export const WIN_SCORE = 1000

export type SearchResult = {
    move: Direction | null
    score: number
    depth: number // depth of the iteration that produced this result
    nodes: number // nodes visited across all iterations
}

type SearchContext = {
    level: Level
    alpha: number // best score reached anywhere so far, a lower bound on the root's value
    shallowestPly: Map<string, number> // transposition table: state -> shallowest ply it was expanded at
    nodes: number
}

// Heuristic for non-terminal states: closer to the goal is better, and lying down costs one extra move.
export function evaluate(level: Level, block: Block): number {
    const distance = Math.min(...cells(block).map(c => Math.abs(c.x - level.goal.x) + Math.abs(c.y - level.goal.y)))
    return -(distance + (block.orientation === "S" ? 0 : 1))
}

export function isWinScore(score: number): boolean {
    return score > WIN_SCORE / 2
}

// Iterative deepening: search depth 1, 2, ... and stop as soon as a win is in reach.
export function bestMove(level: Level, block: Block, maxDepth: number): SearchResult {
    let result: SearchResult = { move: null, score: -Infinity, depth: 0, nodes: 0 }
    let nodes = 0
    for (let depth = 1; depth <= maxDepth; depth++) {
        result = searchRoot(level, block, depth)
        nodes += result.nodes
        if (isWinScore(result.score)) break
    }
    return { ...result, nodes }
}

function searchRoot(level: Level, block: Block, depth: number): SearchResult {
    const ctx: SearchContext = { level, alpha: -Infinity, shallowestPly: new Map([[stateKey(block), 0]]), nodes: 1 }
    let best: SearchResult = { move: null, score: -Infinity, depth, nodes: 0 }

    for (const direction of DIRECTIONS) {
        const next = roll(block, direction)
        if (!isOnBoard(level, next)) continue
        const score = maximize(ctx, next, depth - 1, 1)
        if (score > best.score) best = { move: direction, score, depth, nodes: 0 }
    }
    return { ...best, nodes: ctx.nodes }
}

function maximize(ctx: SearchContext, block: Block, depthLeft: number, ply: number): number {
    // Pruning: the best this subtree can ever give is a win right here (WIN_SCORE - ply).
    // If something at least that good has already been found, this branch cannot change the decision.
    if (ctx.alpha >= WIN_SCORE - ply) return -Infinity

    // Transposition / cycle check: a state already expanded at the same or a shallower ply
    // had at least as much depth left, so everything reachable from here was already scored there.
    const key = stateKey(block)
    const seenAt = ctx.shallowestPly.get(key)
    if (seenAt !== undefined && seenAt <= ply) return -Infinity
    ctx.shallowestPly.set(key, ply)
    ctx.nodes++

    if (isWin(ctx.level, block)) return terminal(ctx, WIN_SCORE - ply) // faster wins score higher
    if (depthLeft === 0) return terminal(ctx, evaluate(ctx.level, block))

    let best = -Infinity
    for (const direction of DIRECTIONS) {
        const next = roll(block, direction)
        if (!isOnBoard(ctx.level, next)) continue // falling off is never chosen
        best = Math.max(best, maximize(ctx, next, depthLeft - 1, ply + 1))
    }
    return best
}

function terminal(ctx: SearchContext, score: number): number {
    ctx.alpha = Math.max(ctx.alpha, score)
    return score
}
