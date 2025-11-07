// Switch to the bharathmedicare database
db = db.getSiblingDB('bharathmedicare');

// Create collections
db.createCollection('users');
db.createCollection('records');
db.createCollection('audit_logs');
db.createCollection('access_permissions');

// Create indexes for better performance
db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "role": 1 });
db.records.createIndex({ "patient_id": 1 });
db.records.createIndex({ "uploaded_by": 1 });
db.access_permissions.createIndex({ "patient_id": 1, "doctor_id": 1 });

print('✓ MongoDB initialized successfully');
print('✓ Collections created: users, records, audit_logs, access_permissions');
print('✓ Indexes created');
