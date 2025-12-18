# PLAY+ Primal Elements Simulation

## Run Instructions

### Requirements
```bash
pip install pygame --break-system-packages
```

### Execute
```bash
python3 play_primal_elements_sim.py
```

### Controls
- **WASD**: Move Handler
- **T**: Toggle between tSEEK (governed) and pSEEK (compulsive) modes
- **SPACE**: Pause/Resume simulation
- **W**: WAIT mode - Awareness continues running, Attention frozen
- **Q**: Quit

---

## Implementation Mapping: Primal Elements → Code

### The Four Triads (Co-Present Constraints)

#### Triad 1: Awareness / Attention / Initiative

**Awareness** (Dispositional)
- `AwarenessStream` class - runs every tick (cheap)
- Maintains 16×16 salience grid over world space
- Detects novelty via field change detection
- Does NOT decide or specify - only maintains substrate
- **Code**: `awareness.update()` → continuous field computation

**Attention** (Relational)
- `AttentionBurst` class - invoked only when gate permits (expensive)
- Returns specified targets ("Disc", "Handler", "Squirrel", "Gate")
- Tracked via `attention_bursts_total` metric (proxy for compute cost)
- **Code**: `attention.invoke()` → gated specification

**Initiative** (Bound)
- `InitiativeSystem` class - tracks who structures possibility space
- Explicit state: `HANDLER` / `DOG` / `TRANSITIONING`
- **Code**: `initiative.holder` + `initiative.transitions` counter

#### Triad 2: Position / Pressure / Threshold

**Position**
- Entity.x, Entity.y - absolute locations in 2D space
- **Code**: Every `Entity` instance carries position state

**Pressure**
- Distance-based coupling fields between agents/objects
- `primal.pressure_to_handler`, `pressure_to_disc`, `pressure_to_squirrel`
- **Code**: `math.hypot()` distance calculations updated per tick

**Threshold**
- Gate zone (`radius=60`) defines explicit boundary
- `primal.at_threshold` Boolean - inside/outside state
- **Code**: `dist_to_gate < gate.radius` predicate

#### Triad 3: Trigger / Targeting / Duration

**Trigger**
- `primal.novelty_trigger_present` - Squirrel movement detected
- **Code**: `awareness.detect_novelty()` → field change > 0.5 threshold

**Targeting**
- `primal.current_aim` - "retrieve_disc" / "return_to_gate" / "explore"
- Structures what is salient for gate logic
- **Code**: String state driving attention gate decisions

**Duration**
- `primal.aim_duration` - ticks in current aim
- Temporal coherence tracking
- **Code**: Incremented counter per update cycle

#### Triad 4: Release / Take / Pass

**Release**
- `primal.release_available` - can initiative be transferred?
- Requires: at threshold + coupling maintained + no distraction
- **Code**: `initiative.check_release_conditions()` predicate

**Take**
- `primal.take_permitted` - Dog allowed to take initiative
- Only true when Handler holds + Release available
- **Code**: Boolean derived from Release state

**Pass**
- `initiative.attempt_transfer()` - actual transfer mechanism
- Only succeeds if Release present (hard constraint)
- **Code**: State transition HANDLER → TRANSITIONING → DOG

---

## The SQUIRREL Gate: Implementation

### Core Principle
Novelty (Squirrel) ALWAYS enters Awareness substrate.
Whether it enters Attention depends on gate evaluation.

### Gate Logic

#### pSEEK Mode (Compulsive)
```python
if squirrel_distance < 200:
    return True, "Squirrel", "pSEEK_compulsive"
```
- Low threshold (200 units)
- No governance checks
- Novelty hijacks attention frequently
- **Result**: High `squirrel_captures`, low `task_progress`, coupling breaks

#### tSEEK Mode (Governed)
```python
if squirrel_distance < 150:
    # Check aim relevance
    aim_relevant = (current_aim == "explore")

    # Check coupling risk
    coupling_risk = (coupling_coherence < 0.5)

    # Permit only if aim-relevant OR (safe AND curious)
    if aim_relevant or (not coupling_risk and random.random() < 0.2):
        return True, "Squirrel", "tSEEK_permitted"
    else:
        return False, None, "tSEEK_blocked"
```

