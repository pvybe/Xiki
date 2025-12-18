#!/usr/bin/env python3
"""
PLAY+ Primal Elements Simulation
A minimal ecological interaction environment testing Awareness + Attention architecture
with Initiative Transfer dynamics between Handler and Dog.

No RL. No reward shaping. Just constraints and coupling.
"""

import pygame
import math
import random
from dataclasses import dataclass
from typing import List, Tuple, Optional
from enum import Enum

# ============================================================================
# PRIMAL ELEMENTS ONTOLOGY
# ============================================================================

class InitiativeHolder(Enum):
    HANDLER = "Handler"
    DOG = "Dog"
    TRANSITIONING = "Transitioning"

@dataclass
class PrimalState:
    """
    The Four Triads (Dispositional / Relational / Bound):
    1. Awareness / Attention / Initiative
    2. Position / Pressure / Threshold
    3. Trigger / Targeting / Duration
    4. Release / Take / Pass

    Implemented as co-present constraints, not stages.
    """
    # Triad 1: Awareness / Attention / Initiative
    awareness_field: List[List[float]]  # Continuous salience substrate
    attention_active: bool  # Burst state
    attention_target: Optional[str]  # What attention specifies
    initiative_holder: InitiativeHolder

    # Triad 2: Position / Pressure / Threshold
    pressure_to_handler: float  # Distance-based coupling field
    pressure_to_disc: float
    pressure_to_squirrel: float
    at_threshold: bool  # Inside gate zone

    # Triad 3: Trigger / Targeting / Duration
    novelty_trigger_present: bool  # Squirrel movement detected
    current_aim: str  # "retrieve_disc", "return_to_gate", etc.
    aim_duration: int  # Ticks in current aim

    # Triad 4: Release / Take / Pass
    release_available: bool  # Can initiative be transferred?
    take_permitted: bool  # Dog allowed to take initiative
    pass_occurring: bool  # Active transfer

@dataclass
class Metrics:
    """Logged per-tick metrics"""
    tick: int = 0
    attention_bursts_total: int = 0
    attention_bursts_this_minute: int = 0
    squirrel_captures: int = 0  # Squirrel entered attention
    coupling_breaks: int = 0  # Dog lost Handler orientation
    initiative_transitions: int = 0
    task_progress: float = 0.0  # 0-100%
    last_minute_reset: int = 0

# ============================================================================
# WORLD ENTITIES
# ============================================================================

@dataclass
class Entity:
    x: float
    y: float
    vx: float = 0.0
    vy: float = 0.0
    heading: float = 0.0  # radians
    color: Tuple[int, int, int] = (255, 255, 255)
    radius: int = 10

class Handler(Entity):
    def __init__(self, x, y):
        super().__init__(x, y, color=(100, 200, 100), radius=15)
        self.hold_disc = False

    def update(self, keys, dt):
        """Simple WASD control"""
        speed = 200 * dt
        if keys[pygame.K_w]: self.vy = -speed
        elif keys[pygame.K_s]: self.vy = speed
        else: self.vy = 0

        if keys[pygame.K_a]: self.vx = -speed
        elif keys[pygame.K_d]: self.vx = speed
        else: self.vx = 0

        self.x += self.vx
        self.y += self.vy

        # Update heading based on velocity
        if abs(self.vx) > 0.1 or abs(self.vy) > 0.1:
            self.heading = math.atan2(self.vy, self.vx)

class Dog(Entity):
    def __init__(self, x, y):
        super().__init__(x, y, color=(200, 150, 50), radius=12)
        self.seek_mode = "tSEEK"  # or "pSEEK"
        self.target = None
        self.coupling_coherence = 1.0  # 0-1, tracks orientation stability

class Disc(Entity):
    def __init__(self, x, y):
        super().__init__(x, y, color=(255, 100, 100), radius=8)
        self.carried_by = None

class Gate(Entity):
    """Threshold zone - not movable"""
    def __init__(self, x, y, radius=50):
        super().__init__(x, y, color=(100, 100, 255), radius=radius)

