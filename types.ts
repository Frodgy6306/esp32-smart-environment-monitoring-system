
export interface RoomConfig {
  id: string;
  name: string;
  csvUrl: string;
  description: string;
}

export interface SensorData {
  timestamp: string;
  date: Date;
  temp: number;
  humidity: number;
  toxicGas: number;
  co2: number;
  isStale?: boolean;
  isMock?: boolean; 
  roomId: string;
}

export interface AIInsight {
  status: 'SAFE' | 'WARNING' | 'DANGER';
  prediction: string;
  trend: 'STABLE' | 'RISING' | 'FALLING';
  confidence: number;
  thoughtProcess?: string;
}

export type AppView = 'dashboard' | 'alerts' | 'config' | 'analytics';

export enum SensorType {
  TEMPERATURE = 'TEMPERATURE',
  HUMIDITY = 'HUMIDITY',
  TOXIC_GAS = 'TOXIC_GAS',
  CO2 = 'CO2'
}
