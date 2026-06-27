// Configuracion de las tres tiendas (resueltas por subdominio).
// El codigo de cada tienda mapea 1:1 con branches.code en Supabase.

export type StoreKey = 'addani' | 'burbujas' | 'cloud';

export interface StoreConfig {
  key: StoreKey;
  branchCode: string;   // = branches.code en Supabase
  name: string;
  tagline: string;
  brand: string;        // color principal (hex)
  brandOn: string;      // color de texto sobre el principal
  emoji: string;
  kind: 'polirrubro' | 'cotillon' | 'tech';
  isService: boolean;   // CLOUD = servicio (reparacion + accesorios)
  subdomains: string[]; // etiquetas de host que caen en esta tienda
}

export const STORES: Record<StoreKey, StoreConfig> = {
  addani: {
    key: 'addani', branchCode: 'addani',
    name: 'ADDANI', tagline: 'Polirrubro, regaleria y libreria',
    brand: '#e11d48', brandOn: '#ffffff', emoji: 'A',
    kind: 'polirrubro', isService: false,
    subdomains: ['addani', 'addani-tienda', 'www', 'tienda', 'localhost'],
  },
  burbujas: {
    key: 'burbujas', branchCode: 'cotillon',
    name: 'Cotillon Burbujas', tagline: 'Todo para tu fiesta',
    brand: '#c026d3', brandOn: '#ffffff', emoji: 'B',
    kind: 'cotillon', isService: false,
    subdomains: ['burbujas', 'cotillon'],
  },
  cloud: {
    key: 'cloud', branchCode: 'cloud',
    name: 'CLOUD', tagline: 'Servicio tecnico y accesorios',
    brand: '#D9A521', brandOn: '#111827', emoji: 'C',
    kind: 'tech', isService: true,
    subdomains: ['cloud', 'servicio'],
  },
};

export const DEFAULT_STORE: StoreKey = 'addani';

export function storeFromHost(host?: string | null): StoreConfig {
  if (!host) return STORES[DEFAULT_STORE];
  const label = host.split(':')[0].split('.')[0].toLowerCase();
  for (const s of Object.values(STORES)) {
    if (s.subdomains.includes(label)) return s;
  }
  return STORES[DEFAULT_STORE];
}

export function storeFromKey(key?: string | null): StoreConfig {
  if (key && (key in STORES)) return STORES[key as StoreKey];
  return STORES[DEFAULT_STORE];
}
