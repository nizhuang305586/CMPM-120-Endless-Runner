class Runner extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, texture, frame) {
        super(scene, x, y, texture, frame)
        scene.add.existing(this)
        scene.physics.add.existing(this)
    
        this.body.setCollideWorldBounds(true)

        this.freezeSFX = scene.sound.add('Freeze')

        const baseSpeed = 150
        this.baseSpeed = baseSpeed
        this.setScale(0.24)
        this.setSize(100, 200)

        //character values
        this.RunnerSpeed = this.baseSpeed
        this.jumpPower = 400
        this.tookDamage = 500
        this.speedStep = 15
        this.maxSpeed = 500
        this.isSliding = false
        this.runAnimPlaying = false

        scene.runnerFSM = new StateMachine('run', {
            run: new RunState(),
            jump: new JumpState(),
            projection: new ProjectionState(),
            freeze: new FreezeState(),
            damage: new DamageState(),
        }, [scene, this])

        //projection values
        this.returnState = 'run'
        this.projSuccess = 0
        this.projFrameStep = 6
        this.projWindowMax = 5000
        this.projWindowMin = 2500
        this.projDecay = 350
        this.projStepMinPx = 48
        this.projStepMaxPx = 96
        this.currentStepPx = 48
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
        console.log('Run State')
        runner.anims.play('run', true)
        runner.runAnimPlaying = true
        runner.setVelocityX(runner.RunnerSpeed)
    }

    execute(scene, runner) {
        const JumpKey = scene.keys.SpaceKey
        const FramePKey = scene.keys.FKey

        if (Phaser.Input.Keyboard.JustDown(JumpKey) && runner.body.blocked.down) {
            this.stateMachine.transition('jump')
            return
        }

        if (Phaser.Input.Keyboard.JustDown(FramePKey)) {
            runner.returnState = 'run'
            this.stateMachine.transition('projection')
            return
        }

        if (runner.body.velocity.y > 0) {
            runner.anims.play('fall', true)
            runner.runAnimPlaying = false
        } else if (!runner.runAnimPlaying) {
            runner.anims.play('run', true)
            runner.runAnimPlaying = true
        }

        runner.setVelocityX(runner.RunnerSpeed)

    }
}

class JumpState extends State {
    enter(scene, runner) {
        console.log("Jump State")
        runner.anims.play('jump', true)
        runner.setVelocityX(runner.RunnerSpeed)
        runner.setVelocityY(-runner.jumpPower)
    }
    execute(scene, runner) {
        const FramePKey = scene.keys.FKey

        if (runner.body.velocity.y >= 0 && runner.body.blocked.down) {
            this.stateMachine.transition('run')
            return
        }

        if (Phaser.Input.Keyboard.JustDown(FramePKey)) {
            this.stateMachine.transition('projection')
            return
        }

        runner.setVelocityX(runner.RunnerSpeed)
    }
}

