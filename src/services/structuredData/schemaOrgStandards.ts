/**
 * Schema.org游戏相关标准定义
 * 基于最新的Schema.org规范定义游戏、软件应用等结构化数据类型
 */

/**
 * 支持的Schema.org游戏相关类型
 */
export enum SchemaGameType {
  VideoGame = 'VideoGame',
  Game = 'Game',
  SoftwareApplication = 'SoftwareApplication',
  VideoGameSeries = 'VideoGameSeries',
}

/**
 * 游戏平台枚举
 */
export enum GamePlatform {
  PC = 'PC',
  PlayStation = 'PlayStation',
  PlayStation2 = 'PlayStation 2',
  PlayStation3 = 'PlayStation 3',
  PlayStation4 = 'PlayStation 4',
  PlayStation5 = 'PlayStation 5',
  Xbox = 'Xbox',
  Xbox360 = 'Xbox 360',
  XboxOne = 'Xbox One',
  XboxSeriesX = 'Xbox Series X',
  Nintendo = 'Nintendo',
  NintendoSwitch = 'Nintendo Switch',
  NintendoDS = 'Nintendo DS',
  Nintendo3DS = 'Nintendo 3DS',
  PSP = 'PlayStation Portable',
  PSVita = 'PlayStation Vita',
  Mobile = 'Mobile',
  Android = 'Android',
  iOS = 'iOS',
  Steam = 'Steam',
  EpicGames = 'Epic Games Store',
  Origin = 'Origin',
  Uplay = 'Uplay',
  GOG = 'GOG.com',
  Web = 'Web Browser',
}

/**
 * 游戏模式枚举
 */
export enum GamePlayMode {
  SinglePlayer = 'SinglePlayer',
  MultiPlayer = 'MultiPlayer',
  CoOp = 'CoOp',
  AsynchronousMultiPlayer = 'AsynchronousMultiPlayer',
}

/**
 * 应用程序类别枚举
 */
export enum ApplicationCategory {
  GameApplication = 'GameApplication',
  EntertainmentApplication = 'EntertainmentApplication',
  SocialNetworkingApplication = 'SocialNetworkingApplication',
  MultimediaApplication = 'MultimediaApplication',
  DesktopEnhancementApplication = 'DesktopEnhancementApplication',
  UtilitiesApplication = 'UtilitiesApplication',
  DeveloperApplication = 'DeveloperApplication',
  EducationalApplication = 'EducationalApplication',
  BusinessApplication = 'BusinessApplication',
  SecurityApplication = 'SecurityApplication',
}

/**
 * 应用程序子类别枚举
 */
export enum ApplicationSubCategory {
  ActionGame = 'Action Game',
  AdventureGame = 'Adventure Game',
  ArcadeGame = 'Arcade Game',
  CasualGame = 'Casual Game',
  FamilyGame = 'Family Game',
  MusicGame = 'Music Game',
  PuzzleGame = 'Puzzle Game',
  RacingGame = 'Racing Game',
  RolePlayingGame = 'Role Playing Game',
  SimulationGame = 'Simulation Game',
  SportsGame = 'Sports Game',
  StrategyGame = 'Strategy Game',
  TriviaGame = 'Trivia Game',
  WordGame = 'Word Game',
  BoardGame = 'Board Game',
  CardGame = 'Card Game',
  CasinoGame = 'Casino Game',
  DiceGame = 'Dice Game',
  EducationalGame = 'Educational Game',
}

/**
 * ESRB等级评定
 */
export enum ContentRating {
  EC = 'Early Childhood',
  E = 'Everyone',
  E10Plus = 'Everyone 10+',
  T = 'Teen',
  M = 'Mature 17+',
  AO = 'Adults Only 18+',
  RP = 'Rating Pending',
  // PEGI等级
  PEGI3 = 'PEGI 3',
  PEGI7 = 'PEGI 7',
  PEGI12 = 'PEGI 12',
  PEGI16 = 'PEGI 16',
  PEGI18 = 'PEGI 18',
  // CERO等级
  CEROA = 'CERO A',
  CEROB = 'CERO B',
  CEROC = 'CERO C',
  CEROD = 'CERO D',
  CEROZ = 'CERO Z',
}

