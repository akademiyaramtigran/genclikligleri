// Firestore belge tipleri. Tarih alanları okumada Date'e çevrilir.

export type TeamRef = { slug: string; name: string; shortName: string; logoUrl: string | null; primaryColor: string; secondaryColor: string };

export type Season = { id: string; name: string; startDate: Date; endDate: Date; isActive: boolean };

export type Venue = { id: string; slug: string; name: string; type: string; district: string; address?: string | null; capacity?: number | null; mapUrl?: string | null; description?: string | null };

export type LeagueEntry = { teamId: string; penaltyPoints: number; group?: string | null };

export type LeaderRow = { playerId: string; slug: string; name: string; teamName: string; teamSlug: string; teamColor: string; total: number; matches: number; perMatch: number; photoUrl?: string | null; position?: string | null };

export type StandingRow = TeamRef & {
  teamId: string; played: number; won: number; drawn: number; lost: number; scored: number; conceded: number; diff: number;
  points: number; penalty: number; form: ("G" | "B" | "M")[]; position: number; ratio: number;
};

export type LeagueSummary = {
  standings: StandingRow[];
  leaders: Record<string, LeaderRow[]>;
  discipline: { playerId: string; slug: string; name: string; teamName: string; yellow: number; red: number; susp: number }[];
  stats: { played: number; total: number; scored: number; avg: number; homeWins: number; awayWins: number; draws: number; attendance: number };
  updatedAt?: Date;
};

export type League = {
  id: string; slug: string; name: string; sport: string; gender: string; ageGroup: string; status: string;
  description?: string | null; rules?: string | null; seasonId: string; seasonName: string; seasonActive: boolean;
  entries: LeagueEntry[]; summary?: LeagueSummary | null; createdAt?: Date;
};

export type Team = TeamRef & {
  id: string; sport: string; gender: string; district: string; neighborhood?: string | null; foundedYear?: number | null;
  coachName?: string | null; managerName?: string | null; instagram?: string | null; description?: string | null;
  status: string; venueId?: string | null; venueName?: string | null; leagueIds: string[];
};

export type Player = {
  id: string; slug: string; firstName: string; lastName: string; gender: string; birthDate?: string | null; position?: string | null;
  jerseyNumber?: number | null; heightCm?: number | null; weightKg?: number | null; strongSide?: string | null; district?: string | null;
  school?: string | null; photoUrl?: string | null; bio?: string | null; licenseNo?: string | null; isCaptain: boolean; status: string;
  teamId?: string | null; sport?: string | null;
};

export type MatchEvent = { id: string; teamId: string; playerId: string | null; playerName: string; type: string; value: number; minute: number | null };

export type Match = {
  id: string; leagueId: string; leagueName: string; leagueSlug: string; sport: string; gender: string; round: number;
  homeTeamId: string; awayTeamId: string; teamIds: string[]; home: TeamRef; away: TeamRef;
  date: Date; venueId?: string | null; venueName?: string | null; status: string; homeScore: number | null; awayScore: number | null;
  periodScores?: string | null; referee?: string | null; attendance?: number | null; youtubeUrl?: string | null; summary?: string | null;
  mvpPlayerId?: string | null; mvpName?: string | null; events: MatchEvent[]; playerIds: string[];
};

export type RequiredDoc = { key: string; label: string; required: boolean; hint?: string };

export type Period = {
  id: string; slug: string; title: string; category: string; sport?: string | null; gender?: string | null; leagueId?: string | null; leagueName?: string | null;
  startDate: Date; endDate: Date; summary: string; description?: string | null; requirements: string; requiredDocuments: RequiredDoc[];
  minMembers?: number | null; maxMembers?: number | null; minAge?: number | null; maxAge?: number | null; quota?: number | null;
  fee?: string | null; contactInfo?: string | null; isPublished: boolean; applicationCount?: number;
};

export type AppDocument = { key: string; label: string; fileName: string; path: string; mimeType: string; size: number };

export type Application = {
  id: string; trackingCode: string; periodId: string; periodTitle: string; category: string; status: string; title: string;
  applicantName: string; applicantEmail: string; applicantPhone: string; applicantRole?: string | null; district: string;
  data: Record<string, string>; members: Record<string, string>[]; kvkkConsent: boolean; adminNote?: string | null; publicNote?: string | null;
  reviewedBy?: string | null; reviewedAt?: Date | null; resultEntityId?: string | null; documents: AppDocument[]; createdAt: Date;
};

export type AppStatus = { id: string; status: string; title: string; periodTitle: string; publicNote?: string | null; emailHash: string; memberCount: number; docLabels: string[]; createdAt: Date; reviewedAt?: Date | null };

