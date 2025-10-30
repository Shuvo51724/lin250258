// Storage interface - not used in this application
// Data is persisted client-side using localStorage
export interface IStorage {}

export class MemStorage implements IStorage {
  constructor() {}
}

export const storage = new MemStorage();
