import React, { useRef, useState } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { OrbitControls, Stars, Text, Billboard } from '@react-three/drei';
import { TextureLoader } from 'three';
import { a, useSpring } from '@react-spring/three';
import * as THREE from 'three';

const EARTH_RADIUS_KM = 6371;
const AU_TO_KM = 149597870.7;
const EARTH_MOON_DISTANCE_KM = 384400;
const MOON_RADIUS_KM = 3474 / 2;
const SCALE_FACTOR = 1 / 50000;
const MAX_ALLOWED_DISTANCE_AU = 0.1;

const Earth = () => {
  const visualRadius = EARTH_RADIUS_KM * SCALE_FACTOR;
  const earthRef = useRef();
  const lightsRef = useRef();

  const [earthTexture, cityLightsTexture] = useLoader(TextureLoader, 
    ['/textures/earthmap1k.jpg', '/textures/earth_lights_lrg.jpg']);

  useFrame(() => {
    if (earthRef.current) {
      earthRef.current.rotation.y += 0.002;
    }
    if (lightsRef.current) {
      lightsRef.current.rotation.y += 0.002;
    }
  });

  return (
    <>
      <mesh ref={earthRef} position={[0, 0, 0]}>
        <sphereGeometry args={[visualRadius, 64, 64]} />
        <meshLambertMaterial map={earthTexture} />
      </mesh>

      <mesh ref={lightsRef} position={[0, 0, 0]}>
        <sphereGeometry args={[visualRadius * 1.001, 64, 64]} />
        <meshBasicMaterial
          map={cityLightsTexture}
          blending={THREE.AdditiveBlending}
          transparent
          opacity={0.7}
        />
      </mesh>

      <Billboard>
        <Text
          position={[0, visualRadius + 0.1, 0]}
          fontSize={0.2}
          color="white"
          anchorX="center"
          anchorY="middle"
        >
          Earth
        </Text>
      </Billboard>
    </>
  );
};

const Moon = () => {
  const moonGroupRef = useRef();
  const moonRef = useRef();
  const moonTexture = useLoader(TextureLoader, '/textures/moontexture1k.jpg');

  const moonDistance = EARTH_MOON_DISTANCE_KM * SCALE_FACTOR;
  const moonRadius = MOON_RADIUS_KM * SCALE_FACTOR;

  useFrame((state) => {
    const elapsedTime = state.clock.getElapsedTime();
    if (moonGroupRef.current) {
      moonGroupRef.current.rotation.y = elapsedTime * 0.05;
    }
    if (moonRef.current) {
      moonRef.current.rotation.y += 0.002;
    }
  });

  return (
    <group ref={moonGroupRef}>
      <group position={[moonDistance, 0, 0]}>
        <mesh ref={moonRef}>
          <sphereGeometry args={[moonRadius, 32, 32]} />
          <meshStandardMaterial map={moonTexture} />
        </mesh>

        <Billboard>
          <Text
            position={[0, moonRadius + 0.1, 0]}
            fontSize={0.1}
            color="white"
            anchorX="center"
            anchorY="middle"
          >
            Moon
          </Text>
        </Billboard>
      </group>
    </group>
  );
};

