class Runner extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, texture, frame) {
        super(scene, x, y, texture, frame)
        scene.add.existing(this)
        scene.physics.add.existing(this)
    
        this.body.setCollideWorldBounds(true)

        //character values
        this.baseSpeed = 100
        this.jumpPower = 200

        scene.runnerFSM = new StateMachine('run', {
            run: new RunState(),
            projection: new ProjectionState(),
            slide: new SlideState(),
            freeze: new FreezeState(),
            trip: new TripState(),
            damage: new DamageState(),
        }, [scene, this])
    }


    
}

class RunState extends State {
    enter(scene, runner) {
        runner.setVelocityX(runner.baseSpeed)
    }

    execute(scene, runner) {
        const JumpKey = scene.keys.SpaceKey
        const SlideKey = scene.keys.SKey

        if (Phaser.Input.Keyboard.JustDown(JumpKey)) {
            runner.setVelocityY(-runner.jumpPower)
            this.StateMachine.
        }

        if (Phaser.Input.Keyboard.JustDown(SlideKey)) {
            runner.
        }
    }
}