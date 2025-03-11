import { Options } from 'electron-store';

declare module 'electron-store' {
  class ElectronStore<T = Record<string, unknown>> {
    constructor(options?: Options<T>);
    get<K extends keyof T>(key: K): T[K];
    get<K extends keyof T, D>(key: K, defaultValue: D): T[K] | D;
    set<K extends keyof T>(key: K, value: T[K]): void;
    set(value: Partial<T>): void;
    has<K extends keyof T>(key: K): boolean;
    delete<K extends keyof T>(key: K): void;
    clear(): void;
    onDidChange<K extends keyof T>(key: K, callback: (newValue: T[K], oldValue: T[K]) => void): () => void;
    onDidAnyChange(callback: (newValue: T, oldValue: T) => void): () => void;
    size: number;
    store: T;
    path: string;
  }

  export default ElectronStore;
} 