/**
 * 组织/开发商类型
 */
export interface Organization {
  '@type': 'Organization';
  name: string;
  url?: string;
  logo?: string | ImageObject;
  foundingDate?: string;
  address?: PostalAddress;
  contactPoint?: ContactPoint;
  sameAs?: string[];
}

/**
 * 人员类型
 */
export interface Person {
  '@type': 'Person';
  name: string;
  url?: string;
  image?: string | ImageObject;
  jobTitle?: string;
  worksFor?: Organization;
  birthDate?: string;
  nationality?: string;
  sameAs?: string[];
}

/**
 * 图片对象
 */
export interface ImageObject {
  '@type': 'ImageObject';
  url: string;
  width?: number;
  height?: number;
  caption?: string;
  contentUrl?: string;
  thumbnailUrl?: string;
  encodingFormat?: string;
}

/**
 * 视频对象
 */
export interface VideoObject {
  '@type': 'VideoObject';
  name: string;
  description?: string;
  thumbnailUrl?: string | string[];
  contentUrl?: string;
  embedUrl?: string;
  uploadDate?: string;
  duration?: string;
  interactionStatistic?: InteractionCounter;
  expires?: string;
}

/**
 * 交互统计
 */
export interface InteractionCounter {
  '@type': 'InteractionCounter';
  interactionType: {
    '@type': 'WatchAction' | 'LikeAction' | 'CommentAction' | 'ShareAction';
  };
  userInteractionCount: number;
}

/**
 * 邮政地址
 */
export interface PostalAddress {
  '@type': 'PostalAddress';
  streetAddress?: string;
  addressLocality?: string;
  addressRegion?: string;
  postalCode?: string;
  addressCountry?: string;
}

/**
 * 联系点
 */
export interface ContactPoint {
  '@type': 'ContactPoint';
  telephone?: string;
  email?: string;
  contactType?: string;
  availableLanguage?: string | string[];
}

/**
 * 数量值
 */
export interface QuantitativeValue {
  '@type': 'QuantitativeValue';
  value?: number;
  minValue?: number;
  maxValue?: number;
  unitText?: string;
}

/**
 * 评分
 */
export interface Rating {
  '@type': 'Rating';
  ratingValue: number | string;
  bestRating?: number;
  worstRating?: number;
  ratingExplanation?: string;
}

/**
 * 聚合评分
 */
export interface AggregateRating {
  '@type': 'AggregateRating';
  ratingValue: number | string;
  reviewCount?: number;
  ratingCount?: number;
  bestRating?: number;
  worstRating?: number;
  itemReviewed?: VideoGame | Game | SoftwareApplication;
}

/**
 * 评论
 */
export interface Review {
  '@type': 'Review';
  reviewRating: Rating;
  author: Person | Organization;
  datePublished?: string;
  reviewBody?: string;
  name?: string;
  itemReviewed?: VideoGame | Game | SoftwareApplication;
  publisher?: Organization;
}

/**
 * 报价/价格
 */
export interface Offer {
  '@type': 'Offer';
  price: number | string;
  priceCurrency?: string;
  availability?: string;
  url?: string;
  priceValidUntil?: string;
  itemCondition?: string;
  seller?: Organization;
  validFrom?: string;
  eligibleRegion?: string;
}

/**
 * 聚合报价
 */
export interface AggregateOffer {
  '@type': 'AggregateOffer';
  lowPrice: number | string;
  highPrice: number | string;
  priceCurrency: string;
  offers?: Offer[];
  offerCount?: number;
}

/**
 * 基础游戏类型
 */
