class Runner extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, texture, frame) {
        super(scene, x, y, texture, frame)
        scene.add.existing(this)
        scene.physics.add.existing(this)
    
        this.body.setCollideWorldBounds(true)

        const baseSpeed = 150
        this.baseSpeed = baseSpeed

        //character values
        this.RunnerSpeed = this.baseSpeed
        this.jumpPower = 400
        this.speedStep = 15
        this.maxSpeed = 500
        this.isSliding = false

        scene.runnerFSM = new StateMachine('run', {
            run: new RunState(),
            jump: new JumpState(),
            slide: new SlideState(),
            projection: new ProjectionState(),
            freeze: new FreezeState(),
            trip: new TripState(),
            damage: new DamageState(),
        }, [scene, this])

        //projection values
        this.returnState = 'run'
        this.projSuccess = 0 //amount of succesful projections
        this.projWindowMax = 5 //starting time for projections
        this.projWindowMin = 1.5 //mininum time given after certain amount of successful projections
        this.projDecay = 0.5 //decay in time every successful projection
        this.projFrameStep = 6 //how many frames
    }


    onProjectionSuccess() {
        this.RunnerSpeed = Math.min(this.RunnerSpeed + this.speedStep, this.maxSpeed)
    }

    onTripOrFreeze() {
        this.RunnerSpeed = this.baseSpeed
    }
    
}

class RunState extends State {
    enter(scene, runner) {
        runner.setVelocityX(runner.RunnerSpeed)
    }

    execute(scene, runner) {
        const JumpKey = scene.keys.SpaceKey
        const SlideKey = scene.keys.SKey
        const FramePKey = scene.keys.FKey

        if (Phaser.Input.Keyboard.JustDown(JumpKey) && runner.body.blocked.down) {
            this.stateMachine.transition('jump')
            return
        }

        if (SlideKey.isDown) {
            this.stateMachine.transition('slide')
            return
        }

        if (Phaser.Input.Keyboard.JustDown(FramePKey)) {
            runner.returnState = 'run'
            this.stateMachine.transition('projection')
            return
        }

        runner.setVelocityX(runner.RunnerSpeed)

    }
}

class JumpState extends State {
    enter(scene, runner) {
        runner.setVelocityX(runner.RunnerSpeed)
        if (runner.body.blocked.down) {
            runner.setVelocityY(-runner.jumpPower)
        }
    }
    execute(scene, runner) {

        if (runner.body.blocked.down) {
            this.stateMachine.transition('run')
            return
        }
        runner.setVelocityX(runner.RunnerSpeed)
    }
}

class SlideState extends State {
    enter(scene, runner) {
        runner.isSliding = true
        runner.setVelocityX(runner.RunnerSpeed)
    }
    execute(scene, runner) {
        const JumpKey = scene.keys.SpaceKey
        const SlideKey = scene.keys.SKey
        const FramePKey = scene.keys.FKey
        
        if (Phaser.Input.Keyboard.JustDown(JumpKey) && runner.body.blocked.down) {
            runner.isSliding = false
            runner.body.setSize(32, 48)
            runner.body.setOffset(0, 0)
            this.stateMachine.transition('jump')
            return
        }

        if (Phaser.Input.Keyboard.JustDown(FramePKey)) {
            runner.returnState = 'slide'
            this.stateMachine.transition('projection')
            return
        }

        if (!SlideKey.isDown) {
            runner.isSliding = false
            runner.body.setSize(32, 48)
            runner.body.setOffset(0, 0)
            this.stateMachine.transition('run')
            return
        }

        runner.setVelocityX(runner.RunnerSpeed)
        runner.body.setSize(32, 16)
        runner.body.setOffset(0, 32)
    }
}

class ProjectionState extends State {
    enter(scene, runner) {
        
    }

    execute(scene, runner) {

    }
}

class FreezeState extends State {
    enter() {

    }

    execute() {

    }
}

class TripState extends State {
    enter() {

    }

    execute() {

    }
}

class DamageState extends State {
    enter() {

    }

    execute() {

    }
}