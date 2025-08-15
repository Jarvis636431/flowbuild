import { useState, useCallback, useRef } from 'react';
import { projectAPI } from '../services/api';
import { AuthService } from '../services/authService';
import { ManagementServiceUrls } from '../services/apiConfig';
import { operatorAPI } from '../services/operatorService';
import { readProjectFromFile } from '../services/excelReader';
import { ProjectService } from '../services/projectService';

export interface UseFileUploadReturn {
  documentFile: File | null;
  cadFile: File | null;
  projectName: string;
  isCreatingProject: boolean;
  isPrecreating: boolean;
  isUploading: boolean;
  uploadProgress: number;
  validationErrors: string[];
  projectId: string | null;
  // 轮询相关状态
  isPolling: boolean;
  pollingStatus: string;
  pollingProgress: number;
  pollingMessage: string;
  jobId: string | null;
  handleDocumentUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleCadUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleDocumentDrop: (event: React.DragEvent<HTMLDivElement>) => void;
  handleCadDrop: (event: React.DragEvent<HTMLDivElement>) => void;
  handleDragOver: (event: React.DragEvent<HTMLDivElement>) => void;
  setProjectName: (name: string) => void;
  handlePrecreateProject: () => Promise<void>;
  handleCreateProject: () => Promise<void>;
  resetUploadState: () => void;
}

