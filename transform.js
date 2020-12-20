class Rotation extends THREE.Quaternion{
    constructor(x, y, z, w){
        super()
        if(x || y || z){
            this.setFromAxisAngle(new THREE.Vector3(x,y,z),w)
        }
    }
    toEular(order='XYZ'){
        return new THREE.Euler().setFromQuaternion(this, order)
    }
    toEularArray(order='XYZ'){
        return new THREE.Euler().setFromQuaternion(this, order).toArray()
    }
    setFromEulerNumber(x,y,z,order='XYZ'){
        this.setFromEuler(new THREE.Euler(x,y,z,order))
        return this
    }
}