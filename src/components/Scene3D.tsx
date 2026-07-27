// @ts-nocheck
import { useEffect, useRef } from 'react';
import * as THREE from 'three';

/** A real WebGL scene: two glowing wireframe icosahedra slowly tumbling in
 * space, plus a soft particle field drifting behind them. Sits absolutely
 * positioned behind the hero copy, transparent so the page's own gradient
 * background shows through. */
export function Scene3D() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let width = mount.clientWidth || 1;
    let height = mount.clientHeight || 1;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, width / height, 0.1, 100);
    camera.position.z = 9;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setClearColor(0x000000, 0);
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    mount.appendChild(renderer.domElement);

    const geoBig = new THREE.IcosahedronGeometry(2.5, 1);
    const matBig = new THREE.MeshBasicMaterial({ color: 0x6d8bff, wireframe: true, transparent: true, opacity: 0.55 });
    const meshBig = new THREE.Mesh(geoBig, matBig);
    meshBig.position.set(-2.8, 0.6, -1);
    scene.add(meshBig);

    const geoSmall = new THREE.IcosahedronGeometry(1.4, 1);
    const matSmall = new THREE.MeshBasicMaterial({ color: 0xb06dff, wireframe: true, transparent: true, opacity: 0.5 });
    const meshSmall = new THREE.Mesh(geoSmall, matSmall);
    meshSmall.position.set(3.2, -0.9, -2);
    scene.add(meshSmall);

    const geoTiny = new THREE.OctahedronGeometry(0.7, 0);
    const matTiny = new THREE.MeshBasicMaterial({ color: 0x3fd18f, wireframe: true, transparent: true, opacity: 0.5 });
    const meshTiny = new THREE.Mesh(geoTiny, matTiny);
    meshTiny.position.set(0.8, 1.6, -3);
    scene.add(meshTiny);

    const particleCount = 240;
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 18;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 10 - 2;
    }
    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particleMat = new THREE.PointsMaterial({ color: 0x9db3ff, size: 0.035, transparent: true, opacity: 0.7 });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    let raf = 0;
    let mounted = true;
    const animate = () => {
      if (!mounted) return;
      meshBig.rotation.x += 0.0016;
      meshBig.rotation.y += 0.0023;
      meshSmall.rotation.x -= 0.0021;
      meshSmall.rotation.y += 0.0017;
      meshTiny.rotation.x += 0.003;
      meshTiny.rotation.y -= 0.0026;
      particles.rotation.y += 0.0004;
      renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    };
    animate();

    const onResize = () => {
      if (!mount) return;
      width = mount.clientWidth || 1;
      height = mount.clientHeight || 1;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener('resize', onResize);

    return () => {
      mounted = false;
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      geoBig.dispose();
      matBig.dispose();
      geoSmall.dispose();
      matSmall.dispose();
      geoTiny.dispose();
      matTiny.dispose();
      particleGeo.dispose();
      particleMat.dispose();
      renderer.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={mountRef} className="scene3d" aria-hidden="true" />;
}
