import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { type Project } from '../services/projectService';
import { projectAPI } from '../services/projectService';
import TaskDetailModal from './modals/TaskDetailModal';
import GanttChart from './charts/GanttChart';
import ProgressTable from './charts/ProgressTable';
import MaterialCharts from './charts/MaterialCharts';
import IfcModel from './charts/IfcModel';
import FileUploadSection from './shared/FileUploadSection';

import { useTaskManagement } from '../hooks/useTaskManagement';
import { useFileUpload } from '../hooks/useFileUpload';
import { useChartData } from '../hooks/useChartData';
import './Output.css';

interface OutputProps {
  currentProject: Project | null;
  viewMode: 'upload' | 'output';
  viewData?: ArrayBuffer | null;
  onProjectCreated: () => void;
}

interface ProjectConfig {
  construction_methods: Array<{ task_name: string; method_index: number }>;
  overtime_tasks: string[];
  shutdown_events: Array<{
    name: string;
    start_time: { day: number; hour: number };
    end_time: { day: number; hour: number };
    a_level_tasks: string[];
    b_level_tasks: string[];
  }>;
  work_start_hour: number;
  work_end_hour: number;
  backgrounds: string[];
  compress: { target_days: number; add_carpenter_first: boolean };
}

const Output: React.FC<OutputProps> = React.memo(
  ({ currentProject, viewMode, viewData, onProjectCreated }) => {
    const [activeTab, setActiveTab] = useState('甘特图模式');
    const [projectConfig, setProjectConfig] = useState<ProjectConfig | null>(
      null
    );
    const [, setConfigLoading] = useState(false);
    const [, setConfigError] = useState<string | null>(null);

    // 使用自定义Hooks
    const taskManagement = useTaskManagement(currentProject);
    const fileUpload = useFileUpload(onProjectCreated);
    const chartData = useChartData(taskManagement.tasks);

    // 缓存计算结果
    const memoizedTabButtons = useMemo(() => {
      return [
        '项目信息',
        '甘特图模式',
        '进度表模式',
        '数据统计',
        'Ifc模型',
      ].map((tab) => (
        <button
          key={tab}
          className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
          onClick={() => setActiveTab(tab)}
        >
          {tab}
        </button>
      ));
    }, [activeTab]);

    // 缓存事件处理函数
    const handleProjectNameChange = useCallback(
      (event: React.ChangeEvent<HTMLInputElement>) => {
        fileUpload.setProjectName(event.target.value);
      },
      [fileUpload]
    );

    // 获取项目配置数据
    const fetchProjectConfig = useCallback(async () => {
      if (!currentProject) return;

      try {
        setConfigLoading(true);
        setConfigError(null);
        const response = await projectAPI.getProjectConfig(currentProject.id);
        
        // 处理接口返回的数据结构：{ config: { ... } }
        const config = response?.config || response;
        
        // 验证配置数据是否符合ProjectConfig接口
        const isValidConfig =
          config &&
          typeof config === 'object' &&
          'work_start_hour' in config &&
          'work_end_hour' in config;

        if (isValidConfig) {
          setProjectConfig(config as unknown as ProjectConfig);
        } else {

          setConfigError('项目配置数据格式不符合预期');
        }
      } catch (error) {

        setConfigError(
          error instanceof Error ? error.message : '获取项目配置失败'
        );
      } finally {
        setConfigLoading(false);
      }
    }, [currentProject]);

    // 初始化数据
    useEffect(() => {
      if (viewMode === 'output') {
        taskManagement.fetchTasks(viewData || undefined);
        fetchProjectConfig();
      }
    }, [viewMode, viewData, taskManagement.fetchTasks, fetchProjectConfig]); // eslint-disable-line react-hooks/exhaustive-deps

    // 监听activeTab变化，确保切换到甘特图模式时数据已加载
    useEffect(() => {
      if (
        activeTab === '甘特图模式' &&
        viewMode === 'output' &&
        !taskManagement.loading &&
        taskManagement.tasks.length === 0
      ) {

        taskManagement.fetchTasks(viewData || undefined);
      }
    }, [
      activeTab,
      viewMode,
      taskManagement.loading,
      taskManagement.tasks.length,
      taskManagement.fetchTasks,
      viewData,
    ]);

    // 渲染内容
    const renderContent = useMemo(() => {
      if (taskManagement.loading) {
        return <div className="loading-container"></div>;
      }

      if (taskManagement.error) {
        return (
          <div className="error-container">
            <p className="error-message">❌ {taskManagement.error}</p>
            <button
              className="retry-button"
              onClick={() => taskManagement.fetchTasks()}
            >
              重新加载
            </button>
          </div>
        );
      }

      switch (activeTab) {
        case '项目信息':
          return (
            <div>
              <div className="project-info">
                {/* 根据项目名第一个字显示不同内容 */}
                {currentProject?.name && (
                  <>
                    {/* 绿城项目显示内容 */}
                    {currentProject.name.startsWith('绿') && (
                      <div className="green-project-content">
                        <h3>石钢旧厂区一期地块项目详细信息</h3>

                        <div className="project-basic-info">
                          <div className="info-section">
                            <h4>🏗️ 基本信息</h4>
                            <div className="info-grid">
                              <div className="info-item">
                                <span className="info-label">项目名称：</span>
                                <span className="info-value">
                                  石钢旧厂区一期地块（居住地块一）
                                </span>
                              </div>
                              <div className="info-item">
                                <span className="info-label">建设地点：</span>
                                <span className="info-value">
                                  河北省石家庄市
                                </span>
                              </div>
                              <div className="info-item">
                                <span className="info-label">层数：</span>
                                <span className="info-value">
                                  多层住宅 6 层，小高层住宅 11 层，高层住宅 18
                                  层、26 层、33 层
                                </span>
                              </div>
                              <div className="info-item">
                                <span className="info-label">室内外高差：</span>
                                <span className="info-value">0.6 米</span>
                              </div>
                              <div className="info-item">
                                <span className="info-label">总占地面积：</span>
                                <span className="info-value">
                                  约 85600 平方米
                                </span>
                              </div>
                              <div className="info-item">
                                <span className="info-label">总建筑面积：</span>
                                <span className="info-value">
                                  约 286000 平方米（地上 228000 平方米，地下
                                  58000 平方米）
                                </span>
                              </div>
                              <div className="info-item">
                                <span className="info-label">住宅套数：</span>
                                <span className="info-value">
                                  共 2150 套住宅（90 平方米以下户型占比
                                  30%，90-120 平方米户型占比 50%，120
                                  平方米以上户型占比 20%）
                                </span>
                              </div>
                              <div className="info-item">
                                <span className="info-label">配套设施：</span>
                                <span className="info-value">
                                  2 栋 3 层商业楼（总建筑面积 4500 平方米）、1
                                  所 6 班幼儿园（建筑面积 2800 平方米）、1
                                  处社区服务中心（建筑面积 1200
                                  平方米）及地下停车场（车位 1980 个）
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="info-section">
                            <h4>🏗️ 结构信息</h4>
                            <div className="info-grid">
                              <div className="info-item">
                                <span className="info-label">结构形式：</span>
                                <span className="info-value">剪力墙</span>
                              </div>
                              <div className="info-item">
                                <span className="info-label">结构体系：</span>
                                <span className="info-value">
                                  剪力墙结构体系
                                </span>
                              </div>
                              <div className="info-item">
                                <span className="info-label">
                                  建筑结构安全等级：
                                </span>
                                <span className="info-value">二级</span>
                              </div>
                              <div className="info-item">
                                <span className="info-label">基础形式：</span>
                                <span className="info-value">
                                  钢筋混凝土桩筏基础，桩基为钻孔灌注桩（直径
                                  600mm，有效桩长 28 米，单桩竖向承载力特征值
                                  3000kN，桩端进入第⑦层粉质黏土层，桩身混凝土强度等级
                                  C35），筏板厚度为 1200mm，混凝土强度等级 C35P6
                                </span>
                              </div>
                              <div className="info-item">
                                <span className="info-label">人防等级：</span>
                                <span className="info-value">
                                  核 6 级、常 6 级
                                </span>
                              </div>
                              <div className="info-item">
                                <span className="info-label">
                                  装配式预制构件：
                                </span>
                                <span className="info-value">
                                  60mm 厚预制叠合楼板（现浇层厚度 70mm，总厚度
                                  130mm）、预制楼梯（厚度
                                  180mm）、预制阳台板（厚度
                                  120mm）、预制空调板（厚度 100mm）
                                </span>
                              </div>
                              <div className="info-item">
                                <span className="info-label">
                                  抗震设防烈度：
                                </span>
                                <span className="info-value">
                                  7 度（设计基本地震加速度值为
                                  0.15g，设计地震分组为第二组）
                                </span>
                              </div>
                              <div className="info-item">
                                <span className="info-label">抗震等级：</span>
                                <span className="info-value">
                                  18 层及以下建筑为三级，26 层建筑为二级，33
                                  层建筑为一级
                                </span>
                              </div>
                              <div className="info-item">
                                <span className="info-label">
                                  基坑开挖深度：
                                </span>
                                <span className="info-value">
                                  地下两层区域 9.8 米，地下一层区域 5.6 米
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="info-section">
                            <h4>🌍 自然和地质条件</h4>
                            <div className="info-grid">
                              <div className="info-item">
                                <span className="info-label">自然条件：</span>
                                <span className="info-value">
                                  石家庄市属温带季风气候，年均气温
                                  14.2℃，极端最高气温 42.9℃，极端最低气温
                                  -19.8℃；年均降水量 569.8mm，降水集中在 7-8
                                  月，占全年降水量的 60% 以上；年均风速
                                  1.8m/s，主导风向为东北风；最大冻土深度
                                  0.5m，基本雪压 0.35kN/㎡，基本风压 0.45kN/㎡
                                </span>
                              </div>
                              <div className="info-item">
                                <span className="info-label">地质条件：</span>
                                <span className="info-value">
                                  场地地层自上而下依次为①素填土（厚度
                                  1.5-3.0m，松散）、②粉质黏土（厚度
                                  2.0-4.0m，可塑）、③粉土（厚度
                                  1.5-3.0m，稍密）、④粉质黏土（厚度
                                  3.0-5.0m，硬塑）、⑤粉砂（厚度
                                  2.0-3.5m，中密）、⑥粉质黏土（厚度
                                  4.0-6.0m，硬塑）、⑦粉质黏土（厚度大于
                                  5.0m，坚硬）。地下水位埋深
                                  8.5-10.0m，地下水类型为潜水，主要受大气降水补给，年变幅
                                  1.5-2.0m，地下水对混凝土结构具微腐蚀性，对钢筋混凝土结构中钢筋具微腐蚀性
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="info-section">
                            <h4>📍 地理位置和交通</h4>
                            <div className="info-grid">
                              <div className="info-item">
                                <span className="info-label">项目位置：</span>
                                <span className="info-value">
                                  位于石家庄市长安区，地处石钢旧厂区核心区域，北临体育北大街，南接和平东路，西靠谈固北大街，东依建华大街。距离地铁
                                  2 号线某站点约 800 米，公交线路涵盖 1 路、5
                                  路、21 路等 10 余条
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="info-section">
                            <h4>🏠 建筑详细参数</h4>
                            <div className="info-grid">
                              <div className="info-item">
                                <span className="info-label">建筑类型：</span>
                                <span className="info-value">
                                  居住建筑群，包含多层住宅（6
                                  层）、小高层住宅（11 层）、高层住宅（18 层、26
                                  层、33 层）
                                </span>
                              </div>
                              <div className="info-item">
                                <span className="info-label">建筑高度：</span>
                                <span className="info-value">
                                  多层住宅 18.5 米，小高层住宅 33.8 米，18
                                  层高层住宅 54.6 米，26 层高层住宅 78.3 米，33
                                  层高层住宅 99.6 米
                                </span>
                              </div>
                              <div className="info-item">
                                <span className="info-label">建筑层高：</span>
                                <span className="info-value">
                                  住宅标准层层高 2.9 米，地下室负一层层高 3.6
                                  米（含设备管线空间），负二层层高 3.3
                                  米（地下车库），商业配套设施一层层高 4.5
                                  米，二、三层层高 3.9 米，幼儿园活动室层高 3.6
                                  米
                                </span>
                              </div>
                              <div className="info-item">
                                <span className="info-label">正负零高程：</span>
                                <span className="info-value">
                                  83.50 米（相对于 1985 国家高程基准）
                                </span>
                              </div>
                              <div className="info-item">
                                <span className="info-label">
                                  绿色建筑等级：
                                </span>
                                <span className="info-value">二星级</span>
                              </div>
                              <div className="info-item">
                                <span className="info-label">人防类别：</span>
                                <span className="info-value">
                                  甲类防空地下室
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="info-section">
                            <h4>🧱 墙体工程</h4>
                            <div className="info-grid">
                              <div className="info-item">
                                <span className="info-label">墙体分类：</span>
                                <span className="info-value">
                                  包括外围护墙和内隔墙，均采用轻质墙体材料，满足隔声、防火要求
                                </span>
                              </div>
                              <div className="info-item">
                                <span className="info-label">
                                  外围护墙材质：
                                </span>
                                <span className="info-value">
                                  200mm 厚加气混凝土砌块（强度等级
                                  A5.0，干密度≤700kg/m³，砌筑砂浆为 M5.0
                                  专用砂浆，导热系数≤0.18W/(m・K)）
                                </span>
                              </div>
                              <div className="info-item">
                                <span className="info-label">内隔墙材质：</span>
                                <span className="info-value">
                                  户内分隔墙采用 100mm
                                  厚轻钢龙骨双面石膏板隔墙（石膏板厚度
                                  12mm，中间填充 50mm 厚离心玻璃棉毡，密度
                                  48kg/m³，隔声量≥40dB）；公共区域隔墙采用 150mm
                                  厚加气混凝土砌块
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="info-section">
                            <h4>🔥 保温工程</h4>
                            <div className="info-grid">
                              <div className="info-item">
                                <span className="info-label">保温范围：</span>
                                <span className="info-value">
                                  外墙保温采用外保温系统，屋面保温采用挤塑板保温层，地面接触室外空气的架空层或外挑部分采用保温处理
                                </span>
                              </div>
                              <div className="info-item">
                                <span className="info-label">外保温形式：</span>
                                <span className="info-value">
                                  粘贴 + 锚栓固定的外墙外保温形式
                                </span>
                              </div>
                              <div className="info-item">
                                <span className="info-label">
                                  外保温材质及厚度：
                                </span>
                                <span className="info-value">
                                  模塑聚苯乙烯泡沫板（EPS），厚度 60mm（表观密度
                                  18-22kg/m³，导热系数≤0.041W/(m・K)）
                                </span>
                              </div>
                              <div className="info-item">
                                <span className="info-label">
                                  外保温防火等级：
                                </span>
                                <span className="info-value">
                                  B1 级，每层楼板处设置 300mm 高防火隔离带（采用
                                  A 级岩棉板）
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="info-section">
                            <h4>🚪 门窗工程</h4>
                            <div className="info-grid">
                              <div className="info-item">
                                <span className="info-label">门窗形式：</span>
                                <span className="info-value">
                                  住宅外窗采用内平开下悬窗；阳台门采用推拉门；单元入口门为平开式
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 海河项目显示内容 */}
                    {currentProject.name.startsWith('海') && (
                      <div className="sea-project-content">
                        <h3>海河玺项目详细信息</h3>

                        <div className="project-basic-info">
                          <div className="info-section">
                            <h4>🏗️ 基本信息</h4>
                            <div className="info-grid">
                              <div className="info-item">
                                <span className="info-label">项目名称：</span>
                                <span className="info-value">海河玺 #9 楼</span>
                              </div>
                              <div className="info-item">
                                <span className="info-label">建设地点：</span>
                                <span className="info-value">天津市</span>
                              </div>
                              <div className="info-item">
                                <span className="info-label">层数：</span>
                                <span className="info-value">
                                  地上 25 层，地下 2 层（局部 1 层）
                                </span>
                              </div>
                              <div className="info-item">
                                <span className="info-label">室内外高差：</span>
                                <span className="info-value">0.6 米</span>
                              </div>
                              <div className="info-item">
                                <span className="info-label">建筑高度：</span>
                                <span className="info-value">
                                  75.3 米（檐口高度 72.1 米，屋脊高度 75.3 米）
                                </span>
                              </div>
                              <div className="info-item">
                                <span className="info-label">总建筑面积：</span>
                                <span className="info-value">
                                  约 15600 平方米（地上 13200 平方米，地下 2400
                                  平方米）
                                </span>
                              </div>
                              <div className="info-item">
                                <span className="info-label">
                                  建筑占地面积：
                                </span>
                                <span className="info-value">
                                  约 580 平方米
                                </span>
                              </div>
                              <div className="info-item">
                                <span className="info-label">住宅套数：</span>
                                <span className="info-value">
                                  共 120 套住宅（三居室 60%，110-130
                                  平方米；两居室 40%，85-95 平方米）
                                </span>
                              </div>
                              <div className="info-item">
                                <span className="info-label">地下车库：</span>
                                <span className="info-value">
                                  地下局部两层车库（96 个车位）
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="info-section">
                            <h4>🏗️ 结构信息</h4>
                            <div className="info-grid">
                              <div className="info-item">
                                <span className="info-label">结构形式：</span>
                                <span className="info-value">钢筋混凝土</span>
                              </div>
                              <div className="info-item">
                                <span className="info-label">结构体系：</span>
                                <span className="info-value">
                                  框架-剪力墙结构体系
                                </span>
                              </div>
                              <div className="info-item">
                                <span className="info-label">
                                  建筑结构安全等级：
                                </span>
                                <span className="info-value">
                                  二级（设计使用年限 50 年）
                                </span>
                              </div>
                              <div className="info-item">
                                <span className="info-label">基础形式：</span>
                                <span className="info-value">
                                  桩基础与筏板基础组合形式，桩基为预应力混凝土管桩（直径
                                  500mm，有效桩长 32 米，单桩竖向承载力特征值
                                  2800kN，桩端进入第⑧层粉质黏土层），筏板厚度
                                  1000mm（混凝土强度等级 C35P6，下设 100mm 厚
                                  C15 素混凝土垫层）
                                </span>
                              </div>
                              <div className="info-item">
                                <span className="info-label">人防等级：</span>
                                <span className="info-value">
                                  核 6 级、常 6 级
                                </span>
                              </div>
                              <div className="info-item">
                                <span className="info-label">
                                  装配式预制构件：
                                </span>
                                <span className="info-value">
                                  60mm 厚预制叠合楼板（现浇层 70mm，总厚度
                                  130mm）、预制楼梯（厚度
                                  180mm）、预制阳台板（厚度
                                  120mm）、预制空调板（厚度
                                  100mm）（预制率≥25%）
                                </span>
                              </div>
                              <div className="info-item">
                                <span className="info-label">
                                  抗震设防烈度：
                                </span>
                                <span className="info-value">
                                  7 度（设计基本地震加速度值
                                  0.15g，设计地震分组第二组）
                                </span>
                              </div>
                              <div className="info-item">
                                <span className="info-label">抗震等级：</span>
                                <span className="info-value">
                                  框架部分三级，剪力墙部分二级
                                </span>
                              </div>
                              <div className="info-item">
                                <span className="info-label">
                                  基坑开挖深度：
                                </span>
                                <span className="info-value">
                                  地下二层区域 8.6 米，地下一层区域 5.2 米
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="info-section">
                            <h4>🌍 自然和地质条件</h4>
                            <div className="info-grid">
                              <div className="info-item">
                                <span className="info-label">自然条件：</span>
                                <span className="info-value">
                                  天津市属温带季风气候，年均气温
                                  12.3℃，极端最高气温 40.5℃，极端最低气温
                                  -17.8℃；年均降水量 550mm，集中在 6-8 月（占
                                  70%）；年均风速
                                  2.4m/s，主导西南风；最大冻土深度
                                  0.6m，基本雪压 0.4kN/㎡，基本风压 0.55kN/㎡
                                </span>
                              </div>
                              <div className="info-item">
                                <span className="info-label">地质条件：</span>
                                <span className="info-value">
                                  场地地层自上而下为①杂填土（1.0-2.5m，松散）、②粉质黏土（2.5-4.0m，可塑）、③淤泥质粉质黏土（1.5-3.0m，流塑）、④粉质黏土（3.0-5.0m，硬塑）、⑤粉土（2.0-3.5m，中密）、⑥粉质黏土（4.0-6.0m，硬塑）、⑦粉砂（2.5-4.0m，密实）、⑧粉质黏土（&gt;5.0m，坚硬）。地下水位埋深
                                  1.5-2.5m（潜水，年变幅
                                  1.0-1.5m），对混凝土结构具弱腐蚀性，对钢筋具微腐蚀性
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="info-section">
                            <h4>📍 地理位置和交通</h4>
                            <div className="info-grid">
                              <div className="info-item">
                                <span className="info-label">项目位置：</span>
                                <span className="info-value">
                                  位于天津市河东区，北临海河东路，南接津塘路，西靠大直沽中路，东依六纬路。距地铁
                                  9 号线直沽站约 600 米，有 643 路、856 路等 8
                                  条公交线路，紧邻海河景观带，周边有重点中学、社区医院、大型超市
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="info-section">
                            <h4>🏠 建筑详细参数</h4>
                            <div className="info-grid">
                              <div className="info-item">
                                <span className="info-label">建筑类型：</span>
                                <span className="info-value">
                                  高层住宅楼（一字型布局，南北朝向，一类高层住宅）
                                </span>
                              </div>
                              <div className="info-item">
                                <span className="info-label">建筑层高：</span>
                                <span className="info-value">
                                  住宅标准层 2.9 米，地下一层 3.5
                                  米（车库），地下二层 3.2 米（设备夹层），首层
                                  3.6 米（入户大堂）
                                </span>
                              </div>
                              <div className="info-item">
                                <span className="info-label">正负零高程：</span>
                                <span className="info-value">
                                  3.85 米（相对于大沽高程）
                                </span>
                              </div>
                              <div className="info-item">
                                <span className="info-label">
                                  绿色建筑等级：
                                </span>
                                <span className="info-value">
                                  二星级（节能率
                                  75%，水资源循环利用率≥85%，可再生能源利用率≥15%）
                                </span>
                              </div>
                              <div className="info-item">
                                <span className="info-label">人防类别：</span>
                                <span className="info-value">
                                  甲类防空地下室（战时为二等人员掩蔽所，平时为地下车库）
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="info-section">
                            <h4>🧱 墙体工程</h4>
                            <div className="info-grid">
                              <div className="info-item">
                                <span className="info-label">墙体分类：</span>
                                <span className="info-value">
                                  分外围护墙和内隔墙，均采用轻质节能材料，兼顾结构安全与节能
                                </span>
                              </div>
                              <div className="info-item">
                                <span className="info-label">
                                  外围护墙材质：
                                </span>
                                <span className="info-value">
                                  200mm 厚蒸压加气混凝土砌块（强度等级
                                  A5.0，干密度≤600kg/m³，M5.0
                                  混合砂浆砌筑，导热系数≤0.16W/(m・K)）
                                </span>
                              </div>
                              <div className="info-item">
                                <span className="info-label">内隔墙材质：</span>
                                <span className="info-value">
                                  户内为 90mm 厚轻钢龙骨石膏板隔墙（12mm
                                  厚石膏板，中间填充 50mm 厚玻璃棉毡，密度
                                  48kg/m³，隔声量≥35dB）；公共区域及楼梯间为
                                  150mm 厚加气混凝土砌块
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="info-section">
                            <h4>🔥 保温工程</h4>
                            <div className="info-grid">
                              <div className="info-item">
                                <span className="info-label">保温范围：</span>
                                <span className="info-value">
                                  涵盖外墙、屋面及地面（外墙外保温，屋面挤塑板保温，与土壤接触地面保温处理）
                                </span>
                              </div>
                              <div className="info-item">
                                <span className="info-label">外保温形式：</span>
                                <span className="info-value">
                                  粘贴 + 机械固定的外墙外保温形式
                                </span>
                              </div>
                              <div className="info-item">
                                <span className="info-label">
                                  外保温材质及厚度：
                                </span>
                                <span className="info-value">
                                  挤塑聚苯乙烯泡沫板（XPS），厚度
                                  70mm（表观密度≥30kg/m³，导热系数≤0.030W/(m・K)）
                                </span>
                              </div>
                              <div className="info-item">
                                <span className="info-label">
                                  外保温防火等级：
                                </span>
                                <span className="info-value">
                                  B1 级，檐口、窗间墙等部位设 300mm 宽 A
                                  级岩棉板防火隔离带
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="info-section">
                            <h4>🚪 门窗工程</h4>
                            <div className="info-grid">
                              <div className="info-item">
                                <span className="info-label">门窗形式：</span>
                                <span className="info-value">
                                  住宅外窗为内平开下悬窗；阳台门为推拉门；单元入口门为平开式钢制保温门（带门禁）
                                </span>
                              </div>
                              <div className="info-item">
                                <span className="info-label">门窗材质：</span>
                                <span className="info-value">
                                  断桥铝合金主型材（壁厚≥1.4mm，氟碳喷涂），玻璃为
                                  5mm+12A+5mm Low-E 中空玻璃
                                </span>
                              </div>
                              <div className="info-item">
                                <span className="info-label">
                                  门窗保温性能：
                                </span>
                                <span className="info-value">
                                  外窗传热系数（K 值）≤2.6W/(㎡・K)，气密性 6
                                  级，水密性 3 级，抗风压 4 级
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="info-section">
                            <h4>🎨 外立面装修</h4>
                            <div className="info-grid">
                              <div className="info-item">
                                <span className="info-label">装修风格：</span>
                                <span className="info-value">
                                  现代简约风格（浅灰色为主色调，搭配深灰色线条及米白色装饰构件）
                                </span>
                              </div>
                              <div className="info-item">
                                <span className="info-label">材质及厚度：</span>
                                <span className="info-value">
                                  1-2 层为 30mm 厚干挂浅灰色花岗岩石材；3
                                  层及以上为 5mm
                                  厚仿石涂料（真石漆）；阳台栏板为 12mm
                                  厚钢化玻璃（配深灰色铝合金型材）；空调外机位用金属百叶遮挡
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="info-section">
                            <h4>🏠 内装修工程</h4>
                            <div className="info-grid">
                              <div className="info-item">
                                <span className="info-label">界面范围：</span>
                                <span className="info-value">
                                  住宅套内（墙面、地面、顶棚、门窗套、卫生洁具
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 其他项目显示默认内容 */}
                    {!currentProject.name.startsWith('绿') &&
                      !currentProject.name.startsWith('海') && (
                        <div className="default-project-content">
                          <h3>项目概览</h3>
                          <div className="project-description">
                            <p>
                              这是一个标准的工程项目，包含完整的施工计划和进度管理。
                            </p>
                          </div>
                        </div>
                      )}
                  </>
                )}
              </div>
            </div>
          );
        case '甘特图模式':


          if (taskManagement.tasks.length === 0) {
            return (
              <div className="empty-state">
                <h3>📊 甘特图</h3>
                <p>暂无任务数据</p>
                <div className="debug-info">
                  <p>调试信息：</p>
                  <ul>
                    <li>任务数量: {taskManagement.tasks.length}</li>
                    <li>
                      加载状态: {taskManagement.loading ? '加载中' : '已完成'}
                    </li>
                    <li>错误信息: {taskManagement.error || '无'}</li>
                    <li>当前项目: {currentProject?.name || '未选择'}</li>
                    <li>Excel数据: {viewData ? '已加载' : '未加载'}</li>
                  </ul>
                </div>
              </div>
            );
          }

          return (
            <>
              <GanttChart
                tasks={taskManagement.tasks}
                onTaskClick={taskManagement.handleTaskClick}
                shutdownEvents={projectConfig?.shutdown_events}
              />
            </>
          );
        case '进度表模式':


          if (taskManagement.tasks.length === 0) {
            return (
              <div className="empty-state">
                <h3>📋 进度表</h3>
                <p>暂无任务数据</p>
                <div className="debug-info">
                  <p>调试信息：</p>
                  <ul>
                    <li>任务数量: {taskManagement.tasks.length}</li>
                    <li>
                      加载状态: {taskManagement.loading ? '加载中' : '已完成'}
                    </li>
                    <li>错误信息: {taskManagement.error || '无'}</li>
                    <li>当前项目: {currentProject?.name || '未选择'}</li>
                    <li>Excel数据: {viewData ? '已加载' : '未加载'}</li>
                  </ul>
                </div>
              </div>
            );
          }

          return (
            <ProgressTable
              tasks={taskManagement.tasks}
              onTaskClick={taskManagement.handleTaskClick}
            />
          );
        case '数据统计':
          return (
            <MaterialCharts
              tasks={taskManagement.tasks}
              projectId={currentProject?.id?.toString()}
            />
          );
        case 'Ifc模型':
          return <IfcModel project={currentProject} />;
        default:
          return null;
      }
    }, [
      activeTab,
      taskManagement.tasks,
      taskManagement.loading,
      taskManagement.error,
      taskManagement.handleTaskClick,
      taskManagement.fetchTasks,
      chartData.totalDays,
      currentProject?.name,
      projectConfig,
    ]);

    // 上传模式的渲染
    if (viewMode === 'upload') {
      return (
        <div className="output-panel">
          <FileUploadSection
            documentFile={fileUpload.documentFile}
            cadFile={fileUpload.cadFile}
            projectName={fileUpload.projectName}
            isCreatingProject={fileUpload.isCreatingProject}
            isPrecreating={fileUpload.isPrecreating}
            isUploading={fileUpload.isUploading}
            uploadProgress={fileUpload.uploadProgress}
            validationErrors={fileUpload.validationErrors}
            projectId={fileUpload.projectId}
            // 轮询相关状态
            isPolling={fileUpload.isPolling}
            pollingStatus={fileUpload.pollingStatus}
            pollingProgress={fileUpload.pollingProgress}
            pollingMessage={fileUpload.pollingMessage}
            onDocumentUpload={fileUpload.handleDocumentUpload}
            onCadUpload={fileUpload.handleCadUpload}
            onDocumentDrop={fileUpload.handleDocumentDrop}
            onCadDrop={fileUpload.handleCadDrop}
            onDragOver={fileUpload.handleDragOver}
            onProjectNameChange={handleProjectNameChange}
            onPrecreateProject={fileUpload.handlePrecreateProject}
            onCreateProject={fileUpload.handleCreateProject}
          />
        </div>
      );
    }

    return (
      <div className="output-panel output-mode">
        <div className="output-header">
          <div className="project-info">
            <div className="project-title">
              {currentProject?.name || '未选择项目'}
            </div>
            <div className="project-date">总计{chartData.totalDays}天</div>
          </div>
          <div className="header-controls">{/* 导出报告按钮已移除 */}</div>
        </div>

        <div className="date-controls">
          <div className="view-tabs">{memoizedTabButtons}</div>
        </div>

        {renderContent}

        {/* 任务详情弹窗 */}
        <TaskDetailModal
          isOpen={!!taskManagement.selectedTask}
          onClose={taskManagement.closePopup}
          task={taskManagement.selectedTask}
          processInfo={taskManagement.processInfo}
          processInfoLoading={taskManagement.processInfoLoading}
          processInfoError={taskManagement.processInfoError}
          project={currentProject}
        />
      </div>
    );
  }
);

Output.displayName = 'Output';

export default Output;
