import * as THREE from "three";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';

import big_sphere_fs from "./shader/big_sphere_fs.glsl";
import big_sphere_vs from "./shader/big_sphere_vs.glsl";
import small_sphere_fs from "./shader/small_sphere_fs.glsl";
import small_sphere_vs from "./shader/small_sphere_vs.glsl";
import * as dat from "dat.gui";
import gsap from "gsap";

export default class Sketch {
  constructor(options) {
    this.scene = new THREE.Scene();

    this.container = options.dom;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.width, this.height);
    this.renderer.setClearColor(0x000000, 1); 
    this.renderer.physicallyCorrectLights = true;
    // this.renderer.outputEncoding = THREE.sRGBEncoding;

    this.gltf_loader = new GLTFLoader();
    this.draco_loader = new DRACOLoader();
    this.draco_loader.setDecoderConfig({ type: 'js' });
    this.draco_loader.setDecoderPath('https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/js/libs/draco/'); // use a full url path
    this.gltf_loader.setDRACOLoader(this.draco_loader);

    this.count = 0;
    this.container.appendChild(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(
      70,
      window.innerWidth / window.innerHeight,
      0.01,
      5
    );


    // var frustumSize = 10;
    // var aspect = window.innerWidth / window.innerHeight;
    // this.camera = new THREE.OrthographicCamera( frustumSize * aspect / - 2, frustumSize * aspect / 2, frustumSize / 2, frustumSize / - 2, -1000, 1000 );
    this.camera.position.set(0, 0, 1.5);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.time = 0;

    this.isPlaying = true;

    this.addObjects();
    this.resize();
    this.render();
    this.setupResize();
    this.settings();
  }

  settings() {
    let that = this;
    this.settings = {
      progress: 0.0,
    };
    this.gui = new dat.GUI();
    this.gui.add(this.settings, "progress", -1, 2, 0.01);
  }

  setupResize() {
    window.addEventListener("resize", this.resize.bind(this));
  }

  resize() {
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.renderer.setSize(this.width, this.height);
    this.camera.aspect = this.width / this.height;
    

    // image cover
    this.imageAspect = 1;
    let a1; let a2;
    if(this.height/this.width>this.imageAspect) {
      a1 = (this.width/this.height) * this.imageAspect ;
      a2 = 1;
    } else{
      a1 = 1;
      a2 = (this.height/this.width) / this.imageAspect;
    }

    this.mat_big_sphere.uniforms.resolution.value.x = this.width;
    this.mat_big_sphere.uniforms.resolution.value.y = this.height;
    this.mat_big_sphere.uniforms.resolution.value.z = a1;
    this.mat_big_sphere.uniforms.resolution.value.w = a2;


    this.camera.updateProjectionMatrix();
  }

  addObjects() {
    let that = this;
    this.mat_big_sphere = new THREE.ShaderMaterial({
      extensions: {
        derivatives: "#extension GL_OES_standard_derivatives : enable"
      },
      side: THREE.DoubleSide,
      uniforms: {
        time: { value: 0 },
        progress: { value: 0.6 },
        resolution: { value: new THREE.Vector4() },
      },
      // wireframe: true,
      // transparent: true,
      vertexShader: big_sphere_vs,
      fragmentShader: big_sphere_fs
    });
    
    
    this.geo_big_sphere = new THREE.SphereBufferGeometry(1.5, 32, 32);
    
    this.msh_big_sphere = new THREE.Mesh(this.geo_big_sphere,this.mat_big_sphere)
    this.scene.add(this.msh_big_sphere)
    
    this.mat_small_sphere = new THREE.ShaderMaterial({
      extensions: {
        derivatives: "#extension GL_OES_standard_derivatives : enable"
      },
      side: THREE.DoubleSide,
      uniforms: {
        time: { value: 0 },
        progress: { value: 0.6 },
        resolution: { value: new THREE.Vector4() },
        u_refraction_ratio: { value: 1.02 },
        u_fresnel_bias: { value: 0.1 },
        u_fresnel_power: { value: 2.0 },
        u_fresnel_scale: { value: 1.0 },
        u_cube: { value: null }
      },
      // wireframe: true,
      // transparent: true,
      vertexShader: small_sphere_vs,
      fragmentShader: small_sphere_fs
    });

    this.geo_small_sphere = new THREE.SphereBufferGeometry(0.4, 32, 32);
    this.msh_small_sphere = new THREE.Mesh(this.geo_small_sphere,this.mat_small_sphere)
    this.scene.add(this.msh_small_sphere)

  }

  stop() {
    this.isPlaying = false;
  }

  play() {
    if(!this.isPlaying){
      this.render()
      this.isPlaying = true;
    }
  }

  render() {
    if (!this.isPlaying) return;
    this.time += 0.05;
    this.mat_big_sphere.uniforms.time.value = this.time;
    this.mat_big_sphere.uniforms.progress.value = this.settings.progress;
    // this.msh_big_sphere.position.y = Math.sin(this.time);
    requestAnimationFrame(this.render.bind(this));
    this.renderer.render(this.scene, this.camera);

  }
}

new Sketch({
  dom: document.getElementById("container")
});
