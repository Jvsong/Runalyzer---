#!/usr/bin/env python3
"""
Runalyzer 分析模块单元测试
测试 analysis.py 中的数据分析功能
"""

import unittest
import pandas as pd
import numpy as np
from datetime import datetime, timedelta

# 导入要测试的模块
try:
    from analysis import (
        analyze_activity,
        calculate_basic_metrics,
        analyze_hr_zones,
        calculate_trimp,
        prepare_time_series,
        generate_training_suggestions
    )
    ANALYSIS_AVAILABLE = True
except ImportError as e:
    print(f"无法导入分析模块: {e}")
    ANALYSIS_AVAILABLE = False

class TestBasicMetrics(unittest.TestCase):
    """测试基础指标计算"""

    def setUp(self):
        """创建测试数据"""
        # 创建包含完整数据的测试DataFrame
        timestamps = pd.date_range('2024-01-15 08:00:00', periods=10, freq='5min')

        self.test_df = pd.DataFrame({
            'timestamp': timestamps,
            'heart_rate': [120, 125, 130, 135, 140, 145, 150, 155, 160, 165],
            'pace': [6.0, 5.9, 5.8, 5.7, 5.6, 5.5, 5.4, 5.3, 5.2, 5.1],
            'distance': np.linspace(0, 9, 10),
            'cadence': [160, 162, 164, 166, 168, 170, 172, 174, 176, 178],
            'altitude': [100, 102, 105, 108, 110, 115, 120, 125, 130, 135]
        })

    @unittest.skipIf(not ANALYSIS_AVAILABLE, "分析模块不可用")
    def test_calculate_basic_metrics_complete(self):
        """测试完整数据的基本指标计算"""
        metrics = calculate_basic_metrics(self.test_df)

        # 检查必要的指标是否存在
        self.assertIn('avg_heart_rate', metrics)
        self.assertIn('max_heart_rate', metrics)
        self.assertIn('avg_pace', metrics)
        self.assertIn('total_distance', metrics)
        self.assertIn('total_time_minutes', metrics)
        self.assertIn('avg_cadence', metrics)

        # 检查数据类型
        self.assertIsInstance(metrics['avg_heart_rate'], float)
        self.assertIsInstance(metrics['max_heart_rate'], float)
        self.assertIsInstance(metrics['avg_pace'], float)
        self.assertIsInstance(metrics['total_distance'], float)
        self.assertIsInstance(metrics['total_time_minutes'], float)
        self.assertIsInstance(metrics['avg_cadence'], float)

        # 检查数值正确性
        self.assertAlmostEqual(metrics['avg_heart_rate'], 142.5, places=1)
        self.assertEqual(metrics['max_heart_rate'], 165)
        self.assertAlmostEqual(metrics['total_distance'], 9.0, places=1)  # 从0到9
        self.assertAlmostEqual(metrics['total_time_minutes'], 45.0, places=1)  # 9个间隔×5分钟

    @unittest.skipIf(not ANALYSIS_AVAILABLE, "分析模块不可用")
    def test_calculate_basic_metrics_partial(self):
        """测试部分数据的基本指标计算"""
        # 创建只有部分数据的DataFrame
        partial_df = pd.DataFrame({
            'timestamp': pd.date_range('2024-01-15 08:00:00', periods=5, freq='5min'),
            'heart_rate': [120, 125, 130, 135, 140]
        })

        metrics = calculate_basic_metrics(partial_df)

        # 检查心率数据存在
        self.assertTrue(metrics['has_hr_data'])
        self.assertIn('avg_heart_rate', metrics)
        self.assertEqual(metrics['avg_heart_rate'], 130)

        # 检查其他数据不存在
        self.assertFalse(metrics['has_pace_data'])
        self.assertFalse(metrics['has_distance_data'])
        self.assertFalse(metrics['has_cadence_data'])

    @unittest.skipIf(not ANALYSIS_AVAILABLE, "分析模块不可用")
    def test_calculate_basic_metrics_empty(self):
        """测试空DataFrame"""
        empty_df = pd.DataFrame()

        metrics = calculate_basic_metrics(empty_df)

        # 所有标志应为False
        self.assertFalse(metrics['has_hr_data'])
        self.assertFalse(metrics['has_pace_data'])
        self.assertFalse(metrics['has_distance_data'])
        self.assertFalse(metrics['has_cadence_data'])

    @unittest.skipIf(not ANALYSIS_AVAILABLE, "分析模块不可用")
    def test_calculate_basic_metrics_with_nan(self):
        """测试包含NaN值的数据"""
        df_with_nan = pd.DataFrame({
            'timestamp': pd.date_range('2024-01-15 08:00:00', periods=5, freq='5min'),
            'heart_rate': [120, np.nan, 130, np.nan, 140],
            'pace': [6.0, 5.9, np.nan, 5.7, 5.6]
        })

        metrics = calculate_basic_metrics(df_with_nan)

        # 应该正确处理NaN值
        self.assertTrue(metrics['has_hr_data'])
        self.assertTrue(metrics['has_pace_data'])

        # 平均值应该只基于有效值计算
        expected_avg_hr = (120 + 130 + 140) / 3
        self.assertAlmostEqual(metrics['avg_heart_rate'], expected_avg_hr, places=1)

