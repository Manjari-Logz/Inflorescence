import AsyncStorage from '@react-native-async-storage/async-storage';

export class OfflineQueryBuilder {
  private table: string;
  private op: 'select' | 'insert' | 'update' | 'delete' | 'upsert' = 'select';
  private opValues: any = null;
  private filters: { col: string; op: string; val: any }[] = [];
  private orderCol: string | null = null;
  private orderAscending = true;
  private isSingle = false;
  private limitNum: number | null = null;
  private rangeFrom: number | null = null;
  private rangeTo: number | null = null;

  constructor(table: string) {
    this.table = table;

    // Defensive error handling using Proxy to catch unsupported query methods at runtime
    return new Proxy(this, {
      get(target, prop, receiver) {
        if (prop in target) {
          return Reflect.get(target, prop, receiver);
        }

        // Avoid throwing on standard JS properties, Promise thenable keys, or symbols
        if (
          typeof prop === 'symbol' ||
          prop === 'then' ||
          prop === 'catch' ||
          prop === 'finally' ||
          prop === 'toJSON'
        ) {
          return Reflect.get(target, prop, receiver);
        }

        // Throw a descriptive runtime error if a service attempts to use an unsupported Postgrest method
        throw new Error(
          `[OfflineQueryBuilder] Unsupported query builder method "${String(prop)}" accessed on table "${target.table}" during "${target.op}" operation.`
        );
      }
    });
  }

