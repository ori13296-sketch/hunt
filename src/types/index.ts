export interface Stop {
  id: string;
  lat: number;
  lng: number;
  clue: string;
  name: string;
  radius: number; // meters
}

export interface Hunt {
  id: string;
  name: string;
  stops: Stop[];
  createdAt: number;
}

export interface PlayerState {
  huntId: string;
  currentStopIndex: number;
  completedAt?: number;
}
