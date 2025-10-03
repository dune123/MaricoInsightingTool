# PROJECT B - Setup Guide for GitHub Repository

## 🔐 Environment Configuration

### 1. Environment Variables Setup

Create a `.env` file in the `PROJECT B/maricoinsight-Dashboarding/` directory:

```bash
# Azure OpenAI Configuration
VITE_AZURE_API_KEY=your_actual_api_key_here
VITE_AZURE_ENDPOINT=https://your-resource.cognitiveservices.azure.com/
VITE_AZURE_DEPLOYMENT_NAME=gpt-4o-mini
```

### 2. API Keys (Keep Secure!)

**API Keys (Keep Secure!):**
- API Key: `your_azure_api_key_here`
- Endpoint: `https://your-resource.cognitiveservices.azure.com/`
- Deployment: `gpt-4o-mini`

## 🚀 Quick Start

### Development Setup

1. **Clone the repository**
2. **Navigate to PROJECT B**:
   ```bash
   cd "PROJECT B/maricoinsight-Dashboarding"
   ```

3. **Install dependencies**:
   ```bash
   npm install
   ```

4. **Create environment file**:
   ```bash
   cp .env.example .env
   # Edit .env with your actual API keys
   ```

5. **Start the application**:
   ```bash
   npm run dev
   # OR
   ./start-dashboard.sh
   ```

## 🔧 Configuration Files

### .env.example (Template)
```env
# Azure OpenAI Configuration
VITE_AZURE_API_KEY=your_azure_api_key_here
VITE_AZURE_ENDPOINT=https://your-resource.cognitiveservices.azure.com/
VITE_AZURE_DEPLOYMENT_NAME=gpt-4o-mini
```

### .gitignore (Already configured)
- `.env` files are ignored
- `node_modules` is ignored
- Build artifacts are ignored

## 📁 Repository Structure

```
PROJECT B/
├── maricoinsight-Dashboarding/
│   ├── .env                    # Your actual API keys (gitignored)
│   ├── .env.example           # Template for others
│   ├── .gitignore            # Already configured
│   ├── src/
│   │   └── App.tsx           # Uses environment variables
│   ├── package.json
│   ├── vite.config.ts        # Port 8082 configuration
│   └── start-dashboard.sh     # Startup script
└── SETUP_GUIDE.md            # This file
```

## 🔒 Security Notes

1. **Never commit `.env` files** - They contain sensitive API keys
2. **Use `.env.example`** - Template for other developers
3. **Rotate API keys regularly** - For production security
4. **Use environment variables in production** - Don't hardcode keys

## 🚀 Deployment

### For Production Deployment:

1. **Set environment variables** in your hosting platform
2. **Don't use `.env` files** in production
3. **Use secure key management** (Azure Key Vault, etc.)

### Environment Variables for Production:
- `VITE_AZURE_API_KEY`
- `VITE_AZURE_ENDPOINT`
- `VITE_AZURE_DEPLOYMENT_NAME`

## 🧪 Testing

```bash
# Test if both apps are running
node test-integration.js

# Should show:
# ✅ Main App is running on port 8081
# ✅ PROJECT B Dashboard is running on port 8082
```

## 📝 Next Steps for GitHub

1. **Create new repository**
2. **Copy this setup guide**
3. **Ensure `.env` is in `.gitignore`**
4. **Provide `.env.example` for other developers**
5. **Document the API key requirements**

---

**Last Updated**: 2025-01-31  
**Author**: BrandBloom Frontend Team
