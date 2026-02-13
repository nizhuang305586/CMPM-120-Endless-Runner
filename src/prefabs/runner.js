class Runner extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, texture, frame) {
        super(scene, x, y, texture, frame)
        scene.add.existing(this)
        scene.physics.add.existing(this)
    
        this.body.setCollideWorldBounds(true)

        const baseSpeed = 100

        //character values
        this.RunnerSpeed = this.baseSpeed
        this.jumpPower = 200
        this.speedStep = 15
        this.maxSpeed = 500

        this.worldSpeed = this.RunnerSpeed
        this.baseSpeed = baseSpeed

        scene.runnerFSM = new StateMachine('run', {
            run: new RunState(),
            jump: new JumpState(),
            slide: new SlideState(),
            projection: new ProjectionState(),
            freeze: new FreezeState(),
            trip: new TripState(),
            damage: new DamageState(),
        }, [scene, this])
    }

    onProjectionSuccess() {
        this.RunnerSpeed = Math.min(this.RunnerSpeed + this.speedStep, this.maxSpeed)
        this.scene.worldSpeed = this.RunnerSpeed
    }

    onTripOrFreeze() {
        this.RunnerSpeed = this.baseSpeed
        this.scene.worldSpeed = this.RunnerSpeed
    }
    
}

class RunState extends State {
    enter(scene, runner) {
        runner.setVelocityX(0)
    }

    execute(scene, runner) {
        const JumpKey = scene.keys.SpaceKey
        const SlideKey = scene.keys.SKey
        const FramePKey = scene.keys.FKey

        if (Phaser.Input.Keyboard.JustDown(JumpKey)) {
            this.stateMachine.transition('jump')
            return
        }

        if (Phaser.Input.Keyboard.JustDown(SlideKey)) {
            this.stateMachine.transition('slide')
            return
        }

        runner.x = runner.anchorX

    }
}

class JumpState extends State {
    execute(scene, runner) {
        const SlideKey = scene.keys.SKey

        if (runner.body.blocked.down) {
            this.stateMachine.transition('run')
            return
        }
    }
}

class SlideState extends State {
    execute(scene, runner) {
        
    }
}