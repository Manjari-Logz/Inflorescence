import AsyncStorage from '@react-native-async-storage/async-storage';

export class OfflineQueryBuilder {
  private table: string;
  private op: 'select' | 'insert' | 'update' | 'delete' | 'upsert' = 'select';
  private opValues: any = null;
  private filters: { col: string; val: any }[] = [];
  private orderCol: string | null = null;
  private orderAscending = true;
  private isSingle = false;

  constructor(table: string) {
    this.table = table;
  }

  select(columns?: string) {
    this.op = 'select';
    return this;
  }

  insert(values: any) {
    this.op = 'insert';
    this.opValues = values;
    return this;
  }

  update(values: any) {
    this.op = 'update';
    this.opValues = values;
    return this;
  }

  delete() {
    this.op = 'delete';
    return this;
  }

  upsert(values: any, options?: any) {
    this.op = 'upsert';
    this.opValues = values;
    return this;
  }

  eq(col: string, val: any) {
    this.filters.push({ col, val });
    return this;
  }

  order(col: string, options?: { ascending?: boolean }) {
    this.orderCol = col;
    this.orderAscending = options?.ascending ?? true;
    return this;
  }

  single() {
    this.isSingle = true;
    return this;
  }

  private async execute() {
    try {
      const storageKey = `@offline_db_${this.table}`;
      const rawData = await AsyncStorage.getItem(storageKey);
      let items: any[] = rawData ? JSON.parse(rawData) : [];

      if (!Array.isArray(items)) {
        items = [];
      }

      if (this.op === 'select') {
        // filter
        let filtered = items;
        for (const f of this.filters) {
          filtered = filtered.filter(item => item[f.col] === f.val);
        }
        // order
        if (this.orderCol) {
          filtered.sort((a, b) => {
            const valA = a[this.orderCol!];
            const valB = b[this.orderCol!];
            if (valA < valB) return this.orderAscending ? -1 : 1;
            if (valA > valB) return this.orderAscending ? 1 : -1;
            return 0;
          });
        }
        if (this.isSingle) {
          return { data: filtered[0] || null, error: null };
        }
        return { data: filtered, error: null };
      }

      if (this.op === 'insert') {
        const newItems = Array.isArray(this.opValues) ? this.opValues : [this.opValues];
        const added = newItems.map(item => {
          const id = item.id || `local_${Math.random().toString(36).substr(2, 9)}`;
          const created_at = item.created_at || new Date().toISOString();
          return { ...item, id, created_at };
        });
        items.push(...added);
        await AsyncStorage.setItem(storageKey, JSON.stringify(items));
        if (this.isSingle || !Array.isArray(this.opValues)) {
          return { data: added[0], error: null };
        }
        return { data: added, error: null };
      }

      if (this.op === 'update') {
        let updatedCount = 0;
        let lastUpdated: any = null;
        items = items.map(item => {
          const matches = this.filters.every(f => item[f.col] === f.val);
          if (matches) {
            updatedCount++;
            lastUpdated = { ...item, ...this.opValues };
            return lastUpdated;
          }
          return item;
        });
        await AsyncStorage.setItem(storageKey, JSON.stringify(items));
        if (this.isSingle) {
          return { data: lastUpdated, error: null };
        }
        return { data: lastUpdated ? [lastUpdated] : [], error: null };
      }

      if (this.op === 'delete') {
        let deleted: any[] = [];
        items = items.filter(item => {
          const matches = this.filters.every(f => item[f.col] === f.val);
          if (matches) {
            deleted.push(item);
            return false;
          }
          return true;
        });
        await AsyncStorage.setItem(storageKey, JSON.stringify(items));
        return { data: deleted, error: null };
      }

      if (this.op === 'upsert') {
        const upsertItems = Array.isArray(this.opValues) ? this.opValues : [this.opValues];
        for (const item of upsertItems) {
          const existingIdx = items.findIndex(x => x.id === item.id || (item.user_id && x.user_id === item.user_id && item.token && x.token === item.token));
          if (existingIdx >= 0) {
            items[existingIdx] = { ...items[existingIdx], ...item };
          } else {
            const id = item.id || `local_${Math.random().toString(36).substr(2, 9)}`;
            const created_at = item.created_at || new Date().toISOString();
            items.push({ ...item, id, created_at });
          }
        }
        await AsyncStorage.setItem(storageKey, JSON.stringify(items));
        return { data: this.opValues, error: null };
      }

      return { data: null, error: new Error('Unsupported offline operation') };
    } catch (e: any) {
      return { data: null, error: e };
    }
  }

  then(onfulfilled?: (value: any) => any, onrejected?: (reason: any) => any) {
    return this.execute().then(onfulfilled, onrejected);
  }
}
