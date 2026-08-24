import type { Match, Player, Standing, Team, Tournament } from '@/types';

export const featuredTournament: Tournament = {
  id: 'summer-championship-2026',
  name: 'Summer Championship 2026',
  description: '16 支顶尖战队争夺年度夏季冠军。小组循环赛后，八强进入双周淘汰赛阶段。',
  format: 'GROUP_KNOCKOUT',
  startDate: '07.18',
  endDate: '08.30',
  teamCount: 16,
  maxTeams: 16,
  defaultBestOf: 3,
};

const t1 = { name: 'T1', shortName: 'T1' };
const gen = { name: 'Gen.G', shortName: 'GEN' };
const blg = { name: 'Bilibili Gaming', shortName: 'BLG' };
const tes = { name: 'Top Esports', shortName: 'TES' };
const hle = { name: 'Hanwha Life Esports', shortName: 'HLE' };
const jdg = { name: 'JD Gaming', shortName: 'JDG' };

export const upcomingMatches: Match[] = [
  { id: 'm-014', stage: '小组赛 · 第 3 轮', teamA: t1, teamB: gen, bestOf: 3, status: 'SCHEDULED', date: '08.24', time: '20:00', venue: '线上赛' },
  { id: 'm-015', stage: '小组赛 · 第 3 轮', teamA: blg, teamB: tes, bestOf: 3, status: 'SCHEDULED', date: '08.24', time: '22:30', venue: '线上赛' },
];

export const recentResults: Match[] = [
  { id: 'm-012', stage: '小组赛 · 第 2 轮', teamA: t1, teamB: hle, bestOf: 3, status: 'FINISHED', date: '08.23', time: '20:00', venue: '线上赛', scoreA: 2, scoreB: 1 },
  { id: 'm-013', stage: '小组赛 · 第 2 轮', teamA: blg, teamB: jdg, bestOf: 3, status: 'FINISHED', date: '08.23', time: '22:30', venue: '线上赛', scoreA: 2, scoreB: 0 },
];

export const standings: Standing[] = [
  { ...gen, wins: 5, losses: 0, points: 15 },
  { ...t1, wins: 4, losses: 1, points: 12 },
  { ...blg, wins: 3, losses: 2, points: 9 },
  { ...tes, wins: 2, losses: 3, points: 6 },
];

export const tournaments: Tournament[] = [
  featuredTournament,
  {
    id: 'kagoshima-summer-cup',
    name: 'Kagoshima LoL Summer Cup',
    description: '面向高校与城市战队的线下杯赛，采用单败淘汰制决出鹿儿岛夏季冠军。',
    format: 'KNOCKOUT',
    startDate: '09.12',
    endDate: '09.14',
    teamCount: 12,
    maxTeams: 16,
    defaultBestOf: 3,
  },
  {
    id: 'rookie-open-2026',
    name: 'Rookie Open 2026',
    description: '新秀战队公开赛，先进行四组循环赛，再由各组前二进入八强。',
    format: 'GROUP_KNOCKOUT',
    startDate: '10.05',
    endDate: '10.26',
    teamCount: 8,
    maxTeams: 16,
    defaultBestOf: 1,
  },
];

export const teams: Team[] = [
  { id: 't1', ...t1, description: '经验与执行力兼备的老牌强队，擅长围绕中野节奏建立优势。', region: 'KR', players: 6, record: '4–1', status: 'ACTIVE' },
  { id: 'gen', ...gen, description: '以稳定运营和后期决策见长，本赛季仍保持小组不败。', region: 'KR', players: 6, record: '5–0', status: 'ACTIVE' },
  { id: 'blg', ...blg, description: '打法主动、边线压制力强，拥有极具威胁的团战能力。', region: 'CN', players: 7, record: '3–2', status: 'ACTIVE' },
  { id: 'tes', ...tes, description: '围绕双 C 输出构建的进攻型战队，比赛节奏紧凑。', region: 'CN', players: 6, record: '2–3', status: 'ACTIVE' },
  { id: 'hle', ...hle, description: '阵容深度出色，善于通过资源交换寻找翻盘窗口。', region: 'KR', players: 6, record: '2–3', status: 'ACTIVE' },
  { id: 'jdg', ...jdg, description: '正在补充替补选手，为淘汰赛阶段完成最后阵容调整。', region: 'CN', players: 5, record: '1–4', status: 'RECRUITING' },
];

export const players: Player[] = [
  { id: 'p-zeus', summonerName: 'Zeus', realName: 'Choi Woo-je', role: 'TOP', team: t1, rank: '王者 1,214 LP', rating: 9.6, matches: 12, status: 'SIGNED' },
  { id: 'p-canyon', summonerName: 'Canyon', realName: 'Kim Geon-bu', role: 'JUNGLE', team: gen, rank: '王者 1,086 LP', rating: 9.4, matches: 11, status: 'SIGNED' },
  { id: 'p-chovy', summonerName: 'Chovy', realName: 'Jeong Ji-hoon', role: 'MID', team: gen, rank: '王者 1,338 LP', rating: 9.8, matches: 13, status: 'SIGNED' },
  { id: 'p-elk', summonerName: 'Elk', realName: 'Zhao Jia-Hao', role: 'ADC', team: blg, rank: '宗师 846 LP', rating: 9.2, matches: 12, status: 'SIGNED' },
  { id: 'p-kelia', summonerName: 'Keria', realName: 'Ryu Min-seok', role: 'SUPPORT', team: t1, rank: '王者 972 LP', rating: 9.5, matches: 12, status: 'SIGNED' },
  { id: 'p-nova', summonerName: 'Nova', realName: 'Open Qualifier', role: 'JUNGLE', team: null, rank: '宗师 621 LP', rating: 8.7, matches: 8, status: 'FREE_AGENT' },
];
