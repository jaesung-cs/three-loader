import * as THREE from 'three';
import { PointCloudOctree, PointSizeType, PointShape } from '../src';
import { Viewer } from './viewer';

require('./main.css');

const targetEl = document.createElement('div');
targetEl.className = 'container';
document.body.appendChild(targetEl);

const viewer = new Viewer();
viewer.initialize(targetEl);

let pointCloud: PointCloudOctree | undefined;
let loaded: boolean = false;

const unloadBtn = document.createElement('button');
unloadBtn.textContent = 'Unload';
unloadBtn.addEventListener('click', () => {
  if (!loaded) {
    return;
  }

  viewer.unload();
  loaded = false;
  pointCloud = undefined;
});

const loadBtn = document.createElement('button');
loadBtn.textContent = 'Load';
loadBtn.addEventListener('click', () => {
  if (loaded) {
    return;
  }

  loaded = true;

  viewer
    .load(
      'cloud.js',
      'https://raw.githubusercontent.com/potree/potree/develop/pointclouds/lion_takanawa/',
    )
    .then(pco => {
      pointCloud = pco;
      pointCloud.rotateX(-Math.PI / 2);

      // Shader options
      pointCloud.material.size = 1.0;
      pointCloud.material.pointSizeType = PointSizeType.ADAPTIVE;
      pointCloud.material.shape = PointShape.PARABOLOID;

      const camera = viewer.camera;
      camera.far = 1000;
      camera.updateProjectionMatrix();
      camera.position.set(0, 0, 10);
      camera.lookAt(new THREE.Vector3());

      viewer.add(pco);
    })
    .catch(err => console.error(err));
});

const slider = document.createElement('input');
slider.type = 'range';
slider.min = String(10_000);
slider.max = String(500_000);
slider.className = 'budget-slider';

slider.addEventListener('change', () => {
  if (!pointCloud) {
    return;
  }

  pointCloud.potree.pointBudget = parseInt(slider.value, 10);
  console.log(pointCloud.potree.pointBudget);
});

const btnContainer = document.createElement('div');
btnContainer.className = 'btn-container';
document.body.appendChild(btnContainer);
btnContainer.appendChild(unloadBtn);
btnContainer.appendChild(loadBtn);
btnContainer.appendChild(slider);

// Highlight picked point
var pickedPointGeometry = new THREE.BufferGeometry();
var pickedPointPosition = new Float32Array(3);
pickedPointGeometry.addAttribute('position', new THREE.BufferAttribute(pickedPointPosition, 3));

var material = new THREE.MeshPhongMaterial();

var pickedPoint = new THREE.Points(pickedPointGeometry, material);
viewer.scene.add(pickedPoint);

pickedPointPosition[0] = 0;
pickedPointPosition[1] = 0;
pickedPointPosition[2] = 0;

// Mouse click event
let mouse = new THREE.Vector2();
document.addEventListener('mousedown', (event: MouseEvent) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;

  console.log('mouse x y: ' + mouse.x + ' ' + mouse.y);

  let pickPoint = viewer.pick(mouse);
  if (pickPoint) {
    if (pickPoint.position) {
      console.log('- position: ' + pickPoint.position.x + ' ' + pickPoint.position.y + ' ' + pickPoint.position.z);
      pickedPointPosition[0] = pickPoint.position.x;
      pickedPointPosition[1] = pickPoint.position.y;
      pickedPointPosition[2] = pickPoint.position.z;
    }
    if (pickPoint.normal) {
      console.log('- normal: ' + pickPoint.normal.x + ' ' + pickPoint.normal.y + ' ' + pickPoint.normal.z);
    }
    if (pickPoint.pointCloud) {
      console.log('- point cloud octree found');
    }
  }
});

// Load point cloud when the page loads
loadBtn.click();
