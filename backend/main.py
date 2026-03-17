from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import uvicorn
from typing import List, Optional
import tempfile
import os
import aiohttp
import numpy as np
from datetime import datetime

from activity_parser import parse_activity_file
from analysis import analyze_activity

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

@app.post("/api/upload-multiple")
async def upload_multiple_activities(files: List[UploadFile] = File(...)):
    """
    上传多个跑步数据文件并进行综合分析
    支持格式: .fit, .gpx, .csv
    """
    # 检查文件格式
    allowed_extensions = {'.fit', '.gpx', '.csv'}
    all_analysis_results = []

    if len(files) == 0:
        raise HTTPException(status_code=400, detail="请至少上传一个文件")

    if len(files) > 10:
        raise HTTPException(status_code=400, detail="最多支持上传10个文件")

    for file in files:
        file_ext = os.path.splitext(file.filename)[1].lower()
        if file_ext not in allowed_extensions:
            raise HTTPException(
                status_code=400,
                detail=f"文件 {file.filename} 格式不支持。请上传 {', '.join(allowed_extensions)} 格式的文件"
            )

    try:
        temp_paths = []
        for file in files:
            # 保存临时文件
            with tempfile.NamedTemporaryFile(delete=False, suffix=file_ext) as tmp_file:
                content = await file.read()
                tmp_file.write(content)
                tmp_path = tmp_file.name
                temp_paths.append(tmp_path)

            # 解析文件
            activity_data = parse_activity_file(tmp_path)

            # 分析单个文件
            analysis_result = analyze_activity(activity_data)
            all_analysis_results.append(analysis_result)

        # 综合分析所有文件
        combined_analysis = analyze_multiple_activities(all_analysis_results)

        # 清理临时文件
        for tmp_path in temp_paths:
            try:
                os.unlink(tmp_path)
            except:
                pass

        return JSONResponse(content=combined_analysis)

    except Exception as e:
        # 清理可能已创建的临时文件
        for tmp_path in temp_paths:
            try:
                os.unlink(tmp_path)
            except:
                pass
        raise HTTPException(status_code=500, detail=f"文件解析失败: {str(e)}")

def analyze_multiple_activities(analysis_results: List[dict]) -> dict:
    """
    综合分析多个活动数据
    """
    if not analysis_results:
        return {}

    # 提取所有指标
    all_metrics = [result['metrics'] for result in analysis_results]
    all_hr_zones = [result['hr_zones'] for result in analysis_results]

    # 计算平均值
    combined_metrics = {}
    for metric_name in all_metrics[0].keys():
        if metric_name in ['has_hr_data', 'has_pace_data', 'has_distance_data',
                          'has_time_data', 'has_cadence_data', 'has_altitude_data']:
            # 布尔值：只要有任何一个文件有数据就为True
            combined_metrics[metric_name] = any(metrics.get(metric_name, False) for metrics in all_metrics)
        else:
            # 数值指标：计算平均值
            values = []
            for metrics in all_metrics:
                value = metrics.get(metric_name)
                if value is not None and isinstance(value, (int, float)):
                    values.append(value)

            if values:
                combined_metrics[f"avg_{metric_name}"] = sum(values) / len(values)
                combined_metrics[f"min_{metric_name}"] = min(values)
                combined_metrics[f"max_{metric_name}"] = max(values)

    # 合并心率区间（平均时间）
    combined_hr_zones = []
    if all_hr_zones and all_hr_zones[0]:
        zone_names = [zone['name'] for zone in all_hr_zones[0]]
        for zone_name in zone_names:
            times = []
            percentages = []
            for hr_zones in all_hr_zones:
                for zone in hr_zones:
                    if zone['name'] == zone_name:
                        times.append(zone['time_minutes'])
                        percentages.append(zone['percentage'])
                        break

            if times:
                combined_hr_zones.append({
                    "zone": all_hr_zones[0][0]['zone'] if all_hr_zones[0] else "Z1",
                    "name": zone_name,
                    "avg_time_minutes": sum(times) / len(times),
                    "avg_percentage": sum(percentages) / len(percentages),
                    "min_time_minutes": min(times),
                    "max_time_minutes": max(times)
                })

    # 生成趋势分析
    trend_analysis = generate_trend_analysis(analysis_results)

    # 综合建议
    combined_suggestions = generate_combined_suggestions(analysis_results, combined_metrics, combined_hr_zones)

    return {
        "file_count": len(analysis_results),
        "individual_results": analysis_results,
        "combined_metrics": combined_metrics,
        "combined_hr_zones": combined_hr_zones,
        "trend_analysis": trend_analysis,
        "suggestions": combined_suggestions
    }