class Squirrel(Entity):
    """Novelty distractor with erratic movement"""
    def __init__(self, x, y):
        super().__init__(x, y, color=(150, 150, 150), radius=6)
        self.erratic_timer = 0

    def update(self, dt):
        """Erratic movement pattern"""
        self.erratic_timer += dt
        if self.erratic_timer > 0.5:  # Change direction every 0.5s
            angle = random.uniform(0, 2 * math.pi)
            speed = random.uniform(50, 150)
            self.vx = math.cos(angle) * speed * dt
            self.vy = math.sin(angle) * speed * dt
            self.erratic_timer = 0

        self.x += self.vx
        self.y += self.vy

        # Bounce off walls
        if self.x < 20 or self.x > 780: self.vx *= -1
        if self.y < 20 or self.y > 580: self.vy *= -1

# ============================================================================
# AWARENESS SUBSTRATE (cheap, continuous)
# ============================================================================

class AwarenessStream:
    """
    Runs every tick. Produces coarse salience map.
    Does NOT decide. Only maintains field and detects change.
    """
    def __init__(self, grid_size=16):
        self.grid_size = grid_size
        self.field = [[0.0] * grid_size for _ in range(grid_size)]
        self.prev_field = [[0.0] * grid_size for _ in range(grid_size)]

    def update(self, entities: List[Entity], world_w=800, world_h=600):
        """Compute salience map based on entity positions"""
        self.prev_field = [row[:] for row in self.field]
        self.field = [[0.0] * self.grid_size for _ in range(self.grid_size)]

        cell_w = world_w / self.grid_size
        cell_h = world_h / self.grid_size

        for entity in entities:
            # Map entity position to grid cell
            gx = int(entity.x / cell_w)
            gy = int(entity.y / cell_h)
            gx = max(0, min(self.grid_size - 1, gx))
            gy = max(0, min(self.grid_size - 1, gy))

            # Different entities have different salience
            if isinstance(entity, Squirrel):
                salience = 0.8  # High salience
            elif isinstance(entity, Disc):
                salience = 0.7
            elif isinstance(entity, Handler):
                salience = 0.6
            else:
                salience = 0.3

            self.field[gy][gx] = max(self.field[gy][gx], salience)

    def detect_novelty(self) -> bool:
        """Has the field changed significantly?"""
        change = 0.0
        for y in range(self.grid_size):
            for x in range(self.grid_size):
                change += abs(self.field[y][x] - self.prev_field[y][x])
        return change > 0.5  # Threshold for novelty detection

# ============================================================================
# ATTENTION GATE (expensive, gated)
# ============================================================================

class AttentionBurst:
    """
    Invoked only when permitted by gate.
    Returns specified relevance items from cropped region.
    """
    def __init__(self):
        self.active = False
        self.target = None
        self.duration = 0

    def invoke(self, dog: Dog, entities: List[Entity], current_aim: str,
               seek_mode: str) -> Tuple[bool, Optional[str], str]:
        """
        Gate decision logic:
        - Check aim relevance: does novelty help current aim?
        - Check coupling risk: will switching break coupling?
        - Check threshold proximity: at lawful boundary?

        Returns: (attention_fired, target_specified, reason)
        """
        # Find closest entities to dog
        distances = {}
        for e in entities:
            if e == dog:
                continue
            dist = math.hypot(e.x - dog.x, e.y - dog.y)
            entity_type = type(e).__name__
            if entity_type not in distances or dist < distances[entity_type][0]:
                distances[entity_type] = (dist, e)

        # GATE LOGIC: Different for tSEEK vs pSEEK
        if seek_mode == "pSEEK":
            # Compulsive novelty capture - low threshold
            if "Squirrel" in distances and distances["Squirrel"][0] < 200:
                return True, "Squirrel", "pSEEK_compulsive"

        elif seek_mode == "tSEEK":
            # Curiosity sampling under governance
            # Novelty enters awareness but only attention if:
            # 1. Aim-relevant
            # 2. Low coupling risk
            # 3. At threshold (lawful boundary)

            if "Squirrel" in distances and distances["Squirrel"][0] < 150:
                # Check aim relevance
                aim_relevant = False
                if current_aim == "explore":
                    aim_relevant = True

                # Check coupling risk (using dog's coupling_coherence)
                coupling_risk = dog.coupling_coherence < 0.5

                # Only permit if aim-relevant OR (low risk AND curious)
                if aim_relevant or (not coupling_risk and random.random() < 0.2):
                    return True, "Squirrel", "tSEEK_permitted"
                else:
                    return False, None, "tSEEK_blocked"

        # Default: attend to task-relevant target
        if current_aim == "retrieve_disc" and "Disc" in distances:
            return True, "Disc", "task_aim"
        elif current_aim == "return_to_gate" and "Gate" in distances:
            return True, "Gate", "task_aim"
        elif "Handler" in distances:
            return True, "Handler", "maintain_coupling"

        return False, None, "no_trigger"

