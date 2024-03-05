import { useFrame } from "@react-three/fiber";
import React, { useRef, useMemo } from "react";
import * as THREE from "three";

const StarfieldBackground = () => {
  const meshRef = useRef();
  const materialRef = useRef();

  // Define shaders outside of the component or useMemo if they depend on props
  const starfieldVertexShader = `
    varying vec3 vPosition;

    void main() {
        vPosition = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

  const starfieldFragmentShader = `
    uniform float time;
    varying vec3 vPosition;

    float starDensity = 0.2;
    float speed = 0.25;
    float brightness = 0.7;

    float rand(vec2 co){
        return fract(sin(dot(co.xy, vec2(12.9898,78.233))) * 43758.5453);
    }

    void main() {
        float starValue = rand(gl_FragCoord.xy * starDensity);
        float movingStar = mod(time * speed + starValue, 1.0);
        float starIntensity = smoothstep(0.1, 0.2, movingStar) * brightness;
        gl_FragColor = vec4(vec3(starIntensity), 1.0);
    }
  `;

  // Uniforms can be defined inside useMemo to avoid re-creation on each render
  const uniforms = useMemo(
    () => ({
      time: { value: 0.0 },
    }),
    []
  );

  useFrame(({ clock }) => {
    if (materialRef.current) {
      materialRef.current.uniforms.time.value = clock.getElapsedTime();
    }
  });

  return (
    <mesh ref={meshRef}>
      <planeBufferGeometry args={[100, 100, 1, 1]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={starfieldVertexShader}
        fragmentShader={starfieldFragmentShader}
        uniforms={uniforms}
        side={THREE.BackSide} // Apply the material to the inside of the geometry
      />
    </mesh>
  );
};

export default StarfieldBackground;
