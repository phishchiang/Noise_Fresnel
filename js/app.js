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
      100
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
      u_debug: new THREE.Vector2(0.75, 0),
      refraction_ratio: 1.02,
      fresnel_bias: 0.1,
      fresnel_power: 2.0,
      fresnel_scale: 1.0,
    };
    this.gui = new dat.GUI();
    this.gui.add(this.settings, "progress", -1, 2, 0.01);
    this.gui.add(this.settings.u_debug, "x", -1, 2, 0.01);
    this.gui.add(this.settings.u_debug, "y", -1, 2, 0.01);
    this.gui.add(this.settings, "refraction_ratio", -1, 2, 0.01);
    this.gui.add(this.settings, "fresnel_bias", -1, 2, 0.01);
    this.gui.add(this.settings, "fresnel_scale", 0, 2, 0.01);
    this.gui.add(this.settings, "fresnel_power", 0, 2, 0.01);
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

    this.cube_render_target = new THREE.WebGLCubeRenderTarget(256,{
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        format: THREE.RGBAFormat,
        generateMipmaps: true,
        encoding: THREE.sRGBEncoding,
      }
    )

    this.cube_camera = new THREE.CubeCamera(0.1, 10, this.cube_render_target);

    this.mat_big_sphere = new THREE.ShaderMaterial({
      extensions: {
        derivatives: "#extension GL_OES_standard_derivatives : enable"
      },
      side: THREE.DoubleSide,
      uniforms: {
        time: { value: 0 },
        progress: { value: 0.6 },
        u_debug: { value: new THREE.Vector2(0, 0) },
        resolution: { value: new THREE.Vector4() },
      },
      // wireframe: true,
      // transparent: true,
      vertexShader: big_sphere_vs,
      fragmentShader: big_sphere_fs
    });
    
    
    this.geo_big_sphere = new THREE.SphereBufferGeometry(10, 32, 32);
    
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

    this.msh_test = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), new THREE.MeshLambertMaterial({color: 0xff0000}));
    this.scene.add(this.msh_test);
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
    // this.mat_big_sphere.uniforms.progress.value = this.settings.progress;
    // this.msh_test.position.y = this.settings.progress;
    this.mat_small_sphere.uniforms.u_refraction_ratio.value = this.settings.refraction_ratio;
    this.mat_small_sphere.uniforms.u_fresnel_bias.value = this.settings.fresnel_bias;
    this.mat_small_sphere.uniforms.u_fresnel_power.value = this.settings.fresnel_power;
    this.mat_small_sphere.uniforms.u_fresnel_scale.value = this.settings.fresnel_scale;
    if(this.settings.u_debug){
      this.msh_test.position.x = this.settings.u_debug.x;
      this.msh_test.position.y = this.settings.u_debug.y;
    }
    // if(this.settings.u_debug) console.log(this.settings.u_debug.x);

    this.msh_small_sphere.visible = false;
    this.cube_camera.update(this.renderer, this.scene);
    this.msh_small_sphere.visible = true;
    this.mat_small_sphere.uniforms.u_cube.value = this.cube_render_target.texture;

    requestAnimationFrame(this.render.bind(this));
    this.renderer.render(this.scene, this.camera);

  }
}

new Sketch({
  dom: document.getElementById("container")
});
