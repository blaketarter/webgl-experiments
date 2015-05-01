"use strict";
(function() {
  var controls,
      scene,
      camera,
      renderer,
      directionalLight1,
      directionalLight2,
      stats,
      ambient;

  var elements = [],
      AMBIENT_COLOR = 0x536DFE,
      DIRECTIONAL_COLOR_1 = 0x607D8B,
      DIRECTIONAL_COLOR_2 = 0xFFA000,
      FOG_COLOR = 0x333333,
      ELEMENT_COUNT = 200,
      ELEMENT_INDEX = 0;

  var audio,
      canvas,
      ctx,
      source,
      context,
      analyser,
      fbc_array,
      lastVolume = 0,
      fileInput;

  function initWebGL() {
    window.addEventListener( 'resize', onWindowResize, false );

    THREE.ImageUtils.crossOrigin = '';
    THREE.TextureLoader.crossOrigin = '';

    scene = new THREE.Scene();
    // scene.fog = new THREE.FogExp2( FOG_COLOR, 0.002 );

    camera = new THREE.PerspectiveCamera( 100, window.innerWidth / window.innerHeight, 0.1, 100000 );
    camera.position.set( 0, 0, 15000 );
    // camera.lookAt( new THREE.Vector3(0, 500, 0) );

    controls = new THREE.OrbitControls(camera);
    controls.damping = 0.2;

    for (; ELEMENT_INDEX < ELEMENT_COUNT; ELEMENT_INDEX++) {
      newElement(ELEMENT_INDEX, elements, scene);
    }

    renderer = new THREE.WebGLRenderer( { antialias: false } );
    // renderer.setClearColor( scene.fog.color );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    document.body.appendChild( renderer.domElement );

    ambient = new THREE.AmbientLight( AMBIENT_COLOR );
    scene.add(ambient);

    directionalLight1 = new THREE.DirectionalLight( DIRECTIONAL_COLOR_1 );
    directionalLight1.position.set( 1, 1, 1 );

    scene.add( directionalLight1 );

    directionalLight2 = new THREE.DirectionalLight( DIRECTIONAL_COLOR_2 );
    directionalLight2.position.set( -1, -1, -1 );

    scene.add( directionalLight2 );

    document.getElementsByClassName('loader')[0].style.display = 'none';
  }

  function onFileChange() {
    var file = fileInput.files[0];

    initAudio(URL.createObjectURL(file));
  }

  function initAudio(src) {
    audio = document.getElementById('player');
    // audio = new Audio();
    audio.src = src;
    audio.controls = true;
    audio.loop = true;
    audio.autoplay = false;

    // document.body.appendChild(audio);
    if (!analyser) {
      context = new AudioContext();
      analyser = context.createAnalyser();
      source = context.createMediaElementSource(audio);
      source.connect(analyser);
      analyser.connect(context.destination);
    }
  }

  function newElement(position, elements, scene) {
    var geometry,
        material,
        mesh;

    geometry = new THREE.SphereGeometry( 5, 32, 32 );
    material =  new THREE.MeshLambertMaterial( { color: 0xffffff, shading: THREE.FlatShading } );

    mesh = new THREE.Mesh( geometry, material );

    console.log((position * 225) - 500);

    mesh.position.set( (position * 225) - 15000, 0, 0 );

    scene.add(mesh);
    elements.push(mesh);
  }

  function initStats() {
    stats = new Stats();
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.top = '0px';
    stats.domElement.style.right = '0px';
    stats.domElement.style.zIndex = 100;
    document.body.appendChild( stats.domElement );
  }

  function render() {
    requestAnimationFrame( render );
    animate();

    stats.update();
    renderer.render( scene, camera );
  }

  function animate() {
    var i = 0,
        ii,
        e = 0,
        ee = ELEMENT_COUNT,
        seperation,
        volume = 0;

    controls.update();

    if (analyser) {
      fbc_array = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(fbc_array);

      ii = fbc_array.length;

      seperation = Math.floor(1024 / ELEMENT_COUNT);

      for (; e < ee; e++) {
        i = e * seperation;

        volume = fbc_array[i];

        // if (volume) {
        //   volume = volume  + (i * 0.1)
        // }

        // if (fbc_array[i - seperation]) {
        //   volume += fbc_array[i - seperation];
        //
        //   volume = volume / 2;
        // }
        //
        // if (fbc_array[i + seperation]) {
        //   volume += fbc_array[i + seperation];
        //
        //   volume = volume / 2;
        // }

        volume = volume / 10;

        if (volume > 45) {
          volume = 45;
        } else if (volume < 0) {
          volume = 0;
        }

        if (volume) {
          elements[e].position.y = volume * 500;
          elements[e].scale.set( volume, volume, volume );
          elements[e].volume = volume;
        } else {
          elements[e].volume = (0 - elements[e.volume]) * 0.01;
          elements[e].position.y = elements[e].volume * 500;
          elements[e].scale.set( elements[e].volume, elements[e].volume, elements[e].volume );
        }
      }
    }
  }

  function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );
  }

  fileInput = document.getElementById('file')

  fileInput.addEventListener('change', onFileChange, false);

  // initAudio();

  initWebGL();

  initStats();

  render();
})();
