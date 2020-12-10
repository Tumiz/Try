// Copyright (c) Tumiz.
// Distributed under the terms of the GPL-3.0 License.
var objects = {}
var scene = new THREE.Scene();
scene.background = new THREE.Color(0xFFFFFF)
var fov_y = 60
var aspect = window.innerWidth / window.innerHeight;
var perspCamera = new THREE.PerspectiveCamera(fov_y, aspect, 0.1, 1000);
perspCamera.up.set(0, 0, 1)
perspCamera.position.set(0, 0, 30)
var Z = perspCamera.position.length();
var depht_s = Math.tan(fov_y / 2.0 * Math.PI / 180.0) * 2.0
var size_y = depht_s * Z;
var size_x = depht_s * Z * aspect
var orthoCamera = new THREE.OrthographicCamera(
    -size_x / 2, size_x / 2,
    size_y / 2, -size_y / 2,
    1, 1000);
orthoCamera.up.set(0, 0, 1)
orthoCamera.position.copy(perspCamera.position)
var renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.documentElement.appendChild(renderer.domElement);

var light = new THREE.PointLight(0xffffff, 1);
light.position.set(1000, 1000, 1000)
scene.add(light)
// var gridHelper = new THREE.GridHelper(1000, 1000);
// gridHelper.rotation.set(Math.PI / 2, 0, 0)

scene.add(new THREE.AxesHelper(5))

var controls = new OrbitControls(perspCamera, orthoCamera, renderer.domElement);
var animate = function () {
    light.position.copy(controls.object.position)
    requestAnimationFrame(animate);
    renderer.render(scene, controls.object);
};
animate()
window.requestAnimationFrame(animate);
var raycaster = new THREE.Raycaster();
var mouse = new THREE.Vector2();
var selected = null
var div_info = document.getElementById("info")
var div_play = document.getElementById("btn")
var div_userdefined = document.getElementById("userdefined")
window.onclick = function (event) {

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


function Points2TypedArray(array, typed_array) {
    for (var i = 0; i < array.length; i++) {
        var a = array[i]
        typed_array[i * 3] = a[0]
        typed_array[i * 3 + 1] = a[1]
        typed_array[i * 3 + 2] = a[2]
    }
}

function Cube() {
    var geometry = new THREE.BoxGeometry();
    var material = new THREE.MeshLambertMaterial({ transparent: true });
    var cube = new THREE.Mesh(geometry, material);
    return cube
}
function Sphere() {
    var geometry = new THREE.SphereGeometry(1, 32, 32);
    var material = new THREE.MeshLambertMaterial({ transparent: true, color: 0x00ff00 });
    var obj = new THREE.Mesh(geometry, material);
    return obj
}

function Pipe(cross, path) {
    var length = 12, width = 8;

    var shape = new THREE.Shape();
    for (var i = 0, l = cross.length; i < l; i++) {
        var x = cross[i][0]
        var y = cross[i][1]
        if (i == 0) {
            shape.moveTo(x, y)
        } else {
            shape.lineTo(x, y)
        }
    }
    shape.lineTo(cross[0][0], cross[0][1]);
    var points = []
    for (var i = 0, l = path.length; i < l; i++) {
        var p = path[i]
        points.push(new THREE.Vector3(p[0], p[1], p[2]))
    }
    var curve = new THREE.CatmullRomCurve3(points)
    var extrudeSettings = {
        steps: path.length * 10,
        bevelEnabled: false,
        extrudePath: curve
    };

    var geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    var material = new THREE.MeshLambertMaterial({ color: 0x00ff00 });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.update = function (message) {
        curve.points = []
        for (var i = 0, l = path.length; i < l; i++) {
            var p = path[i]
            curve.points.push(new THREE.Vector3(p[0], p[1], p[2]))
        }
    }
    return mesh
}

function new_object(message) {
    switch (message.class) {
        case "Cube":
            return Cube()
        case "Sphere":
            return Sphere()
        case "XYZ":
            return new THREE.AxesHelper(message.size)
        case "Line":
            return Line()
        case "Cylinder":
            return Cylinder(message.top_radius, message.bottom_radius, message.height)
        case "Pipe":
            return Pipe(message.cross, message.path)
        default:
            return null
    }
}
function update(message, obj) {
    var position = message.position
    var rotation = message.rotation
    var scale = message.scale
    obj.position.set(position[0], position[1], position[2])
    obj.rotation.set(rotation[0], rotation[1], rotation[2])
    obj.scale.set(scale[0], scale[1], scale[2])
    obj.material.color.setRGB(message.color[0], message.color[1], message.color[2])
    obj.material.opacity = message.color[3]
    obj.material.linewidth = message.line_width
    if (obj.update)
        obj.update(message)
}