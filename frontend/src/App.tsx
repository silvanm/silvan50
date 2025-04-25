import React, { useRef, useState, useEffect, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { AxesHelper } from 'three'
import { useControls } from 'leva'
import './App.css'

// 1. Define types for the data
type Coordinate = [number, number];
type Color = [number, number, number] | [number]; // RGB or Grayscale

interface TriangleData {
  coordinates: [Coordinate, Coordinate, Coordinate];
  color: Color;
}

// Function to convert [0-255] color to Three.js Color
function convertColor(colorData: Color): THREE.Color {
  if (colorData.length === 3) {
    // RGB
    return new THREE.Color(colorData[0] / 255, colorData[1] / 255, colorData[2] / 255);
  } else {
    // Grayscale
    const gray = colorData[0] / 255;
    return new THREE.Color(gray, gray, gray);
  }
}

// 3. Triangle Component
interface TriangleMeshProps {
  triangle: TriangleData;
  centerOffset: [number, number];
  duration: number;
  maxDistance: number;
}

// Simple easing function (can be replaced with others)
function easeInOutQuad(t: number): number {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

function TriangleMesh({ triangle, centerOffset, duration, maxDistance }: TriangleMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const [offsetX, offsetY] = centerOffset;

  // --- Calculate random direction and target position ---
  const { targetPosition } = useMemo(() => {
    const dir = new THREE.Vector3(
      Math.random() * 2 - 1,
      Math.random() * 2 - 1,
      Math.random() * 2 - 1
    );
    dir.normalize();
    if (dir.lengthSq() < 0.001) {
        dir.set(0, 1, 0); // Default axis if normalization fails
    }
    const target = dir.clone().multiplyScalar(maxDistance);

    return { targetPosition: target };
  }, [maxDistance]); // Removed rotation speed dependency
  // -------------------------------------------------------------

  // Store start position (local origin)
  const startPosition = useMemo(() => new THREE.Vector3(0, 0, 0), []);

  // Create geometry from coordinates, applying the offset
  const vertices = new Float32Array([
    triangle.coordinates[0][0] - offsetX, triangle.coordinates[0][1] - offsetY, 0, // Vertex 1 (x, y, z=0)
    triangle.coordinates[1][0] - offsetX, triangle.coordinates[1][1] - offsetY, 0, // Vertex 2 (x, y, z=0)
    triangle.coordinates[2][0] - offsetX, triangle.coordinates[2][1] - offsetY, 0, // Vertex 3 (x, y, z=0)
  ]);

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
  geometry.computeVertexNormals(); // Compute normals for potential lighting

  // Create material with the correct color
  const material = new THREE.MeshBasicMaterial({
    color: convertColor(triangle.color),
    side: THREE.DoubleSide // Render both sides
  });

  // Animation using useFrame with easing
  useFrame((state) => {
    if (meshRef.current && duration > 0) {
      const elapsedTime = state.clock.getElapsedTime();
      // Calculate progress t (0 to 1)
      const t = Math.min(elapsedTime / duration, 1);
      // Apply easing function
      const easedT = easeInOutQuad(t);

      // Interpolate position using lerp
      meshRef.current.position.copy(startPosition).lerp(targetPosition, easedT);
    }
  });

  return <mesh ref={meshRef} geometry={geometry} material={material} />;
}

function App() {
  // Leva Controls MUST be called unconditionally at the top
  const { ambientIntensity, dirIntensity, dirPosition } = useControls('Lighting', {
    ambientIntensity: { value: 0.8, min: 0, max: 2, step: 0.1 },
    dirIntensity: { value: 0.5, min: 0, max: 2, step: 0.1 },
    // Placeholder initial position, will be updated once imageSize is known if needed
    dirPosition: { value: [0, 100, 100], step: 10 } 
  });

  const { groupPosition, groupRotation } = useControls('Triangles Group', {
      groupPosition: {
        // Placeholder initial position
        value: [0, 0, 0], 
        step: 10,
      },
      groupRotation: {
        value: [0, 0, -Math.PI / 2], 
        step: Math.PI / 180, 
      }
  });

  // Leva controls for animation
  const { duration, maxDistance } = useControls('Animation', {
    duration: { value: 5, min: 0, max: 20, step: 0.1 }, // Duration in seconds
    maxDistance: { value: 200, min: 0, max: 1000, step: 10 },
  });

  // State for triangle data
  const [triangles, setTriangles] = useState<TriangleData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [centerOffset, setCenterOffset] = useState<[number, number]>([0, 0]);

  // Fetch data on mount
  useEffect(() => {
    fetch('/data.json') 
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then((data: TriangleData[]) => {
        setTriangles(data);
        let maxWidth = 0;
        let maxHeight = 0;
        data.forEach(tri => {
          tri.coordinates.forEach(([x, y]) => {
            if (x > maxWidth) maxWidth = x;
            if (y > maxHeight) maxHeight = y;
          });
        });
        const imgSize = { width: Math.ceil(maxWidth), height: Math.ceil(maxHeight) };
        setImageSize(imgSize);
        setCenterOffset([imgSize.width / 2, imgSize.height / 2]);
        
        // Optionally: Update leva controls defaults based on loaded data
        // This requires leva's `set` function, which adds complexity.
        // For now, we set reasonable starting points and allow manual adjustment.
        // If you need controls to *automatically* update based on data, let me know.
        
        setIsLoading(false);
      })
      .catch(e => {
        console.error("Error loading triangle data:", e);
        setError("Failed to load triangle data. Make sure data.json is in the public folder.");
        setIsLoading(false);
      });
  }, []); 

  if (isLoading) {
    return <div>Loading triangle data...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  // Estimate a suitable camera distance based on image size (use state variable)
  const distance = imageSize.width > 0 && imageSize.height > 0 
                    ? Math.max(imageSize.width, imageSize.height) * 1.2 
                    : 200; // Default distance if size is unknown

  // Calculate a suitable size for the AxesHelper
  const axesHelperSize = imageSize.width > 0 ? Math.max(imageSize.width, imageSize.height) * 0.6 : 100;

  return (
    <div id="canvas-container" style={{ width: '100vw', height: '100vh' }}>
       {/* Leva GUI is added automatically */}
       <Canvas
          camera={{
            position: [0, 0, distance/2], 
            fov: 50,
            near: 0.01,
            far: distance * 5, 
          }}
       >
        <ambientLight intensity={ambientIntensity} /> 
        <directionalLight position={dirPosition as [number, number, number]} intensity={dirIntensity} />

        {/* Group uses values from leva controls */}
        <group 
          position={groupPosition as [number, number, number]} 
          rotation={groupRotation as [number, number, number]}
        > 
            {/* Render Triangles */} 
            {triangles.map((tri, index) => (
                <TriangleMesh
                    key={index}
                    triangle={tri}
                    centerOffset={centerOffset}
                    duration={duration}
                    maxDistance={maxDistance}
                />
            ))}
        </group>

        <OrbitControls target={[0, 0, 0]} />
        <primitive object={new AxesHelper(axesHelperSize)} />
      </Canvas>
    </div>
  )
}

export default App