export interface BaseGame {
  '@context': 'https://schema.org';
  '@type': SchemaGameType;
  name: string;
  description?: string;
  url?: string;
  image?: string | string[] | ImageObject | ImageObject[];
  
  // 游戏特有属性
  genre?: string | string[];
  gamePlatform?: string | string[];
  playMode?: GamePlayMode | GamePlayMode[];
  numberOfPlayers?: QuantitativeValue;
  applicationCategory?: ApplicationCategory;
  applicationSubCategory?: ApplicationSubCategory;
  contentRating?: ContentRating | string;
  
  // 创作相关
  author?: Person | Organization | (Person | Organization)[];
  creator?: Person | Organization | (Person | Organization)[];
  developer?: Organization | Organization[];
  publisher?: Organization | Organization[];
  director?: Person | Person[];
  musicBy?: Person | Organization | (Person | Organization)[];
  actor?: Person | (Person | Organization)[];
  
  // 评分和评论
  aggregateRating?: AggregateRating;
  review?: Review | Review[];
  
  // 时间相关
  datePublished?: string;
  dateCreated?: string;
  dateModified?: string;
  copyrightYear?: number;
  
  // 商业信息
  offers?: Offer | AggregateOffer;
  isAccessibleForFree?: boolean;
  
  // 技术信息
  operatingSystem?: string | string[];
  processorRequirements?: string;
  memoryRequirements?: string;
  storageRequirements?: string;
  softwareRequirements?: string;
  
  // 媒体内容
  trailer?: VideoObject | VideoObject[];
  screenshot?: string | string[] | ImageObject | ImageObject[];
  video?: VideoObject | VideoObject[];
  audio?: string | string[];
  
  // 其他
  award?: string | string[];
  keywords?: string | string[];
  inLanguage?: string | string[];
  copyrightHolder?: Person | Organization;
  license?: string;
  sameAs?: string | string[];
  
  // 可访问性
  accessibilityFeature?: string | string[];
  accessibilityHazard?: string | string[];
  accessibilitySummary?: string;
}

/**
 * 电子游戏特有属性
 */
export interface VideoGame extends BaseGame {
  '@type': SchemaGameType.VideoGame;
  
  // VideoGame特有属性
  cheatCode?: string | string[];
  gameTip?: string | string[];
  gameEdition?: string;
  gameServer?: string;
  characterAttribute?: string | string[];
  gameItem?: string | string[];
  gameLocation?: string | string[];
  quest?: string | string[];
  
  // 软件应用属性
  applicationSuite?: string;
  availableOnDevice?: string | string[];
  countriesSupported?: string | string[];
  countriesNotSupported?: string | string[];
  downloadUrl?: string;
  installUrl?: string;
  fileSize?: string;
  softwareVersion?: string;
  releaseNotes?: string;
  softwareAddOn?: SoftwareApplication | SoftwareApplication[];
  softwareHelp?: string;
  featureList?: string | string[];
  permissions?: string | string[];
  supportingData?: string;
}

/**
 * 通用游戏类型
 */
export interface Game extends BaseGame {
  '@type': SchemaGameType.Game;
  
  // Game特有属性
  characterAttribute?: string | string[];
  gameItem?: string | string[];
  gameLocation?: string | string[];
  quest?: string | string[];
}

/**
 * 软件应用类型
 */
export interface SoftwareApplication extends BaseGame {
  '@type': SchemaGameType.SoftwareApplication;
  
  // SoftwareApplication特有属性
  applicationSuite?: string;
  availableOnDevice?: string | string[];
  countriesSupported?: string | string[];
  countriesNotSupported?: string | string[];
  downloadUrl?: string;
  installUrl?: string;
  fileSize?: string;
  softwareVersion?: string;
  releaseNotes?: string;
  softwareAddOn?: SoftwareApplication | SoftwareApplication[];
  softwareHelp?: string;
  featureList?: string | string[];
  permissions?: string | string[];
  supportingData?: string;
}

