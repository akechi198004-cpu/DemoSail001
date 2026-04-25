import { MapObject } from '../objects/MapObjectTypes';

export const LOCATION_NAMES = {
  PORT: [
    '阿姆斯特丹', '热那亚', '亚历山大', '马赛', '哥本哈根',
    '那不勒斯', '雅典', '斯德哥尔摩', '汉堡', '布里斯托尔',
    '安特卫普', '波尔多', '巴塞罗那', '阿尔及尔', '突尼斯'
  ],
  CITY: [
    '巴黎', '马德里', '罗马', '柏林', '维也纳',
    '布拉格', '莫斯科', '耶路撒冷', '大马士革', '米兰',
    '佛罗伦萨', '慕尼黑', '华沙', '基辅', '伊斯坦布尔'
  ],
  RUIN: [
    '巨石阵', '特洛伊遗址', '庞贝古城', '巴比伦遗址', '帕台农神庙',
    '迈锡尼遗址', '克诺索斯迷宫', '马丘比丘', '奇琴伊察', '吴哥窟'
  ],
  VILLAGE: [
    '哈尔施塔特', '羊角村', '拜伯里', '萨弗伦沃尔登', '克鲁姆洛夫',
    '五渔村', '格拉斯', '大库马亚', '白露里治奥', '科尔马'
  ]
};

export const INITIAL_MAP_OBJECTS: MapObject[] = [
  {
    id: 'lisbon',
    name: '里斯本',
    type: 'PORT',
    tx: 2047,
    ty: 2047,
    isDiscovered: false,
    visibilityRange: 8,
    interactionRange: 1,
    description: '大航海时代的起点，熙熙攘攘的港口城市。'
  },
  {
    id: 'london',
    name: '伦敦',
    type: 'PORT',
    tx: 2020,
    ty: 2025,
    isDiscovered: false,
    visibilityRange: 8,
    interactionRange: 1,
    description: '浓雾笼罩的大港口，海上贸易的枢纽。'
  },
  {
    id: 'venice',
    name: '威尼斯',
    type: 'PORT',
    tx: 2060,
    ty: 2050,
    isDiscovered: false,
    visibilityRange: 8,
    interactionRange: 1,
    description: '水城威尼斯，无数商船云集于此。'
  },
  {
    id: 'seville',
    name: '塞维利亚',
    type: 'CITY',
    tx: 2055,
    ty: 2045,
    isDiscovered: false,
    visibilityRange: 10,
    interactionRange: 1,
    description: '内陆繁华大城，商业与权力的交汇点。'
  },
  {
    id: 'cairo',
    name: '开罗',
    type: 'CITY',
    tx: 2080,
    ty: 2060,
    isDiscovered: false,
    visibilityRange: 12,
    interactionRange: 1,
    description: '沙漠之城，香料与传说的发源地。'
  },
  {
    id: 'mystic_ruin',
    name: '神秘遗迹',
    type: 'RUIN',
    tx: 2030,
    ty: 2065,
    isDiscovered: false,
    visibilityRange: 5,
    interactionRange: 1,
    description: '杂草丛生的古代遗迹，隐约散发着微光。'
  },
  {
    id: 'nameless_village',
    name: '无名村落',
    type: 'VILLAGE',
    tx: 2040,
    ty: 2035,
    isDiscovered: false,
    visibilityRange: 4,
    interactionRange: 1,
    description: '隐居在此的村民对外界知之甚少。'
  },
  {
    id: 'ancient_lighthouse',
    name: '古代灯塔',
    type: 'DISCOVERY',
    tx: 2060,
    ty: 2075,
    isDiscovered: false,
    visibilityRange: 8,
    interactionRange: 1,
    description: '曾指引着古代舰队的雄伟建筑。'
  }
];
