export type StationResult = {
  type: "station";
  name: string;
  line: string;
  prefecture: string;
};

export type SpotResult = {
  type: "spot";
  name: string;
  tourism: string;
  prefecture?: string;
  lat: number;
  lon: number;
};

export type GachaResult = StationResult | SpotResult;

export type Station = {
  name: string;
  prefecture: string;
  line: string;
  x: number;
  y: number;
  postal: string;
  prev: string;
  next: string;
};

export type Spot = {
  name: string;
  tourism: string;
  lat: number;
  lon: number;
};

export type FilterOptions = {
  area?: string;
  prefecture?: string;
};