export const useFileUpload = (
  onProjectCreated?: () => void
): UseFileUploadReturn => {
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [cadFile, setCadFile] = useState<File | null>(null);
  const [projectName, setProjectName] = useState('');
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [isPrecreating, setIsPrecreating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);

  // 轮询相关状态
  const [isPolling, setIsPolling] = useState(false);
  const [pollingStatus, setPollingStatus] = useState('');
  const [pollingProgress, setPollingProgress] = useState(0);
  const [pollingMessage, setPollingMessage] = useState('');
  const pollingIntervalRef = useRef<number | null>(null);
  const pollingTimeoutRef = useRef<number | null>(null);

  // 处理文档文件上传
  const handleDocumentUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (files && files.length > 0) {
        const file = files[0];
        // 验证文件
        const validation = projectAPI.validateFile(file, 'document');
        if (validation.isValid) {
          setDocumentFile(file);
          setValidationErrors([]);
          console.log('上传的文档文件:', file);
        } else {
          const errors = validation.error
            ? [validation.error]
            : ['文件验证失败'];
          setValidationErrors(errors);
          console.error('文档文件验证失败:', errors);
        }
      }
    },
    []
  );

  // 处理CAD文件上传
  const handleCadUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (files && files.length > 0) {
        const file = files[0];
        // 验证文件
        const validation = projectAPI.validateFile(file, 'cad');
        if (validation.isValid) {
          setCadFile(file);
          setValidationErrors([]);
          console.log('上传的CAD文件:', file);
        } else {
          const errors = validation.error
            ? [validation.error]
            : ['文件验证失败'];
          setValidationErrors(errors);
          console.error('CAD文件验证失败:', errors);
        }
      }
    },
    []
  );

  // 处理文档文件拖拽
  const handleDocumentDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      const files = event.dataTransfer.files;
      if (files && files.length > 0) {
        const file = files[0];
        // 验证文件
        const validation = projectAPI.validateFile(file, 'document');
        if (validation.isValid) {
          setDocumentFile(file);
          setValidationErrors([]);
          console.log('拖拽的文档文件:', file);
        } else {
          const errors = validation.error
            ? [validation.error]
            : ['文件验证失败'];
          setValidationErrors(errors);
          console.error('文档文件验证失败:', errors);
        }
      }
    },
    []
  );

  // 处理CAD文件拖拽
  const handleCadDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      const files = event.dataTransfer.files;
      if (files && files.length > 0) {
        const file = files[0];
        // 验证文件
        const validation = projectAPI.validateFile(file, 'cad');
        if (validation.isValid) {
          setCadFile(file);
          setValidationErrors([]);
          console.log('拖拽的CAD文件:', file);
        } else {
          const errors = validation.error
            ? [validation.error]
            : ['文件验证失败'];
          setValidationErrors(errors);
          console.error('CAD文件验证失败:', errors);
        }
      }
    },
    []
  );

  // 处理拖拽悬停
  const handleDragOver = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
    },
    []
  );

  // 停止轮询
  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    if (pollingTimeoutRef.current) {
      clearTimeout(pollingTimeoutRef.current);
      pollingTimeoutRef.current = null;
    }
    setIsPolling(false);
  }, []);

  // 启动轮询
  const startPolling = useCallback(
    async (jobId: string) => {
      console.log('启动项目状态轮询:', jobId);
      setIsPolling(true);
      setPollingStatus('processing');
      setPollingMessage('项目处理中，请稍候...');
      setPollingProgress(0);

      // 启动轮询的同时，异步执行操作员操作
      if (projectId && projectName) {
        console.log('🤖 启动操作员自动操作...', { projectId, projectName });
        operatorAPI.executeOperatorActionsAsync({
          projectId,
          projectName,
        });
      } else {
        console.warn('⚠️ 缺少项目ID或项目名称，跳过操作员操作');
      }

      // 设置5分钟超时
      pollingTimeoutRef.current = setTimeout(
        () => {
          console.log('轮询超时，停止轮询');
          stopPolling();
          alert('项目处理超时，请稍后手动刷新查看状态');
        },
        5 * 60 * 1000
      ); // 5分钟

      // 开始轮询
      const pollProject = async () => {
        try {
          const result = await projectAPI.pollProjectStatus(jobId);
          console.log('轮询结果:', result);

          setPollingStatus(result.status);
          setPollingMessage(result.message || '项目处理中...');
          if (result.progress !== undefined) {
            setPollingProgress(result.progress);
          }

          if (result.status === 'success') {
            console.log('项目处理完成，停止轮询');
            stopPolling();

            // 下载并解析Excel文件
            try {
              if (projectId) {
                console.log('开始下载项目Excel文件:', projectId);
                const excelFile =
                  await projectAPI.downloadProjectExcel(projectId);
                console.log('Excel文件下载成功:', excelFile.name);

                // 解析Excel文件
                console.log('开始解析Excel文件...');
                const projectData = await readProjectFromFile(excelFile);

                if (
                  projectData &&
                  projectData.tasks &&
                  projectData.tasks.length > 0
                ) {
                  console.log(
                    'Excel解析成功，任务数量:',
                    projectData.tasks.length
                  );
                  console.log('解析后的项目数据:', projectData);

                  // 使用正确的项目ID更新项目数据
                  if (projectId) {
                    projectData.id = projectId;
                    projectData.name = projectName || projectData.name;
                  }

                  // 将解析后的数据设置为模拟数据，供其他组件使用
                  ProjectService.setMockProjects([projectData]);
                  console.log('项目数据已更新到系统中，项目ID:', projectData.id);
                  
                  // 存储Excel数据以便后续使用
                  window.latestProjectData = projectData;
                } else {
                  console.warn('Excel文件解析失败或无有效数据');
                }
              }
            } catch (error) {
              console.error('下载或解析Excel文件失败:', error);
              // 即使Excel处理失败，也继续执行后续逻辑
            }

            // 重置状态
            setDocumentFile(null);
            setCadFile(null);
            setProjectName('');
            setIsCreatingProject(false);
            setIsPrecreating(false);
            setIsUploading(false);
            setUploadProgress(0);
            setValidationErrors([]);
            setProjectId(null);
            setJobId(null);
            setPollingStatus('');
            setPollingProgress(0);
            setPollingMessage('');

            // 调用回调函数
            if (onProjectCreated) {
              onProjectCreated();
            }
          }
        } catch (error) {
          console.error('轮询失败:', error);
          // 轮询失败不停止，继续尝试
        }
      };

      // 立即执行一次
      await pollProject();

      // 每3秒轮询一次
      pollingIntervalRef.current = setInterval(pollProject, 3000);
    },
    [stopPolling, onProjectCreated, projectId, projectName]
  );

  // 重置上传状态
  const resetUploadState = useCallback(() => {
    // 停止轮询
    stopPolling();

    setDocumentFile(null);
    setCadFile(null);
    setProjectName('');
    setIsCreatingProject(false);
    setIsPrecreating(false);
    setIsUploading(false);
    setUploadProgress(0);
    setValidationErrors([]);
    setProjectId(null);
    setJobId(null);
    // 重置轮询状态
    setPollingStatus('');
    setPollingProgress(0);
    setPollingMessage('');
  }, [stopPolling]);

  // 最终确认创建项目
  const handleCreateProject = useCallback(async () => {
    if (!projectId) {
      alert('请先预创建项目');
      return;
    }

    // 检查文档文件和CAD文件是否都已上传
    if (!documentFile || !cadFile) {
      alert('请确保已上传文档文件和CAD文件，两个文件都必须上传才能创建项目');
      return;
    }

    try {
      setIsCreatingProject(true);
      console.log('确认创建项目:', {
        project_id: projectId,
        project_name: projectName,
      });

      // 获取当前用户信息
      const currentUser = AuthService.getCurrentUserSync();
      if (!currentUser || !currentUser.user_id) {
        alert('用户未登录，请先登录');
        return;
      }

      // 上传文件
      const uploadResults: unknown[] = [];
      if (documentFile && cadFile) {
        setIsUploading(true);
        setUploadProgress(0);
        console.log('开始上传文件...');

        const totalFiles = (documentFile ? 1 : 0) + (cadFile ? 1 : 0);
        let completedFiles = 0;

        // 上传文档文件
        if (documentFile) {
          try {
            console.log('上传文档文件:', documentFile.name);
            setUploadProgress(Math.round((completedFiles / totalFiles) * 50)); // 开始上传时显示进度

            const docResult = await projectAPI.uploadFile({
              file: documentFile,
              project_id: projectId,
              uploaded_by: currentUser.user_id,
              category: 'workdescription',
              file_type: 'document',
            });

            uploadResults.push(docResult);
            completedFiles++;
            setUploadProgress(Math.round((completedFiles / totalFiles) * 80)); // 文件上传完成后更新进度
            console.log('文档文件上传成功:', docResult);
          } catch (error) {
            console.error('文档文件上传失败:', error);
            setIsUploading(false);
            setUploadProgress(0);
            throw new Error(
              `文档文件上传失败: ${error instanceof Error ? error.message : '未知错误'}`
            );
          }
        }

        // 上传CAD文件
        if (cadFile) {
          try {
            console.log('上传CAD文件:', cadFile.name);
            setUploadProgress(Math.round((completedFiles / totalFiles) * 50)); // 开始上传时显示进度

            const cadResult = await projectAPI.uploadFile({
              file: cadFile,
              project_id: projectId,
              uploaded_by: currentUser.user_id,
              category: 'workvolume',
              file_type: 'cad',
            });

            uploadResults.push(cadResult);
            completedFiles++;
            setUploadProgress(Math.round((completedFiles / totalFiles) * 80)); // 文件上传完成后更新进度
            console.log('CAD文件上传成功:', cadResult);
          } catch (error) {
            console.error('CAD文件上传失败:', error);
            setIsUploading(false);
            setUploadProgress(0);
            throw new Error(
              `CAD文件上传失败: ${error instanceof Error ? error.message : '未知错误'}`
            );
          }
        }

        setUploadProgress(90); // 所有文件上传完成
        console.log('所有文件上传完成:', uploadResults);
      }

      // 调用最终创建API
      const finalProject = await projectAPI.createProject({
        project_id: projectId,
        user_id: currentUser.user_id,
      });

      setUploadProgress(100); // 项目创建完成
      console.log('项目创建成功:', finalProject);

      // 从返回值中提取job_id
      if (finalProject && finalProject.job_id) {
        setJobId(finalProject.job_id);
        console.log('获取到job_id:', finalProject.job_id);

        // 使用job_id启动轮询
        startPolling(finalProject.job_id);
      } else {
        console.error('项目创建成功但未返回job_id');
        alert('项目创建成功但无法获取作业ID，请手动刷新查看状态');
      }
    } catch (error) {
      console.error('创建项目失败:', error);
      alert(
        '创建项目失败，请重试：' +
          (error instanceof Error ? error.message : '未知错误')
      );
    } finally {
      setIsCreatingProject(false);
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [projectId, projectName, documentFile, cadFile, startPolling]);

  // 预创建项目（获取project_id）
  const handlePrecreateProject = useCallback(async () => {
    try {
      setIsPrecreating(true);

      // 获取当前用户信息
      const currentUser = AuthService.getCurrentUserSync();
      if (!currentUser || !currentUser.user_id) {
        alert('用户未登录，请先登录');
        return;
      }

      // 验证项目名称
      if (!projectName || !projectName.trim()) {
        alert('请输入项目名称');
        return;
      }

      const trimmedProjectName = projectName.trim();

      // 项目名称长度限制
      if (trimmedProjectName.length < 2) {
        alert('项目名称至少需要2个字符');
        return;
      }

      if (trimmedProjectName.length > 50) {
        alert('项目名称不能超过50个字符');
        return;
      }

      // 项目名称字符限制（允许中文、英文、数字、下划线、连字符、空格）
      const namePattern = /^[\u4e00-\u9fa5a-zA-Z0-9_\-\s]+$/;
      if (!namePattern.test(trimmedProjectName)) {
        alert('项目名称只能包含中文、英文、数字、下划线、连字符和空格');
        return;
      }

      console.log('预创建项目:', {
        user_id: currentUser.user_id,
        project_name: trimmedProjectName,
      });

      console.log('=== 预创建项目调试信息 ===');
      console.log('API URL:', ManagementServiceUrls.precreate());
      console.log('请求参数:', {
        user_id: currentUser.user_id,
        name: trimmedProjectName,
      });
      console.log('当前用户:', currentUser);
      console.log('HTTP方法: POST');
      console.log('========================');

      // 调用预创建API获取project_id
      const response = await projectAPI.precreateProject({
        user_id: currentUser.user_id,
        name: trimmedProjectName,
      });

      setProjectId(response.project_id);
      console.log('项目预创建成功，获得project_id:', response.project_id);
      alert('项目预创建成功！现在可以上传文件了。');
    } catch (error) {
      console.error('预创建项目失败:', error);

      // 打印详细的错误信息用于调试
      if (error && typeof error === 'object' && 'data' in error) {
        console.error('服务器返回的错误详情:', error.data);
        console.error('完整错误对象:', JSON.stringify(error, null, 2));
      }

      let errorMessage = '预创建项目失败，请重试';
      if (error && typeof error === 'object') {
        if ('data' in error && error.data && typeof error.data === 'object') {
          // 尝试从错误数据中提取具体信息
          const errorData = error.data as Record<string, unknown>;
          if (errorData.message) {
            errorMessage += `：${errorData.message}`;
          } else if (errorData.detail) {
            errorMessage += `：${errorData.detail}`;
          } else if (errorData.error) {
            errorMessage += `：${errorData.error}`;
          }
        } else if ('message' in error) {
          errorMessage += `：${(error as Error).message}`;
        }
      }

      alert(errorMessage);
    } finally {
      setIsPrecreating(false);
    }
  }, [projectName]);

  return {
    documentFile,
    cadFile,
    projectName,
    isCreatingProject,
    isPrecreating,
    isUploading,
    uploadProgress,
    validationErrors,
    projectId,
    // 轮询相关状态
    isPolling,
    pollingStatus,
    pollingProgress,
    pollingMessage,
    jobId,
    handleDocumentUpload,
    handleCadUpload,
    handleDocumentDrop,
    handleCadDrop,
    handleDragOver,
    setProjectName,
    handlePrecreateProject,
    handleCreateProject,
    resetUploadState,
  };
};