class TestHeartRateZones(unittest.TestCase):
    """测试心率区间分析"""

    def setUp(self):
        """创建测试数据"""
        timestamps = pd.date_range('2024-01-15 08:00:00', periods=20, freq='1min')

        # 创建跨越多个心率区间的测试数据
        heart_rates = []
        for i in range(20):
            if i < 5:
                heart_rates.append(110)  # Z1
            elif i < 10:
                heart_rates.append(130)  # Z2
            elif i < 15:
                heart_rates.append(150)  # Z3
            elif i < 18:
                heart_rates.append(170)  # Z4
            else:
                heart_rates.append(190)  # Z5

        self.test_df = pd.DataFrame({
            'timestamp': timestamps,
            'heart_rate': heart_rates
        })

    @unittest.skipIf(not ANALYSIS_AVAILABLE, "分析模块不可用")
    def test_analyze_hr_zones_default(self):
        """测试默认心率区间分析"""
        zones = analyze_hr_zones(self.test_df)

        # 检查返回结构
        self.assertEqual(len(zones), 5)  # 5个区间
        for zone in zones:
            self.assertIn('zone', zone)
            self.assertIn('name', zone)
            self.assertIn('min_hr', zone)
            self.assertIn('max_hr', zone)
            self.assertIn('time_minutes', zone)
            self.assertIn('time_seconds', zone)
            self.assertIn('percentage', zone)

        # 检查百分比总和接近100%
        total_percentage = sum(zone['percentage'] for zone in zones)
        self.assertAlmostEqual(total_percentage, 100.0, places=1)

        # 找到Z3区间（150 bpm）并检查
        z3_zone = next((zone for zone in zones if zone['zone'] == 'Z3'), None)
        self.assertIsNotNone(z3_zone)
        self.assertEqual(z3_zone['min_hr'], 140)
        self.assertEqual(z3_zone['max_hr'], 160)
        # Z3应有5分钟（5个点，每个1分钟间隔）
        self.assertAlmostEqual(z3_zone['time_minutes'], 5.0, places=1)

    @unittest.skipIf(not ANALYSIS_AVAILABLE, "分析模块不可用")
    def test_analyze_hr_zones_custom(self):
        """测试自定义心率区间"""
        custom_zones = [
            {"zone": "Low", "name": "低强度", "min": 0, "max": 130},
            {"zone": "Mid", "name": "中强度", "min": 130, "max": 160},
            {"zone": "High", "name": "高强度", "min": 160, "max": 200}
        ]

        zones = analyze_hr_zones(self.test_df, custom_zones)

        self.assertEqual(len(zones), 3)
        zone_names = [zone['zone'] for zone in zones]
        self.assertIn('Low', zone_names)
        self.assertIn('Mid', zone_names)
        self.assertIn('High', zone_names)

    @unittest.skipIf(not ANALYSIS_AVAILABLE, "分析模块不可用")
    def test_analyze_hr_zones_no_hr_data(self):
        """测试没有心率数据的情况"""
        df_no_hr = pd.DataFrame({
            'timestamp': pd.date_range('2024-01-15 08:00:00', periods=5, freq='5min'),
            'pace': [6.0, 5.9, 5.8, 5.7, 5.6]
        })

        zones = analyze_hr_zones(df_no_hr)
        self.assertEqual(zones, [])

    @unittest.skipIf(not ANALYSIS_AVAILABLE, "分析模块不可用")
    def test_analyze_hr_zones_uneven_timestamps(self):
        """测试不均匀时间戳"""
        # 创建不均匀时间间隔的数据
        timestamps = [
            datetime(2024, 1, 15, 8, 0, 0),
            datetime(2024, 1, 15, 8, 2, 30),  # 2.5分钟后
            datetime(2024, 1, 15, 8, 7, 0),   # 4.5分钟后
            datetime(2024, 1, 15, 8, 12, 0)   # 5分钟后
        ]

        df_uneven = pd.DataFrame({
            'timestamp': timestamps,
            'heart_rate': [120, 140, 160, 180]
        })

        zones = analyze_hr_zones(df_uneven)

        # 应该仍然能够计算
        self.assertEqual(len(zones), 5)
        total_time = sum(zone['time_minutes'] for zone in zones)
        expected_total = 2.5 + 4.5 + 5  # 总分钟数 = 12分钟
        self.assertAlmostEqual(total_time, expected_total, places=1)

