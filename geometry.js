class Grid extends THREE.LineSegments {
	static attributes(step, divisions, centerLineColor, commonLineColor) {
		const center = divisions / 2;
		const halfSize = step * divisions / 2;
		const vertices = []
		const colors = [];
		for (let i = 0, j = 0, k = - halfSize; i <= divisions; i++, k += step) {
			vertices.push(- halfSize, 0, k, halfSize, 0, k);
			vertices.push(k, 0, - halfSize, k, 0, halfSize);
			const color = i === center ? centerLineColor : commonLineColor;

			color.toArray(colors, j); j += 3;
			color.toArray(colors, j); j += 3;
			color.toArray(colors, j); j += 3;
			color.toArray(colors, j); j += 3;

		}
		return {
			"vertices": vertices,
			"colors": colors
		}
	}
	constructor(step, divisions, centerLineColor, commonLineColor) {
		step = step || 1;
		divisions = divisions || 10;
		centerLineColor = new THREE.Color(centerLineColor !== undefined ? centerLineColor : 0x444444);
		commonLineColor = new THREE.Color(commonLineColor !== undefined ? commonLineColor : 0x888888);
		const attributes = Grid.attributes(step, divisions, centerLineColor, commonLineColor)
		const geometry = new THREE.BufferGeometry();
		geometry.setAttribute('position', new THREE.Float32BufferAttribute(attributes.vertices, 3));
		geometry.setAttribute('color', new THREE.Float32BufferAttribute(attributes.colors, 3));
		const material = new THREE.LineBasicMaterial({ vertexColors: true, toneMapped: false });
		super(geometry, material)
		this.centerLineColor = centerLineColor
		this.commonLineColor = commonLineColor
	}
	set(step, divisions) {
		const attributes = Grid.attributes(step, divisions, this.centerLineColor, this.commonLineColor)
		this.geometry.setAttribute('position', new THREE.Float32BufferAttribute(attributes.vertices, 3));
		this.geometry.setAttribute('color', new THREE.Float32BufferAttribute(attributes.colors, 3));
		this.geometry.colorsNeedUpdate = true
		this.geometry.verticesNeedUpdate = true
		this.geometry.computeBoundingSphere()
	}
}

class Line extends THREE.Line {
	constructor() {
		let geometry = new THREE.BufferGeometry()
		const material = new THREE.LineBasicMaterial()
		super(geometry, material)
		this.color = this.material.color
		this.lineWidth = this.material.linewidth
		this.points = []
	}
	set(points) {
		this.points = points
		this.geometry.setFromPoints(points)
	}
	add(point) {
		this.points.push(point)
		this.geometry.setFromPoints(this.points)
	}
}

class Cylinder extends THREE.Mesh {
	axis_ = new THREE.Vector3(0, 1, 0)
	topCenter_ = new THREE.Vector3(0, -1, 0)
	bottomCenter_ = new THREE.Vector3(0, 1, 0)
	constructor() {
		var geometry = new THREE.CylinderGeometry(1, 1, 2, 32)
		const material = new THREE.MeshLambertMaterial({ transparent: true, color: "grey" });
		super(geometry, material)
		this.color = this.material.color
	}
	get axis() {
		return this.axis_
	}
	set axis(value) {
		this.axis_.copy(value.normalize())
		var axis = new THREE.Vector3().crossVectors(this.up, value).normalize()
		var angle = this.up.angleTo(value)
		this.setRotationFromAxisAngle(axis, angle)
	}
	get radiusTop() {
		return this.geometry.parameters.radiusTop
	}
	set radiusTop(value) {
		this.geometry = new THREE.CylinderGeometry(value, this.geometry.parameters.radiusBottom, this.geometry.parameters.height, this.geometry.parameters.radialSegments)
	}
	get radiusBottom() {
		return this.geometry.parameters.radiusBottom
	}
	set radiusBottom(value) {
		this.geometry = new THREE.CylinderGeometry(this.geometry.parameters.radiusTop, value, this.geometry.parameters.height, this.geometry.parameters.radialSegments)
	}
	get height() {
		return this.geometry.parameters.height
	}
	set height(value) {
		this.geometry = new THREE.CylinderGeometry(this.geometry.parameters.radiusTop, this.geometry.parameters.radiusBottom, value, this.geometry.parameters.radialSegments)
	}
	get topCenter() {
		return this.topCenter_
	}
	set topCenter(value) {
		this.topCenter_.copy(value)
		this.position.copy(new THREE.Vector3().subVectors(value, this.axis.multiplyScalar(this.geometry.parameters.height / 2)))
	}
	get bottomCenter() {
		return this.bottomCenter
	}
	set bottomCenter(value) {
		this.bottomCenter.copy(value)
		this.position.copy(new THREE.Vector3().addVectors(value, this.axis.multiplyScalar(this.geometry.parameters.height / 2)))
	}
}

