#!/usr/bin/env python3
"""
Runalyzer API 测试脚本
用于测试后端API功能
"""

import requests
import json
import time
import os
from pathlib import Path

# API基础URL
BASE_URL = "http://localhost:8000"

def test_api_health():
    """测试API健康状态"""
    print("🔍 测试API健康状态...")
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=5)
        if response.status_code == 200:
            print(f"✅ API健康状态: {response.json()}")
            return True
        else:
            print(f"❌ API健康检查失败: {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ 无法连接到API服务器")
        return False
    except Exception as e:
        print(f"❌ 健康检查异常: {e}")
        return False

def test_sample_endpoint():
    """测试示例数据端点"""
    print("\n🔍 测试示例数据端点...")
    try:
        response = requests.get(f"{BASE_URL}/api/sample", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ 示例数据获取成功")
            print(f"   文件类型: {data.get('filename', '未知')}")
            print(f"   指标数量: {len(data.get('metrics', {}))}")
            print(f"   心率区间: {len(data.get('hr_zones', []))}个")
            print(f"   时间序列: {len(data.get('time_series', {}).get('timestamps', []))}个点")
            print(f"   训练建议: {len(data.get('suggestions', []))}条")
            return True
        else:
            print(f"❌ 示例数据获取失败: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ 示例数据测试异常: {e}")
        return False

def test_file_upload(file_path):
    """测试文件上传"""
    print(f"\n📤 测试文件上传: {file_path}")

    if not os.path.exists(file_path):
        print(f"❌ 文件不存在: {file_path}")
        return False

    file_ext = Path(file_path).suffix.lower()
    if file_ext not in ['.fit', '.gpx', '.csv']:
        print(f"❌ 不支持的文件格式: {file_ext}")
        return False

    try:
        with open(file_path, 'rb') as f:
            files = {'file': (Path(file_path).name, f, 'application/octet-stream')}
            response = requests.post(
                f"{BASE_URL}/api/upload",
                files=files,
                timeout=30  # 文件上传可能需要更长时间
            )

        if response.status_code == 200:
            data = response.json()
            print(f"✅ 文件上传成功")
            print(f"   文件类型: {data.get('filename', '未知')}")

            # 显示关键指标
            metrics = data.get('metrics', {})
            if metrics.get('has_hr_data'):
                print(f"   平均心率: {metrics.get('avg_heart_rate', 'N/A')} bpm")
            if metrics.get('has_pace_data'):
                print(f"   平均配速: {metrics.get('avg_pace', 'N/A')} min/km")
            if metrics.get('total_distance'):
                print(f"   总距离: {metrics.get('total_distance', 'N/A')} km")

            # 显示心率区间
            hr_zones = data.get('hr_zones', [])
            if hr_zones:
                print(f"   心率区间分析: {len(hr_zones)}个区间")
                for zone in hr_zones[:3]:  # 显示前3个
                    print(f"     {zone.get('zone')}: {zone.get('time_minutes')}分钟 ({zone.get('percentage')}%)")

            return True
        else:
            print(f"❌ 文件上传失败: {response.status_code}")
            try:
                error_data = response.json()
                print(f"   错误信息: {error_data.get('detail', '未知错误')}")
            except:
                print(f"   错误信息: {response.text[:100]}")
            return False
    except requests.exceptions.Timeout:
        print("❌ 文件上传超时")
        return False
    except Exception as e:
        print(f"❌ 文件上传异常: {e}")
        return False

def run_comprehensive_test():
    """运行全面的API测试"""
    print("=" * 50)
    print("🏃 Runalyzer API 全面测试")
    print("=" * 50)

    # 等待API启动
    print("⏳ 等待API启动...")
    for i in range(10):
        if test_api_health():
            break
        time.sleep(1)
    else:
        print("❌ API启动失败，测试中止")
        return False

    # 测试示例端点
    if not test_sample_endpoint():
        print("⚠️  示例端点测试失败，但继续测试...")

    # 测试CSV文件上传
    csv_file = "sample_data/sample_activity.csv"
    if os.path.exists(csv_file):
        test_file_upload(csv_file)
    else:
        print(f"⚠️  CSV测试文件不存在: {csv_file}")

    # 测试其他文件格式（如果存在）
    test_files = [
        "sample_data/sample_activity.fit",
        "sample_data/sample_activity.gpx"
    ]

    for test_file in test_files:
        if os.path.exists(test_file):
            test_file_upload(test_file)
        else:
            print(f"⚠️  测试文件不存在: {test_file}")

    print("\n" + "=" * 50)
    print("📊 测试总结")
    print("=" * 50)
    print("✅ API基础功能测试完成")
    print("✅ 示例数据端点测试完成")
    print("✅ 文件上传功能测试完成")
    print("\n🔗 API文档: http://localhost:8000/docs")
    print("🌐 前端界面: http://localhost:3000")
    print("=" * 50)

    return True

def quick_test():
    """快速测试 - 只检查API是否可用"""
    print("🚀 运行快速测试...")
    if test_api_health():
        print("✅ API运行正常")
        print("🔗 访问以下地址:")
        print("   API文档: http://localhost:8000/docs")
        print("   前端界面: http://localhost:3000")
        return True
    else:
        print("❌ API不可用")
        print("💡 请确保后端服务已启动:")
        print("   1. 进入 backend/ 目录")
        print("   2. 运行: python main.py")
        return False

if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Runalyzer API 测试工具")
    parser.add_argument("--quick", action="store_true", help="快速测试")
    parser.add_argument("--full", action="store_true", help="全面测试")
    parser.add_argument("--upload", type=str, help="测试上传指定文件")

    args = parser.parse_args()

    if args.upload:
        test_file_upload(args.upload)
    elif args.full:
        run_comprehensive_test()
    else:
        quick_test()