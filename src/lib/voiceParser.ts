import { getCategories, toDateStr } from './storage';

export interface VoiceResult {
  categoryId: string;
  categoryName: string;
  amount: number;
  date: string;
  note: string;
  raw: string;
}

const ALIASES: Record<string, string[]> = {
  '幼儿园学费': ['幼儿园', '学费'],
  '物业费': ['物业', '物业费'],
  '保险费': ['保险', '保费'],
  '手机费': ['手机', '话费', '手机话费', '电话费'],
  '小庆零花钱': ['小庆零花钱', '小庆零用钱'],
  '药物': ['药', '买药', '药品', '医药费'],
  '早餐': ['早餐', '早饭', '早点'],
  '午餐': ['午餐', '午饭', '中饭', '中餐'],
  '晚餐': ['晚餐', '晚饭', '夜饭'],
  '水果': ['水果'],
  '买菜': ['菜', '买菜', '蔬菜'],
  '买肉': ['肉', '买肉'],
  '超市': ['超市'],
  '零食': ['零食', '小吃'],
  '外卖': ['外卖', '点外卖'],
  '咖啡奶茶': ['咖啡', '奶茶', '喝咖啡', '喝奶茶', '咖啡奶茶', '饮料'],
  '孝敬父母': ['孝敬父母', '给父母', '给爸妈', '爸妈零花', '父母', '孝父母'],
  '同事': ['同事', '给同事', '同事聚餐'],
  '停车费': ['停车', '停车费'],
  '加油费': ['加油', '加油费', '油费'],
  '充电费': ['充电', '充电费', '电费'],
  '洗车费': ['洗车', '洗车费'],
  '保养费': ['保养', '保养费', '维修', '修车'],
  '日常用品': ['日常用品', '日用品', '日用', '生活用品'],
  '化妆护肤': ['化妆', '护肤', '化妆品', '护肤品', '美容'],
  '衣物': ['衣服', '衣物', '买衣服', '裤子', '鞋子', '买鞋', '穿'],
  '运动健身': ['运动', '健身', '健身房', '运动器材'],
  '约会': ['约会', '约会吃饭', '谈恋爱'],
  '读书学习': ['读书', '学习', '买书', '课程'],
  '罚款': ['罚款', '罚单', '违章'],
  '不该花的钱': ['不该花', '不该花的', '乱花钱', '冲动消费'],
  '小淇花销': ['小淇', '小淇花', '小淇花费', '小淇开销'],
  '小庆花销': ['小庆', '小庆花', '小庆花费', '小庆开销'],
  '交通费': ['交通', '打车', '公交', '地铁', '车费', '过路费', '叫车'],
  '其他': ['其他', '杂项', '乱七八糟'],
  '工资': ['工资', '薪水', '发工资'],
  '奖金': ['奖金', '年终奖', '绩效', '提成', '奖励'],
};

export function parseVoiceInput(text: string): VoiceResult | null {
  const raw = text.trim();
  if (!raw) return null;

  const categories = getCategories();
  const now = new Date();

  // --- 1. Extract date ---
  let date = toDateStr(now);

  const dateMatch = raw.match(/(\d{1,2})\s*月\s*(\d{1,2})\s*[日号]/);
  if (dateMatch) {
    const m = parseInt(dateMatch[1], 10);
    const d = parseInt(dateMatch[2], 10);
    if (m >= 1 && m <= 12 && d >= 1 && d <= 31) {
      date = `${now.getFullYear()}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    }
  } else if (/今[天日]/.test(raw)) {
    date = toDateStr(now);
  } else if (/昨[天日]/.test(raw)) {
    const y = new Date(now);
    y.setDate(y.getDate() - 1);
    date = toDateStr(y);
  } else if (/前[天日]/.test(raw)) {
    const y = new Date(now);
    y.setDate(y.getDate() - 2);
    date = toDateStr(y);
  } else if (/大前[天日]/.test(raw)) {
    const y = new Date(now);
    y.setDate(y.getDate() - 3);
    date = toDateStr(y);
  }

  // --- 2. Extract amount ---
  let amount = 0;

  const huaMatch = raw.match(/花了?\s*(\d+(?:\.\d{1,2})?)\s*[块元]?/);
  if (huaMatch) {
    amount = parseFloat(huaMatch[1]);
  }
  if (!amount) {
    const kuaiMatch = raw.match(/(\d+(?:\.\d{1,2})?)\s*[块元](?:钱)?/);
    if (kuaiMatch) amount = parseFloat(kuaiMatch[1]);
  }
  if (!amount) {
    const numMatch = raw.match(/(\d+(?:\.\d{1,2})?)\s*$/);
    if (numMatch) amount = parseFloat(numMatch[1]);
  }

  if (amount <= 0) return null;

  // --- 3. Extract explicit note: "备注..." or "，备注..." ---
  let note = '';
  const beiZhuMatch = raw.match(/[,，]?\s*备注\s*[：:，,]?\s*(.+?)$/);
  if (beiZhuMatch) {
    note = beiZhuMatch[1].trim();
    if (note.length > 50) note = note.slice(0, 50);
  }

  // --- 4. Match category ---
  let bestMatch: { id: string; name: string; score: number } | null = null;

  // Remove 备注 part before matching to avoid false positives
  const searchText = beiZhuMatch ? raw.slice(0, raw.indexOf('备注')) : raw;

  for (const cat of categories) {
    const aliases = ALIASES[cat.name] || [cat.name];
    for (const alias of aliases) {
      if (searchText.includes(alias)) {
        const score = alias.length;
        if (!bestMatch || score > bestMatch.score) {
          bestMatch = { id: cat.id, name: cat.name, score };
        }
      }
    }
  }

  if (!bestMatch) {
    const other = categories.find(c => c.name === '其他' && c.type === 'expense');
    bestMatch = other
      ? { id: other.id, name: '其他', score: 0 }
      : { id: categories[0]?.id || '', name: '其他', score: 0 };
  }

  return {
    categoryId: bestMatch.id,
    categoryName: bestMatch.name,
    amount,
    date,
    note,
    raw,
  };
}
