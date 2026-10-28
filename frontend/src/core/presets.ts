import { MediaAssetPreset } from '../types';

export const STOCK_VIDEOS: MediaAssetPreset[] = [
  {
    id: 'sample_neon_city',
    title: 'Cyberpunk Neon City',
    type: 'video',
    thumbnailUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=400&q=80',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    durationSec: 15,
    category: 'Cinematic'
  },
  {
    id: 'sample_drone_nature',
    title: 'Alpine Mountain Peak',
    type: 'video',
    thumbnailUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=400&q=80',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    durationSec: 15,
    category: 'Nature'
  },
  {
    id: 'sample_skater_action',
    title: 'Urban Action Movement',
    type: 'video',
    thumbnailUrl: 'https://images.unsplash.com/photo-1520045892732-304bc3ac5d8e?auto=format&fit=crop&w=400&q=80',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4',
    durationSec: 15,
    category: 'Action'
  }
];

export const STOCK_AUDIO: MediaAssetPreset[] = [
  {
    id: 'audio_synthwave',
    title: 'Neon Nights (Synthwave Beat)',
    type: 'audio',
    url: 'https://actions.google.com/sounds/v1/science_fiction/scifi_hum.ogg',
    durationSec: 24,
    category: 'Electronic',
    beats: [1200, 2400, 3600, 4800, 6000, 7200, 8400, 9600, 10800, 12000, 13200, 14400, 15600, 16800, 18000],
    waveformData: [
      0.2, 0.4, 0.7, 0.9, 0.5, 0.3, 0.6, 0.85, 0.4, 0.2, 0.7, 0.95, 0.6, 0.3, 0.8, 0.9,
      0.3, 0.5, 0.75, 0.9, 0.4, 0.2, 0.65, 0.85, 0.35, 0.2, 0.75, 1.0, 0.55, 0.3, 0.85, 0.95
    ]
  },
  {
    id: 'audio_lofi_chill',
    title: 'Midnight Coffee (Lo-Fi Chill)',
    type: 'audio',
    url: 'https://actions.google.com/sounds/v1/ambiences/coffee_shop.ogg',
    durationSec: 30,
    category: 'Lo-Fi',
    beats: [1500, 3000, 4500, 6000, 7500, 9000, 10500, 12000, 13500, 15000, 16500, 18000],
    waveformData: [
      0.15, 0.3, 0.45, 0.6, 0.35, 0.25, 0.4, 0.55, 0.3, 0.2, 0.5, 0.65, 0.4, 0.25, 0.55, 0.6,
      0.2, 0.35, 0.5, 0.6, 0.3, 0.15, 0.45, 0.55, 0.25, 0.2, 0.5, 0.7, 0.4, 0.2, 0.6, 0.65
    ]
  }
];

export const STOCK_SFX: MediaAssetPreset[] = [
  {
    id: 'sfx_whoosh',
    title: 'Fast Cinematic Whoosh',
    type: 'sfx',
    url: 'https://actions.google.com/sounds/v1/weapons/air_whoosh.ogg',
    durationSec: 1.5,
    category: 'Transition'
  },
  {
    id: 'sfx_sub_bass',
    title: 'Deep Cinema Impact',
    type: 'sfx',
    url: 'https://actions.google.com/sounds/v1/explosions/distant_bomb.ogg',
    durationSec: 2.5,
    category: 'Impact'
  }
];

export const TEXT_PRESETS = [
  {
    id: 'text_cyber',
    name: 'Cyberpunk Neon Title',
    text: 'NEON PROTOCOL',
    fontSize: 56,
    fontFamily: 'Outfit',
    color: '#00F2FE',
    animation: 'fade' as const
  },
  {
    id: 'text_cinematic',
    name: 'Cinematic Minimalist',
    text: 'A FILM BY CREATOR',
    fontSize: 32,
    fontFamily: 'Inter',
    color: '#FFFFFF',
    animation: 'pop' as const
  },
  {
    id: 'text_quote',
    name: 'Kinetic Quote',
    text: '"Make Every Frame Count"',
    fontSize: 38,
    fontFamily: 'Inter',
    color: '#FFB300',
    animation: 'slideUp' as const
  }
];

export const LUT_PRESETS = [
  { id: 'normal', name: 'Original (Standard)', filter: 'none', previewColor: '#6B7280' },
  { id: 'teal_orange', name: 'Teal & Orange (Blockbuster)', filter: 'contrast(1.2) saturate(1.3) hue-rotate(-10deg)', previewColor: '#00F2FE' },
  { id: 'cyberpunk', name: 'Cyberpunk Neon', filter: 'contrast(1.3) saturate(1.6) hue-rotate(30deg)', previewColor: '#9D4EDD' },
  { id: 'golden_hour', name: 'Golden Hour (Warm Sunset)', filter: 'sepia(0.3) saturate(1.4) brightness(1.05)', previewColor: '#FFB300' },
  { id: 'noir', name: 'Vintage Noir (Black & White)', filter: 'grayscale(1) contrast(1.4) brightness(0.9)', previewColor: '#FFFFFF' }
];

export const SPEED_CURVE_PRESETS = [
  {
    id: 'montage',
    name: 'Montage (Fast-Slow-Fast)',
    points: [
      [0, 1.0],
      [0.25, 4.0],
      [0.5, 0.4],
      [0.75, 4.0],
      [1.0, 1.0]
    ] as Array<[number, number]>
  },
  {
    id: 'hero',
    name: 'Hero Climax (Slow Motion Drop)',
    points: [
      [0, 1.0],
      [0.3, 1.2],
      [0.5, 0.25],
      [0.7, 0.25],
      [1.0, 1.0]
    ] as Array<[number, number]>
  },
  {
    id: 'bullet_time',
    name: 'Bullet Time (Matrix Pause)',
    points: [
      [0, 2.0],
      [0.4, 0.15],
      [0.6, 0.15],
      [0.8, 3.0],
      [1.0, 1.0]
    ] as Array<[number, number]>
  },
  {
    id: 'flash_in',
    name: 'Flash In (Speed Ramp Start)',
    points: [
      [0, 5.0],
      [0.2, 3.0],
      [0.5, 1.0],
      [0.8, 1.0],
      [1.0, 1.0]
    ] as Array<[number, number]>
  }
];
