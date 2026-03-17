import pandas as pd
import numpy as np
from datetime import datetime
import os
from typing import Dict, List, Optional, Any

# 尝试导入可选的解析库
try:
    import fitparse
    FIT_AVAILABLE = True
except ImportError:
    FIT_AVAILABLE = False
    print("警告: fitparse 未安装，FIT文件支持受限")

try:
    import gpxpy
    import gpxpy.gpx
    GPX_AVAILABLE = True
except ImportError:
    GPX_AVAILABLE = False
    print("警告: gpxpy 未安装，GPX文件支持受限")

def parse_activity_file(file_path: str) -> Dict[str, Any]:
    """
    解析活动文件，根据扩展名选择解析器

    参数:
        file_path: 文件路径

    返回:
        包含解析后数据的字典
    """
    ext = os.path.splitext(file_path)[1].lower()

    if ext == '.fit':
        return parse_fit_file(file_path)
    elif ext == '.gpx':
        return parse_gpx_file(file_path)
    elif ext == '.csv':
        return parse_csv_file(file_path)
    else:
        raise ValueError(f"不支持的文件格式: {ext}")

def parse_fit_file(file_path: str) -> Dict[str, Any]:
    """
    解析Garmin FIT文件

    参数:
        file_path: FIT文件路径

    返回:
        包含时间序列数据和元数据的字典
    """
    if not FIT_AVAILABLE:
        raise ImportError("fitparse 未安装，无法解析FIT文件")

    fitfile = fitparse.FitFile(file_path)

    timestamps = []
    heart_rates = []
    cadences = []
    distances = []
    speeds = []
    altitudes = []
    latitudes = []
    longitudes = []

    # 解析记录数据
    for record in fitfile.get_messages('record'):
        timestamp = None
        hr = None
        cadence = None
        distance = None
        speed = None
        altitude = None
        lat = None
        lon = None

        for data in record:
            if data.name == 'timestamp':
                timestamp = data.value
            elif data.name == 'heart_rate':
                hr = data.value
            elif data.name == 'cadence':
                cadence = data.value
            elif data.name == 'distance':
                distance = data.value
            elif data.name == 'speed':
                speed = data.value
            elif data.name == 'altitude':
                altitude = data.value
            elif data.name == 'position_lat':
                if data.value is not None:
                    lat = data.value * (180 / 2**31)  # 转换为度
            elif data.name == 'position_long':
                if data.value is not None:
                    lon = data.value * (180 / 2**31)  # 转换为度

        if timestamp:
            timestamps.append(timestamp)
            heart_rates.append(hr if hr is not None else np.nan)
            cadences.append(cadence if cadence is not None else np.nan)
            distances.append(distance if distance is not None else np.nan)
            speeds.append(speed if speed is not None else np.nan)
            altitudes.append(altitude if altitude is not None else np.nan)
            latitudes.append(lat if lat is not None else np.nan)
            longitudes.append(lon if lon is not None else np.nan)

    # 计算配速 (分钟/公里)，如果速度数据可用
    paces = []
    if speeds:
        paces = [60 / s if s and s > 0 else np.nan for s in speeds]

    # 创建DataFrame
    data = {
        'timestamp': timestamps,
        'heart_rate': heart_rates,
        'cadence': cadences,
        'distance': distances,
        'speed': speeds,
        'pace': paces,
        'altitude': altitudes,
        'latitude': latitudes,
        'longitude': longitudes
    }

    # 移除完全为NaN的列
    df = pd.DataFrame(data)
    df = df.dropna(axis=1, how='all')

    # 填充缺失值（向前填充）
    df = df.ffill().bfill()

    return {
        'dataframe': df,
        'metadata': {
            'file_type': 'FIT',
            'data_points': len(df),
            'has_hr': 'heart_rate' in df.columns,
            'has_gps': 'latitude' in df.columns and 'longitude' in df.columns,
            'has_altitude': 'altitude' in df.columns,
            'timestamp_range': {
                'start': df['timestamp'].iloc[0].isoformat() if len(df) > 0 else None,
                'end': df['timestamp'].iloc[-1].isoformat() if len(df) > 0 else None
            }
        }
    }

