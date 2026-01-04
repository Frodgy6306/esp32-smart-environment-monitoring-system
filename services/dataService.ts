
import { SensorData, RoomConfig } from '../types';

const STORAGE_KEY = 'ecoguard_rooms_config';

const DEFAULT_ROOMS: RoomConfig[] = [
  {
    id: 'room-01',
    name: 'Living Room',
    csvUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRFe6FgQmWF_JV3on_oAxAs_iZTd5ZLJRZEAhRd6HR4I4PwT1OuKr68vU_JbBsC5DUhiJ3YbH5EdE-y/pub?output=csv',
    description: 'Main living area monitoring (ESP32-A)'
  }
];

export function getStoredRooms(): RoomConfig[] {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_ROOMS));
    return DEFAULT_ROOMS;
  }
  try {
    return JSON.parse(stored);
  } catch {
    return DEFAULT_ROOMS;
  }
}

export function saveRooms(rooms: RoomConfig[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rooms));
}

const SMOOTHING_WINDOW = 5;

export async function fetchRoomData(room: RoomConfig): Promise<SensorData[]> {
  try {
    const response = await fetch(room.csvUrl);
    if (!response.ok) throw new Error('Network response was not ok');
    const csvText = await response.text();
    
    const lines = csvText.split('\n').filter(line => line.trim() !== '');
    // If only header exists, it's essentially an empty node
    if (lines.length < 2) return generateMockData(room.id, true);

    const headers = lines[0].toLowerCase().split(',').map(h => h.trim());
    
    const idx = {
      timestamp: headers.findIndex(h => h.includes('time') || h.includes('date') || h.includes('timestamp')),
      temp: headers.findIndex(h => (h.includes('temp') || h.includes('dht')) && !h.includes('gas')),
      humidity: headers.findIndex(h => h.includes('hum') || h.includes('rh')),
      toxicGas: headers.findIndex(h => h.includes('mq') || h.includes('toxic') || (h.includes('gas') && !h.includes('co2'))),
      co2: headers.findIndex(h => h.includes('co2') || h.includes('mg') || h.includes('811'))
    };

    const data: SensorData[] = lines.slice(1).map((line) => {
      const values = line.split(',').map(v => v.trim());
      
      const getVal = (index: number, fallbackIdx: number) => {
        const primary = index !== -1 ? parseFloat(values[index]) : NaN;
        if (!isNaN(primary)) return primary;
        const fallback = parseFloat(values[fallbackIdx]);
        return isNaN(fallback) ? 0 : fallback;
      };

      const rawTime = idx.timestamp !== -1 ? values[idx.timestamp] : '';
      let dateObj = new Date(rawTime);
      // If timestamp is invalid, we mark it but we don't just use "new Date()" 
      // because that masks downtime.
      const isTimeValid = !isNaN(dateObj.getTime());

      return {
        timestamp: isTimeValid ? dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Invalid Time',
        date: isTimeValid ? dateObj : new Date(0), // Use epoch for missing timestamps to trigger staleness
        temp: getVal(idx.temp, 1),
        humidity: getVal(idx.humidity, 2),
        toxicGas: getVal(idx.toxicGas, 3),
        co2: getVal(idx.co2, 4),
        isMock: false,
        roomId: room.id
      };
    });

    data.sort((a, b) => a.date.getTime() - b.date.getTime());
    return applySmoothing(data);
  } catch (error) {
    console.error(`Error fetching data for ${room.name}:`, error);
    return generateMockData(room.id, true);
  }
}

function applySmoothing(data: SensorData[]): SensorData[] {
  return data.map((item, idx, arr) => {
    if (idx < SMOOTHING_WINDOW) return item;
    const slice = arr.slice(idx - SMOOTHING_WINDOW + 1, idx + 1);
    const avgGas = slice.reduce((sum, d) => sum + d.toxicGas, 0) / SMOOTHING_WINDOW;
    const avgCo2 = slice.reduce((sum, d) => sum + d.co2, 0) / SMOOTHING_WINDOW;
    return { ...item, toxicGas: Number(avgGas.toFixed(2)), co2: Number(avgCo2.toFixed(2)) };
  });
}

function generateMockData(roomId: string, isFromFailure: boolean = false): SensorData[] {
  const now = new Date();
  // If it's from a failure, we want to simulate old data to trigger the alert
  // Shift mock data back by 2 hours so staleness detection hits immediately
  const offset = isFromFailure ? 120 * 60000 : 0; 
  
  return Array.from({ length: 40 }, (_, i) => {
    const d = new Date(now.getTime() - offset - (40 - i) * 60000);
    return {
      timestamp: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      date: d,
      temp: 22 + Math.random() * 5,
      humidity: 45 + Math.random() * 10,
      toxicGas: 80 + Math.random() * 40,
      co2: 380 + Math.random() * 80,
      isMock: true,
      roomId
    };
  });
}
