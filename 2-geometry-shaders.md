# 2. Cultural Geometry Definition & WebGL Custom Shaders

## Atapattama Procedural Modeling Guardrails
- Core Body: Initialize an isolated boxGeometry vector space exactly scaled to [1, 1, 1].
- Pyramidal Face Caps: Affix 8 uniform coneGeometry modules (4 segments, radial calculation matched to box diagonals) functioning as symmetric triangular cap peaks mapped to all outer box coordinate normals.
- Internal Skeleton: Layer an auxiliary wireframe mesh layer using material configurations color: '#3d2100', wireframe: true, opacity: 0.35, offset slightly inward to visually simulate the underlying hand-cut bamboo structural frame (Bata Koora).
- Hanging Tassels (Rali): Model four distinct narrow subdivided planeGeometry strips anchored directly to the 4 lowest corner vectors of the central box body.

## GLSL Custom Shader Matrices

### Fragment Shader: Subsurface Tissue Paper Glow (Saviya)
- Goal: Implement a real-time Fresnel rim-lighting edge falloff calculation simulating internal light penetration.
- Uniform Inputs: Pass uTime (float), uGlowColor (vec3), and uPaperColor (vec3).
- Math Constraint: Inside the main pipeline, construct an unpredictable candle flickering amplitude value mixing three distinct high-frequency sine equations modulated by an interpolated 2D noise mask:
  float flicker = sin(uTime * 5.2) * cos(uTime * 3.1) * 0.12 + 0.88;

### Vertex Shader: Fluid Kinetic Tails
- Goal: Displace plane vertices to represent physical movement dynamically on the GPU.
- Wave Model: Mutate the x and z coordinate points over time relative to their height using this exact calculation:
  position.x += sin(position.y * 2.5 + uTime * 3.0) * 0.08 * (1.0 - uv.y);
- Anchor Factor: Multiplying by (1.0 - uv.y) locks the top margins to the rigid frame while allowing the lower fabric points to flow freely.