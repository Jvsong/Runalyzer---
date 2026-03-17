# Runalyzer Project Memory

## Project Structure
- `frontend/` - React application with Bootstrap
- `backend/` - FastAPI server with activity parsing and analysis
- Main features: GPX/FIT/CSV file analysis, metrics calculation, training suggestions

## New Features Added (March 2026)

### 1. Multiple File Upload and Analysis
- **Backend**: Added `/api/upload-multiple` endpoint supporting up to 10 files
- **Analysis**: `analyze_multiple_activities()` function aggregates metrics from multiple files
- **Trend Analysis**: `generate_trend_analysis()` identifies performance trends across multiple training sessions
- **Combined Suggestions**: `generate_combined_suggestions()` provides insights based on multiple files

### 2. AI Consultation with DeepSeek
- **Backend**: `/api/ai-consult` endpoint using DeepSeek API (API key: sk-ec1adccac84c4167ad503b80c63463de)
- **Frontend**: `AIConsultation.js` component with chat interface
- **Features**: Question history, sample questions, response analysis, conversation management

### 3. Enhanced Frontend Components
- `FileUpload.js`: Now supports both single and multiple file upload modes
- `App.js`: Integrated AI consultation toggle and combined analysis display
- `api.js`: Added `analyzeMultipleActivities()` and `aiConsultation()` functions

## Key Implementation Details

### Multiple File Analysis
- Calculates averages, min/max values for key metrics
- Analyzes heart rate zone distribution across files
- Generates trend analysis showing improvement/decline in performance
- Provides combined training suggestions based on multiple sessions

### AI Integration
- Uses DeepSeek API for personalized training advice
- Context-aware: Includes analysis data when available
- Chat interface with conversation history
- Sample questions for easy user guidance

## File Changes Summary
1. `backend/main.py` - Added multi-upload endpoint, AI consultation endpoint, analysis functions
2. `backend/requirements.txt` - Added `aiohttp` dependency
3. `frontend/src/components/FileUpload.js` - Enhanced for single/multiple file upload
4. `frontend/src/components/AIConsultation.js` - New AI chat component
5. `frontend/src/services/api.js` - Added new API functions
6. `frontend/src/App.js` - Integrated all new features

## Usage Notes
- Multi-file analysis requires at least 2 files for trend analysis
- AI consultation works with or without analysis data
- Maximum file size: 50MB per file, up to 10 files for multi-upload
- Supported formats: .FIT, .GPX, .CSV