def generate_trend_analysis(analysis_results: List[dict]) -> dict:
    """
    生成趋势分析
    """
    if len(analysis_results) < 2:
        return {"message": "需要至少2个文件才能进行趋势分析"}

    trend_metrics = {}

    # 分析关键指标趋势
    key_metrics = ['avg_heart_rate', 'avg_pace', 'total_distance', 'training_load', 'avg_cadence']

    for metric in key_metrics:
        values = []
        for result in analysis_results:
            value = result['metrics'].get(metric)
            if value is not None:
                values.append(value)

        if len(values) >= 2:
            trend = "稳定"
            if values[-1] > values[0] * 1.1:
                trend = "上升"
            elif values[-1] < values[0] * 0.9:
                trend = "下降"

            trend_metrics[metric] = {
                "values": values,
                "trend": trend,
                "improvement": f"{((values[-1] - values[0]) / values[0] * 100):.1f}%" if values[0] != 0 else "N/A"
            }

    # 整体趋势评估
    overall_trend = "无明显趋势"
    improvement_count = sum(1 for metric_data in trend_metrics.values()
                           if metric_data['trend'] == "上升" and "pace" not in metric)

    if improvement_count >= len(trend_metrics) * 0.7:
        overall_trend = "整体表现改善"
    elif improvement_count <= len(trend_metrics) * 0.3:
        overall_trend = "整体表现下降"

    return {
        "overall_trend": overall_trend,
        "metric_trends": trend_metrics
    }

def generate_combined_suggestions(analysis_results: List[dict], combined_metrics: dict, combined_hr_zones: List[dict]) -> List[str]:
    """
    基于多个文件生成综合建议
    """
    suggestions = []

    if len(analysis_results) < 2:
        suggestions.append("📊 建议上传更多训练数据以获得更准确的长期分析")
        return suggestions

    # 基于趋势的建议
    trend_analysis = generate_trend_analysis(analysis_results)

    if trend_analysis.get("overall_trend") == "整体表现改善":
        suggestions.append("🎉 恭喜！从趋势来看，您的训练效果在持续改善")
    elif trend_analysis.get("overall_trend") == "整体表现下降":
        suggestions.append("📉 从趋势来看，您的表现有所下降，建议检查恢复情况和训练强度")

    # 基于一致性分析
    pace_values = []
    hr_values = []
    for result in analysis_results:
        if 'avg_pace' in result['metrics']:
            pace_values.append(result['metrics']['avg_pace'])
        if 'avg_heart_rate' in result['metrics']:
            hr_values.append(result['metrics']['avg_heart_rate'])

    if len(pace_values) >= 3:
        pace_std = np.std(pace_values) if len(pace_values) > 1 else 0
        if pace_std < 0.5:
            suggestions.append("🏃‍♂️ 配速一致性很好，说明您有很好的节奏控制能力")
        else:
            suggestions.append("📊 配速波动较大，建议保持更稳定的训练强度")

    if len(hr_values) >= 3:
        hr_std = np.std(hr_values) if len(hr_values) > 1 else 0
        avg_hr = sum(hr_values) / len(hr_values)
        if hr_std < 5:
            suggestions.append("❤️ 心率表现稳定，说明训练强度控制得当")

    # 基于训练频率的建议
    if len(analysis_results) >= 4:
        suggestions.append(f"📅 过去上传了 {len(analysis_results)} 次训练，训练频率良好")

    # 基于心率区间的建议
    if combined_hr_zones:
        # 计算低强度和高强度比例
        low_intensity_zones = ['恢复区', '有氧区']
        high_intensity_zones = ['节奏区', '阈值区', '无氧区']

        low_intensity_time = sum(zone['avg_time_minutes'] for zone in combined_hr_zones
                                if zone['name'] in low_intensity_zones)
        high_intensity_time = sum(zone['avg_time_minutes'] for zone in combined_hr_zones
                                 if zone['name'] in high_intensity_zones)
        total_time = low_intensity_time + high_intensity_time

        if total_time > 0:
            low_intensity_percent = low_intensity_time / total_time * 100
            if low_intensity_percent < 20:
                suggestions.append("🧘‍♂️ 低强度训练比例偏低，建议增加恢复训练比例")
            elif low_intensity_percent > 80:
                suggestions.append("⚡ 高强度训练比例偏低，建议适当增加高强度训练")

    # 添加基于平均指标的建议
    if 'avg_avg_heart_rate' in combined_metrics:
        avg_hr = combined_metrics['avg_avg_heart_rate']
        if avg_hr < 140:
            suggestions.append("🏃‍♀️ 平均心率较低，可以考虑增加一些高强度训练")
        elif avg_hr > 160:
            suggestions.append("🔥 平均心率较高，注意训练强度和恢复")

    if 'avg_avg_pace' in combined_metrics:
        avg_pace = combined_metrics['avg_avg_pace']
        if avg_pace < 5.0:
            suggestions.append("⚡ 平均配速很快，注意技术动作和恢复")
        elif avg_pace > 6.5:
            suggestions.append("🐢 平均配速较慢，可以尝试加入一些速度训练")

    if not suggestions:
        suggestions.append("👍 综合分析显示训练状况良好，继续保持！")

    return suggestions[:6]  # 限制为6条建议

