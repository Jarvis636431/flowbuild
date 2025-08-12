import { useState, useCallback } from 'react';

export interface UseFileUploadReturn {
  documentFile: File | null;
  cadFile: File | null;
  projectName: string;
  isCreatingProject: boolean;
  handleDocumentUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleCadUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleDocumentDrop: (event: React.DragEvent<HTMLDivElement>) => void;
  handleCadDrop: (event: React.DragEvent<HTMLDivElement>) => void;
  handleDragOver: (event: React.DragEvent<HTMLDivElement>) => void;
  setProjectName: (name: string) => void;
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

  // 处理文档文件上传
  const handleDocumentUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (files && files.length > 0) {
        setDocumentFile(files[0]);
        console.log('上传的文档文件:', files[0]);
      }
    },
    []
  );

  // 处理CAD文件上传
  const handleCadUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (files && files.length > 0) {
        setCadFile(files[0]);
        console.log('上传的CAD文件:', files[0]);
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
        setDocumentFile(files[0]);
        console.log('拖拽的文档文件:', files[0]);
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
        setCadFile(files[0]);
        console.log('拖拽的CAD文件:', files[0]);
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
  }, []);

  // 创建项目
  const handleCreateProject = useCallback(async () => {
    if (!projectName.trim()) {
      alert('请输入项目名称');
      return;
    }

    if (!documentFile && !cadFile) {
      alert('请至少上传一个文件');
      return;
    }

    try {
      setIsCreatingProject(true);
      console.log('创建项目:', {
        name: projectName,
      });
      console.log('上传的文件:', { documentFile, cadFile });

      // 调用API创建项目
      // const newProject = await projectAPI.createProject({
      //   name: projectName,
      // });
      // console.log('项目创建成功:', newProject);
      alert('项目创建成功！');

      // 重置状态
      resetUploadState();

      // 调用回调函数
      if (onProjectCreated) {
        onProjectCreated();
      }
    } catch (error) {
      console.error('创建项目失败:', error);
      alert('创建项目失败，请重试');
    } finally {
      setIsCreatingProject(false);
    }
  }, [projectName, documentFile, cadFile, onProjectCreated, resetUploadState]);

  return {
    documentFile,
    cadFile,
    projectName,
    isCreatingProject,
    handleDocumentUpload,
    handleCadUpload,
    handleDocumentDrop,
    handleCadDrop,
    handleDragOver,
    setProjectName,
    handleCreateProject,
    resetUploadState,
  };
};