class Sphere extends THREE.Mesh {
	constructor() {
		var geometry = new THREE.SphereGeometry(1, 32, 32);
		const material = new THREE.MeshLambertMaterial({ transparent: true, color: 0x00ff00 });
		super(geometry, material)
		this.color = this.material.color
		this.body = new CANNON.Body({
			mass: 1,
			position: new CANNON.Vec3(),
			shape: new CANNON.Sphere(this.radius)
		})
	}
	get radius() {
		return Math.max(this.scale.x, this.scale.y, this.scale.z)
	}
	set radius(value) {
		this.scale.set(value, value, value)
	}
}

class Plane extends THREE.Mesh {
	constructor() {
		const geometry = new THREE.PlaneBufferGeometry(5, 5);
		const material = new THREE.MeshBasicMaterial({ color: 0xFFFFFF, side: THREE.DoubleSide });
		super(geometry, material)
		this.color = this.material.color
		this.body = new CANNON.Body({
			mass: 0,
			position: new CANNON.Vec3(),
			shape: new CANNON.Plane()
		})
	}
	get width() {
		return this.geometry.parameters.width
	}
	set width(value) {
		if (value != this.geometry.parameters.width) {
			this.geometry = new THREE.PlaneBufferGeometry(value, this.geometry.parameters.height)
		}
	}
	get height() {
		return this.geometry.parameters.height
	}
	set height(value) {
		if (value != this.geometry.parameters.height) {
			this.geometry = new THREE.PlaneBufferGeometry(this.geometry.parameters.width, value)
		}
	}
}

class Box extends THREE.Mesh {
	constructor() {
		const geometry = new THREE.BoxGeometry();
		const material = new THREE.MeshLambertMaterial({ transparent: true });
		super(geometry, material);
		this.color = this.material.color
		this.body = new CANNON.Body({
			mass: 1,
			position: new CANNON.Vec3(),
			shape: new CANNON.Box(new CANNON.Vec3(0.5, 0.5, 0.5))
		})
	}
}

class Scene extends THREE.Scene {
	constructor() {
		super()
		this.world = new CANNON.World()
		this.world.gravity.set(0, 0, -9.82)
		// this.world.broadphase = new CANNON.NaiveBroadphase()
	}
	add() {
		if (arguments.length) {
			for (let object of arguments) {
				super.add(object)
				if (object.body) {
					this.world.addBody(object.body)
				}
			}
		}
	}
	step(fixedDeltaTime) {
		for (let child of this.children) {
			if (child.body) {
				child.body.position.copy(child.position)
				child.body.quaternion.copy(child.quaternion)
			}
		}
		this.world.step(fixedDeltaTime)
		for (let child of this.children) {
			if (child.body) {
				child.position.copy(child.body.position)
				child.quaternion.copy(child.body.quaternion)
			}
		}
	}
	run(fixedDeltaTime) {
		for (let child of this.children) {
			if (child.body) {
				child.body.position.copy(child.position)
				child.body.quaternion.copy(child.quaternion)
			}
		}
		if (fixedDeltaTime) {
			const step = () => {
				this.world.step(fixedDeltaTime)
				for (let child of this.children) {
					if (child.body) {
						child.position.copy(child.body.position)
						child.quaternion.copy(child.body.quaternion)
					}
				}
			}
			return setInterval(step, fixedDeltaTime)
		}
		return -1
	}
}