const NeoObject = ({ neo, selectedId, onClick, paused }) => {
  const groupRef = useRef();
  const meshRef = useRef();
  const [hovered, setHover] = useState(false);

  const missDistanceAU = parseFloat(neo.close_approach_data[0]?.miss_distance?.astronomical || "1");
  const distance = Math.max(0.6, (missDistanceAU * AU_TO_KM) * SCALE_FACTOR);

  const diameterKm = neo.estimated_diameter.meters.estimated_diameter_max / 1000;
  const size = Math.min(0.5, Math.max(0.03, diameterKm * SCALE_FACTOR * 10));

  const speed = 0.5 / Math.sqrt(distance);
  const [angle] = useState(Math.random() * Math.PI * 2);
  const isSelected = selectedId === neo.id;

  const { scale } = useSpring({
    scale: isSelected ? 1.5 : 1,
    config: { mass: 1, tension: 170, friction: 12 }
  });

  const { emissiveIntensity } = useSpring({
    emissiveIntensity: isSelected ? 
      (hovered ? 1.2 : 1) :
      (hovered ? 0.5 : 0),
    loop: { reverse: true },
    config: { duration: 1500 },
    pause: !isSelected
  });

  useFrame((state) => {
    if (paused) return;

    const time = state.clock.getElapsedTime();
    if (groupRef.current) {
      groupRef.current.position.x = Math.sin(time * speed + angle) * distance;
      groupRef.current.position.z = Math.cos(time * speed + angle) * distance;
      meshRef.current.rotation.y = Math.atan2(
        groupRef.current.position.x,
        groupRef.current.position.z
      );
    }
  });

  return (
    <a.group ref={groupRef} scale={scale}>
      <a.mesh
        ref={meshRef}
        onClick={onClick}
        onPointerOver={() => setHover(true)}
        onPointerOut={() => setHover(false)}
      >
        <sphereGeometry args={[size, 16, 16]} />
        <a.meshStandardMaterial
          color={neo.is_potentially_hazardous_asteroid ? '#ff3d00' : '#4caf50'}
          emissive="#ffffff"
          emissiveIntensity={emissiveIntensity}
        />
        {(hovered || isSelected) && (
          <Text
            position={[0, size + 0.1, 0]}
            fontSize={0.1}
            color="white"
            anchorX="center"
            anchorY="middle"
          >
            {neo.name}
          </Text>
        )}
      </a.mesh>

      {isSelected && (
        <mesh>
          <sphereGeometry args={[size * 1.4, 16, 16]} />
          <meshBasicMaterial color="#4facfe" wireframe opacity={0.5} transparent />
        </mesh>
      )}
    </a.group>
  );
};


const OrbitVisualizer3D = ({ neoData, selectedNeoId, onSelectNeo, showOnlyHazardous, paused }) => {
  const filteredNeos = neoData
    ? Object.values(neoData)
        .flat()
        .filter(neo => {
          const missAU = parseFloat(neo.close_approach_data[0]?.miss_distance?.astronomical || "1");
          const isHazardousCheck = !showOnlyHazardous || neo.is_potentially_hazardous_asteroid;
          return isHazardousCheck && missAU <= MAX_ALLOWED_DISTANCE_AU;
        })
    : [];

  const maxDistance = filteredNeos.reduce((max, neo) => {
    const dist = parseFloat(neo.close_approach_data[0]?.miss_distance?.astronomical || "1") * AU_TO_KM * SCALE_FACTOR;
    return Math.max(max, dist);
  }, 3);

  const cameraPosition = [0, maxDistance * 0.7, maxDistance * 1.2];

  return (
    <div className="orbit-visualizer-3d">
      <Canvas
        camera={{
          position: cameraPosition,
          fov: 45,
          near: 0.01,
          far: 1000
        }}
        gl={{ antialias: true }}
      >
        <color attach="background" args={['#000']} />
        <fog attach="fog" args={['#000', 10, 100]} />

        <directionalLight position={[5, 3, 5]} intensity={1.3} color="#ffe9b3" castShadow={false} />
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />

        <primitive object={new THREE.AxesHelper(2)} />

        <Earth />
        <Moon />

        {filteredNeos.map(neo => (
          <NeoObject
            key={neo.id}
            neo={neo}
            selectedId={selectedNeoId}
            onClick={() => onSelectNeo(neo)}
            paused={paused}
          />
        ))}

        <gridHelper args={[maxDistance * 2, 20, '#444', '#222']} rotation={[Math.PI / 2, 0, 0]} />
        <Stars radius={maxDistance * 3} depth={50} count={2000} factor={4} fade speed={1} />
        <OrbitControls enableZoom enablePan enableRotate minDistance={1.5} maxDistance={maxDistance * 2} />
      </Canvas>
    </div>
  );
};

export default OrbitVisualizer3D;
