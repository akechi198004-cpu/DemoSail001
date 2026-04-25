export interface FleetState {
  name: string;
  gold: number;
  food: number;
  water: number;
  crew: number;
}

type Listener = (state: FleetState) => void;

class GameStateStore {
  private state: FleetState = {
    name: "寻路者号",
    gold: 1000,
    food: 100,
    water: 100,
    crew: 20
  };

  private listeners: Set<Listener> = new Set();

  getState() {
    return this.state;
  }

  updateState(partial: Partial<FleetState>) {
    this.state = { ...this.state, ...partial };
    this.notify();
  }

  subscribe(listener: Listener) {
    this.listeners.add(listener);
    listener(this.state); // immediate notify on sub
    return () => this.listeners.delete(listener);
  }

  private notify() {
    for (const listener of this.listeners) {
      listener(this.state);
    }
  }
}

export const gameStateStore = new GameStateStore();