### Three Gate Checks

1. **Aim Relevance**: Does novelty help current aim?
   - If aim="explore" → yes
   - If aim="retrieve_disc" → no

2. **Coupling Risk**: Will switching break coupling?
   - `coupling_coherence < 0.5` → high risk, block
   - Coherence computed from Handler orientation alignment

3. **Threshold Proximity**: At lawful boundary?
   - `at_threshold` (inside Gate) → transitions permitted
   - Not used for Squirrel capture, but for Initiative transfer

### Measurable Outcomes

**pSEEK Dog**:
- High attention burst count (~60% on Squirrel)
- Frequent coupling breaks (coherence decays)
- Low task progress (rarely approaches Disc)
- "SQUIRREL!" behavior - compulsive distraction

**tSEEK Dog**:
- Lower attention burst count (~80% on task)
- Maintains coupling (coherence > 0.7)
- Higher task progress (approaches Disc reliably)
- Novelty sampled only when safe/relevant

---

## Hard Constraints Enforced

### No Awareness → Nothing Can Be Specified
- Awareness grid computed EVERY tick before attention
- Attention gate receives awareness field as input
- If awareness returns flat field (no entities), attention has no specification targets

### No Threshold → No Entry/Exit
- Initiative transfer checks `at_threshold` predicate
- If not inside Gate zone, `release_available=False`
- Transfer blocked: "No threshold → no lawful transition"

### No Release → No Reversibility
- `initiative.attempt_transfer()` checks `release_available`
- Returns False if Release not present
- Initiative cannot pass without Release state

---

## Metrics Logged Per Tick

1. **attention_bursts_total**: Proxy for compute/energy cost
2. **attention_bursts_this_minute**: Budget enforcement (200/min ceiling)
3. **squirrel_captures**: Novelty hijack rate
4. **coupling_breaks**: When Dog loses Handler orientation (coherence < 0.5)
5. **initiative_transitions**: Successful Handler ↔ Dog passes
6. **task_progress**: Proximity to task goal (approach Disc)
7. **coupling_coherence**: 0-1 scalar, orientation alignment

---

## Two Add-Ons Implemented

### 1. WAIT Mode (Press 'W')
- Awareness stream continues running
- Attention bursts frozen
- Tests: "Can system maintain field without specification?"
- Demonstrates awareness/attention separation

### 2. Time Budget (200 bursts/minute)
```python
attention_budget = 200  # Max bursts per minute
if attention_bursts_this_minute >= attention_budget:
    # Block attention, awareness continues
```
- Hard ceiling on attention invocations
- Counter resets every 3600 ticks (60 FPS × 60 sec)
- Visible in HUD: "Bursts this minute: X/200"

---

## What This Tests

**Core Question**: Can an agent hold task coherence under novelty?

**pSEEK Prediction**:
- Compulsive attention capture
- Coupling breaks
- Task fails
- High compute cost (many attention bursts)

**tSEEK Prediction**:
- Governed curiosity
- Coupling maintained
- Task succeeds
- Lower compute cost (fewer bursts)

**Architecture Validated**:
- Awareness as cheap continuous substrate
- Attention as expensive gated specification
- Initiative as binding constraint on action possibility
- Release as required for reversible transfer

---

## No RL. No Reward. Just Coupling.

This is a **constraints-and-coupling simulator**:
- No policy gradients
- No value functions
- No "internal world model" language
- Just ecological constraints and relational dynamics

The dog moves toward whatever attention specifies.
The gate governs what enters attention.
The result is emergent task-holding or breakdown.

---

## Architecture Summary

```
Every Tick:
├─ Awareness.update() → salience field [CHEAP]
├─ Primal.update() → triads (position/pressure/threshold)
├─ If (novelty detected AND gate permits):
│  └─ Attention.invoke() → specify target [EXPENSIVE]
├─ Dog.move(attention.target) → ecological coupling
└─ Metrics.log() → bursts, captures, coherence
```

**Key Property**: Awareness runs continuously (cheap).
Attention fires only when gated (expensive, counted).

This implements "permissioned specification riding on continuous substrate."
