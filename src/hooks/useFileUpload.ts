import { useState, useCallback, useRef } from 'react';
import { projectAPI } from '../services/api';
import { AuthService } from '../services/authService';
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
        } else {
          const errors = validation.error
            ? [validation.error]
            : ['文件验证失败'];
          setValidationErrors(errors);
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
        } else {
          const errors = validation.error
            ? [validation.error]
            : ['文件验证失败'];
          setValidationErrors(errors);
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
        } else {
          const errors = validation.error
            ? [validation.error]
            : ['文件验证失败'];
          setValidationErrors(errors);
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
        } else {
          const errors = validation.error
            ? [validation.error]
            : ['文件验证失败'];
          setValidationErrors(errors);
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
      setIsPolling(true);
      setPollingStatus('processing');
      setPollingMessage('项目处理中，请稍候...');
      setPollingProgress(0);

      // 启动轮询的同时，异步执行操作员操作
      if (projectId && projectName) {
        operatorAPI.executeOperatorActionsAsync({
          projectId,
          projectName,
        });
      }

      // 设置5分钟超时
      pollingTimeoutRef.current = setTimeout(
        () => {
          stopPolling();
          alert('项目处理超时，请稍后手动刷新查看状态');
        },
        5 * 60 * 1000
      ); // 5分钟

      // 开始轮询
      const pollProject = async () => {
        try {
          const result = await projectAPI.pollProjectStatus(jobId);

          setPollingStatus(result.status);
          setPollingMessage(result.message || '项目处理中...');
          if (result.progress !== undefined) {
            setPollingProgress(result.progress);
          }

          if (result.status === 'success') {

            // 清除轮询定时器，但保持 isPolling 状态为 true
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current);
              pollingIntervalRef.current = null;
            }
            if (pollingTimeoutRef.current) {
              clearTimeout(pollingTimeoutRef.current);
              pollingTimeoutRef.current = null;
            }

            // 更新轮询状态为等待状态，但保持 isPolling 为 true
            setPollingStatus('waiting');
            setPollingMessage('项目处理完成，正在等待数据准备...');
            setPollingProgress(100);

            // 等待4分钟后执行后续逻辑
            setTimeout(
              async () => {

                // 更新状态为数据处理中
                setPollingMessage('正在处理项目数据，请稍候...');

                // 下载并解析Excel文件
                try {
                  if (projectId) {
                    const excelFile =
                      await projectAPI.downloadProjectExcel(projectId);

                    // 解析Excel文件
                    const projectData = await readProjectFromFile(excelFile);

                    if (
                      projectData &&
                      projectData.tasks &&
                      projectData.tasks.length > 0
                    ) {

                      // 使用正确的项目ID更新项目数据
                      if (projectId) {
                        projectData.id = projectId;
                        projectData.name = projectName || projectData.name;
                      }

                      // 将解析后的数据设置为模拟数据，供其他组件使用
                      ProjectService.setMockProjects([projectData]);

                      // 验证数据是否正确设置
                      try {
                        await ProjectService.getProjects();
                        // 数据验证完成，无需额外处理
                      } catch {
                        // 数据验证失败，继续执行
                      }

                      // 存储Excel数据以便后续使用
                      window.latestProjectData = projectData;
                    }
                  }
                } catch {
                  // 即使Excel处理失败，也继续执行后续逻辑
                }

                // 更新状态为完成
                setPollingMessage('数据处理完成，即将刷新页面...');

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

                // 调用回调函数刷新UI
                if (onProjectCreated) {
                  onProjectCreated();
                }

                // 最后停止轮询状态
                setTimeout(() => {
                  setIsPolling(false);
                  setPollingStatus('');
                  setPollingProgress(0);
                  setPollingMessage('');
                }, 1000); // 延迟1秒停止轮询状态，确保用户能看到完成信息
              },
              2 * 60 * 1000
            ); // 4分钟 = 4 * 60 * 1000毫秒
          }
        } catch {
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
      // 确认创建项目

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
        // 开始上传文件

        const totalFiles = (documentFile ? 1 : 0) + (cadFile ? 1 : 0);
        let completedFiles = 0;

        // 上传文档文件
        if (documentFile) {
          try {
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
          } catch (error) {
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
          } catch (error) {
            setIsUploading(false);
            setUploadProgress(0);
            throw new Error(
              `CAD文件上传失败: ${error instanceof Error ? error.message : '未知错误'}`
            );
          }
        }

        setUploadProgress(90); // 所有文件上传完成
      }

      // 调用最终创建API
      const finalProject = await projectAPI.createProject({
        project_id: projectId,
        user_id: currentUser.user_id,
      });

      setUploadProgress(100); // 项目创建完成

      // 从返回值中提取job_id
      if (finalProject && finalProject.job_id) {
        setJobId(finalProject.job_id);

        // 使用job_id启动轮询
        startPolling(finalProject.job_id);
      } else {
        alert('项目创建成功但无法获取作业ID，请手动刷新查看状态');
      }
    } catch (error) {
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

      // 预创建项目

      // 调用预创建API获取project_id
      const response = await projectAPI.precreateProject({
        user_id: currentUser.user_id,
        name: trimmedProjectName,
      });

      setProjectId(response.project_id);
      alert('项目预创建成功！现在可以上传文件了。');
    } catch (error) {

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