# ============================================================================
# INITIATIVE TRANSFER SYSTEM
# ============================================================================

class InitiativeSystem:
    """
    Tracks who structures what is salient/possible/actionable.
    Handler can hold or offer.
    Dog can take when permitted.
    Passing requires Release.
    """
    def __init__(self):
        self.holder = InitiativeHolder.HANDLER
        self.transitions = 0

    def check_release_conditions(self, primal: PrimalState,
                                   handler: Handler, dog: Dog) -> bool:
        """
        Release available when:
        - Handler at threshold (gate zone)
        - Dog maintains coupling (coherence > 0.7)
        - No active attention burst on distractor
        """
        dist_to_handler = math.hypot(dog.x - handler.x, dog.y - handler.y)
        coupling_maintained = dist_to_handler < 100 and dog.coupling_coherence > 0.7
        no_distraction = primal.attention_target != "Squirrel"

        return primal.at_threshold and coupling_maintained and no_distraction

    def attempt_transfer(self, from_holder: InitiativeHolder,
                         to_holder: InitiativeHolder,
                         release_available: bool) -> bool:
        """Pass only possible if Release present"""
        if not release_available:
            return False

        if self.holder == from_holder:
            self.holder = InitiativeHolder.TRANSITIONING
            # Transition complete next tick
            self.holder = to_holder
            self.transitions += 1
            return True
        return False

# ============================================================================
# MAIN SIMULATION
# ============================================================================

