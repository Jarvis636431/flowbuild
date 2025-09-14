import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { IFCLoader } from 'web-ifc-three/IFCLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { type Project } from '../../services/projectService';

interface IfcModelProps {
  project?: Project | null;
}

const IfcModel: React.FC<IfcModelProps> = React.memo(({ project }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInitializedRef = useRef(false);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const animateIdRef = useRef<number | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // 根据项目名称选择模型文件
  const getModelURL = (projectName: string): string => {
    const firstChar = projectName.charAt(0);
    if (firstChar === '海') {
      return '/海河玺.ifc';
    } else if (firstChar === '绿') {
      return '/绿城石岗.ifc';
    }
    // 默认返回绿城石岗.ifc
    return '/绿城石岗.ifc';
  };

  useEffect(() => {
    if (isInitializedRef.current || !containerRef.current) {
      return;
    }

    // 创建新的AbortController用于取消下载
    abortControllerRef.current = new AbortController();

    const container = containerRef.current;
    container.innerHTML = '';

    const scene = new THREE.Scene();
    scene.background = null;
    scene.fog = null;

    const camera = new THREE.PerspectiveCamera(
      75,
      container.clientWidth / container.clientHeight,
      0.01,
      2000
    );
    camera.position.set(20, 20, 20);
    camera.lookAt(0, 0, 0);
    camera.near = 0.01;
    camera.far = 2000;
    camera.updateProjectionMatrix();

    const renderer = new THREE.WebGLRenderer({
      antialias: false,
      powerPreference: 'high-performance',
      stencil: false,
      depth: true,
      alpha: true,
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = false;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 10);
    scene.add(directionalLight);

    const ifcLoader = new IFCLoader();
    ifcLoader.ifcManager.setWasmPath('./');

    const loadModel = async () => {
      try {
        // 检查是否已被取消
        if (abortControllerRef.current?.signal.aborted) {
          return;
        }

        // 根据项目名称选择模型文件
        const modelURL = project?.name
          ? getModelURL(project.name)
          : '/绿城石岗.ifc';
        
        const response = await fetch(modelURL, {
          signal: abortControllerRef.current?.signal
        });
        
        if (!response.ok) {
          throw new Error(`请求模型文件失败: ${response.status}`);
        }

        // 再次检查是否已被取消
        if (abortControllerRef.current?.signal.aborted) {
          return;
        }

        const data = await response.arrayBuffer();
        
        // 再次检查是否已被取消
        if (abortControllerRef.current?.signal.aborted) {
          return;
        }

        const model = await ifcLoader.parse(data);

        // 检查是否已被取消
        if (abortControllerRef.current?.signal.aborted) {
          return;
        }

        model.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            if (child.geometry) {
              child.geometry.computeBoundingSphere();
              child.geometry.computeBoundingBox();
            }

            if (child.material) {
              child.material.side = THREE.FrontSide;
              child.material.transparent = false;
              child.material.depthWrite = true;
              child.material.depthTest = true;

              if (child.material.map) {
                child.material.map.generateMipmaps = false;
                child.material.map.minFilter = THREE.LinearFilter;
                child.material.map.magFilter = THREE.LinearFilter;
              }
            }

            child.renderOrder = 0;
          }
        });

        // 检查是否已被取消
        if (abortControllerRef.current?.signal.aborted) {
          return;
        }

        scene.add(model);

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = false;
        controls.dampingFactor = 0.05;
        controls.enableZoom = true;
        controls.enablePan = true;
        controls.enableRotate = true;
        controls.rotateSpeed = 0.5;
        controls.zoomSpeed = 0.8;
        controls.panSpeed = 0.8;
        controls.maxDistance = 1000;
        controls.minDistance = 1;

        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());

        model.position.sub(center);

        const maxDim = Math.max(size.x, size.y, size.z);
        const fov = camera.fov * (Math.PI / 180);
        const cameraDistance = Math.abs(maxDim / 2 / Math.tan(fov / 2)) * 2.5; // 增加距离倍数

        camera.position.set(cameraDistance, cameraDistance, cameraDistance);
        camera.lookAt(0, 0, 0);

        controls.target.set(0, 0, 0);
        controls.update();

        // 调整控制器限制，防止过度缩放
        controls.maxDistance = cameraDistance * 3; // 最大距离为初始距离的3倍
        controls.minDistance = maxDim * 0.1; // 最小距离为模型最大尺寸的10%

        // 当控制器发生变化时，标记需要渲染
        controls.addEventListener('change', () => {
          needsRender = true;
        });

        controlsRef.current = controls;
        sceneRef.current = scene;
        cameraRef.current = camera;
        rendererRef.current = renderer;

        let lastTime = 0;
        const targetFPS = 60;
        const frameInterval = 1000 / targetFPS;
        let needsRender = true;

        const animate = (currentTime: number) => {
          // 检查是否已被取消
          if (abortControllerRef.current?.signal.aborted) {
            return;
          }
          
          animateIdRef.current = requestAnimationFrame(animate);

          if (currentTime - lastTime >= frameInterval) {
            // 更新控制器
            controls.update();

            if (needsRender) {
              renderer.render(scene, camera);
              needsRender = false;
            }

            lastTime = currentTime;
          }
        };
        animate(0);

        isInitializedRef.current = true;
      } catch (error) {
        // 如果是取消错误，不显示错误信息
        if (error instanceof Error && error.name === 'AbortError') {
  
          return;
        }

      }
    };

    loadModel();

    const handleResize = () => {
      if (camera && renderer && container) {
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);

        // 强制重新渲染，确保模型在尺寸变化后立即显示
        if (sceneRef.current && cameraRef.current) {
          renderer.render(sceneRef.current, cameraRef.current);
        }

        // 更新控制器限制
        if (controlsRef.current) {
          controlsRef.current.update();
        }
      }
    };

    // 使用ResizeObserver监听容器尺寸变化
    const resizeObserver = new ResizeObserver(() => {
      handleResize();
      // 强制重新渲染，确保模型在尺寸变化后立即显示
      if (sceneRef.current && cameraRef.current && rendererRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    });

    if (container) {
      resizeObserver.observe(container);
    }

    window.addEventListener('resize', handleResize);

    return () => {
      // 取消正在进行的下载
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      if (animateIdRef.current) {
        cancelAnimationFrame(animateIdRef.current);
      }
      if (controlsRef.current) {
        controlsRef.current.dispose();
      }
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
      resizeObserver.disconnect();
      window.removeEventListener('resize', handleResize);
      isInitializedRef.current = false;
    };
  }, [project?.name]); // 添加project.name作为依赖项，当项目名称变化时重新加载模型

  return (
    <div
      className="ifc-model-container"
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        height: '100%',
        padding: '20px',
      }}
    >
      <div
        id="viewer-container"
        ref={containerRef}
        style={{
          width: '100%',
          height: '100%',
          minHeight: '600px',
          border: '1px solid #ddd',
          borderRadius: '8px',
          overflow: 'hidden',
        }}
      ></div>
    </div>
  );
});

IfcModel.displayName = 'IfcModel';

export default IfcModel;
