import { Film, LiveTickerData } from './types';

export const mockFilms: Film[] = [
  {
    id: 'garuda',
    title: 'Project Garuda',
    genre: 'Supernatural Horror',
    client: 'MD Pictures',
    phase: 'Week 4',
    daysToRelease: -28,
    reach: '1.2M',
    occupancy: 72,
    status: 'active',
    progress: 72,
    logline: 'A research team discovers an ancient deity in a remote mountain range.',
    leadCast: 'Ario Bayu, Tara Basro',
    budgetTier: 'major',
    releaseWindow: 'nataru',
    ipType: 'original'
  },
  {
    id: 'sayap',
    title: 'Sayap Patah',
    genre: 'Romantic Drama',
    client: 'Visinema',
    phase: 'Pre-release',
    daysToRelease: 14,
    reach: '640K',
    occupancy: null,
    status: 'pre-release',
    progress: 31,
    alert: 'Awareness gap — segmen Penonton Romance belum terjangkau',
    logline: 'A dramatic love story set against the backdrop of a security crisis.',
    leadCast: 'Nicholas Saputra, Ariel Tatum',
    budgetTier: 'mid',
    releaseWindow: 'regular',
    ipType: 'popular-adaptation'
  },
  {
    id: 'langit',
    title: 'Langit Ketujuh',
    genre: 'Family / Animation',
    client: 'Falcon Pictures',
    phase: 'Post W2',
    daysToRelease: -14,
    reach: '2.3M',
    occupancy: 45,
    status: 'post',
    progress: 100,
    logline: 'An animated adventure of five friends searching for a mythical city.',
    budgetTier: 'mid',
    releaseWindow: 'lebaran',
    ipType: 'original'
  },
];

export const mockTickerData: LiveTickerData = {
  filmId: 'garuda',
  lastUpdated: '14 menit lalu',
  totalAdmission: 847000,
  revenue: 12400000000,
  avgOccupancy: 71,
  trend: 'up',
  cities: [
    { name: 'Jakarta', occupancy: 82, trend: 'up', alert: false },
    { name: 'Surabaya', occupancy: 63, trend: 'stable', alert: false },
    { name: 'Bandung', occupancy: 71, trend: 'up', alert: false },
    { name: 'Medan', occupancy: 51, trend: 'down', alert: true },
    { name: 'Yogyakarta', occupancy: 44, trend: 'down', alert: true },
    { name: 'Makassar', occupancy: 38, trend: 'stable', alert: false },
    { name: 'Palembang', occupancy: 35, trend: 'down', alert: true },
    { name: 'Semarang', occupancy: 58, trend: 'stable', alert: false },
  ],
};
