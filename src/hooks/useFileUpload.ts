import { useState, useCallback } from 'react';
import { projectAPI } from '../services/api';
import { AuthService } from '../services/authService';
import { ManagementServiceUrls } from '../services/apiConfig';

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
  handleDocumentUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleCadUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleDocumentDrop: (event: React.DragEvent<HTMLDivElement>) => void;
  handleCadDrop: (event: React.DragEvent<HTMLDivElement>) => void;
  handleDragOver: (event: React.DragEvent<HTMLDivElement>) => void;
  setProjectName: (name: string) => void;
  handlePrecreateProject: () => Promise<void>;
  handleUploadFiles: () => Promise<void>;
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

  // 重置上传状态
  const resetUploadState = useCallback(() => {
    setDocumentFile(null);
    setCadFile(null);
    setProjectName('');
    setIsCreatingProject(false);
    setIsPrecreating(false);
    setIsUploading(false);
    setUploadProgress(0);
    setValidationErrors([]);
    setProjectId(null);
  }, []);

  // 最终确认创建项目
  const handleCreateProject = useCallback(async () => {
    if (!projectId) {
      alert('请先预创建项目并上传文件');
      return;
    }

    try {
      setIsCreatingProject(true);
      console.log('确认创建项目:', {
        project_id: projectId,
        project_name: projectName,
      });

      // 调用最终创建API
      const finalProject = await projectAPI.createProject({
        project_id: projectId,
        project_name: projectName,
        description: `项目包含${documentFile ? '文档文件' : ''}${documentFile && cadFile ? '和' : ''}${cadFile ? 'CAD文件' : ''}`,
      });

      console.log('项目创建成功:', finalProject);
      alert('项目创建成功！');

      // 重置状态
      resetUploadState();

      // 调用回调函数
      if (onProjectCreated) {
        onProjectCreated();
      }
    } catch (error) {
      console.error('创建项目失败:', error);
      alert(
        '创建项目失败，请重试：' +
          (error instanceof Error ? error.message : '未知错误')
      );
    } finally {
      setIsCreatingProject(false);
    }
  }, [
    projectId,
    projectName,
    documentFile,
    cadFile,
    onProjectCreated,
    resetUploadState,
  ]);

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

  // 上传文件到预创建的项目
  const handleUploadFiles = useCallback(async () => {
    if (!projectId) {
      alert('请先预创建项目');
      return;
    }

    if (!documentFile && !cadFile) {
      alert('请至少选择一个文件');
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress(0);

      // 获取当前用户信息
      const currentUser = AuthService.getCurrentUserSync();
      if (!currentUser || !currentUser.user_id) {
        alert('用户未登录，请先登录');
        return;
      }

      const filesToUpload = [];
      if (documentFile)
        filesToUpload.push({ file: documentFile, type: 'document' });
      if (cadFile) filesToUpload.push({ file: cadFile, type: 'cad' });

      for (let i = 0; i < filesToUpload.length; i++) {
        const { file, type } = filesToUpload[i];

        console.log(`上传文件 ${i + 1}/${filesToUpload.length}:`, file.name);

        await projectAPI.uploadFile({
          project_id: projectId,
          uploaded_by: currentUser.user_id,
          category: 'project_document',
          file: file,
          file_type: type as 'document' | 'cad',
        });

        // 更新进度
        const progress = Math.floor(((i + 1) / filesToUpload.length) * 100);
        setUploadProgress(progress);
      }

      console.log('所有文件上传完成');
      alert('文件上传成功！现在可以确认创建项目了。');
    } catch (error) {
      console.error('文件上传失败:', error);
      alert(
        '文件上传失败，请重试：' +
          (error instanceof Error ? error.message : '未知错误')
      );
    } finally {
      setIsUploading(false);
    }
  }, [projectId, documentFile, cadFile]);

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
    handleDocumentUpload,
    handleCadUpload,
    handleDocumentDrop,
    handleCadDrop,
    handleDragOver,
    setProjectName,
    handlePrecreateProject,
    handleUploadFiles,
    handleCreateProject,
    resetUploadState,
  };
};