/**
 * 游戏系列类型
 */
export interface VideoGameSeries extends BaseGame {
  '@type': SchemaGameType.VideoGameSeries;
  
  // VideoGameSeries特有属性
  containsSeason?: string | string[];
  episode?: string | string[];
  numberOfEpisodes?: number;
  numberOfSeasons?: number;
  startDate?: string;
  endDate?: string;
  issn?: string;
  productionCompany?: Organization | Organization[];
  
  // 游戏系列特有属性
  cheatCode?: string | string[];
  characterAttribute?: string | string[];
  gameItem?: string | string[];
  gameLocation?: string | string[];
  quest?: string | string[];
}

/**
 * Schema.org游戏类型联合类型
 */
export type SchemaGameData = VideoGame | Game | SoftwareApplication | VideoGameSeries;

/**
 * 默认Schema.org上下文
 */
export const SCHEMA_CONTEXT = 'https://schema.org';

/**
 * 预定义的游戏类型映射
 */
export const GAME_GENRE_MAPPING: Record<string, string[]> = {
  '动作': ['Action', 'ActionGame'],
  '冒险': ['Adventure', 'AdventureGame'],
  '角色扮演': ['Role Playing', 'RolePlayingGame', 'RPG'],
  '策略': ['Strategy', 'StrategyGame'],
  '模拟': ['Simulation', 'SimulationGame'],
  '竞速': ['Racing', 'RacingGame'],
  '体育': ['Sports', 'SportsGame'],
  '射击': ['Shooter', 'ActionGame'],
  '格斗': ['Fighting', 'ActionGame'],
  '益智': ['Puzzle', 'PuzzleGame'],
  '休闲': ['Casual', 'CasualGame'],
  '音乐': ['Music', 'MusicGame'],
  '街机': ['Arcade', 'ArcadeGame'],
  '家庭': ['Family', 'FamilyGame'],
  '教育': ['Educational', 'EducationalGame'],
  '棋牌': ['Board', 'BoardGame', 'CardGame'],
  '问答': ['Trivia', 'TriviaGame'],
  '文字': ['Word', 'WordGame'],
};

/**
 * 预定义的平台映射
 */
export const PLATFORM_MAPPING: Record<string, GamePlatform> = {
  'PC': GamePlatform.PC,
  'Steam': GamePlatform.Steam,
  'PlayStation': GamePlatform.PlayStation,
  'PlayStation 4': GamePlatform.PlayStation4,
  'PlayStation 5': GamePlatform.PlayStation5,
  'PS4': GamePlatform.PlayStation4,
  'PS5': GamePlatform.PlayStation5,
  'Xbox': GamePlatform.Xbox,
  'Xbox One': GamePlatform.XboxOne,
  'Xbox Series X': GamePlatform.XboxSeriesX,
  'Nintendo Switch': GamePlatform.NintendoSwitch,
  'Switch': GamePlatform.NintendoSwitch,
  'Mobile': GamePlatform.Mobile,
  'Android': GamePlatform.Android,
  'iOS': GamePlatform.iOS,
  'iPhone': GamePlatform.iOS,
  'iPad': GamePlatform.iOS,
  'Web': GamePlatform.Web,
  '网页': GamePlatform.Web,
  '移动': GamePlatform.Mobile,
  '手机': GamePlatform.Mobile,
};

/**
 * Schema.org验证规则
 */
export interface SchemaValidationRule {
  field: string;
  required: boolean;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'url' | 'date' | 'email';
  pattern?: RegExp;
  minLength?: number;
  maxLength?: number;
  enumValues?: string[];
  customValidator?: (value: any) => boolean;
}

/**
 * VideoGame验证规则
 */