class TestTRIMPCalculation(unittest.TestCase):
    """测试TRIMP训练负荷计算"""

    def setUp(self):
        """创建测试数据"""
        timestamps = pd.date_range('2024-01-15 08:00:00', periods=10, freq='5min')

        self.test_df = pd.DataFrame({
            'timestamp': timestamps,
            'heart_rate': [140, 145, 150, 155, 160, 165, 170, 175, 180, 185]
        })

    @unittest.skipIf(not ANALYSIS_AVAILABLE, "分析模块不可用")
    def test_calculate_trimp_basic(self):
        """测试基础TRIMP计算"""
        avg_hr = 160
        max_hr = 185

        trimp = calculate_trimp(self.test_df, avg_hr, max_hr)

        # TRIMP应为正数
        self.assertGreater(trimp, 0)
        self.assertIsInstance(trimp, float)

    @unittest.skipIf(not ANALYSIS_AVAILABLE, "分析模块不可用")
    def test_calculate_trimp_no_data(self):
        """测试没有数据的情况"""
        empty_df = pd.DataFrame()
        trimp = calculate_trimp(empty_df, 160, 185)
        self.assertEqual(trimp, 0)

    @unittest.skipIf(not ANALYSIS_AVAILABLE, "分析模块不可用")
    def test_calculate_trimp_short_activity(self):
        """测试短时间活动"""
        short_df = pd.DataFrame({
            'timestamp': pd.date_range('2024-01-15 08:00:00', periods=2, freq='1min'),
            'heart_rate': [140, 145]
        })

        trimp = calculate_trimp(short_df, 142.5, 145)
        self.assertGreaterEqual(trimp, 0)

