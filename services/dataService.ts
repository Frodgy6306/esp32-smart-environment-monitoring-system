import { SensorData, RoomConfig } from '../types';

const STORAGE_KEY = 'ecoguard_rooms_config';

const DEFAULT_ROOMS: RoomConfig[] = [
  {
    id: 'room-01',
    name: 'Main Monitor',
    csvUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRFe6FgQmWF_JV3on_oAxAs_iZTd5ZLJRZEAhRd6HR4I4PwT1OuKr68vU_JbBsC5DUhiJ3/pub?output=csv',
    description: 'Environmental monitoring node (ESP32)'
  }
];

export function getStoredRooms(): RoomConfig[] {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_ROOMS));
    return DEFAULT_ROOMS;
  }
  try {
    const parsed = JSON.parse(stored) as RoomConfig[];
    // Self-healing fix for users who might have the old broken URL in their localStorage
    return parsed.map(room => {
      if (room.id === 'room-01' && (room.csvUrl.includes('__') || room.csvUrl.includes('Fix'))) {
        return DEFAULT_ROOMS[0];
      }
      return room;
    });
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
    const response = await fetch(room.csvUrl, { 
      cache: 'no-store',
      mode: 'cors'
    });

    if (!response.ok) {
      console.warn(`Fetch failed for ${room.name}: ${response.status} ${response.statusText}`);
      throw new Error(`Network response was not ok (${response.status})`);
    }

    const csvText = await response.text();
    
    // Check if we actually got CSV content or an HTML error page from Google
    if (csvText.toLowerCase().trim().startsWith('<!doctype html>')) {
      console.warn(`Received HTML instead of CSV for ${room.name}. This usually means the sheet is not "Published to the web" correctly as a CSV.`);
      throw new Error('Invalid data format: received HTML instead of CSV');
    }

    const lines = csvText.split(/\r?\n/).filter(line => line.trim() !== '');
    if (lines.length < 2) {
      console.warn(`CSV for ${room.name} has no data rows.`);
      return generateMockData(room.id, true);
    }

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
      
      const getVal = (index: number) => {
        if (index === -1 || index >= values.length) return 0;
        const val = parseFloat(values[index]);
        return isNaN(val) ? 0 : val;
      };

      const rawTime = idx.timestamp !== -1 ? values[idx.timestamp] : '';
      let dateObj = new Date(rawTime);
      
      // Handle cases where date is just a time or badly formatted
      if (isNaN(dateObj.getTime())) {
        if (rawTime.includes(':')) {
          const today = new Date().toLocaleDateString();
          dateObj = new Date(`${today} ${rawTime}`);
        } else {
          dateObj = new Date();
        }
      }

      return {
        timestamp: dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        date: dateObj,
        temp: getVal(idx.temp),
        humidity: getVal(idx.humidity),
        toxicGas: getVal(idx.toxicGas),
        co2: getVal(idx.co2),
        isMock: false,
        roomId: room.id
      };
    });

    const validData = data.filter(d => !isNaN(d.date.getTime()));
    validData.sort((a, b) => a.date.getTime() - b.date.getTime());
    
    return applySmoothing(validData);
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
  const count = 40;
  
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(now.getTime() - (count - i) * 60000);
    return {
      timestamp: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      date: d,
      temp: 22 + Math.random() * 5,
      humidity: 45 + Math.random() * 10,
      toxicGas: 80 + Math.random() * 40,
      co2: 380 + Math.random() * 80,
      isMock: isFromFailure,
      roomId
    };
  });
}