"use strict";
(function() {
  THREE.ImageUtils.crossOrigin = '';
  THREE.TextureLoader.crossOrigin = '';

  var ORIGIN = new THREE.Vector3();
  var STAR_COLOR;
  var STAR_BRIGHTNESS_COLOR;
  var BRIGHTNESS;
  var SPEED;

  var controls, scene, camera, renderer, geometry, material, sphere, spriteMaterial, sprite, ambient, urls, cubemap, shader, shaderMaterial, skybox;

  function bvToT(bv) {
    var t;
    if (bv < -0.4) {
      bv = -0.4;
    } else if (bv > 2) {
      bv = 2;
    }
    t = 4600 * (1 / (0.92 * bv + 1.7) + 1 / (0.92 * bv + 0.62));
    return t;
  }

  function tToXyy(t) {
    var x, y, Y = 1;
    if (t >= 1667 && t <= 4000) {
      x = -0.2661239 * (Math.pow(10, 9) / Math.pow(t, 3)) - -0.234358 * (Math.pow(10, 6) / Math.pow(t, 2)) + 0.8776956 * (Math.pow(10, 3) / t) + 0.17991;
    } else if (t >= 4000 && t <= 25000) {
      x = -3.0258469 * (Math.pow(10, 9) / Math.pow(t, 3)) + 2.1070379 * (Math.pow(10, 6) / Math.pow(t, 2)) + 0.2226347 * (Math.pow(10, 3) / t) + 0.24039;
    }
    if (t >= 1667 && t <= 2222) {
      y = -1.1063814 * Math.pow(x, 3) - 1.3481102 * Math.pow(x, 2) + 2.18555832 * x - 0.20219683;
    } else if (t >= 2222 && t <= 4000) {
      y = -0.9549476 * Math.pow(x, 3) - 1.37418593 * Math.pow(x, 2) + 2.09137015 * x - 0.16748867;
    } else if (t >= 4000 && t <= 25000) {
      y = 3.081758 * Math.pow(x, 3) - 5.8733867 * Math.pow(x, 2) + 3.75112997 * x - 0.37001483;
    }
    return [
      x,
      y,
      Y
    ];
  }

  function xyYToXyz(xyY) {
    var X, Y, Z, x = xyY[0],
      y = xyY[1];
    Y = xyY[2];
    X = y === 0 ? 0 : x * Y / y;
    Z = y === 0 ? 0 : (1 - x - y) * Y / y;
    return [
      X,
      Y,
      Z
    ];
  }

  function xyzToRgb(xyz) {
    var r, g, b, x = xyz[0],
      y = xyz[1],
      z = xyz[2];
    r = 3.2406 * x + -1.5372 * y + -0.4986 * z;
    g = -0.9689 * x + 1.8758 * y + 0.0415 * z;
    b = 0.0557 * x + -0.204 * y + 1.057 * z;
    r = r > 1 ? 1 : r;
    g = g > 1 ? 1 : g;
    b = b > 1 ? 1 : b;
    return [
      r,
      g,
      b
    ];
  }

  function gammaCorrect(rgb) {
    var a = 0.055,
      gamma = 2.2,
      R, G, B, r = rgb[0],
      g = rgb[1],
      b = rgb[2];
    R = r;
    G = g / 1.05;
    B = b;
    R = R > 1 ? 1 : R;
    G = G > 1 ? 1 : G;
    B = B > 1 ? 1 : B;
    return [
      Math.round(R * 255),
      Math.round(G * 255),
      Math.round(B * 255)
    ];
  }

  function rgbToHex(rgb) {
    return '#' + rgb[0].toString(16) + rgb[1].toString(16) + rgb[2].toString(16);
    // return parseInt('0x' + rgb[0].toString(16) + rgb[1].toString(16) + rgb[2].toString(16), 16);
  }

  function bvToRgb(bv) {
    var t, xyY, xyz, rgb, crgb;
    t = bvToT(bv);
    xyY = tToXyy(t);
    xyz = xyYToXyz(xyY);
    rgb = xyzToRgb(xyz);
    crgb = gammaCorrect(rgb);
    return crgb;
  }

  var labelContainer = document.getElementById('info-container');

  var label = labelContainer
    .getElementsByClassName('label')[0]
    .getElementsByClassName('data')[0];

  var colorb_v = labelContainer
    .getElementsByClassName('colorb_v')[0]
    .getElementsByClassName('data')[0];

  var lum = labelContainer
    .getElementsByClassName('lum')[0]
    .getElementsByClassName('data')[0];

  var speed = labelContainer
    .getElementsByClassName('speed')[0]
    .getElementsByClassName('data')[0];

  function updateLabels(star) {
    label.innerHTML = star.label;
    colorb_v.innerHTML = star.colorb_v;
    lum.innerHTML = star.lum;
    speed.innerHTML = star.speed;
  }

  function transfromStarData(star) {
    star.color = rgbToHex(bvToRgb(star.colorb_v));

    star.rotation = star.speed / 1000000;

    if (star.lum > 1000) {
      star.brightness = 1;
    } else if (star.lum > 750) {
      star.brightness = 0.9;
    } else if (star.lum > 500) {
      star.brightness = 0.8;
    } else if (star.lum > 250) {
      star.brightness = 0.7;
    } else if (star.lum > 100) {
      star.brightness = 0.6;
    } else if (star.lum > 50) {
      star.brightness = 0.5;
    } else if (star.lum > 15) {
      star.brightness = 0.4;
    } else if (star.lum > 5) {
      star.brightness = 0.3;
    } else if (star.lum > 1) {
      star.brightness = 0.2;
    } else if (star.lum < 0.09) {
      star.brightness = 0.1;
    } else {
      star.brightness = 0.2;
    }

    if (star.colorb_v < 0.7 && star.brightness < 0.5) {
      star.brightness = 0.5;
    }

    // console.log(star.brightness)

    // star.brightness = star.lum;

    return star;
  }

  function updateStar(star) {
    updateLabels(star);

    star = transfromStarData(star);

    console.log(star);

    newStar(star);
  }

  function newStar(star) {
    STAR_COLOR = star.color;
    STAR_BRIGHTNESS_COLOR = STAR_COLOR;
    BRIGHTNESS = star.brightness;

    STAR_BRIGHTNESS_COLOR =
      new THREE.Color(STAR_BRIGHTNESS_COLOR);

    STAR_BRIGHTNESS_COLOR =
      STAR_BRIGHTNESS_COLOR.setHSL(
        STAR_BRIGHTNESS_COLOR.getHSL().h,
        STAR_BRIGHTNESS_COLOR.getHSL().s,
        STAR_BRIGHTNESS_COLOR.getHSL().l * BRIGHTNESS
      );

    SPEED = star.rotation;

    if (sphere) {
      scene.remove(sphere);
      // console.log('removing');
    }

    if (sprite) {
      scene.remove(sprite);
      // console.log('removing');
    }

    if (ambient) {
      scene.remove(ambient);
      // console.log('removing');
    }

    material = new THREE.MeshLambertMaterial({
      color: STAR_COLOR,
      map: THREE.ImageUtils.loadTexture('//s3-us-west-2.amazonaws.com/s.cdpn.io/104946/star_texture.png', null, function() {
        render()
      }),
      emissive: STAR_BRIGHTNESS_COLOR
      //wireframe: true
    });

    sphere = new THREE.Mesh(geometry, material);

    scene.add(sphere);

    spriteMaterial = new THREE.SpriteMaterial({
      map: THREE.ImageUtils.loadTexture('//s3-us-west-2.amazonaws.com/s.cdpn.io/104946/glow.png', null, function() {
        render()
      }),
      useScreenCoordinates: false,
      color: STAR_COLOR,
      opacity: BRIGHTNESS,
      transparent: true,
      blending: THREE.AdditiveBlending
    });

    sprite = new THREE.Sprite(spriteMaterial);

    sprite.scale.set(300, 300, 1);

    sphere.add(sprite);

    ambient = new THREE.AmbientLight(STAR_COLOR);

    scene.add(ambient);
  }

  controls;

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);

  urls = [
    '//s3-us-west-2.amazonaws.com/s.cdpn.io/104946/pos-x.png',
    '//s3-us-west-2.amazonaws.com/s.cdpn.io/104946/neg-x.png',
    '//s3-us-west-2.amazonaws.com/s.cdpn.io/104946/pos-y.png',
    '//s3-us-west-2.amazonaws.com/s.cdpn.io/104946/neg-y.png',
    '//s3-us-west-2.amazonaws.com/s.cdpn.io/104946/pos-z.png',
    '//s3-us-west-2.amazonaws.com/s.cdpn.io/104946/neg-z.png'
  ];

  cubemap = THREE.ImageUtils.loadTextureCube(urls);

  cubemap.format = THREE.RGBFormat;

  // following code from https://github.com/mrdoob/three.js/blob/master/examples/webgl_materials_cubemap.html
  shader = THREE.ShaderLib["cube"];
  shader.uniforms["tCube"].value = cubemap;

  shaderMaterial = new THREE.ShaderMaterial({

    fragmentShader: shader.fragmentShader,
    vertexShader: shader.vertexShader,
    uniforms: shader.uniforms,
    depthWrite: false,
    side: THREE.BackSide

  });

  skybox = new THREE.Mesh(new THREE.BoxGeometry(10000, 10000, 10000), shaderMaterial)

  scene.add(skybox)

  controls = new THREE.OrbitControls(camera);
  controls.damping = 0.2;

  renderer = new THREE.WebGLRenderer();

  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  geometry = new THREE.SphereGeometry(50, 32, 32);

  updateStar({
    colorb_v: 2,
    label: 'Sun',
    speed: 0,
    lum: 0.8913
  });

  camera.position.z = 100;

  function render() {
    requestAnimationFrame(render);

    //  camera.lookAt(ORIGIN);
    animate();

    renderer.render(scene, camera);
  }

  function animate() {
    sphere.rotation.y += SPEED;

    controls.update();
  }

  render();

  window.addEventListener('resize', onWindowResize, false);

  function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);

  }

  window.updateStar = updateStar;
})();

(function() {

  var stars = window.localStorage.getItem('stars');

  function randomStar(stars) {
    var star = stars[Math.floor(Math.random() * stars.length)];

    window.updateStar(star);
  }

  if (stars) {
    stars = JSON.parse(stars);
  }

  if (!stars) {
    $.ajax({
        url: '//s3-us-west-2.amazonaws.com/s.cdpn.io/104946/stars.json',
        method: 'GET',
        crossDomain: true,
        json: true
      })
      .then(function(data) {
        window.localStorage.setItem('stars', JSON.stringify(data));

        //randomStar(data);
        // render();
      })
      .fail(function(err) {
        console.error(err);
      });
  } else {
    //randomStar(stars);
    // render();
  }

  document.getElementById('new').addEventListener('click', function(e) {
    e.preventDefault();

    randomStar(stars);
  }, false);
})();