export type Jury = { name: string; title: string; bio?: string | null };
export type MusicCompetition = { id: string; slug: string; name: string; edition: string; tagline?: string | null; description?: string | null; prizes?: string | null; status: string; votingOpen: boolean; isCurrent: boolean; jury: Jury[]; createdAt?: Date };
export type MusicContestant = { id: string; slug: string; competitionId: string; name: string; type: string; genre: string; district: string; members: { name: string; role: string }[]; bio?: string | null; photoUrl?: string | null; instagram?: string | null; youtubeUrl?: string | null; status: string; finalRank?: number | null; votes?: number };
export type Performance = { contestantId: string; contestantName: string; contestantSlug: string; songTitle: string; songArtist?: string | null; order: number; juryScore?: number | null; publicScore?: number | null; totalScore?: number | null; rank?: number | null; advanced: boolean; youtubeUrl?: string | null; juryComment?: string | null };
export type MusicRound = { id: string; competitionId: string; name: string; order: number; date: Date; venueId?: string | null; venueName?: string | null; status: string; advanceCount?: number | null; youtubeUrl?: string | null; description?: string | null; performances: Performance[] };

export type Award = { id: string; category: string; winner: string; playId?: string | null };
export type Workshop = { id: string; title: string; instructor: string; date: Date; location: string; description?: string | null };
export type TheatreFestival = { id: string; slug: string; name: string; edition: string; theme?: string | null; tagline?: string | null; description?: string | null; startDate: Date; endDate: Date; status: string; isCurrent: boolean; awards: Award[]; workshops: Workshop[] };
export type TheatreGroup = { id: string; slug: string; name: string; district: string; foundedYear?: number | null; director?: string | null; memberCount?: number | null; logoUrl?: string | null; instagram?: string | null; description?: string | null };
export type Show = { id: string; date: Date; venueId?: string | null; venueName?: string | null; ticketInfo: string; status: string };
export type TheatrePlay = { id: string; slug: string; festivalId: string; groupId: string; groupName: string; groupSlug: string; title: string; playwright: string; director: string; genre: string; durationMin?: number | null; ageLimit?: string | null; language: string; synopsis?: string | null; cast: { name: string; role: string }[]; posterUrl?: string | null; youtubeUrl?: string | null; inCompetition: boolean; shows: Show[]; createdAt?: Date };

export type WritingEntry = { id: string; title: string; author: string; penName?: string | null; language: string; category: string; status: string; district?: string | null; synopsis?: string | null; juryNote?: string | null; applicationId?: string | null };
export type WritingJury = { name: string; title: string; language: string };
export type WritingStep = { title: string; date?: Date | null; text?: string | null };
export type WritingContest = {
  id: string; slug: string; name: string; edition: string; tagline?: string | null; description?: string | null; rules?: string | null;
  deadline: Date; status: string; isCurrent: boolean; minAge?: number | null; maxAge?: number | null; prizes: string[]; timeline: WritingStep[];
  jury: WritingJury[]; entries: WritingEntry[]; youtubeUrl?: string | null; createdAt?: Date;
};

export type Announcement = { id: string; slug: string; title: string; excerpt: string; content: string; category: string; coverUrl?: string | null; isPinned: boolean; isPublished: boolean; publishedAt: Date; isHeadline?: boolean; kicker?: string | null };

/** Haftanın öne çıkanları: oyuncu, sanatçı, centilmenlik */
export type Highlight = { id: string; kind: string; weekOf: Date; name: string; subtitle?: string | null; story: string; photoUrl?: string | null; link?: string | null; section?: string | null; isPublished: boolean };

/** Gençliğin Sesi: röportaj, köşe yazısı, fotoğraf, haber */
export type Post = {
  id: string; slug: string; kind: string; section: string; title: string; body: string; author: string; authorRole?: string | null; authorPhoto?: string | null;
  photos: string[]; qa?: { q: string; a: string }[]; publishedAt: Date; isPublished: boolean;
};

export type Volunteer = { id: string; name: string; email: string; phone: string; district: string; role: string; branch?: string | null; experience?: string | null; applicationId?: string | null; active: boolean; createdAt: Date };
export type MailDoc = { id: string; to: string; message: { subject: string; text: string; html?: string }; kind: string; refId?: string | null; createdAt: Date; delivery?: { state?: string } | null };
export type Video = { id: string; title: string; youtubeUrl: string; category: string; description?: string | null; isFeatured: boolean; publishedAt: Date };
export type Message = { id: string; name: string; email: string; phone?: string | null; subject: string; message: string; isRead: boolean; createdAt: Date };
export type AdminUser = { id: string; name: string; email: string; role: string; scope: string; active: boolean; createdAt?: Date; lastLoginAt?: Date | null };
export type LogEntry = { id: string; userId?: string | null; userName?: string | null; action: string; entity: string; entityId?: string | null; details?: string | null; createdAt: Date };
