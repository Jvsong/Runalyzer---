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

    # 计算高级指标
    if metrics['has_hr_data']:
        advanced_metrics = calculate_advanced_metrics(df, metrics, hr_zones)
        metrics.update(advanced_metrics)

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

    # 基于新高级指标的建议
    # 1. 训练效果建议
    training_effect = metrics.get('training_effect')
    if training_effect is not None:
        if training_effect >= 4.0:
            suggestions.append("💪 训练效果很高，这表明进行了高强度训练，确保充分恢复")
        elif training_effect <= 2.0:
            suggestions.append("🌿 训练效果较低，适合恢复日或基础有氧训练")
        else:
            suggestions.append("✅ 训练效果适中，有助于提升有氧能力和耐力")

    # 2. 强度平衡建议
    low_intensity_ratio = metrics.get('low_intensity_ratio')
    high_intensity_ratio = metrics.get('high_intensity_ratio')
    if low_intensity_ratio is not None and high_intensity_ratio is not None:
        if high_intensity_ratio > 70:
            suggestions.append("⚡ 高强度训练比例很高，注意平衡训练强度以避免过度训练")
        elif low_intensity_ratio > 80:
            suggestions.append("🐌 低强度训练比例很高，考虑加入一些高强度间歇训练提升速度")

    # 3. 配速稳定性建议
    pace_cv = metrics.get('pace_cv')
    if pace_cv is not None:
        if pace_cv > 15:
            suggestions.append("📊 配速波动较大，尝试保持更稳定的配速以提高跑步经济性")
        elif pace_cv < 5:
            suggestions.append("🎯 配速非常稳定，这表明良好的节奏控制能力")

    # 4. 训练压力分数建议
    training_stress_score = metrics.get('training_stress_score')
    if training_stress_score is not None:
        if training_stress_score > 150:
            suggestions.append("🏋️‍♂️ 训练压力分数较高，可能需要1-2天完全恢复")
        elif training_stress_score < 50:
            suggestions.append("🧘‍♀️ 训练压力分数较低，可以安排更高强度的训练")

    # 如果没有其他建议，添加一条积极的反馈
    if not suggestions:
        suggestions.append("👍 训练完成得很好！继续保持规律的训练")

    # 限制为5条建议，优先显示最重要的建议
    # 排序逻辑：警告类建议 > 改进建议 > 积极反馈
    warning_keywords = ['⚠️', '注意', '避免', '风险', '恢复', '平衡']
    improvement_keywords = ['建议', '尝试', '考虑', '提高', '增加', '减少']

    def suggestion_priority(suggestion):
        for keyword in warning_keywords:
            if keyword in suggestion:
                return 0  # 最高优先级
        for keyword in improvement_keywords:
            if keyword in suggestion:
                return 1  # 中等优先级
        return 2  # 低优先级（积极反馈）

    suggestions.sort(key=suggestion_priority)
    return suggestions[:5]

