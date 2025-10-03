# CosmosDB Optional Setup Guide

## 🚀 **Quick Start (No CosmosDB Required)**

Your application works perfectly without CosmosDB! The app will automatically:
- ✅ Use local storage for all data
- ✅ Show a warning that CosmosDB is not configured
- ✅ Disable CosmosDB features gracefully
- ✅ Continue working normally

## 🔧 **To Enable CosmosDB (Optional)**

### Step 1: Create Environment File
Create a `.env` file in your project root:

```bash
# In PROJECTB/maricoinsight-Dashboarding/
touch .env
```

### Step 2: Add Environment Variables
Add these to your `.env` file:

```env
# CosmosDB Configuration (Optional)
VITE_COSMOSDB_ENDPOINT=https://your-cosmosdb-account.documents.azure.com:443/
VITE_COSMOSDB_KEY=your-cosmosdb-primary-key
VITE_COSMOSDB_DATABASE_ID=brandbloom-insights
VITE_COSMOSDB_CONTAINER_ID=data
```

### Step 3: Get CosmosDB Credentials
1. Go to [Azure Portal](https://portal.azure.com)
2. Create a new CosmosDB account
3. Go to **Keys** section
4. Copy the **URI** and **Primary Key**

### Step 4: Restart Your Application
```bash
npm run dev
```

## 🎯 **What Happens When CosmosDB is Not Configured?**

- ✅ **No Errors**: Application runs normally
- ✅ **Local Storage**: All data saved locally
- ✅ **Clear UI**: Warning message shows CosmosDB is disabled
- ✅ **Graceful Fallback**: CosmosDB features are disabled
- ✅ **Full Functionality**: All other features work perfectly

## 🔍 **How to Check if CosmosDB is Working**

1. **Look for the warning message** in the Data Persistence section
2. **Check browser console** for configuration messages
3. **Toggle the switch** - it should be disabled if not configured
4. **Try creating a chat** - it will save locally only

## 🛠 **Troubleshooting**

### If you see errors:
1. **Check your `.env` file** exists and has correct values
2. **Restart the development server** after adding environment variables
3. **Check browser console** for specific error messages
4. **Verify CosmosDB credentials** are correct

### If CosmosDB toggle is disabled:
- This is normal! It means CosmosDB is not configured
- The app will work perfectly with local storage only
- To enable, add the environment variables above

## 📝 **Environment Variables Reference**

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `VITE_COSMOSDB_ENDPOINT` | Your CosmosDB endpoint URL | Yes (for CosmosDB) | - |
| `VITE_COSMOSDB_KEY` | Your CosmosDB primary key | Yes (for CosmosDB) | - |
| `VITE_COSMOSDB_DATABASE_ID` | Database name | No | `brandbloom-insights` |
| `VITE_COSMOSDB_CONTAINER_ID` | Container name | No | `data` |

## 🎉 **You're All Set!**

Your application now works with or without CosmosDB. The integration is completely optional and the app gracefully handles both scenarios!
