const db = new Dexie('GaloFrameDB');

db.version(1).stores({
    memories: '++id, title, description, date, tags, imageData, createdAt'
});

export default db;