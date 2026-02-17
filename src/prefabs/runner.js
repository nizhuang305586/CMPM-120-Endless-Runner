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
        this.jumpPower = 340
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
        this.projSuccess = 0
        this.projFrameStep = 6
        this.projWindowMax = 5000
        this.projWindowMin = 1500
        this.projDecay = 350
        this.projStepMinPx = 48
        this.projStepMaxPx = 96
        this.forceProjSlide = false
    }

    getProjWindowsMs() {
        return Math.max(this.projWindowMin, this.projWindowMax - this.projSuccess * this.projDecay)
    }

    getProjStepPx() {
        const t = Phaser.Math.Clamp(this.projSuccess / 10, 0, 1)
        return Math.round(Phaser.Math.Linear(this.projStepMinPx, this.projStepMaxPx, t))
    }

    onProjectionSuccess() {
        return this.RunnerSpeed = Math.min(this.RunnerSpeed + this.speedStep, this.maxSpeed)
    }

    onTripOrFreeze() {
        return this.RunnerSpeed = this.baseSpeed
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
            runner.forceProjSlide = false
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
            runner.forceProjSlide = true
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

        runner._projSaved = {
            allowGravity: runner.body.allowGravity,
            vx: runner.body.velocity.x,
            vy: runner.body.velocity.y,
            moves: runner.body.moves,
        }

        runner.body.setAllowGravity(false)
        runner.body.setVelocity(0, 0)
        runner.body.moves = false

        runner.body.reset(runner.x, runner.y)

        scene.physics.world.timeScale = 0.2
        scene.cameras.main.stopFollow()

        this.framesTotal = runner.projFrameStep
        this.windowMs = runner.getProjWindowsMs()
        this.timeLeft = this.windowMs
        this.stepPx = runner.getProjStepPx()

        this.index = 0
        this.sequence = []
        this.spriteFrames = []
        for (let i = 0; i < this.framesTotal; i++) {
            this.sequence.push(Math.random() < 0.5 ? 'A' : 'D')
        }

        const nextMarker = scene.safeZones[0] || null
        const frontX = runner.body ? runner.body.right : runner.getBounds().right

        for (let i = 0; i < this.framesTotal; i++) {
            let baseX = frontX + this.stepPx * (i + 1)
            let targetX = baseX

            if (nextMarker) {
                const aimStrength = 0.2
                targetX = baseX + (nextMarker.x - baseX) * aimStrength
                targetX = Math.max(baseX, targetX)
            }
            
            const startY = runner.y
            const endY = nextMarker ? nextMarker.y : runner.y

            const t = (i + 1) / this.framesTotal
            const arc = 4 * t * (1 - t)
            const arcHeight = 64
            const dir = Math.sign(endY - startY)
            let targetY = Phaser.Math.Linear(startY, endY, t) + (-dir) * arcHeight * arc

            const ghost = scene.add.sprite(targetX, targetY, runner.texture.key)
            ghost.setTint(0x9933ff)
            ghost.setAlpha(0.7)
            ghost.setDepth(9)

            const label = scene.add.text(
                ghost.x,
                ghost.y - 40,
                this.sequence[i],
                { fontSize: '20px', color: '#ffffff'}
            ).setOrigin(0.5)
            label.setDepth(8)

            this.spriteFrames.push({ ghost, label })
        }

        this.projMode = runner.forceProjSlide ? 'slide' : 'run'
        runner.forceProjSlide = false
    }

    execute(scene, runner) {
        this.timeLeft -= scene.game.loop.delta
        if (this.timeLeft <= 0) {
            this.fail(scene, runner)
            return
        }

        let pressed = null
        if (Phaser.Input.Keyboard.JustDown(scene.keys.AKey)) pressed = 'A'
        if (Phaser.Input.Keyboard.JustDown(scene.keys.DKey)) pressed = 'D'
        if (!pressed) return

        if (pressed !== this.sequence[this.index]) {
            this.fail(scene, runner)
            return
        }
        
        this.spriteFrames[this.index].ghost.setTint(0x55ff55)
        const target = this.spriteFrames[this.index].ghost

        scene.tweens.add({
            targets: runner,
            x: target.x,
            y: target.y,
            duration: 90,
            ease: 'Sine.Out',
            onUpdate: () => {
                runner.body.reset(runner.x, runner.y)
            },
            onComplete: () => {
                runner.body.reset(runner.x, runner.y)
            }
        })

        this.index++

        if (this.index >= this.framesTotal) this.success(scene, runner)


    }

    clearGhosts() {
        for (const g of this.spriteFrames) {
            g.ghost.destroy()
            g.label.destroy()
        }
        this.spriteFrames = []
    }

    success(scene, runner) {
        this.clearGhosts()

        scene.physics.world.timeScale = 1
        scene.cameras.main.startFollow(runner)
        scene.cameras.main.setDeadzone(0, 0)
        scene.cameras.main.setFollowOffset(-scene.scale.width * 0.25, 0)

        runner.projSuccess++

        const s = runner._projSaved
        runner.body.moves = s.moves
        runner.body.setAllowGravity(s.allowGravity)
        runner.body.setVelocity(runner.onProjectionSuccess(), s.vy)
        runner._projSaved = null


        this.stateMachine.transition(runner.returnState)
    }

    fail(scene, runner) {

        this.clearGhosts()

        scene.physics.world.timeScale = 1
        scene.cameras.main.startFollow(runner)
        scene.cameras.main.setDeadzone(0, 0)
        scene.cameras.main.setFollowOffset(-scene.scale.width * 0.25, 0)

        runner.projSuccess = 0
        
        const s = runner._projSaved
        runner.body.moves = s.moves
        runner.body.setAllowGravity(s.allowGravity)
        runner.body.setVelocity(runner.onTripOrFreeze(), s.vy)
        runner._projSaved = null

        this.stateMachine.transition('freeze')
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