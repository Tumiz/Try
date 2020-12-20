const parseColor = (x) => {
    let t = typeof(x)
    switch(t){
        case 'object':
            if(x.length){
                return new THREE.Color(x[0],x[1],x[2])
            }else{
                return null
            }
        case 'string':
        case 'number':
            return new THREE.Color(x)
        default:
            console.error(x, "is not a color")
            return null
    }
}

const parseRotation = (x) => {
    switch(x.length){
        case 3:
            return new Rotation().setFromEulerNumber(x[0], x[1], x[2])
        case 4:
            return new Rotation(x[0], x[1], x[2], x[3])
        default:
            console.error(x, "is not a rotation")
            return null
    }
}

class Scene extends THREE.Scene {
    constructor() {
        super()
        this.light = new THREE.PointLight(0xffffff, 1);
        this.light.position.set(0, 0, 3000)
        super.add(this.light)
        super.add(new THREE.AxesHelper(5))
        this.objects = new THREE.Object3D()
        super.add(this.objects)
    }
    add() {
        if (arguments.length) {
            for (let object of arguments) {
                this.objects.add(object)
            }
        }
    }
    initPhysics() {
        this.world = new CANNON.World()
        this.world.gravity.set(0, 0, -9.82)
        for (let child of this.objects.children) {
            this.world.addBody(child.initPhysics())
        }
        return this.world
    }
    run(duration, fixedDeltaTime = 10) {
        this.initPhysics()
        const step = () => {
            this.world.step(fixedDeltaTime / 1000)
            for (let child of this.objects.children) {
                if (child.body) {
                    if (child.updatePhysics){
                        child.updatePhysics()
                    }else{
                        child.position.copy(child.body.position)
                        child.quaternion.copy(child.body.quaternion)
                    }
                }
            }
            if (duration > 0) {
                duration -= fixedDeltaTime
            } else {
                clearInterval(timer)
            }
        }
        let timer = setInterval(step, fixedDeltaTime)
        return timer
    }
    set(json) {
        this.objects.clear()
        for (let key in json) {
            if (key.match(/^.*[A-Z]+.*$/)) {
                let data = json[key]
                let object = eval("new " + key + "()")
                this.add(object)
                for (let propKey in data) {
                    if (propKey == 'id') {
                        window[data.id] = object
                    } else {
                        let property = object[propKey]
                        let value = data[propKey]
                        switch(propKey){
                            case 'color':
                                property.copy(parseColor(value))
                                break
                            case 'position':
                            case 'scale':
                                property.copy(new THREE.Vector3(value[0],value[1],value[2]))
                                break
                            case 'rotation':
                                object.quaternion.copy(parseRotation(value))
                                break
                            default:
                                object[propKey] = data[propKey]
                                break
                        }
                    }
                }
            }
        }
    }
}