# DeepSeek AI问询API端点
DEEPSEEK_API_KEY = "sk-ec1adccac84c4167ad503b80c63463de"
DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions"

# Pydantic模型
class AIConsultRequest(BaseModel):
    question: str
    analysis_data: Optional[dict] = None

@app.post("/api/ai-consult")
async def ai_consultation(request: AIConsultRequest):
    """
    AI智能问询：基于训练数据提供个性化建议
    """
    if not request.question.strip():
        raise HTTPException(status_code=400, detail="请提供问题内容")

    try:
        # 构建提示词
        prompt = build_ai_prompt(request.question, request.analysis_data)

        # 调用DeepSeek API
        ai_response = await call_deepseek_api(prompt)

        return {
            "question": request.question,
            "response": ai_response,
            "timestamp": datetime.now().isoformat()
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI问询失败: {str(e)}")

def build_ai_prompt(question: str, analysis_data: dict = None) -> str:
    """
    构建AI提示词
    """
    base_prompt = """你是一个专业的跑步教练和运动科学专家。请根据用户的跑步训练数据和问题，提供专业、个性化的建议。

用户问题：{question}

"""

    if analysis_data:
        # 格式化分析数据
        prompt = base_prompt.format(question=question)

        # 添加分析数据摘要
        prompt += "以下是用户的训练数据分析结果：\n\n"

        if 'combined_metrics' in analysis_data:
            metrics = analysis_data['combined_metrics']
            prompt += "综合指标：\n"
            for key, value in metrics.items():
                if isinstance(value, (int, float)):
                    prompt += f"- {key}: {value}\n"

        if 'combined_hr_zones' in analysis_data and analysis_data['combined_hr_zones']:
            prompt += "\n心率区间分布：\n"
            for zone in analysis_data['combined_hr_zones']:
                prompt += f"- {zone['name']}: {zone['avg_percentage']:.1f}% (平均 {zone['avg_time_minutes']:.1f} 分钟)\n"

        if 'trend_analysis' in analysis_data:
            trend = analysis_data['trend_analysis']
            prompt += f"\n趋势分析：{trend.get('overall_trend', '无数据')}\n"

        if 'suggestions' in analysis_data:
            prompt += "\n系统建议：\n"
            for i, suggestion in enumerate(analysis_data['suggestions'], 1):
                prompt += f"{i}. {suggestion}\n"
    else:
        prompt = base_prompt.format(question=question)
        prompt += "注意：用户没有提供具体的训练数据，请基于一般跑步训练知识回答。"

    prompt += "\n\n请提供专业、具体、可操作的建议，用中文回答。"

    return prompt

async def call_deepseek_api(prompt: str) -> str:
    """
    调用DeepSeek API
    """
    headers = {
        "Authorization": f"Bearer {DEEPSEEK_API_KEY}",
        "Content-Type": "application/json"
    }

    payload = {
        "model": "deepseek-chat",
        "messages": [
            {"role": "system", "content": "你是一个专业的跑步教练和运动科学专家，擅长分析跑步训练数据并提供个性化训练建议。"},
            {"role": "user", "content": prompt}
        ],
        "max_tokens": 1000,
        "temperature": 0.7
    }

    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(DEEPSEEK_API_URL, headers=headers, json=payload) as response:
                if response.status == 200:
                    result = await response.json()
                    return result['choices'][0]['message']['content']
                else:
                    error_text = await response.text()
                    raise Exception(f"DeepSeek API错误: {response.status}, {error_text}")
    except Exception as e:
        raise Exception(f"调用DeepSeek API失败: {str(e)}")

# 添加缺失的datetime导入
from datetime import datetime

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

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
            "avg_cadence": 168,  # 步/分钟
            "has_hr_data": True,
            "has_pace_data": True,
            "has_distance_data": True,
            "has_cadence_data": True,
            "training_load": 120.5,
            "training_effect": 3.5,
            "low_intensity_ratio": 36,
            "high_intensity_ratio": 27,
            "pace_cv": 8.2,
            "training_stress_score": 85.3
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
            "distances": [0, 0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0, 5.5],
            "altitudes": [50, 55, 60, 65, 70, 68, 65, 60, 55, 50, 45, 40]
        },
        "suggestions": [
            "✅ 训练强度分布良好，保持了适当的有氧和阈值训练",
            "👣 平均步频很高，注意保持经济性",
            "🎯 配速非常稳定，这表明良好的节奏控制能力",
            "💪 训练效果适中，有助于提升有氧能力和耐力",
            "🧘‍♂️ 低强度训练比例适中，有助于恢复和基础有氧能力发展",
            "🏃‍♂️ 建议下次训练可以尝试增加一些短距离间歇训练"
        ]
    }
    return JSONResponse(content=sample_data)

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)