def parse_gpx_file(file_path: str) -> Dict[str, Any]:
    """
    解析GPX文件

    参数:
        file_path: GPX文件路径

    返回:
        包含时间序列数据和元数据的字典
    """
    if not GPX_AVAILABLE:
        raise ImportError("gpxpy 未安装，无法解析GPX文件")

    with open(file_path, 'r') as gpx_file:
        gpx = gpxpy.parse(gpx_file)

    timestamps = []
    latitudes = []
    longitudes = []
    altitudes = []

    for track in gpx.tracks:
        for segment in track.segments:
            for point in segment.points:
                timestamps.append(point.time)
                latitudes.append(point.latitude)
                longitudes.append(point.longitude)
                altitudes.append(point.elevation)

    # 计算距离和速度
    distances = [0.0]
    speeds = [0.0]

    for i in range(1, len(latitudes)):
        from math import radians, sin, cos, sqrt, atan2

        # 计算两点间的距离（Haversine公式）
        lat1, lon1 = radians(latitudes[i-1]), radians(longitudes[i-1])
        lat2, lon2 = radians(latitudes[i]), radians(longitudes[i])

        dlat = lat2 - lat1
        dlon = lon2 - lon1

        a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
        c = 2 * atan2(sqrt(a), sqrt(1-a))
        distance_km = 6371 * c  # 地球半径6371km

        distances.append(distances[-1] + distance_km)

        # 计算速度 (km/h)
        if i > 0 and timestamps[i] and timestamps[i-1]:
            time_diff = (timestamps[i] - timestamps[i-1]).total_seconds() / 3600  # 小时
            if time_diff > 0:
                speeds.append(distance_km / time_diff)
            else:
                speeds.append(0)
        else:
            speeds.append(0)

    # 计算配速 (分钟/公里)
    paces = [60 / s if s and s > 0 else np.nan for s in speeds]

    # 心率数据在GPX中通常不可用，设置为NaN
    heart_rates = [np.nan] * len(timestamps)
    cadences = [np.nan] * len(timestamps)

    # 创建DataFrame
    data = {
        'timestamp': timestamps,
        'heart_rate': heart_rates,
        'cadence': cadences,
        'distance': distances,
        'speed': speeds,
        'pace': paces,
        'altitude': altitudes,
        'latitude': latitudes,
        'longitude': longitudes
    }

    df = pd.DataFrame(data)

    return {
        'dataframe': df,
        'metadata': {
            'file_type': 'GPX',
            'data_points': len(df),
            'has_hr': False,
            'has_gps': True,
            'has_altitude': True,
            'timestamp_range': {
                'start': df['timestamp'].iloc[0].isoformat() if len(df) > 0 else None,
                'end': df['timestamp'].iloc[-1].isoformat() if len(df) > 0 else None
            }
        }
    }

def parse_csv_file(file_path: str) -> Dict[str, Any]:
    """
    解析CSV文件

    参数:
        file_path: CSV文件路径

    返回:
        包含时间序列数据和元数据的字典
    """
    # 尝试不同的编码和分隔符
    try:
        df = pd.read_csv(file_path)
    except UnicodeDecodeError:
        df = pd.read_csv(file_path, encoding='latin1')

    # 标准化列名（不区分大小写）
    column_mapping = {}
    for col in df.columns:
        col_lower = col.lower()
        if 'time' in col_lower or 'timestamp' in col_lower:
            column_mapping[col] = 'timestamp'
        elif 'heart' in col_lower or 'hr' in col_lower:
            column_mapping[col] = 'heart_rate'
        elif 'cadence' in col_lower:
            column_mapping[col] = 'cadence'
        elif 'distance' in col_lower:
            column_mapping[col] = 'distance'
        elif 'speed' in col_lower:
            column_mapping[col] = 'speed'
        elif 'pace' in col_lower:
            column_mapping[col] = 'pace'
        elif 'altitude' in col_lower or 'elevation' in col_lower:
            column_mapping[col] = 'altitude'
        elif 'lat' in col_lower:
            column_mapping[col] = 'latitude'
        elif 'lon' in col_lower or 'lng' in col_lower:
            column_mapping[col] = 'longitude'

    df = df.rename(columns=column_mapping)

    # 处理时间戳列
    if 'timestamp' in df.columns:
        try:
            df['timestamp'] = pd.to_datetime(df['timestamp'])
        except:
            # 如果转换失败，保持原样
            pass

    # 计算配速，如果速度数据可用但配速数据不可用
    if 'speed' in df.columns and 'pace' not in df.columns:
        df['pace'] = 60 / df['speed']  # 分钟/公里

    # 填充缺失值
    df = df.ffill().bfill()

    # 确保有必要的列
    required_columns = ['timestamp', 'heart_rate', 'pace', 'distance']
    for col in required_columns:
        if col not in df.columns:
            df[col] = np.nan

    return {
        'dataframe': df,
        'metadata': {
            'file_type': 'CSV',
            'data_points': len(df),
            'has_hr': 'heart_rate' in df.columns and not df['heart_rate'].isna().all(),
            'has_gps': 'latitude' in df.columns and 'longitude' in df.columns,
            'has_altitude': 'altitude' in df.columns and not df['altitude'].isna().all(),
            'timestamp_range': {
                'start': df['timestamp'].iloc[0].isoformat() if len(df) > 0 and 'timestamp' in df.columns else None,
                'end': df['timestamp'].iloc[-1].isoformat() if len(df) > 0 and 'timestamp' in df.columns else None
            }
        }
    }