export const VIDEO_GAME_VALIDATION_RULES: SchemaValidationRule[] = [
  {
    field: 'name',
    required: true,
    type: 'string',
    minLength: 1,
    maxLength: 200,
  },
  {
    field: 'description',
    required: false,
    type: 'string',
    maxLength: 5000,
  },
  {
    field: 'url',
    required: false,
    type: 'url',
  },
  {
    field: 'image',
    required: false,
    type: 'string',
  },
  {
    field: 'genre',
    required: false,
    type: 'string',
  },
  {
    field: 'gamePlatform',
    required: false,
    type: 'string',
  },
  {
    field: 'applicationCategory',
    required: false,
    type: 'string',
    enumValues: Object.values(ApplicationCategory),
  },
  {
    field: 'datePublished',
    required: false,
    type: 'date',
  },
  {
    field: 'aggregateRating.ratingValue',
    required: false,
    type: 'number',
    customValidator: (value: number) => value >= 0 && value <= 5,
  },
  {
    field: 'aggregateRating.ratingCount',
    required: false,
    type: 'number',
    customValidator: (value: number) => value >= 0,
  },
  {
    field: 'offers.price',
    required: false,
    type: 'number',
    customValidator: (value: number) => value >= 0,
  },
];

/**
 * Schema.org类型检测函数
 */
export const detectSchemaGameType = (gameData: any): SchemaGameType => {
  // 检查是否包含软件应用特有属性
  const softwareProps = ['softwareVersion', 'downloadUrl', 'fileSize', 'operatingSystem'];
  const hasSoftwareProps = softwareProps.some(prop => gameData[prop]);
  
  // 检查是否包含视频游戏特有属性
  const videoGameProps = ['cheatCode', 'gameTip', 'gameEdition', 'trailer'];
  const hasVideoGameProps = videoGameProps.some(prop => gameData[prop]);
  
  // 检查是否为游戏系列
  const seriesProps = ['numberOfEpisodes', 'numberOfSeasons', 'containsSeason'];
  const hasSeriesProps = seriesProps.some(prop => gameData[prop]);
  
  if (hasSeriesProps) {
    return SchemaGameType.VideoGameSeries;
  }
  
  if (hasVideoGameProps || hasSoftwareProps) {
    return SchemaGameType.VideoGame;
  }
  
  return SchemaGameType.Game;
};

/**
 * 生成标准的Schema.org JSON-LD结构
 */
export const generateSchemaJsonLd = (gameData: SchemaGameData): string => {
  const jsonLd = {
    '@context': SCHEMA_CONTEXT,
    ...gameData,
  };
  
  return JSON.stringify(jsonLd, null, 2);
};

/**
 * 常用的Schema.org属性模板
 */
export const SCHEMA_TEMPLATES = {
  basicVideoGame: {
    '@context': SCHEMA_CONTEXT,
    '@type': SchemaGameType.VideoGame,
    name: '',
    description: '',
    genre: '',
    gamePlatform: '',
    applicationCategory: ApplicationCategory.GameApplication,
    datePublished: '',
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: 0,
      ratingCount: 0,
      bestRating: 5,
    },
    offers: {
      '@type': 'Offer',
      price: 0,
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
    },
  } as VideoGame,
  
  basicGame: {
    '@context': SCHEMA_CONTEXT,
    '@type': SchemaGameType.Game,
    name: '',
    description: '',
    genre: '',
    numberOfPlayers: {
      '@type': 'QuantitativeValue',
      minValue: 1,
      maxValue: 1,
    },
    datePublished: '',
  } as Game,
  
  basicSoftwareApplication: {
    '@context': SCHEMA_CONTEXT,
    '@type': SchemaGameType.SoftwareApplication,
    name: '',
    description: '',
    applicationCategory: ApplicationCategory.GameApplication,
    operatingSystem: '',
    softwareVersion: '',
    offers: {
      '@type': 'Offer',
      price: 0,
      priceCurrency: 'USD',
    },
  } as SoftwareApplication,
}; 