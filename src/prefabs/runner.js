class runner extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, texture, frame) {
        super(scene, x, y, texture, frame)
        scene.add.existing(this)
        scene.physics.add.existing(this)
    
        this.body.setCollideWorldBounds(true)

        //character values
        this.baseSpeed = 100
        this.jumpPower = 50

        scene.fsm = new StateMachine('run', {
            run: new runState(),
            projection: new projectionState(),
            freeze: new freezeState(),
            trip: new tripState(),
            damage: new damageState(),
        }, [scene, this])
    }

    update() {
        this.fsm.step()
    }
    
}