import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, extend } from '@react-three/fiber';
import { shaderMaterial } from '@react-three/drei';
import { createLoveLetterTexture } from './CoverTexture';

// Define the shader material
const BurningPaperMaterial = shaderMaterial(
  {
    uTime: 0,
    uTexture: new THREE.Texture(),
    uNoiseTexture: new THREE.Texture(),
    uBurnColor: new THREE.Color(1.5, 0.5, 0.0), // HDR Orange
    uAshColor: new THREE.Color(0.0, 0.0, 0.0),
    uPaperColor: new THREE.Color(1.0, 1.0, 1.0),
  },
  // Vertex Shader
  `
    varying vec2 vUv;
    varying float vNoise;
    uniform float uTime;

    // Simple pseudo-random noise
    float random(vec2 st) {
        return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
    }
    
    // 2D Noise based on Morgan McGuire @morgan3d
    float noise(in vec2 st) {
        vec2 i = floor(st);
        vec2 f = fract(st);

        // Four corners in 2D of a tile
        float a = random(i);
        float b = random(i + vec2(1.0, 0.0));
        float c = random(i + vec2(0.0, 1.0));
        float d = random(i + vec2(1.0, 1.0));

        vec2 u = f * f * (3.0 - 2.0 * f);

        return mix(a, b, u.x) +
                (c - a)* u.y * (1.0 - u.x) +
                (d - b) * u.x * u.y;
    }

    void main() {
      vUv = uv;
      
      // Add a slight curl animation based on burn progress (uTime)
      // We want the paper to curl up slightly as it burns
      vec3 pos = position;
      
      // Calculate distance from bottom right (approx burn origin)
      float dist = distance(uv, vec2(1.0, 0.0));
      
      // Apply noise for vertex displacement to look charred/crumpled
      float n = noise(uv * 10.0 + uTime * 0.5);
      vNoise = n;
      
      // Curl effect: lift z based on proximity to bottom right and time
      float curlIntensity = smoothstep(0.0, 1.5, uTime) * 0.2;
      // Only curl near the burn front
      float wave = sin(uv.x * 5.0 + uTime) * 0.05;
      
      pos.z += wave * curlIntensity * (1.0 - dist);

      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
    }
  `,
  // Fragment Shader
  `
    uniform float uTime;
    uniform sampler2D uTexture;
    uniform vec3 uBurnColor;
    uniform vec3 uAshColor;
    
    varying vec2 vUv;
    varying float vNoise;

    // FBM Noise for organic burning edges
    float random(in vec2 st) {
        return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
    }

    float noise(in vec2 st) {
        vec2 i = floor(st);
        vec2 f = fract(st);
        float a = random(i);
        float b = random(i + vec2(1.0, 0.0));
        float c = random(i + vec2(0.0, 1.0));
        float d = random(i + vec2(1.0, 1.0));
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(a, b, u.x) + (c - a)* u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
    }

    #define OCTAVES 6
    float fbm (in vec2 st) {
        float value = 0.0;
        float amplitude = .5;
        float frequency = 0.;
        for (int i = 0; i < OCTAVES; i++) {
            value += amplitude * noise(st);
            st *= 2.;
            amplitude *= .5;
        }
        return value;
    }

    void main() {
      // 1. Base Paper Texture
      vec4 texColor = texture2D(uTexture, vUv);
      
      // 2. Define Burn Gradient (Bottom Right to Top Left)
      // UV (0,0) is bottom left. UV (1,0) is bottom right.
      // We want burn to start at (1,0)
      
      float distFromCorner = distance(vUv, vec2(1.0, 0.0));
      
      // Add noise to the gradient to make the edge jagged
      // Scale uv for noise granularity
      float n = fbm(vUv * 8.0); 
      
      // The "burn value" is the threshold at which burning happens.
      // We combine distance and noise.
      float burnFront = distFromCorner + n * 0.4; // 0.4 is noise strength
      
      // uTime drives the threshold. 
      // Multiplier determines speed. Offset ensures it starts off-screen.
      // range needs to cover approx 0.0 to 1.8 (diagonal of rect + noise)
      float burnThreshold = uTime * 1.0 - 0.2; 
      
      // Calculate the difference between current state and threshold
      float diff = burnFront - burnThreshold;
      
      // --- Logic ---
      // If diff < 0.0 : Fully Burnt (Transparent/Discard)
      // If diff < 0.05 : Glowing Fire Edge
      // If diff < 0.15 : Charred Black Edge
      // Else : Intact Paper
      
      vec4 finalColor = texColor;
      
      if (diff < 0.0) {
        discard;
      } else if (diff < 0.08) {
        // Ember / Fire
        // Pulse the fire intensity
        float pulse = 0.8 + 0.2 * sin(uTime * 20.0 + vUv.x * 50.0);
        
        // Gradient within the fire strip for inner-white/outer-orange look
        float fireGradient = 1.0 - (diff / 0.08); 
        vec3 fire = mix(uBurnColor, vec3(1.0, 1.0, 0.8), fireGradient * fireGradient);
        
        finalColor = vec4(fire * pulse * 2.0, 1.0); // Boost intensity for bloom-like effect
      } else if (diff < 0.22) {
        // Charred Edge (Black/Brown ash)
        // Lerp from Black to Paper color
        float charGradient = (diff - 0.08) / (0.22 - 0.08);
        vec3 charColor = mix(uAshColor, texColor.rgb * 0.5, charGradient); // Darkened paper
        finalColor = vec4(charColor, 1.0);
      } else {
        // Intact paper, maybe add slight darkening from smoke?
        finalColor = texColor;
      }

      gl_FragColor = finalColor;
      
      // Optional: Tone mapping fix if colors are too bright in THREE > r150
      #include <colorspace_fragment>
    }
  `
);

extend({ BurningPaperMaterial });

// Add type definition for the custom material
// declare global {
//   namespace JSX {
//     interface IntrinsicElements {
//       burningPaperMaterial: Object3DNode<THREE.ShaderMaterial, typeof BurningPaperMaterial> & {
//         uTime?: number;
//         uTexture?: THREE.Texture;
//         uBurnColor?: THREE.Color;
//         uAshColor?: THREE.Color;
//       };
//     }
//   }
// }

export const BurningLoveLetter: React.FC = () => {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  
  // Create texture once
  const paperTexture = useMemo(() => createLoveLetterTexture(), []);

  // Animation Loop
  useFrame((_, delta) => {
    if (materialRef.current) {
      // Progress time. Stop when fully burnt (approx 2.5s)
      if (materialRef.current.uniforms.uTime.value < 2.5) {
         materialRef.current.uniforms.uTime.value += delta * 0.3; // Speed of burn
      }
    }
  });

  return (
    <group rotation={[0, 0, 0]}>
      <mesh position={[0, 0, 0]} rotation={[0, 0, 0]}>
        {/* A4 Aspect Ratio approx 1 : 1.414 */}
        <planeGeometry args={[3, 4.2, 64, 64]} />
        <burningPaperMaterial
          ref={materialRef}
          uTexture={paperTexture}
          transparent={true}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
};