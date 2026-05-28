# 3. Post-Processing VFX, Spatial Audio, & Performance Targets

## Post-Processing Pass Pipeline
- Pass 1: Selective Unreal Bloom. Set luminosity threshold to 0.22, light scattering radius to 0.75, and edge bleed intensity to 1.6. The lighting must radiate past the bounds of the paper geometry faces into the dark void.
- Pass 2: Corner Vignette and Micro Film Grain (Opacity capped at 0.02).

## Web Audio API 3D Positional Infrastructure
- Audio Listener Matrix: Mount a default THREE.AudioListener node directly onto the main perspective camera instance.
- Positional Sound Nodes: Bind a THREE.PositionalAudio emitter instance directly to each newly loaded Atapattama mesh instance container.
- Sound Profiles: Allocate a low-frequency crackle tracking loop (Mono, raw .ogg file layout) with a strict refDistance threshold of 2.0 units and an inverse linear dropoff rollOffFactor tracking value of 1.4.

## GPU Performance Optimization Targets
- Memory Management: Every background floating lantern mesh instance must map directly into a singular, batched THREE.InstancedMesh matrix index buffer layout.
- Thread Execution: Do NOT read/write any variable properties via native React state hooks inside rendering run loops. All position offsets and rotational increments must mutate directly via ref vector pointer arrays inside the useFrame lifecycle loop.