class PlayPrimalSimulation:
    def __init__(self, width=800, height=600):
        pygame.init()
        self.width = width
        self.height = height
        self.screen = pygame.display.set_mode((width, height))
        pygame.display.set_caption("PLAY+ Primal Elements Simulation")
        self.clock = pygame.time.Clock()
        self.font = pygame.font.Font(None, 24)
        self.small_font = pygame.font.Font(None, 18)

        # World entities
        self.handler = Handler(400, 500)
        self.dog = Dog(350, 450)
        self.disc = Disc(400, 100)
        self.gate = Gate(400, 500, radius=60)
        self.squirrel = Squirrel(600, 300)

        # Systems
        self.awareness = AwarenessStream(grid_size=16)
        self.attention = AttentionBurst()
        self.initiative = InitiativeSystem()

        # State
        self.primal = PrimalState(
            awareness_field=self.awareness.field,
            attention_active=False,
            attention_target=None,
            initiative_holder=InitiativeHolder.HANDLER,
            pressure_to_handler=0.0,
            pressure_to_disc=0.0,
            pressure_to_squirrel=0.0,
            at_threshold=False,
            novelty_trigger_present=False,
            current_aim="retrieve_disc",
            aim_duration=0,
            release_available=False,
            take_permitted=False,
            pass_occurring=False
        )

        self.metrics = Metrics()
        self.paused = False
        self.wait_mode = False  # WAIT key - awareness runs, attention frozen
        self.attention_budget = 200  # Max bursts per minute

        self.running = True

    def update_primal_state(self, dt):
        """Update all primal element relationships"""
        # Triad 2: Position / Pressure / Threshold
        self.primal.pressure_to_handler = math.hypot(
            self.dog.x - self.handler.x,
            self.dog.y - self.handler.y
        )
        self.primal.pressure_to_disc = math.hypot(
            self.dog.x - self.disc.x,
            self.dog.y - self.disc.y
        )
        self.primal.pressure_to_squirrel = math.hypot(
            self.dog.x - self.squirrel.x,
            self.dog.y - self.squirrel.y
        )

        # At threshold if inside gate
        dist_to_gate = math.hypot(self.dog.x - self.gate.x, self.dog.y - self.gate.y)
        self.primal.at_threshold = dist_to_gate < self.gate.radius

        # Triad 3: Trigger / Targeting / Duration
        self.primal.novelty_trigger_present = self.awareness.detect_novelty()
        self.primal.aim_duration += 1

        # Update coupling coherence based on dog's orientation to handler
        angle_to_handler = math.atan2(
            self.handler.y - self.dog.y,
            self.handler.x - self.dog.x
        )
        heading_diff = abs(angle_to_handler - self.dog.heading)
        if heading_diff > math.pi:
            heading_diff = 2 * math.pi - heading_diff

        # Coherence degrades if oriented away from handler
        if self.primal.attention_target == "Squirrel":
            self.dog.coupling_coherence *= 0.95  # Decay
        else:
            self.dog.coupling_coherence = min(1.0,
                self.dog.coupling_coherence + 0.05)

        if self.dog.coupling_coherence < 0.5 and not hasattr(self, '_last_break'):
            self.metrics.coupling_breaks += 1
            self._last_break = self.metrics.tick

        # Triad 4: Release / Take / Pass
        self.primal.release_available = self.initiative.check_release_conditions(
            self.primal, self.handler, self.dog
        )
        self.primal.take_permitted = (
            self.primal.release_available and
            self.primal.initiative_holder == InitiativeHolder.HANDLER
        )

    def update_dog_behavior(self, dt):
        """Simple ecological coupling - dog moves toward attention target"""
        if self.primal.attention_target and self.attention.active:
            target_entity = None

            if self.primal.attention_target == "Handler":
                target_entity = self.handler
            elif self.primal.attention_target == "Disc":
                target_entity = self.disc
            elif self.primal.attention_target == "Squirrel":
                target_entity = self.squirrel
            elif self.primal.attention_target == "Gate":
                target_entity = self.gate

            if target_entity:
                # Move toward target
                dx = target_entity.x - self.dog.x
                dy = target_entity.y - self.dog.y
                dist = math.hypot(dx, dy)

                if dist > 5:
                    speed = 150 * dt
                    self.dog.vx = (dx / dist) * speed
                    self.dog.vy = (dy / dist) * speed
                    self.dog.x += self.dog.vx
                    self.dog.y += self.dog.vy

                    # Update heading
                    self.dog.heading = math.atan2(dy, dx)
        else:
            # Idle behavior - slight drift toward handler
            dx = self.handler.x - self.dog.x
            dy = self.handler.y - self.dog.y
            dist = math.hypot(dx, dy)

            if dist > 80:
                speed = 50 * dt
                self.dog.vx = (dx / dist) * speed
                self.dog.vy = (dy / dist) * speed
                self.dog.x += self.dog.vx
                self.dog.y += self.dog.vy

    def update(self, dt):
        """Main update loop"""
        if self.paused:
            return

        keys = pygame.key.get_pressed()

        # Update entities
        self.handler.update(keys, dt)
        self.squirrel.update(dt)

        # AWARENESS (always runs - cheap)
        all_entities = [self.handler, self.dog, self.disc, self.gate, self.squirrel]
        self.awareness.update(all_entities, self.width, self.height)
        self.primal.awareness_field = self.awareness.field

        # Update primal relationships
        self.update_primal_state(dt)

        # ATTENTION (gated - expensive)
        if not self.wait_mode:
            # Check budget
            budget_available = (
                self.metrics.attention_bursts_this_minute < self.attention_budget
            )

            if budget_available:
                fired, target, reason = self.attention.invoke(
                    self.dog, all_entities,
                    self.primal.current_aim,
                    self.dog.seek_mode
                )

                self.primal.attention_active = fired
                self.primal.attention_target = target

                if fired:
                    self.metrics.attention_bursts_total += 1
                    self.metrics.attention_bursts_this_minute += 1

                    if target == "Squirrel":
                        self.metrics.squirrel_captures += 1

        # Update dog behavior based on attention
        self.update_dog_behavior(dt)

        # Task progress (simple metric: did dog approach disc?)
        if self.primal.current_aim == "retrieve_disc":
            progress = max(0, 100 - self.primal.pressure_to_disc)
            self.metrics.task_progress = min(100, progress)

        # Reset per-minute counters
        if self.metrics.tick - self.metrics.last_minute_reset > 3600:  # 60 FPS * 60s
            self.metrics.attention_bursts_this_minute = 0
            self.metrics.last_minute_reset = self.metrics.tick

        self.metrics.tick += 1

    def draw(self):
        """Render the world"""
        self.screen.fill((20, 20, 30))

        # Draw awareness field (faint grid)
        cell_w = self.width / self.awareness.grid_size
        cell_h = self.height / self.awareness.grid_size

        for y in range(self.awareness.grid_size):
            for x in range(self.awareness.grid_size):
                salience = self.primal.awareness_field[y][x]
                if salience > 0.1:
                    alpha = int(salience * 100)
                    color = (alpha, alpha, alpha)
                    rect = pygame.Rect(
                        x * cell_w, y * cell_h,
                        cell_w, cell_h
                    )
                    pygame.draw.rect(self.screen, color, rect, 1)

        # Draw gate (threshold zone)
        pygame.draw.circle(self.screen, self.gate.color,
                          (int(self.gate.x), int(self.gate.y)),
                          self.gate.radius, 2)

        # Draw entities
        for entity in [self.disc, self.squirrel, self.handler, self.dog]:
            pygame.draw.circle(self.screen, entity.color,
                             (int(entity.x), int(entity.y)),
                             entity.radius)

            # Draw heading indicator
            if hasattr(entity, 'heading'):
                end_x = entity.x + math.cos(entity.heading) * (entity.radius + 10)
                end_y = entity.y + math.sin(entity.heading) * (entity.radius + 10)
                pygame.draw.line(self.screen, (255, 255, 255),
                               (entity.x, entity.y),
                               (end_x, end_y), 2)

        # Draw attention burst indicator
        if self.primal.attention_active and self.primal.attention_target:
            target_pos = None
            if self.primal.attention_target == "Handler":
                target_pos = (self.handler.x, self.handler.y)
            elif self.primal.attention_target == "Disc":
                target_pos = (self.disc.x, self.disc.y)
            elif self.primal.attention_target == "Squirrel":
                target_pos = (self.squirrel.x, self.squirrel.y)
            elif self.primal.attention_target == "Gate":
                target_pos = (self.gate.x, self.gate.y)

            if target_pos:
                pygame.draw.line(self.screen, (255, 255, 0),
                               (self.dog.x, self.dog.y),
                               target_pos, 3)

        # Draw HUD
        self.draw_hud()

        pygame.display.flip()

    def draw_hud(self):
        """Draw metrics and status"""
        y_offset = 10
        line_height = 25

        # Mode indicator
        mode_color = (255, 100, 100) if self.dog.seek_mode == "pSEEK" else (100, 255, 100)
        mode_text = self.font.render(f"Mode: {self.dog.seek_mode}", True, mode_color)
        self.screen.blit(mode_text, (10, y_offset))
        y_offset += line_height

        # Metrics
        lines = [
            f"Tick: {self.metrics.tick}",
            f"Attention Bursts (total): {self.metrics.attention_bursts_total}",
            f"Bursts this minute: {self.metrics.attention_bursts_this_minute}/{self.attention_budget}",
            f"Squirrel Captures: {self.metrics.squirrel_captures}",
            f"Coupling Breaks: {self.metrics.coupling_breaks}",
            f"Coupling Coherence: {self.dog.coupling_coherence:.2f}",
            f"Initiative: {self.primal.initiative_holder.value}",
            f"At Threshold: {self.primal.at_threshold}",
            f"Release Available: {self.primal.release_available}",
        ]

        for line in lines:
            text = self.small_font.render(line, True, (200, 200, 200))
            self.screen.blit(text, (10, y_offset))
            y_offset += 20

        # Controls
        y_offset = self.height - 100
        controls = [
            "WASD: Move Handler",
            "T: Toggle tSEEK/pSEEK",
            "SPACE: Pause",
            "W: WAIT mode (attention freeze)",
            "Q: Quit"
        ]
        for line in controls:
            text = self.small_font.render(line, True, (150, 150, 150))
            self.screen.blit(text, (10, y_offset))
            y_offset += 18

        # Status indicators
        if self.wait_mode:
            wait_text = self.font.render("WAIT MODE", True, (255, 255, 0))
            self.screen.blit(wait_text, (self.width - 150, 10))

        if self.paused:
            pause_text = self.font.render("PAUSED", True, (255, 100, 100))
            self.screen.blit(pause_text, (self.width // 2 - 50, 10))

    def handle_events(self):
        """Process input events"""
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                self.running = False

            if event.type == pygame.KEYDOWN:
                if event.key == pygame.K_q:
                    self.running = False
                elif event.key == pygame.K_t:
                    # Toggle SEEK mode
                    self.dog.seek_mode = "pSEEK" if self.dog.seek_mode == "tSEEK" else "tSEEK"
                    print(f"Switched to {self.dog.seek_mode}")
                elif event.key == pygame.K_SPACE:
                    self.paused = not self.paused
                    print(f"Paused: {self.paused}")
                elif event.key == pygame.K_w and not pygame.key.get_mods() & pygame.KMOD_SHIFT:
                    # WAIT mode toggle (only if not holding shift for movement)
                    if event.mod == 0:  # No modifiers
                        self.wait_mode = not self.wait_mode
                        print(f"WAIT mode: {self.wait_mode}")

    def run(self):
        """Main game loop"""
        print("\n" + "="*60)
        print("PLAY+ PRIMAL ELEMENTS SIMULATION")
        print("="*60)
        print("\nImplementing the Four Triads:")
        print("  1. Awareness / Attention / Initiative")
        print("  2. Position / Pressure / Threshold")
        print("  3. Trigger / Targeting / Duration")
        print("  4. Release / Take / Pass")
        print("\nTesting: Can Dog hold task under novelty (Squirrel)?")
        print("  tSEEK: Governed curiosity (novelty → awareness, rarely → attention)")
        print("  pSEEK: Compulsive capture (novelty hijacks attention)")
        print("\nControls:")
        print("  T - Toggle tSEEK/pSEEK mode")
        print("  SPACE - Pause/Resume")
        print("  W - WAIT mode (awareness runs, attention frozen)")
        print("  Q - Quit")
        print("="*60 + "\n")

        while self.running:
            dt = self.clock.tick(60) / 1000.0  # 60 FPS

            self.handle_events()
            self.update(dt)
            self.draw()

        # Final metrics
        print("\n" + "="*60)
        print("SIMULATION COMPLETE - Final Metrics")
        print("="*60)
        print(f"Total Ticks: {self.metrics.tick}")
        print(f"Total Attention Bursts: {self.metrics.attention_bursts_total}")
        print(f"Squirrel Captures: {self.metrics.squirrel_captures}")
        print(f"Coupling Breaks: {self.metrics.coupling_breaks}")
        print(f"Initiative Transitions: {self.initiative.transitions}")
        print(f"Task Progress: {self.metrics.task_progress:.1f}%")
        print(f"Final Coupling Coherence: {self.dog.coupling_coherence:.2f}")
        print("="*60 + "\n")

        pygame.quit()

# ============================================================================
# ENTRY POINT
# ============================================================================

if __name__ == "__main__":
    sim = PlayPrimalSimulation()
    sim.run()