class TestTimeSeriesPreparation(unittest.TestCase):
    """测试时间序列数据准备"""

    def setUp(self):
        """创建测试数据"""
        timestamps = pd.date_range('2024-01-15 08:00:00', periods=100, freq='30s')

        self.test_df = pd.DataFrame({
            'timestamp': timestamps,
            'heart_rate': np.sin(np.linspace(0, 2*np.pi, 100)) * 20 + 150,  # 正弦波动
            'pace': np.linspace(6.0, 4.0, 100),
            'distance': np.linspace(0, 5, 100),
            'altitude': np.random.uniform(100, 150, 100)
        })

    @unittest.skipIf(not ANALYSIS_AVAILABLE, "分析模块不可用")
    def test_prepare_time_series_sampling(self):
        """测试时间序列采样"""
        time_series = prepare_time_series(self.test_df, max_points=50)

        # 检查返回结构
        expected_keys = ['timestamps', 'heart_rates', 'paces', 'distances', 'altitudes']
        for key in expected_keys:
            self.assertIn(key, time_series)
            self.assertIsInstance(time_series[key], list)

        # 检查采样后数据点数量不超过max_points
        self.assertLessEqual(len(time_series['timestamps']), 50)
        self.assertLessEqual(len(time_series['heart_rates']), 50)

        # 所有列表长度应该相同
        lengths = [len(time_series[key]) for key in expected_keys]
        self.assertTrue(all(length == lengths[0] for length in lengths))

    @unittest.skipIf(not ANALYSIS_AVAILABLE, "分析模块不可用")
    def test_prepare_time_series_empty(self):
        """测试空DataFrame"""
        empty_df = pd.DataFrame()
        time_series = prepare_time_series(empty_df)

        # 所有列表应为空
        for key in ['timestamps', 'heart_rates', 'paces', 'distances', 'altitudes']:
            self.assertEqual(time_series[key], [])

    @unittest.skipIf(not ANALYSIS_AVAILABLE, "分析模块不可用")
    def test_prepare_time_series_partial(self):
        """测试部分数据"""
        partial_df = pd.DataFrame({
            'timestamp': pd.date_range('2024-01-15 08:00:00', periods=10, freq='5min'),
            'heart_rate': [120, 125, 130, 135, 140, 145, 150, 155, 160, 165]
        })

        time_series = prepare_time_series(partial_df)

        # 应该有心率数据但没有配速和距离数据
        self.assertEqual(len(time_series['heart_rates']), len(partial_df))
        self.assertEqual(len(time_series['paces']), len(partial_df))
        # 配速应为None（因为数据不存在）
        self.assertTrue(all(p is None for p in time_series['paces']))

class TestTrainingSuggestions(unittest.TestCase):
    """测试训练建议生成"""

    @unittest.skipIf(not ANALYSIS_AVAILABLE, "分析模块不可用")
    def test_generate_suggestions_no_hr_data(self):
        """测试没有心率数据的情况"""
        metrics = {'has_hr_data': False}
        hr_zones = []

        suggestions = generate_training_suggestions(metrics, hr_zones)

        # 应该有一条关于缺少心率数据的建议
        self.assertGreater(len(suggestions), 0)
        self.assertTrue(any('心率数据' in s for s in suggestions))

    @unittest.skipIf(not ANALYSIS_AVAILABLE, "分析模块不可用")
    def test_generate_suggestions_with_hr_zones(self):
        """测试有心率区间数据的情况"""
        metrics = {'has_hr_data': True}

        # 创建测试心率区间数据
        hr_zones = [
            {"zone": "Z1", "name": "恢复区", "time_minutes": 10, "percentage": 10},
            {"zone": "Z2", "name": "有氧区", "time_minutes": 30, "percentage": 30},
            {"zone": "Z3", "name": "节奏区", "time_minutes": 40, "percentage": 40},
            {"zone": "Z4", "name": "阈值区", "time_minutes": 15, "percentage": 15},
            {"zone": "Z5", "name": "无氧区", "time_minutes": 5, "percentage": 5}
        ]

        suggestions = generate_training_suggestions(metrics, hr_zones)

        # 应该有建议
        self.assertGreater(len(suggestions), 0)
        self.assertLessEqual(len(suggestions), 5)  # 最多5条建议

    @unittest.skipIf(not ANALYSIS_AVAILABLE, "分析模块不可用")
    def test_generate_suggestions_high_training_load(self):
        """测试高训练负荷情况"""
        metrics = {
            'has_hr_data': True,
            'training_load': 150,
            'total_time_minutes': 60
        }
        hr_zones = []

        suggestions = generate_training_suggestions(metrics, hr_zones)

        # 检查是否有关注恢复的建议
        self.assertTrue(any('恢复' in s or '强度' in s for s in suggestions))

    @unittest.skipIf(not ANALYSIS_AVAILABLE, "分析模块不可用")
    def test_generate_suggestions_low_cadence(self):
        """测试低步频情况"""
        metrics = {
            'has_hr_data': True,
            'has_cadence_data': True,
            'avg_cadence': 150
        }
        hr_zones = []

        suggestions = generate_training_suggestions(metrics, hr_zones)

        # 检查是否有关于步频的建议
        self.assertTrue(any('步频' in s for s in suggestions))

    @unittest.skipIf(not ANALYSIS_AVAILABLE, "分析模块不可用")
    def test_generate_suggestions_default(self):
        """测试默认情况（无特定建议）"""
        metrics = {'has_hr_data': True}
        hr_zones = []

        suggestions = generate_training_suggestions(metrics, hr_zones)

        # 应该有默认的积极反馈
        self.assertEqual(len(suggestions), 1)
        self.assertTrue('很好' in suggestions[0] or '保持' in suggestions[0])

