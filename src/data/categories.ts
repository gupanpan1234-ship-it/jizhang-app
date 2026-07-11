import { Category } from '../types';

let _id = 0;
function id(): string { return String(++_id); }

export function getDefaultCategories(): Category[] {
  _id = 0;
  return [
    // === 支出大类 ===
    ...makeGroup('必要支出', '🏠', [
      { name: '幼儿园学费', icon: '🎓' },
      { name: '物业费', icon: '🏢' },
      { name: '保险费', icon: '🛡️' },
      { name: '手机费', icon: '📱' },
      { name: '小庆零花钱', icon: '👦' },
      { name: '药物', icon: '💊' },
    ]),
    ...makeGroup('饮食', '🍽️', [
      { name: '早餐', icon: '🌅' },
      { name: '午餐', icon: '☀️' },
      { name: '晚餐', icon: '🌙' },
      { name: '水果', icon: '🍎' },
      { name: '买菜', icon: '🥬' },
      { name: '买肉', icon: '🥩' },
      { name: '超市', icon: '🏪' },
      { name: '零食', icon: '🍿' },
      { name: '外卖', icon: '🥡' },
      { name: '咖啡奶茶', icon: '☕' },
    ]),
    ...makeGroup('人情往来', '🎁', [
      { name: '孝敬父母', icon: '👴' },
      { name: '同事', icon: '👔' },
    ]),
    ...makeGroup('交通费', '🚗', [
      { name: '停车费', icon: '🅿️' },
      { name: '加油费', icon: '⛽' },
      { name: '充电费', icon: '🔋' },
      { name: '洗车费', icon: '🧽' },
      { name: '保养费', icon: '🔧' },
    ]),
    ...makeLeaf('日常用品', '🧴'),
    ...makeLeaf('化妆护肤', '💄'),
    ...makeLeaf('衣物', '👗'),
    ...makeLeaf('运动健身', '🏃'),
    ...makeLeaf('约会', '💑'),
    ...makeLeaf('读书学习', '📚'),
    ...makeLeaf('罚款', '💸'),
    ...makeLeaf('其他', '📦'),
    ...makeLeaf('不该花的钱', '🙈'),
    ...makeLeaf('小淇花销', '👧'),
    ...makeLeaf('小庆花销', '👦'),

    // === 收入大类 ===
    ...makeLeaf('工资', '💰', 'income'),
    ...makeLeaf('奖金', '🎉', 'income'),
    ...makeLeaf('其他', '💵', 'income'),
  ];
}

function makeGroup(groupName: string, icon: string, children: { name: string; icon: string }[]): Category[] {
  const groupId = id();
  const parent: Category = { id: groupId, name: groupName, icon, type: 'expense', parentId: null, budget: null, sortOrder: 0 };
  const subs: Category[] = children.map((c, i) => ({
    id: id(),
    name: c.name,
    icon: c.icon,
    type: 'expense' as const,
    parentId: groupId,
    budget: null,
    sortOrder: i + 1,
  }));
  return [parent, ...subs];
}

function makeLeaf(name: string, icon: string, type: 'income' | 'expense' = 'expense'): Category[] {
  return [{ id: id(), name, icon, type, parentId: null, budget: null, sortOrder: 0 }];
}

export function getCategoryTree(categories: Category[]): Category[] {
  return categories.filter(c => c.parentId === null);
}

export function getSubCategories(categories: Category[], parentId: string): Category[] {
  return categories.filter(c => c.parentId === parentId);
}

export function getCategoryById(categories: Category[], id: string): Category | undefined {
  return categories.find(c => c.id === id);
}

export function getCategoryPath(categories: Category[], categoryId: string): string {
  const cat = getCategoryById(categories, categoryId);
  if (!cat) return '';
  if (cat.parentId) {
    const parent = getCategoryById(categories, cat.parentId);
    return parent ? `${parent.name} > ${cat.name}` : cat.name;
  }
  return cat.name;
}
