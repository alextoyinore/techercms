# Firestore Composite Indexes

This document contains the required composite indexes for the application's complex queries. Click the links below to create them directly in your Firebase project.

---

### 1. Index for Posts Filtered by Category

This index is required for widgets that filter posts by one or more categories and sort them by date (e.g., "Post Showcase" widget configured to use categories).

**Fields:**
- `status` (Ascending)
- `categoryIds` (Array)
- `createdAt` (Descending)

**Link to Create:**

[https://console.firebase.google.com/project/studio-8583940939-979bb/firestore/indexes/composite?create_composite=eyJwcm9qZWN0SWQiOiJzdHVkaW8tODU4Mzk0MDkzOS05NzliYiIsImRhdGFiYXNlSWQiOiIoZGVmYXVsdCkiLCJjb2xsZWN0aW9uSWQiOiJwb3N0cyIsImluZGV4Ijp7ImZpZWxkcyI6W3siZmllbGRQYXRoIjoic3RhdHVzIiwib3JkZXIiOiJBU0NFTkRJTkcifSx7ImZpZWxkUGF0aCI6ImNhdGVnb3J5SWRzIiwiYXJyYXlDb25maWciOiJDT05UQUlOUyJ9LHsiZmllbGRQYXRoIjoiY3JlYXRlZEF0Iiwib3JkZXIiOiJERVNDRU5ESU5HIn1dfX0=](https://console.firebase.google.com/project/studio-8583940939-979bb/firestore/indexes/composite?create_composite=eyJwcm9qZWN0SWQiOiJzdHVkaW8tODU4Mzk0MDkzOS05NzliYiIsImRhdGFiYXNlSWQiOiIoZGVmYXVsdCkiLCJjb2xsZWN0aW9uSWQiOiJwb3N0cyIsImluZGV4Ijp7ImZpZWxkcyI6W3siZmllbGRQYXRoIjoic3RhdHVzIiwib3JkZXIiOiJBU0NFTkRJTkcifSx7ImZpZWxkUGF0aCI6ImNhdGVnb3J5SWRzIiwiYXJyYXlDb25maWciOiJDT05UQUlOUyJ9LHsiZmllbGRQYXRoIjoiY3JlYXRlZEF0Iiwib3JkZXIiOiJERVNDRU5ESU5HIn1dfX0=)

**JSON Definition:**
```json
{
  "collectionGroup": "posts",
  "queryScope": "COLLECTION",
  "fields": [
    {
      "fieldPath": "status",
      "order": "ASCENDING"
    },
    {
      "fieldPath": "categoryIds",
      "arrayConfig": "CONTAINS"
    },
    {
      "fieldPath": "createdAt",
      "order": "DESCENDING"
    }
  ]
}
```

---

### 2. Index for Posts Filtered by Tag

This index is required for widgets that filter posts by one or more tags and sort them by date (e.g., "Post Showcase" widget configured to use tags).

**Fields:**
- `status` (Ascending)
- `tagIds` (Array)
- `createdAt` (Descending)

**Link to Create:**

[https://console.firebase.google.com/project/studio-8583940939-979bb/firestore/indexes/composite?create_composite=eyJwcm9qZWN0SWQiOiJzdHVkaW8tODU4Mzk0MDkzOS05NzliYiIsImRhdGFiYXNlSWQiOiIoZGVmYXVsdCkiLCJjb2xsZWN0aW9uSWQiOiJwb3N0cyIsImluZGV4Ijp7ImZpZWxkcyI6W3siZmllbGRQYXRoIjoic3RhdHVzIiwib3JkZXIiOiJBU0NFTkRJTkcifSx7ImZpZWxkUGF0aCI6InRhZ0lkcyIsImFycmF5Q29uZmlnIjoiQ09OVEFJTlMifSx7ImZpZWxkUGF0aCI6ImNyZWF0ZWRBdCIsIm9yZGVyIjoiREVTQ0VORElORyJ9XX19](https://console.firebase.google.com/project/studio-8583940939-979bb/firestore/indexes/composite?create_composite=eyJwcm9qZWN0SWQiOiJzdHVkaW8tODU4Mzk0MDkzOS05NzliYiIsImRhdGFiYXNlSWQiOiIoZGVmYXVsdCkiLCJjb2xsZWN0aW9uSWQiOiJwb3N0cyIsImluZGV4Ijp7ImZpZWxkcyI6W3siZmllbGRQYXRoIjoic3RhdHVzIiwib3JkZXIiOiJBU0NFTkRJTkcifSx7ImZpZWxkUGF0aCI6InRhZ0lkcyIsImFycmF5Q29uZmlnIjoiQ09OVEFJTlMifSx7ImZpZWxkUGF0aCI6ImNyZWF0ZWRBdCIsIm9yZGVyIjoiREVTQ0VORElORyJ9XX19)

**JSON Definition:**
```json
{
  "collectionGroup": "posts",
  "queryScope": "COLLECTION",
  "fields": [
    {
      "fieldPath": "status",
      "order": "ASCENDING"
    },
    {
      "fieldPath": "tagIds",
      "arrayConfig": "CONTAINS"
    },
    {
      "fieldPath": "createdAt",
      "order": "DESCENDING"
    }
  ]
}
```