  select(columns?: string) {
    // Only set op to select if it hasn't already been set to a mutation (insert/update/delete/upsert)
    if (this.op !== 'insert' && this.op !== 'update' && this.op !== 'delete' && this.op !== 'upsert') {
      this.op = 'select';
    }
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

  // Chainable filter methods matching Supabase PostgrestFilterBuilder API
  eq(col: string, val: any) {
    this.filters.push({ col, op: 'eq', val });
    return this;
  }

  neq(col: string, val: any) {
    this.filters.push({ col, op: 'neq', val });
    return this;
  }

  gt(col: string, val: any) {
    this.filters.push({ col, op: 'gt', val });
    return this;
  }

  gte(col: string, val: any) {
    this.filters.push({ col, op: 'gte', val });
    return this;
  }

  lt(col: string, val: any) {
    this.filters.push({ col, op: 'lt', val });
    return this;
  }

  lte(col: string, val: any) {
    this.filters.push({ col, op: 'lte', val });
    return this;
  }

  in(col: string, val: any[]) {
    this.filters.push({ col, op: 'in', val });
    return this;
  }

  like(col: string, val: string) {
    this.filters.push({ col, op: 'like', val });
    return this;
  }

  ilike(col: string, val: string) {
    this.filters.push({ col, op: 'ilike', val });
    return this;
  }

  contains(col: string, val: any) {
    this.filters.push({ col, op: 'contains', val });
    return this;
  }

  overlap(col: string, val: any[]) {
    this.filters.push({ col, op: 'overlap', val });
    return this;
  }

  not(col: string, operator: string, val: any) {
    this.filters.push({ col, op: 'not', val: { subOp: operator, subVal: val } });
    return this;
  }

  or(filters: string) {
    this.filters.push({ col: '', op: 'or', val: filters });
    return this;
  }

  // Chainable sorting/pagination/transform methods matching Supabase PostgrestTransformBuilder API
  order(col: string, options?: { ascending?: boolean }) {
    this.orderCol = col;
    this.orderAscending = options?.ascending ?? true;
    return this;
  }

  limit(limitNum: number) {
    this.limitNum = limitNum;
    return this;
  }

  range(from: number, to: number) {
    this.rangeFrom = from;
    this.rangeTo = to;
    return this;
  }

  single() {
    this.isSingle = true;
    return this;
  }

  maybeSingle() {
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
          if (f.op === 'or') {
            if (typeof f.val !== 'string') continue;
            const clauses = f.val.split(',');
            filtered = filtered.filter(item => {
              return clauses.some(clause => {
                const parts = clause.split('.');
                if (parts.length < 3) return false;
                const orCol = parts[0];
                const orOp = parts[1];
                let orVal: any = parts.slice(2).join('.');
                if (orVal === 'true') orVal = true;
                else if (orVal === 'false') orVal = false;
                else if (orVal === 'null') orVal = null;
                else if (!isNaN(Number(orVal))) orVal = Number(orVal);

                const actualVal = item[orCol];
                if (orOp === 'eq') return actualVal === orVal;
                if (orOp === 'neq') return actualVal !== orVal;
                if (orOp === 'gt') return actualVal > orVal;
                if (orOp === 'gte') return actualVal >= orVal;
                if (orOp === 'lt') return actualVal < orVal;
                if (orOp === 'lte') return actualVal <= orVal;
                return false;
              });
            });
            continue;
          }

          filtered = filtered.filter(item => {
            const itemVal = item[f.col];
            const filterVal = f.val;
            switch (f.op) {
              case 'eq':
                return itemVal === filterVal;
              case 'neq':
                return itemVal !== filterVal;
              case 'gt':
                return itemVal > filterVal;
              case 'gte':
                return itemVal >= filterVal;
              case 'lt':
                return itemVal < filterVal;
              case 'lte':
                return itemVal <= filterVal;
              case 'in':
                return Array.isArray(filterVal) && filterVal.includes(itemVal);
              case 'like': {
                if (typeof itemVal !== 'string') return false;
                const regexStr = '^' + filterVal.replace(/%/g, '.*') + '$';
                const regex = new RegExp(regexStr);
                return regex.test(itemVal);
              }
              case 'ilike': {
                if (typeof itemVal !== 'string') return false;
                const regexStr = '^' + filterVal.replace(/%/g, '.*') + '$';
                const regex = new RegExp(regexStr, 'i');
                return regex.test(itemVal);
              }
              case 'contains': {
                if (Array.isArray(itemVal)) {
                  if (Array.isArray(filterVal)) {
                    return filterVal.every(v => itemVal.includes(v));
                  }
                  return itemVal.includes(filterVal);
                }
                if (typeof itemVal === 'object' && itemVal !== null && typeof filterVal === 'object' && filterVal !== null) {
                  return Object.keys(filterVal).every(k => itemVal[k] === filterVal[k]);
                }
                return itemVal === filterVal;
              }
              case 'overlap': {
                if (Array.isArray(itemVal) && Array.isArray(filterVal)) {
                  return filterVal.some(v => itemVal.includes(v));
                }
                return false;
              }
              case 'not': {
                const { subOp, subVal } = filterVal;
                switch (subOp) {
                  case 'eq': return itemVal !== subVal;
                  case 'neq': return itemVal === subVal;
                  case 'gt': return !(itemVal > subVal);
                  case 'gte': return !(itemVal >= subVal);
                  case 'lt': return !(itemVal < subVal);
                  case 'lte': return !(itemVal <= subVal);
                  case 'in': return !(Array.isArray(subVal) && subVal.includes(itemVal));
                  default: return true;
                }
              }
              default:
                return true;
            }
          });
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

        if (this.limitNum !== null) {
          filtered = filtered.slice(0, this.limitNum);
        }

        if (this.rangeFrom !== null && this.rangeTo !== null) {
          filtered = filtered.slice(this.rangeFrom, this.rangeTo + 1);
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
        const updatedList: any[] = [];
        
        items = items.map(item => {
          // evaluate filters for each item to match during updates
          const matches = this.filters.every(f => {
            const itemVal = item[f.col];
            if (f.op === 'eq') return itemVal === f.val;
            if (f.op === 'neq') return itemVal !== f.val;
            return true;
          });

          if (matches) {
            updatedCount++;
            lastUpdated = { ...item, ...this.opValues, updated_at: new Date().toISOString() };
            updatedList.push(lastUpdated);
            return lastUpdated;
          }
          return item;
        });

        await AsyncStorage.setItem(storageKey, JSON.stringify(items));
        if (this.isSingle) {
          return { data: lastUpdated, error: null };
        }
        return { data: updatedList, error: null };
      }

      if (this.op === 'delete') {
        const deleted: any[] = [];
        items = items.filter(item => {
          const matches = this.filters.every(f => {
            const itemVal = item[f.col];
            if (f.op === 'eq') return itemVal === f.val;
            if (f.op === 'neq') return itemVal !== f.val;
            return true;
          });
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
          const existingIdx = items.findIndex(x => 
            x.id === item.id || 
            (item.user_id && x.user_id === item.user_id && item.token && x.token === item.token) ||
            (item.user_id && x.user_id === item.user_id && item.date && x.date === item.date)
          );
          if (existingIdx >= 0) {
            items[existingIdx] = { ...items[existingIdx], ...item, updated_at: new Date().toISOString() };
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
