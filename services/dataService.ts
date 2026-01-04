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
    
    // Self-healing: Detect and fix common typos or broken URLs from previous versions
    const fixed = parsed.map(room => {
      // If the URL has common errors or is a known legacy broken version
      if (room.id === 'room-01' && (room.csvUrl.includes('__') || !room.csvUrl.includes('pub?output=csv'))) {
        return { ...room, csvUrl: DEFAULT_ROOMS[0].csvUrl };
      }
      return room;
    });
    
    return fixed;
  } catch {
    return DEFAULT_ROOMS;
  }
}

export function saveRooms(rooms: RoomConfig[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rooms));
}

export async function fetchRoomData(room: RoomConfig): Promise<SensorData[]> {
  try {
    const response = await fetch(room.csvUrl, { 
      cache: 'no-store',
      mode: 'cors'
    });

    if (!response.ok) {
      throw new Error(`HTTP Error ${response.status}`);
    }

    const csvText = await response.text();
    
    // Guard against Google Sheets returning an HTML login/error page instead of CSV
    if (csvText.toLowerCase().trim().startsWith('<!doctype html>')) {
      throw new Error('Received HTML instead of CSV. Ensure sheet is published to web as CSV.');
    }

    const lines = csvText.split(/\r?\n/).filter(line => line.trim() !== '');
    if (lines.length < 2) {
      return generateMockData(room.id, true);
    }

    const headers = lines[0].toLowerCase().split(',').map(h => h.trim());
    
    const idx = {
      timestamp: headers.findIndex(h => h.includes('time') || h.includes('date')),
      temp: headers.findIndex(h => h.includes('temp') || h.includes('dht')),
      humidity: headers.findIndex(h => h.includes('hum')),
      toxicGas: headers.findIndex(h => h.includes('mq') || h.includes('toxic')),
      co2: headers.findIndex(h => h.includes('co2') || h.includes('mg'))
    };

    const data: SensorData[] = lines.slice(1).map((line) => {
      const values = line.split(',').map(v => v.trim());
      
      const parseNum = (index: number, fallback = 0) => {
        if (index === -1 || index >= values.length) return fallback;
        const val = parseFloat(values[index]);
        return isNaN(val) ? fallback : val;
      };

      const rawTime = idx.timestamp !== -1 ? values[idx.timestamp] : '';
      let dateObj = new Date(rawTime);
      
      if (isNaN(dateObj.getTime())) {
        dateObj = new Date();
      }

      return {
        timestamp: dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        date: dateObj,
        temp: parseNum(idx.temp),
        humidity: parseNum(idx.humidity),
        toxicGas: parseNum(idx.toxicGas),
        co2: parseNum(idx.co2),
        isMock: false,
        roomId: room.id
      };
    });

    // Sort by time and ensure we don't have empty readings
    return data
      .filter(d => !isNaN(d.date.getTime()))
      .sort((a, b) => a.date.getTime() - b.date.getTime());

  } catch (error) {
    console.warn(`Fetch failed for ${room.name}, using mock data.`, error);
    return generateMockData(room.id, true);
  }
}

function generateMockData(roomId: string, isFromFailure = false): SensorData[] {
  const now = new Date();
  const count = 30;
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(now.getTime() - (count - i) * 60000);
    return {
      timestamp: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      date: d,
      temp: 20 + Math.random() * 10,
      humidity: 40 + Math.random() * 20,
      toxicGas: 50 + Math.random() * 100,
      co2: 400 + Math.random() * 200,
      isMock: isFromFailure,
      roomId
    };
  });
}