def calculate_advanced_metrics(df: pd.DataFrame, basic_metrics: Dict[str, Any], hr_zones: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    计算高级分析指标

    参数:
        df: 包含活动数据的DataFrame
        basic_metrics: 基础指标字典
        hr_zones: 心率区间分析结果

    返回:
        包含高级指标的字典
    """
    advanced_metrics = {}

    # 1. 训练效果（Training Effect）
    if basic_metrics.get('has_hr_data', False) and hr_zones:
        training_effect = calculate_training_effect(hr_zones)
        advanced_metrics['training_effect'] = training_effect

    # 2. 强度平衡（低强度 vs 高强度）
    if hr_zones:
        intensity_balance = calculate_intensity_balance(hr_zones)
        advanced_metrics.update(intensity_balance)

    # 3. 配速稳定性
    if basic_metrics.get('has_pace_data', False):
        pace_stability = calculate_pace_stability(df)
        advanced_metrics.update(pace_stability)

    # 4. 训练压力分数（更复杂的训练负荷）
    if (basic_metrics.get('has_hr_data', False) and
        basic_metrics.get('has_time_data', False) and
        'training_load' in basic_metrics):
        # 基于TRIMP的训练压力分数（标准化）
        training_stress_score = calculate_training_stress_score(
            basic_metrics['training_load'],
            basic_metrics.get('total_time_minutes', 0)
        )
        advanced_metrics['training_stress_score'] = training_stress_score

    return advanced_metrics

def calculate_training_effect(hr_zones: List[Dict[str, Any]]) -> float:
    """
    计算训练效果（Training Effect）
    基于Garmin Firstbeat算法简化版
    范围：1.0-5.0（低到高）

    参数:
        hr_zones: 心率区间分析结果

    返回:
        训练效果分数
    """
    if not hr_zones:
        return 1.0

    # 计算各区间加权时间
    weighted_time = 0.0
    total_time = sum(zone.get('time_minutes', 0) for zone in hr_zones)

    if total_time <= 0:
        return 1.0

    # 权重系数：随着心率区间增加而增加
    zone_weights = {
        'Z1': 0.5,  # 恢复区
        'Z2': 1.0,  # 有氧区
        'Z3': 2.0,  # 节奏区
        'Z4': 3.0,  # 阈值区
        'Z5': 4.0   # 无氧区
    }

    for zone in hr_zones:
        zone_id = zone.get('zone', '')
        time_minutes = zone.get('time_minutes', 0)
        weight = zone_weights.get(zone_id, 1.0)
        weighted_time += time_minutes * weight

    # 计算平均权重
    avg_weight = weighted_time / total_time

    # 映射到1.0-5.0范围
    # 假设权重范围0.5-4.0，映射到1.0-5.0
    min_weight, max_weight = 0.5, 4.0
    training_effect = 1.0 + (avg_weight - min_weight) * (4.0 / (max_weight - min_weight))

    # 限制在1.0-5.0范围内
    training_effect = max(1.0, min(5.0, training_effect))

    return round(training_effect, 1)

def calculate_intensity_balance(hr_zones: List[Dict[str, Any]]) -> Dict[str, float]:
    """
    计算强度平衡指标

    参数:
        hr_zones: 心率区间分析结果

    返回:
        包含强度平衡指标的字典
    """
    if not hr_zones:
        return {}

    # 初始化各区间的总时间
    zone_times = {f"zone_{zone['zone']}_minutes": zone.get('time_minutes', 0) for zone in hr_zones}

    # 计算低强度（Z1+Z2）和高强度（Z3+Z4+Z5）比例
    low_intensity_zones = ['Z1', 'Z2']
    high_intensity_zones = ['Z3', 'Z4', 'Z5']

    total_time = sum(zone.get('time_minutes', 0) for zone in hr_zones)

    if total_time <= 0:
        return zone_times

    low_intensity_time = sum(
        zone.get('time_minutes', 0) for zone in hr_zones
        if zone.get('zone', '') in low_intensity_zones
    )

    high_intensity_time = sum(
        zone.get('time_minutes', 0) for zone in hr_zones
        if zone.get('zone', '') in high_intensity_zones
    )

    # 计算比例
    low_intensity_ratio = low_intensity_time / total_time * 100
    high_intensity_ratio = high_intensity_time / total_time * 100

    intensity_balance = {
        'low_intensity_ratio': round(low_intensity_ratio, 1),
        'high_intensity_ratio': round(high_intensity_ratio, 1),
        'intensity_balance_score': round(high_intensity_ratio / max(low_intensity_ratio, 1), 2)
    }

    # 合并所有指标
    intensity_balance.update(zone_times)
    return intensity_balance

def calculate_pace_stability(df: pd.DataFrame) -> Dict[str, Any]:
    """
    计算配速稳定性指标

    参数:
        df: 包含活动数据的DataFrame

    返回:
        包含配速稳定性指标的字典
    """
    if 'pace' not in df.columns:
        return {}

    pace_series = pd.to_numeric(df['pace'], errors='coerce')
    pace_series = pace_series.dropna()

    if len(pace_series) < 2:
        return {}

    pace_mean = pace_series.mean()
    pace_std = pace_series.std()
    pace_cv = (pace_std / pace_mean * 100) if pace_mean > 0 else 0  # 变异系数（%）

    # 计算配速区间分布
    pace_bins = [0, 4, 5, 6, 7, 8, float('inf')]  # 分钟/公里区间
    pace_labels = ['<4:00', '4:00-5:00', '5:00-6:00', '6:00-7:00', '7:00-8:00', '>8:00']

    if len(pace_series) > 0:
        # 使用pandas cut函数进行分箱
        binned = pd.cut(pace_series, bins=pace_bins, labels=pace_labels, include_lowest=True)
        pace_distribution = binned.value_counts(normalize=True).to_dict()

        # 转换为百分比
        pace_distribution_pct = {str(k): round(v * 100, 1) for k, v in pace_distribution.items()}
    else:
        pace_distribution_pct = {}

    return {
        'pace_std': round(pace_std, 2),  # 配速标准差
        'pace_cv': round(pace_cv, 1),    # 配速变异系数（%）
        'pace_distribution': pace_distribution_pct  # 配速分布
    }

def calculate_training_stress_score(trimp: float, total_time_minutes: float) -> float:
    """
    计算训练压力分数（Training Stress Score）
    基于TRIMP的标准化分数

    参数:
        trimp: TRIMP训练负荷值
        total_time_minutes: 总训练时间（分钟）

    返回:
        训练压力分数
    """
    if total_time_minutes <= 0:
        return 0.0

    # 标准化：每小时的TRIMP乘以时间因子
    # 这是一个简化版本，实际TSS算法更复杂
    trimp_per_hour = trimp / (total_time_minutes / 60)

    # 基础TSS计算（简化）
    # 假设中等强度1小时对应TSS=100
    base_intensity = 50  # 中等强度的trimp_per_hour估计值

    if base_intensity <= 0:
        return 0.0

    tss = (trimp_per_hour / base_intensity) * 100 * (total_time_minutes / 60)

    return round(max(0, tss), 1)