from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
from typing import Optional
import tempfile
import os

from activity_parser import parse_activity_file
from analysis import analyze_activity, calculate_basic_metrics, analyze_hr_zones

app = FastAPI(title="Runalyzer API", description="跑步训练数据分析API")

# 配置CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React前端地址
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Runalyzer API is running", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.post("/api/upload")
async def upload_activity(file: UploadFile = File(...)):
    """
    上传跑步数据文件并解析
    支持格式: .fit, .gpx, .csv
    """
    # 检查文件格式
    allowed_extensions = {'.fit', '.gpx', '.csv'}
    file_ext = os.path.splitext(file.filename)[1].lower()

    if file_ext not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"不支持的文件格式。请上传 {', '.join(allowed_extensions)} 格式的文件"
        )

    try:
        # 保存临时文件
        with tempfile.NamedTemporaryFile(delete=False, suffix=file_ext) as tmp_file:
            content = await file.read()
            tmp_file.write(content)
            tmp_path = tmp_file.name

        # 解析文件
        activity_data = parse_activity_file(tmp_path)

        # 分析数据
        analysis_result = analyze_activity(activity_data)

        # 清理临时文件
        os.unlink(tmp_path)

        return JSONResponse(content=analysis_result)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"文件解析失败: {str(e)}")

@app.get("/api/sample")
async def get_sample_data():
    """
    获取示例数据（用于测试）
    """
    import json
    # 这里可以返回一些模拟数据用于前端开发
    sample_data = {
        "filename": "sample_activity.fit",
        "metrics": {
            "avg_heart_rate": 155,
            "max_heart_rate": 185,
            "avg_pace": 5.2,  # 分钟/公里
            "total_distance": 10.5,  # 公里
            "total_time": 55.5,  # 分钟
            "avg_cadence": 168  # 步/分钟
        },
        "hr_zones": [
            {"zone": "Z1", "name": "恢复区", "time_minutes": 5, "percentage": 9},
            {"zone": "Z2", "name": "有氧区", "time_minutes": 15, "percentage": 27},
            {"zone": "Z3", "name": "节奏区", "time_minutes": 20, "percentage": 36},
            {"zone": "Z4", "name": "阈值区", "time_minutes": 10, "percentage": 18},
            {"zone": "Z5", "name": "无氧区", "time_minutes": 5, "percentage": 9}
        ],
        "time_series": {
            "timestamps": ["00:00", "00:05", "00:10", "00:15", "00:20", "00:25", "00:30", "00:35", "00:40", "00:45", "00:50", "00:55"],
            "heart_rates": [120, 125, 130, 140, 150, 155, 160, 165, 170, 175, 180, 185],
            "paces": [6.0, 5.8, 5.6, 5.5, 5.4, 5.3, 5.2, 5.2, 5.1, 5.0, 4.9, 4.8],
            "distances": [0, 0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0, 5.5]
        }
    }
    return JSONResponse(content=sample_data)

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)