class ProjectionState extends State {
    enter(scene, runner) {

        //-----------------------------------------
        //Save + freeze current physics
        //-----------------------------------------
        runner._projSaved = {
            allowGravity: runner.body.allowGravity,
            vx: runner.body.velocity.x,
            vy: runner.body.velocity.y,
            moves: runner.body.moves,
        }

        runner.anims.stop()

        runner.body.setAllowGravity(false)
        runner.body.setVelocity(0, 0)
        runner.body.moves = false
        runner.body.reset(runner.x, runner.y)

        scene.physics.world.timeScale = 0.2
        scene.cameras.main.stopFollow()

        //-----------------------------------------
        //Projection Params
        //-----------------------------------------
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


        //-----------------------------------------
        //Projection Reach scales with speed
        //-----------------------------------------
        let MIN_AHEAD = this.stepPx
        let MAX_Y_REACH = this.stepPx * this.framesTotal
        const CURVE_THRESHOLD = 16

        const frontX = runner.body ? runner.body.right : runner.getBounds().right
        const startY = runner.y

        const bodyCenterOffsetX = runner.body.center.x - runner.x
        const bodyCenterOffsetY = runner.body.center.y - runner.y

        const solidLayers = scene.solidLayers || []


        const getCollideTile = (x, y) => {
            for (const L of solidLayers) {
                if (!L) continue
                const t = L.getTileAtWorldXY(x, y, true)
                if (t && t.collides) return t
            }

            return null
        }

        const frameBlocked = (x, y) => {
            if (!runner.body || solidLayers.length === 0) return false

            //Conver srpite position to body center position
            const cx = x + bodyCenterOffsetX
            const cy = y + bodyCenterOffsetY

            const w = runner.body.width
            const h = runner.body.height
            const left = cx - w * 0.5
            const top = cy - h * 0.5

            for (const L of solidLayers) {
                if (!L) continue
                const tiles = L.getTilesWithinWorldXY(left, top, w, h, { isNotEmpty: true })
                if (tiles && tiles.some(t => t && t.collides)) return true
            }
            return false
        }

        const segmentClear = (ax, ay, bx, by) => {
            const dist = Phaser.Math.Distance.Between(ax, ay, bx, by)
            const step = 6  // px between samples (4–8 is good)
            const n = Math.max(1, Math.ceil(dist / step))

            for (let s = 1; s <= n; s++) {
                const t = s / n
                const x = Phaser.Math.Linear(ax, bx, t)
                const y = Phaser.Math.Linear(ay, by, t)
                if (frameBlocked(x, y)) return false
            }
            return true
        }

        const nudgeX = (x, y, minX) => {
            if (solidLayers.length === 0) return x
            if (!frameBlocked(x, y)) return x

            const maxNudge = 32

            // Prefer forward nudges first (never collapses spacing)
            for (let d = 8; d <= maxNudge; d += 8) {
                const xf = x + d
                if (!frameBlocked(xf, y)) return Math.max(xf, minX)
            }

            // If you really need backward nudges, still never allow going behind minX
            for (let d = 8; d <= maxNudge; d += 8) {
                const xb = x - d
                if (!frameBlocked(xb, y)) return Math.max(xb, minX)
            }

            return null
        }

        const snapToGround = (x, y) => {
            if (solidLayers.length === 0) return { y, snapped: false }

            const MAX_DOWN = 80
            const SNAP_DIST = 16

            const cx = x + bodyCenterOffsetX
            const cy = y + bodyCenterOffsetY

            const footY = cy + runner.body.height * 0.5

            for (let off = 0; off <= MAX_DOWN; off += 8) {
                const yTry = footY + off
                const tile = getCollideTile(cx, yTry)
                if (!tile || !tile.collides) continue

                const tileTop = tile.getTop()
                const dist = tileTop - footY
                if (dist > SNAP_DIST) return { y, snapped: false }

                const ySnap = tileTop - runner.body.height / 2

                const ySnapSprite = ySnap - bodyCenterOffsetY
                // reject if you'd still be embedded at the snapped pose (hopefully rejects :/)
                if (frameBlocked(x, ySnapSprite)) return { y, snapped: false }

                return { y: ySnapSprite, snapped: true }
            }

            return { y, snapped: false }
        }

        //build ONE frame position using the current rules
        //(used both for validating markers and for the real ghosts)

        const computeFrame = (endY, dy, aimOffsetX, i, prevX) => {
            const t = (i + 1) / this.framesTotal

            const baseX = frontX + this.stepPx * (i + 1)
            let x = baseX + aimOffsetX
            x = Math.max(baseX, x)

            let y = Phaser.Math.Linear(startY, endY, t)

            //making sure its always concave down/ height arc
            if (Math.abs(dy) >= CURVE_THRESHOLD) {
                const arc = 4 * t * (1 - t)
                const arcHeight = Phaser.Math.Clamp(Math.abs(dy) * 0.6, 24, 90)

                const h0 = -startY
                const h1 = -endY
                let h = Phaser.Math.Linear(h0, h1, t)
                h += arcHeight * arc
                y = -h
            }
            
            //gentle snap
            const snap = snapToGround(x, y)
            y = snap.y

            if (prevX != null) {
                x = Math.max(x, prevX + this.stepPx)
            }


            //nudge off collisions
            const nx = nudgeX(x, y, baseX)
            if (nx === null) return null
            x = nx

            if (frameBlocked(x, y)) return null

            return { x, y }
        }

        const chainEndX = frontX + this.stepPx * this.framesTotal
        const aimStrength = 0.2

        const aimForMarker = (m) => Phaser.Math.Clamp((m.x - chainEndX) * aimStrength, -32, 32)

        const markerReachable = (marker) => {
            const endY = marker.y
            const dy = endY - startY
            const aimOffsetX = aimForMarker(marker)

            let prev = { x: runner.x, y: runner.y }

            for (let i = 0; i < this.framesTotal; i++) {
                const p = computeFrame(endY, dy, aimOffsetX, i, prev.x)
                if (!p) return false

                // NEW: reject if you'd have to pass through a solid to reach this frame
                if (!segmentClear(prev.x, prev.y, p.x, p.y)) return false

                prev = p
            }
            return true
        }

        const airborne = runner.body && !runner.body.blocked.down
        const vy = runner.body ? runner.body.velocity.y : 0

        const UP_GRACE = 12
        const DOWN_GRACE = 24

         //choose only valid forward marker
        const zoneCandidates = (scene.safeZones || [])
            .filter(z => z.x >= frontX + MIN_AHEAD)
            .filter(z => Math.abs(z.y - startY) <= MAX_Y_REACH)
            .filter(z => {
                if (!airborne) return true

                const dy = z.y - startY

                //If rising, dont pick any targets below
                if (vy < -5) return dy <= -DOWN_GRACE

                //If falling, don't pick any targets above
                if (vy > 5) return dy >= -UP_GRACE

                return true
            })
            .sort((a, b) => a.x - b.x)

        let nextMarker = null
        for (const m of zoneCandidates) {
            if (markerReachable(m)) {
                nextMarker = m
                break
            }
        }

        const endY = nextMarker ? nextMarker.y : startY
        const dy = endY - startY
        const aimOffsetX = nextMarker ? aimForMarker(nextMarker) : 0

        let prevX = null
        for (let i = 0; i < this.framesTotal; i++) {
            const p = computeFrame(endY, dy, aimOffsetX, i, prevX)
            
            //if a frame becomes invalid, clamp near runner rather than stretching
            const x = p ? p.x : (frontX + this.stepPx * (i + 1))
            const y = p ? p.y : Phaser.Math.Clamp(Phaser.Math.Linear(startY, endY, (i + 1) / this.framesTotal), startY - 140, startY + 140)

            prevX = x
            
            const ghostFrame = scene.add.sprite(x, y, 'naoya', i)
            ghostFrame.setScale(0.24)
            ghostFrame.setTint(0x9933ff)
            ghostFrame.setAlpha(0.8)
            ghostFrame.setDepth(9)

            const label = scene.add.text(
                ghostFrame.x,
                ghostFrame.y - 40,
                this.sequence[i],
                { fontSize: '20px', color: this.sequence[i] === 'A' ? '#FFFFFF' : '#000000', fontStyle: 'bold'}
            ).setOrigin(0.5)
            label.setDepth(8)
            this.spriteFrames.push({ ghostFrame, label })
        }
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
        
        this.spriteFrames[this.index].ghostFrame.setTint(0x55ff55)
        const target = this.spriteFrames[this.index].ghostFrame

        scene.tweens.add({
            targets: runner,
            x: target.x,
            y: target.y,
            duration: 90,
            ease: 'Sine.Out',
            onUpdate: () => {
                runner.setFrame(this.index - 1)
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
            g.ghostFrame.destroy()
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
    enter(scene, runner) {
        this.timeLeft = 1500

        runner.freezeSFX.play()
        runner.setVelocity(0, 0)

        scene.freezeFrame.setVisible(true)
        runner.setAlpha(0.9)
    }

    execute(scene, runner) {
        this.timeLeft -= scene.game.loop.delta
        if (this.timeLeft <= 0) {
            scene.freezeFrame.setVisible(false)
            runner.clearTint()
            this.stateMachine.transition('run')
            return
        }

    }
}

class DamageState extends State {
    enter(scene, runner) {
        if (scene.freezeFrame.setVisible() !== false)
            scene.freezeFrame.setVisible(false)
        
        runner.body.setVelocityY(-runner.tookDamage)
        runner.body.setVelocityX(runner.onTripOrFreeze())

        runner.projSuccess = 0
        
        scene.tweens.add({
            targets: runner,
            alpha: 0.5,
            duration: 90,
            ease: 'Power1',
            yoyo: true,
            repeat: 5,
            onComplete: () => {
                runner.setAlpha(1)
            }
        })

        runner.setAlpha(1)
        this.stateMachine.transition('jump')
        return
    }

    execute() {

    }
}