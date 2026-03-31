# Side Plan: Reconstruct NN Arrow Visualization in D3

## Goal
Replace the static PDF-rendered board structure images with a fully interactive
D3 visualization that draws nearest-neighbor arrows on a hex grid, animated
across all 20 training checkpoints (not just 0, 10, 15, 20).

## What we have

- **`structure.tsv`**: Per-cell NDCG and overlap scores for 81 cells × 20
  checkpoints × 4 agents. The overlap column gives the fraction of a cell's
  true hex neighbors that appear in its learned nearest-neighbor set (0, 0.25,
  0.333, 0.5, … 1.0).

- **Original PDFs** (grubby-0, -10, -15, -20): Show dot-product similarity
  arrows between cells — these were generated from the actual model embeddings
  (not in the TSV).

## What we don't have

The raw embedding vectors or the per-cell nearest-neighbor lists. The TSV only
stores aggregate NDCG/overlap — not *which* neighbor was chosen for each cell.

## Reconstruction approach

### Option A: Use overlap as edge confidence (approximate)

1. **Hex grid layout**: Place 81 cells on a pointy-top hex grid (9×9). The
   geometry is fixed: cell `i` maps to `(row, col)` = `(i // 9, i % 9)` with
   standard hex offset coordinates.

2. **Ground-truth neighbors**: For each cell, compute its true hexagonal
   neighbors (up to 6, fewer on edges/corners). This is pure geometry.

3. **Per-cell overlap → edge drawing**: The overlap score tells us what
   fraction of true neighbors were recovered. We can't know *which* neighbors
   were recovered, but we can:
   - Draw all 6 true-neighbor arrows with opacity = overlap score
   - At overlap = 0, arrows are invisible (random NN, not matching true grid)
   - At overlap = 1, all arrows are fully visible (perfect recovery)

4. **Random arrows for low overlap**: To mimic the chaotic early-checkpoint
   look, also draw "noise" arrows to random non-neighbor cells with opacity
   = (1 - overlap). This simulates the random NN structure.

5. **Animate across checkpoints**: Slider or auto-play from checkpoint 0→19.
   Each frame recalculates arrow opacities from that checkpoint's overlap data.

### Option B: Re-extract from model (gold standard, needs code)

1. Load the trained model at each checkpoint (requires `boardlaw` package +
   model weights from the original repo).
2. Extract first-layer cell embeddings (81 × hidden_dim).
3. Compute pairwise dot-product similarities.
4. For each cell, find top-k nearest neighbors.
5. Draw arrows to those neighbors.

This gives exact arrows but requires the model weights and `boardlaw` env.

## Recommendation

**Start with Option A** — it's self-contained, uses data we already have, and
produces a visually similar result. The key insight: viewers can't distinguish
"correct arrows at 80% opacity" from "80% of correct arrows at full opacity"
at this scale. The animation will show the same story: chaos → clean hex grid.

**Compare** the Option A visualization side-by-side with the 4 PDF frames to
validate the visual similarity. If the approximation looks wrong (e.g., the
noise arrows don't match the PDF's chaotic pattern), move to Option B.

## Implementation steps (Option A)

1. Export per-cell overlap data as JSON (one array per checkpoint).
2. Create `HexBoard.svelte` component:
   - SVG hex grid with 81 cells using offset coordinates.
   - For each cell, draw arrows to true neighbors (opacity from overlap).
   - Optionally draw noise arrows to random cells (opacity from 1 - overlap).
3. Add checkpoint slider/auto-play control.
4. Integrate into BoardAnimation component or replace it.

## Estimated complexity
~200 lines of Svelte/D3 for the hex grid + arrow drawing.