class TestActivityAnalysisIntegration(unittest.TestCase):
    """测试活动分析集成功能"""

    def setUp(self):
        """创建测试活动数据"""
        timestamps = pd.date_range('2024-01-15 08:00:00', periods=10, freq='5min')

        self.activity_data = {
            'dataframe': pd.DataFrame({
                'timestamp': timestamps,
                'heart_rate': [120, 125, 130, 135, 140, 145, 150, 155, 160, 165],
                'pace': [6.0, 5.9, 5.8, 5.7, 5.6, 5.5, 5.4, 5.3, 5.2, 5.1],
                'distance': np.linspace(0, 9, 10)
            }),
            'metadata': {
                'file_type': 'CSV',
                'data_points': 10
            }
        }

    @unittest.skipIf(not ANALYSIS_AVAILABLE, "分析模块不可用")
    def test_analyze_activity_complete(self):
        """测试完整活动分析"""
        result = analyze_activity(self.activity_data)

        # 检查返回结构
        self.assertIn('filename', result)
        self.assertIn('metadata', result)
        self.assertIn('metrics', result)
        self.assertIn('hr_zones', result)
        self.assertIn('time_series', result)
        self.assertIn('suggestions', result)

        # 检查各个部分
        self.assertEqual(result['filename'], 'CSV')
        self.assertIsInstance(result['metrics'], dict)
        self.assertIsInstance(result['hr_zones'], list)
        self.assertIsInstance(result['time_series'], dict)
        self.assertIsInstance(result['suggestions'], list)

def run_tests():
    """运行测试"""
    # 创建测试套件
    suite = unittest.TestSuite()

    # 添加测试类
    if ANALYSIS_AVAILABLE:
        suite.addTest(unittest.makeSuite(TestBasicMetrics))
        suite.addTest(unittest.makeSuite(TestHeartRateZones))
        suite.addTest(unittest.makeSuite(TestTRIMPCalculation))
        suite.addTest(unittest.makeSuite(TestTimeSeriesPreparation))
        suite.addTest(unittest.makeSuite(TestTrainingSuggestions))
        suite.addTest(unittest.makeSuite(TestActivityAnalysisIntegration))

    # 运行测试
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)

    return result

if __name__ == '__main__':
    print("=" * 60)
    print("Runalyzer 分析模块单元测试")
    print("=" * 60)

    if not ANALYSIS_AVAILABLE:
        print("❌ 无法导入分析模块，跳过测试")
        print("💡 确保已安装所有依赖并正确设置PYTHONPATH")
        exit(1)

    result = run_tests()

    print("\n" + "=" * 60)
    print("测试总结")
    print("=" * 60)
    print(f"运行测试数: {result.testsRun}")
    print(f"失败: {len(result.failures)}")
    print(f"错误: {len(result.errors)}")
    print(f"跳过: {len(result.skipped)}")

    if result.wasSuccessful():
        print("[PASS] 所有测试通过!")
    else:
        print("[FAIL] 测试失败")
        exit(1)