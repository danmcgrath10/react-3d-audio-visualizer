import React, { useRef, useEffect, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { OrbitControls } from "@react-three/drei";

const AmorphousBlob = ({ audioAnalyser }) => {
  const meshRef = useRef();
  const geometry = useMemo(() => new THREE.SphereGeometry(1.5, 64, 64), []);
  const originalPositions = useRef([]);
  const frequencyData = useRef(
    new Uint8Array(audioAnalyser?.frequencyBinCount || 0)
  );
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          color: { value: new THREE.Color("hotpink") },
          time: { value: 0 },
          deformationIntensity: { value: 0 },
        },
        vertexShader: `
        uniform float time;
        uniform float deformationIntensity;
        varying vec3 vNormal;
        varying float vDeformation;

        float smoothTransition(float x) {
          return sin(x * x);
        }

        // GLSL implementation of Simplex Noise
        vec3 mod289(vec3 x) {
          return x - floor(x * (1.0 / 289.0)) * 289.0;
        }

        vec4 mod289(vec4 x) {
          return x - floor(x * (1.0 / 289.0)) * 289.0;
        }

        vec4 permute(vec4 x) {
            return mod289(((x*34.0)+1.0)*x);
        }

        vec4 taylorInvSqrt(vec4 r)
        {
          return 1.79284291400159 - 0.85373472095314 * r;
        }

        float snoise(vec3 v)
        { 
          const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
          const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);

        // First corner
          vec3 i  = floor(v + dot(v, C.yyy) );
          vec3 x0 =   v - i + dot(i, C.xxx) ;

        // Other corners
          vec3 g = step(x0.yzx, x0.xyz);
          vec3 l = 1.0 - g;
          vec3 i1 = min( g.xyz, l.zxy );
          vec3 i2 = max( g.xyz, l.zxy );

          //  x0 = x0 - 0. + 0.0 * C 
          vec3 x1 = x0 - i1 + 1.0 * C.xxx;
          vec3 x2 = x0 - i2 + 2.0 * C.xxx;
          vec3 x3 = x0 - 1. + 3.0 * C.xxx;

        // Permutations
          i = mod289(i); 
          vec4 p = permute( permute( permute( 
                    i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
                  + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) 
                  + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));

        // Gradients
        // ( N*N points uniformly over a square, mapped onto an octahedron.)
          float n_ = 1.0/7.0; // N=7
          vec3  ns = n_ * D.wyz - D.xzx;

          vec4 j = p - 49.0 * floor(p * ns.z *ns.z);  //  mod(p,N*N)

          vec4 x_ = floor(j * ns.z);
          vec4 y_ = floor(j - 7.0 * x_ );    // mod(j,N)

          vec4 x = x_ *ns.x + ns.yyyy;
          vec4 y = y_ *ns.x + ns.yyyy;
          vec4 h = 1.0 - abs(x) - abs(y);

          vec4 b0 = vec4( x.xy, y.xy );
          vec4 b1 = vec4( x.zw, y.zw );

          //vec4 s0 = vec4(lessThan(b0,0.0))*2.0 - 1.0;
          //vec4 s1 = vec4(lessThan(b1,0.0))*2.0 - 1.0;
          vec4 s0 = floor(b0)*2.0 + 1.0;
          vec4 s1 = floor(b1)*2.0 + 1.0;
          vec4 sh = -step(h, vec4(0.0));

          vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
          vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;

          vec3 p0 = vec3(a0.xy,h.x);
          vec3 p1 = vec3(a0.zw,h.y);
          vec3 p2 = vec3(a1.xy,h.z);
          vec3 p3 = vec3(a1.zw,h.w);

        //Normalise gradients
          vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
          p0 *= norm.x;
          p1 *= norm.y;
          p2 *= norm.z;
          p3 *= norm.w;

        // Mix final noise value
          vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2, x2), dot(x3,x3)), 0.0);
          m = m * m;
          return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), 
                                        dot(p2,x2), dot(p3,x3) ) );
        }

        void main() {
            vNormal = normal;
            float noiseValue = snoise(position + time * 0.1);
            float spikeIntensity = pow(abs(sin(time + noiseValue)), 3.0) * deformationIntensity;
            vDeformation = spikeIntensity;
            vec3 newPosition = position + normal * spikeIntensity * 2.0;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
        }
    `,
        fragmentShader: `
        uniform vec3 color;
        varying vec3 vNormal;
        void main() {
          float intensity = 0.1 + (0.9 * (0.5 + dot(vNormal, vec3(0.0, 0.0, 1.0))));
          gl_FragColor = vec4(color * intensity, 1.0);
        }
    `,
      }),
    []
  );

  useEffect(() => {
    if (meshRef.current && meshRef.current.geometry) {
      const positions = meshRef.current.geometry.attributes.position.array;
      originalPositions.current = positions.slice();
    }
  }, []);

  useFrame((state) => {
    if (audioAnalyser && meshRef.current) {
      audioAnalyser.getByteFrequencyData(frequencyData.current);
      const averageFrequency =
        frequencyData.current.reduce((sum, value) => sum + value, 0) /
        frequencyData.current.length;
      const deformationIntensity = Math.min(averageFrequency / 128, 1);

      material.uniforms.time.value = state.clock.getElapsedTime();
      material.uniforms.deformationIntensity.value = deformationIntensity;
    }
  });

  return <mesh ref={meshRef} geometry={geometry} material={material} />;
};

const AmorphousBlobVisualizer = ({ audioAnalyser }) => {
  return (
    <Canvas camera={{ position: [0, 0, 5] }}>
      <ambientLight intensity={0.5} />
      <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
      <pointLight position={[-10, -10, -10]} />
      <OrbitControls />
      <AmorphousBlob audioAnalyser={audioAnalyser} />
      {/* Consider re-enabling and configuring post-processing effects here for enhanced visual quality. */}
    </Canvas>
  );
};

export default AmorphousBlobVisualizer;
