import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { IFCLoader } from 'web-ifc-three/IFCLoader';
import { IFCPRODUCT } from 'web-ifc';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { type Project } from '../../services/projectService';

interface IfcModelProps {
  project?: Project | null;
  highlightIds?: string[];
}

const IfcModel: React.FC<IfcModelProps> = React.memo(({ project, highlightIds }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInitializedRef = useRef(false);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const animateIdRef = useRef<number | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const ifcLoaderRef = useRef<IFCLoader | null>(null);
  const modelRef = useRef<any>(null);
  const raycasterRef = useRef<THREE.Raycaster | null>(null);
  const mouseRef = useRef<THREE.Vector2 | null>(null);
  const infoDivRef = useRef<HTMLDivElement | null>(null);
  const selectionSubsetRef = useRef<THREE.Mesh | null>(null);

  // 添加错误状态
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  // 需要高亮（红色）的 GlobalId 列表
  const HIGHLIGHT_GLOBAL_IDS = highlightIds || [
    "aJsnXu9eIpoyoEJdJSv$0G",
    "x5GgzOLEIt6paCvCuno_0G",
  ];

  // 根据项目名称选择模型文件
  const getModelURL = (projectName: string): string => {
    const firstChar = projectName.charAt(0);
    if (firstChar === '海') {
      return '/海河玺.ifc';
    } else if (firstChar === '绿') {
      return '/18号楼石钢住宅18#楼【拆分标准层】【删除部分楼层＜100mb】.ifc';
    }
    // 默认返回18号楼石钢住宅18#楼【拆分标准层】【删除部分楼层＜100mb】.ifc
    return '/18号楼石钢住宅18#楼【拆分标准层】【删除部分楼层＜100mb】.ifc';
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
    ifcLoaderRef.current = ifcLoader;

    const loadModel = async () => {
      try {
        // 检查是否已被取消
        if (abortControllerRef.current?.signal.aborted) {
          return;
        }

        // 根据项目名称选择模型文件
        const modelURL = project?.name
          ? getModelURL(project.name)
          : '/18号楼石钢住宅18#楼【拆分标准层】【删除部分楼层＜100mb】.ifc';
        
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

        const model = (await ifcLoader.parse(data)) as any;

        // 检查是否已被取消
        if (abortControllerRef.current?.signal.aborted) {
          return;
        }

        model.traverse((child: THREE.Object3D) => {
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
        modelRef.current = model;

        // 信息面板
        if (!infoDivRef.current) {
          const info = document.createElement('div');
          info.style.position = 'absolute';
          info.style.top = '12px';
          info.style.right = '12px';
          info.style.maxWidth = '360px';
          info.style.background = 'rgba(0,0,0,0.65)';
          info.style.color = '#fff';
          info.style.padding = '10px 12px';
          info.style.borderRadius = '8px';
          info.style.fontSize = '12px';
          info.style.lineHeight = '1.4';
          info.style.pointerEvents = 'none';
          info.style.whiteSpace = 'pre-wrap';
          info.textContent = '点击构件以查看属性';
          infoDivRef.current = info;
          container.style.position = 'relative';
          container.appendChild(info);
        }

        // 底色统一为半透明灰色
        const baseMaterial = new THREE.MeshStandardMaterial({
          color: 0x808080,
          transparent: true,
          opacity: 0.3,
          depthWrite: false,
          metalness: 0,
          roughness: 1,
        });
        model.traverse((child: THREE.Object3D) => {
          if (child instanceof THREE.Mesh) {
            child.material = baseMaterial;
            child.renderOrder = 0;
          }
        });

        // 根据 GlobalId 创建高亮子集（红色）
        try {
          const modelID = (model as any).modelID as number;

          // 获取所有产品元素的 expressID 列表（优先方式）
          const rawIds = await ifcLoader.ifcManager.getAllItemsOfType(
            modelID,
            IFCPRODUCT,
            true
          );
          let allProductIds: number[] = Array.isArray(rawIds)
            ? (rawIds as number[])
            : Array.from(rawIds as Iterable<number>);

          console.log('[IFC] 产品总数(方式A IFCPRODUCT):', allProductIds.length);

          // 回退：通过空间结构收集 expressID
          if (!allProductIds.length) {
            try {
              const spatial = await ifcLoader.ifcManager.getSpatialStructure(modelID, true);
              const idsSet = new Set<number>();
              const collect = (node: any) => {
                if (!node) return;
                if (typeof node.expressID === 'number') idsSet.add(node.expressID);
                if (Array.isArray(node.items)) {
                  for (const it of node.items) {
                    if (typeof it?.expressID === 'number') idsSet.add(it.expressID);
                  }
                }
                if (Array.isArray(node.children)) {
                  for (const ch of node.children) collect(ch);
                }
              };
              collect(spatial);
              allProductIds = Array.from(idsSet);
              console.log('[IFC] 产品总数(方式B SpatialStructure):', allProductIds.length);
            } catch (se) {
              console.warn('[IFC] 通过空间结构收集ID失败:', se);
            }
          }

          const globalIdToExpressId = new Map<string, number>();

          for (const expressID of allProductIds) {
            const props: any = await ifcLoader.ifcManager.getItemProperties(
              modelID,
              expressID,
              false
            );
            const gid = props?.GlobalId?.value as string | undefined;
            if (gid) {
              globalIdToExpressId.set(gid, expressID);
            }
          }

          console.log('[IFC] 已映射GlobalId数量:', globalIdToExpressId.size);
          const resolvedPairs = HIGHLIGHT_GLOBAL_IDS.map((gid) => ({
            gid,
            expressID: globalIdToExpressId.get(gid) ?? null,
          }));
          console.log('[IFC] 待高亮ID映射:', resolvedPairs);

          const idsToHighlight = HIGHLIGHT_GLOBAL_IDS.map((gid) =>
            globalIdToExpressId.get(gid)
          ).filter((id): id is number => typeof id === 'number');

          if (idsToHighlight.length > 0) {
            const highlightMaterial = new THREE.MeshStandardMaterial({
              color: 0xff0000,
              transparent: true,
              opacity: 0.5,
              depthWrite: true,
              depthTest: true,
              metalness: 0,
              roughness: 0.6,
            });

            // 不再把子集直接加到 scene，避免与居中后的 model 产生偏移
            const subset = ifcLoader.ifcManager.createSubset({
              modelID,
              ids: idsToHighlight,
              material: highlightMaterial,
              removePrevious: true,
              customID: 'highlight',
            } as any);

            if (subset) {
              subset.renderOrder = 1;
              // 挂到原模型上，保持与模型相同的坐标变换
              (model as THREE.Object3D).add(subset);
              console.log('[IFC] 创建高亮子集成功(挂到model)，数量:', idsToHighlight.length);
            } else {
              console.warn('[IFC] 创建高亮子集失败');
            }
          } else {
            console.warn('[IFC] 未找到匹配的GlobalId用于高亮');
          }
        } catch (e) {
          console.warn('根据 GlobalId 高亮失败:', e);
        }

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

        // 拾取器与事件
        raycasterRef.current = new THREE.Raycaster();
        mouseRef.current = new THREE.Vector2();

        const handleClick = async (event: MouseEvent) => {
          if (!rendererRef.current || !cameraRef.current || !raycasterRef.current) return;
          const rect = rendererRef.current.domElement.getBoundingClientRect();
          const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
          const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
          mouseRef.current!.set(x, y);

          raycasterRef.current.setFromCamera(mouseRef.current!, cameraRef.current);
          const targets: THREE.Object3D[] = modelRef.current ? [modelRef.current] : sceneRef.current ? [sceneRef.current] : [];
          const intersects = raycasterRef.current.intersectObjects(targets, true);
          if (!intersects.length) {
            if (infoDivRef.current) infoDivRef.current.textContent = '未选中构件';
            // 未命中，移除已有的黄色选择子集，避免误判为选中
            if (selectionSubsetRef.current && modelRef.current) {
              (modelRef.current as THREE.Object3D).remove(selectionSubsetRef.current);
              selectionSubsetRef.current = null;
              try {
                if (sceneRef.current && cameraRef.current && rendererRef.current) {
                  rendererRef.current.render(sceneRef.current, cameraRef.current);
                }
              } catch {}
            }
            return;
          }

          const first = intersects[0];
          if (!first.object || !('geometry' in first.object) || typeof first.faceIndex !== 'number') {
            if (infoDivRef.current) infoDivRef.current.textContent = '未选中有效面';
            // 无效命中，同样移除黄色选择
            if (selectionSubsetRef.current && modelRef.current) {
              (modelRef.current as THREE.Object3D).remove(selectionSubsetRef.current);
              selectionSubsetRef.current = null;
              try {
                if (sceneRef.current && cameraRef.current && rendererRef.current) {
                  rendererRef.current.render(sceneRef.current, cameraRef.current);
                }
              } catch {}
            }
            return;
          }

          try {
            const geom = (first.object as any).geometry as THREE.BufferGeometry;
            const expressID = ifcLoader.ifcManager.getExpressId(geom, first.faceIndex as number);
            const modelID = (first.object as any).modelID ?? (modelRef.current as any)?.modelID;
            if (typeof expressID !== 'number' || typeof modelID !== 'number') {
              if (infoDivRef.current) infoDivRef.current.textContent = '无法解析构件ID';
              return;
            }

            const props: any = await ifcLoader.ifcManager.getItemProperties(modelID, expressID, true);
            const gid = props?.GlobalId?.value ?? '';
            const name = props?.Name?.value ?? '';
            const type = props?.ObjectType?.value ?? props?.type ?? '';
            const predef = props?.PredefinedType?.value ?? '';

            console.log('[IFC] 点击选中:', { expressID, GlobalId: gid, Name: name, Type: type, Predefined: predef });

            if (infoDivRef.current) {
              infoDivRef.current.innerHTML =
                `<div><b>ExpressID</b>: ${expressID}</div>` +
                (gid ? `<div><b>GlobalId</b>: ${gid}</div>` : '') +
                (name ? `<div><b>Name</b>: ${name}</div>` : '') +
                (type ? `<div><b>Type</b>: ${type}</div>` : '') +
                (predef ? `<div><b>Predefined</b>: ${predef}</div>` : '');
            }

            // 创建/更新黄色半透明选择子集，挂到 model 保持原位
            try {
              if (selectionSubsetRef.current && modelRef.current) {
                (modelRef.current as THREE.Object3D).remove(selectionSubsetRef.current);
                selectionSubsetRef.current = null;
              }

              const selectMaterial = new THREE.MeshStandardMaterial({
                color: 0xffff00,
                transparent: true,
                opacity: 0.5,
                depthWrite: false,
                depthTest: true,
                metalness: 0,
                roughness: 0.6,
              });

              const selectionSubset = ifcLoader.ifcManager.createSubset({
                modelID,
                ids: [expressID],
                material: selectMaterial,
                removePrevious: true,
                customID: 'select',
              } as any);

              if (selectionSubset) {
                selectionSubset.renderOrder = 2;
                (modelRef.current as THREE.Object3D).add(selectionSubset);
                selectionSubsetRef.current = selectionSubset as THREE.Mesh;
              }
            } catch (se) {
              console.warn('[IFC] 创建选择子集失败:', se);
            }

            // 立即渲染一次以反映选择
            try {
              if (sceneRef.current && cameraRef.current && rendererRef.current) {
                rendererRef.current.render(sceneRef.current, cameraRef.current);
              }
            } catch {}
          } catch (e) {
            if (infoDivRef.current) infoDivRef.current.textContent = '读取属性失败';
            console.warn('点击读取属性失败', e);
          }
        };

        renderer.domElement.addEventListener('click', handleClick);

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
        
        console.error('[IFC] 加载模型失败:', error);
        setError(error instanceof Error ? error.message : '加载模型失败');
        setLoading(false);
      } finally {
        setLoading(false);
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
        if (renderer && renderer.domElement) {
          renderer.domElement.replaceWith(renderer.domElement.cloneNode(false));
        }
        if (infoDivRef.current && container.contains(infoDivRef.current)) {
          container.removeChild(infoDivRef.current);
          infoDivRef.current = null;
      }
      resizeObserver.disconnect();
      window.removeEventListener('resize', handleResize);
      isInitializedRef.current = false;
    };
  }, [project?.name]); // 添加project.name作为依赖项，当项目名称变化时重新加载模型

  // 如果有错误，显示错误信息
  if (error) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          width: '100%',
          height: '100%',
          padding: '20px',
          color: '#ff6b6b',
          textAlign: 'center',
        }}
      >
        <div>
          <div style={{ fontSize: '18px', marginBottom: '10px' }}>❌ 模型加载失败</div>
          <div style={{ fontSize: '14px', opacity: 0.8 }}>{error}</div>
        </div>
      </div>
    );
  }

  // 如果正在加载，显示加载状态
  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          width: '100%',
          height: '100%',
          padding: '20px',
          color: '#4CAF50',
          textAlign: 'center',
        }}
      >
        <div>
          <div style={{ fontSize: '18px', marginBottom: '10px' }}>🔄 正在加载模型...</div>
          <div style={{ fontSize: '14px', opacity: 0.8 }}>请稍候</div>
        </div>
      </div>
    );
  }

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
