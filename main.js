// Copyright (c) Tumiz.
// Distributed under the terms of the GPL-3.0 License.
var objects = {}
const scene = new Scene();
scene.background = new THREE.Color(0x111111)
var fov_y = 60
var aspect = canvas.clientWidth / canvas.clientHeight;
const perspCamera = new THREE.PerspectiveCamera(fov_y, aspect, 1, 10000);
perspCamera.up.set(0, 0, 1)
perspCamera.position.set(0, 0, 30)
var Z = perspCamera.position.length();
var depht_s = Math.tan(fov_y / 2.0 * Math.PI / 180.0) * 2.0
var size_y = depht_s * Z;
var size_x = depht_s * Z * aspect
const orthoCamera = new THREE.OrthographicCamera(
    -size_x / 2, size_x / 2,
    size_y / 2, -size_y / 2,
    1, 10000);
orthoCamera.up.set(0, 0, 1)
orthoCamera.position.copy(perspCamera.position)
const renderer = new THREE.WebGLRenderer({
    canvas: canvas
});
renderer.setSize(canvas.clientWidth, canvas.clientHeight);

const controls = new OrbitControls(perspCamera, orthoCamera, renderer.domElement);
const animate = function () {
    scene.light.position.copy(controls.object.position)
    requestAnimationFrame(animate);
    renderer.render(scene, controls.object);
};
animate()
window.requestAnimationFrame(animate);
var raycaster = new THREE.Raycaster();
var mouse = new THREE.Vector2();
var selected = null

window.onresize = () => {
    canvas.style.width = canvas.parentElement.clientWidth
    canvas.style.height = canvas.parentElement.clientHeight
    controls.object.aspect = canvas.clientWidth / canvas.clientHeight
    controls.object.updateProjectionMatrix()
	controls.update()
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
}
window.ondblclick = (event) => {
    controls.object.position.set(0,0,30)
    controls.target.set(0,0,0)
    controls.update()
}
window.onclick = (event) => {

    // calculate mouse position in normalized device coordinates
    // (-1 to +1) for both components

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
    // update the picking ray with the camera and mouse position
    var intersect = pick(mouse)

    // calculate objects intersecting the picking ray
    if (intersect) {
        if (selected) {
            selected.material.wireframe = false
        }
        if (selected != intersect.object) {
            selected = intersect.object
            selected.material.wireframe = true
        } else {
            selected = null
        }
        div_info.innerHTML = infof()
    }
}
window.onkeypress = function (evt) {
    //     console.log({"key":evt.key})
}

function pick(mouse) {
    var intersect = null
    var intersect_range = 1000
    raycaster.setFromCamera(mouse, controls.object)
    for (var i in objects) {
        var obj = objects[i]
        if (new THREE.Vector3().subVectors(obj.position, controls.object.position).length() < intersect_range) {
            var intersects = raycaster.intersectObject(obj);
            if (intersects.length) {
                var d = new THREE.Vector3().subVectors(intersects[0].point, controls.object.position).length()
                if (d < intersect_range) {
                    intersect_range = d
                    intersect = intersects[0]
                }
            }
        }
    }
    return intersect;
}

var time = 0
function infof() {
    return time + " s" + (selected ? "  id:" + selected.pyid
        + "  position:" + selected.position.x.toFixed(3) + "," + selected.position.y.toFixed(3) + "," + selected.position.z.toFixed(3)
        + "  rotation:" + selected.rotation.x.toFixed(3) + "," + selected.rotation.y.toFixed(3) + "," + selected.rotation.z.toFixed(3) : "")
}