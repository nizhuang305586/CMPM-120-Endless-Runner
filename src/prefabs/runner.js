class Runner extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, texture, frame) {
        super(scene, x, y, texture, frame)
        scene.add.existing(this)
        scene.physics.add.existing(this)
    
        this.body.setCollideWorldBounds(true)

        const baseSpeed = 100
        this.baseSpeed = baseSpeed

        //character values
        this.RunnerSpeed = this.baseSpeed
        this.jumpPower = 200
        this.speedStep = 15
        this.maxSpeed = 500
        this.isSliding = false

        this.worldSpeed = this.RunnerSpeed

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
        scene.worldSpeed = this.worldSpeed
    }

    execute(scene, runner) {
        const JumpKey = scene.keys.SpaceKey
        const SlideKey = scene.keys.SKey
        const FramePKey = scene.keys.FKey

        if (Phaser.Input.Keyboard.JustDown(JumpKey)) {
            this.stateMachine.transition('jump')
            return
        }

        if (SlideKey.isDown) {
            this.stateMachine.transition('slide')
            return
        }

        if (Phaser.Input.Keyboard.JustDown(FramePKey)) {
            this.stateMachine.transition('projection')
            return
        }

        runner.x = runner.anchorX

    }
}

class JumpState extends State {
    enter(scene, runner) {
        if (!runner.body.blocked.down) {
            runner.setVelocityY(-runner.jumpPower)
        }
    }
    execute(scene, runner) {
        const SlideKey = scene.keys.SKey

        if (runner.body.blocked.down) {
            this.stateMachine.transition('run')
            return
        }
    }
}

class SlideState extends State {
    enter(scene, runner) {
        runner.isSliding = true
    }
    execute(scene, runner) {
        const JumpKey = scene.keys.SpaceKey
        const FramePKey = scene.keys.FKey
        
        if (Phaser.Input.Keyboard.JustDown(JumpKey)) {
            this.stateMachine.transition('jump')
            runner.isSliding = false
            runner.body.setSize(32, 48)
            runner.body.setOffset(0, 0)
            return
        }

        if (Phaser.Input.Keyboard.JustDown(FramePKey)) {
            this.stateMachine.transition('projection')
            runner.isSliding = false
            runner.body.setSize(32, 48)
            runner.body.setOffset(0, 0)
            return
        }

        if (!runner.isSliding) {
            this.stateMachine.transition('run')
            runner.isSliding = false
            runner.body.setSize(32, 48)
            runner.body.setOffset(0, 0)
            return
        }

        runner.body.setSize(32, 16)
        runner.body.setOffset(0, 32)
    }
}