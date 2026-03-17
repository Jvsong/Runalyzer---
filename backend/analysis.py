import pandas as pd
import numpy as np
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta

def analyze_activity(activity_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    分析活动数据，计算各种指标

    参数:
        activity_data: 来自parse_activity_file的解析数据

    返回:
        包含分析结果的字典
    """
    df = activity_data['dataframe']
    metadata = activity_data['metadata']

    # 计算基本指标
    metrics = calculate_basic_metrics(df)

    # 分析心率区间
    hr_zones = []
    if metrics['has_hr_data']:
        hr_zones = analyze_hr_zones(df)

    # 准备时间序列数据（采样以减少数据量）
    time_series = prepare_time_series(df)

    # 生成训练建议
    suggestions = generate_training_suggestions(metrics, hr_zones)

    return {
        'filename': metadata.get('file_type', 'unknown'),
        'metadata': metadata,
        'metrics': metrics,
        'hr_zones': hr_zones,
        'time_series': time_series,
        'suggestions': suggestions
    }

def calculate_basic_metrics(df: pd.DataFrame) -> Dict[str, Any]:
    """
    计算基本指标

    参数:
        df: 包含活动数据的DataFrame

    返回:
        包含计算指标的字典
    """
    metrics = {}

    # 心率数据
    if 'heart_rate' in df.columns:
        hr_series = pd.to_numeric(df['heart_rate'], errors='coerce')
        hr_series = hr_series.dropna()

        if len(hr_series) > 0:
            metrics['avg_heart_rate'] = float(hr_series.mean())
            metrics['max_heart_rate'] = float(hr_series.max())
            metrics['min_heart_rate'] = float(hr_series.min())
            metrics['hr_std'] = float(hr_series.std())
            metrics['has_hr_data'] = True
        else:
            metrics['has_hr_data'] = False
    else:
        metrics['has_hr_data'] = False

    # 配速数据
    if 'pace' in df.columns:
        pace_series = pd.to_numeric(df['pace'], errors='coerce')
        pace_series = pace_series.dropna()

        if len(pace_series) > 0:
            metrics['avg_pace'] = float(pace_series.mean())
            metrics['fastest_pace'] = float(pace_series.min())
            metrics['slowest_pace'] = float(pace_series.max())
            metrics['pace_std'] = float(pace_series.std())
            metrics['has_pace_data'] = True
        else:
            metrics['has_pace_data'] = False
    else:
        metrics['has_pace_data'] = False

    # 距离数据
    if 'distance' in df.columns:
        distance_series = pd.to_numeric(df['distance'], errors='coerce')
        distance_series = distance_series.dropna()

        if len(distance_series) > 0:
            metrics['total_distance'] = float(distance_series.iloc[-1] - distance_series.iloc[0])
            metrics['has_distance_data'] = True
        else:
            metrics['has_distance_data'] = False
    else:
        metrics['has_distance_data'] = False

    # 时间数据
    if 'timestamp' in df.columns:
        timestamps = pd.to_datetime(df['timestamp'], errors='coerce')
        timestamps = timestamps.dropna()

        if len(timestamps) > 1:
            total_seconds = (timestamps.iloc[-1] - timestamps.iloc[0]).total_seconds()
            metrics['total_time_minutes'] = float(total_seconds / 60)
            metrics['has_time_data'] = True
        else:
            metrics['has_time_data'] = False
    else:
        metrics['has_time_data'] = False

    # 步频数据
    if 'cadence' in df.columns:
        cadence_series = pd.to_numeric(df['cadence'], errors='coerce')
        cadence_series = cadence_series.dropna()

        if len(cadence_series) > 0:
            metrics['avg_cadence'] = float(cadence_series.mean())
            metrics['max_cadence'] = float(cadence_series.max())
            metrics['has_cadence_data'] = True
        else:
            metrics['has_cadence_data'] = False
    else:
        metrics['has_cadence_data'] = False

    # 海拔数据
    if 'altitude' in df.columns:
        altitude_series = pd.to_numeric(df['altitude'], errors='coerce')
        altitude_series = altitude_series.dropna()

        if len(altitude_series) > 0:
            metrics['avg_altitude'] = float(altitude_series.mean())
            metrics['max_altitude'] = float(altitude_series.max())
            metrics['min_altitude'] = float(altitude_series.min())

            # 计算爬升和下降
            diff = altitude_series.diff().dropna()
            ascent = diff[diff > 0].sum()
            descent = abs(diff[diff < 0].sum())

            metrics['total_ascent'] = float(ascent)
            metrics['total_descent'] = float(descent)
            metrics['has_altitude_data'] = True
        else:
            metrics['has_altitude_data'] = False
    else:
        metrics['has_altitude_data'] = False

    # 计算训练负荷（简化TRIMP）
    if metrics['has_hr_data'] and metrics['has_time_data']:
        try:
            trimp = calculate_trimp(df, metrics['avg_heart_rate'], metrics['max_heart_rate'])
            metrics['training_load'] = float(trimp)
        except:
            metrics['training_load'] = 0.0
    else:
        metrics['training_load'] = 0.0

    return metrics

def analyze_hr_zones(df: pd.DataFrame, custom_zones: Optional[Dict] = None) -> List[Dict[str, Any]]:
    """
    分析心率区间分布

    参数:
        df: 包含活动数据的DataFrame
        custom_zones: 自定义心率区间

    返回:
        心率区间分析结果列表
    """
    if 'heart_rate' not in df.columns or 'timestamp' not in df.columns:
        return []

    # 使用默认心率区间
    if custom_zones is None:
        zones = [
            {"zone": "Z1", "name": "恢复区", "min": 0, "max": 120},
            {"zone": "Z2", "name": "有氧区", "min": 120, "max": 140},
            {"zone": "Z3", "name": "节奏区", "min": 140, "max": 160},
            {"zone": "Z4", "name": "阈值区", "min": 160, "max": 180},
            {"zone": "Z5", "name": "无氧区", "min": 180, "max": 300}
        ]
    else:
        zones = custom_zones

    hr_series = pd.to_numeric(df['heart_rate'], errors='coerce')
    timestamps = pd.to_datetime(df['timestamp'], errors='coerce')

    # 计算每个区间的时间
    zone_results = []
    total_time_seconds = 0

    for i in range(len(hr_series) - 1):
        if pd.isna(hr_series.iloc[i]) or pd.isna(timestamps.iloc[i]) or pd.isna(timestamps.iloc[i+1]):
            continue

        hr = hr_series.iloc[i]
        time_diff = (timestamps.iloc[i+1] - timestamps.iloc[i]).total_seconds()

        # 找到对应的心率区间
        for zone in zones:
            if zone['min'] <= hr < zone['max']:
                zone['time_seconds'] = zone.get('time_seconds', 0) + time_diff
                total_time_seconds += time_diff
                break

    # 格式化结果
    for zone in zones:
        time_seconds = zone.get('time_seconds', 0)
        time_minutes = time_seconds / 60

        if total_time_seconds > 0:
            percentage = (time_seconds / total_time_seconds) * 100
        else:
            percentage = 0

        zone_results.append({
            "zone": zone['zone'],
            "name": zone['name'],
            "min_hr": zone['min'],
            "max_hr": zone['max'],
            "time_minutes": round(time_minutes, 1),
            "time_seconds": round(time_seconds, 1),
            "percentage": round(percentage, 1)
        })

    return zone_results

def calculate_trimp(df: pd.DataFrame, avg_hr: float, max_hr: float) -> float:
    """
    计算简化版TRIMP训练负荷

    参数:
        df: 包含活动数据的DataFrame
        avg_hr: 平均心率
        max_hr: 最大心率

    返回:
        TRIMP值
    """
    if not ('timestamp' in df.columns and 'heart_rate' in df.columns):
        return 0.0

    # 计算训练时间（分钟）
    timestamps = pd.to_datetime(df['timestamp'], errors='coerce')
    if len(timestamps) < 2:
        return 0.0

    total_minutes = (timestamps.iloc[-1] - timestamps.iloc[0]).total_seconds() / 60

    # 简化TRIMP公式: 时间 × 心率储备百分比
    resting_hr = 60  # 假设静息心率为60
    hr_reserve = max_hr - resting_hr
    if hr_reserve <= 0:
        return 0.0

    intensity = (avg_hr - resting_hr) / hr_reserve

    # 指数权重（简化版）
    trimp = total_minutes * intensity * 0.64 * np.exp(1.92 * intensity)

    return trimp

def prepare_time_series(df: pd.DataFrame, max_points: int = 100) -> Dict[str, List]:
    """
    准备时间序列数据，采样以减少数据量

    参数:
        df: 包含活动数据的DataFrame
        max_points: 最大数据点数

    返回:
        采样后的时间序列数据
    """
    result = {
        'timestamps': [],
        'heart_rates': [],
        'paces': [],
        'distances': [],
        'altitudes': []
    }

    if len(df) == 0:
        return result

    # 确定采样间隔
    sample_interval = max(1, len(df) // max_points)

    # 采样数据
    for i in range(0, len(df), sample_interval):
        row = df.iloc[i]

        # 时间戳
        if 'timestamp' in df.columns and not pd.isna(row['timestamp']):
            if isinstance(row['timestamp'], pd.Timestamp):
                result['timestamps'].append(row['timestamp'].strftime('%H:%M:%S'))
            else:
                result['timestamps'].append(str(row['timestamp']))
        else:
            result['timestamps'].append(f"{i//60:02d}:{i%60:02d}")

        # 心率
        if 'heart_rate' in df.columns and not pd.isna(row['heart_rate']):
            result['heart_rates'].append(float(row['heart_rate']))
        else:
            result['heart_rates'].append(None)

        # 配速
        if 'pace' in df.columns and not pd.isna(row['pace']):
            result['paces'].append(float(row['pace']))
        else:
            result['paces'].append(None)

        # 距离
        if 'distance' in df.columns and not pd.isna(row['distance']):
            result['distances'].append(float(row['distance']))
        else:
            result['distances'].append(None)

        # 海拔
        if 'altitude' in df.columns and not pd.isna(row['altitude']):
            result['altitudes'].append(float(row['altitude']))
        else:
            result['altitudes'].append(None)

    # 限制数据点数量
    if len(result['timestamps']) > max_points:
        for key in result:
            result[key] = result[key][:max_points]

    return result

def generate_training_suggestions(metrics: Dict[str, Any], hr_zones: List[Dict[str, Any]]) -> List[str]:
    """
    基于分析结果生成训练建议

    参数:
        metrics: 计算出的指标
        hr_zones: 心率区间分析结果

    返回:
        训练建议列表
    """
    suggestions = []

    if not metrics.get('has_hr_data', False):
        suggestions.append("⚠️ 未检测到心率数据，建议使用带心率监测的设备以获得更准确的分析")
        return suggestions

    # 基于心率区间的建议
    if hr_zones:
        total_time = sum(zone.get('time_minutes', 0) for zone in hr_zones)

        # 计算各区间的百分比
        zone_percentages = {}
        for zone in hr_zones:
            if total_time > 0:
                percentage = zone.get('percentage', 0)
                zone_percentages[zone['zone']] = percentage

        # Z5（无氧区）时间过长
        if zone_percentages.get('Z5', 0) > 10:
            suggestions.append("🏃‍♂️ 无氧区时间较长，建议增加恢复时间或降低强度")

        # Z1-Z2（低强度）时间过少
        low_intensity = zone_percentages.get('Z1', 0) + zone_percentages.get('Z2', 0)
        if low_intensity < 20:
            suggestions.append("🧘‍♂️ 低强度训练比例较低，建议增加轻松跑或恢复跑")

        # Z3-Z4（中等强度）适中
        mid_intensity = zone_percentages.get('Z3', 0) + zone_percentages.get('Z4', 0)
        if 40 <= mid_intensity <= 60:
            suggestions.append("✅ 训练强度分布良好，保持了适当的有氧和阈值训练")

    # 基于训练负荷的建议
    training_load = metrics.get('training_load', 0)
    total_time = metrics.get('total_time_minutes', 0)

    if training_load > 0 and total_time > 0:
        load_per_minute = training_load / total_time

        if load_per_minute > 0.5:
            suggestions.append("🔥 训练强度较高，注意恢复和营养补充")
        elif load_per_minute < 0.2:
            suggestions.append("🌱 训练强度较低，可以适当增加训练量或强度")

    # 基于步频的建议
    if metrics.get('has_cadence_data', False):
        avg_cadence = metrics.get('avg_cadence', 0)
        if avg_cadence > 0:
            if avg_cadence < 160:
                suggestions.append("👣 平均步频较低，尝试提高步频以减少受伤风险")
            elif avg_cadence > 190:
                suggestions.append("👣 平均步频很高，注意保持经济性")

    # 基于距离和时间的建议
    if metrics.get('has_distance_data', False) and metrics.get('has_time_data', False):
        total_distance = metrics.get('total_distance', 0)
        total_time = metrics.get('total_time_minutes', 0)

        if total_distance > 0 and total_time > 0:
            avg_speed = total_distance / (total_time / 60)  # km/h

            if avg_speed > 15:
                suggestions.append("⚡ 平均速度很快，注意技术动作和恢复")
            elif avg_speed < 6:
                suggestions.append("🐢 平均速度较慢，可以尝试加入一些速度训练")

    # 如果没有其他建议，添加一条积极的反馈
    if not suggestions:
        suggestions.append("👍 训练完成得很好！继续保持规律的训练")

    return suggestions[:5]  # 限制为5条建议