class Play extends Phaser.Scene {
    constructor() {
        super('Play')
    }

    create() {

        this.isGameOver = false
        this.chunkColliders = []

        this.physics.resume()
        this.physics.world.resume()
        this.physics.world.timeScale = 1
        this.physics.world.gravity.y = 0


        //audio
        this.bgMusic = this.sound.add('bgMuix', { loop: true })
        this.bgMusic.play()
        this.bgMusic.setVolume(0.1)

        //game background
        const { width, height } = this.scale

        // Deep space gradient background
        this.cameras.main.setBackgroundColor('#0b1020')

        // Subtle gradient overlay
        const bgGradient = this.add.graphics().setScrollFactor(0).setDepth(-300)

        bgGradient.fillGradientStyle(
            0x0b1020, 0x0b1020,   // top left / right
            0x1b255a, 0x1b255a,   // bottom left / right
            1
        )

        bgGradient.fillRect(0, 0, width, height)


        // Star field
        this.stars = this.add.graphics().setScrollFactor(0).setDepth(-250)

        for (let i = 0; i < 120; i++) {
            this.stars.fillStyle(0xffffff, Phaser.Math.FloatBetween(0.08, 0.35))
            this.stars.fillCircle(
                Phaser.Math.Between(0, width),
                Phaser.Math.Between(0, height),
                Phaser.Math.Between(1, 2)
            )
        }


        this.bg = this.add.tileSprite(
            0, 0,
            this.scale.width, this.scale.height,
            'Mountains'
        ).setOrigin(0, 0).setScrollFactor(0)

        this.bg.setDepth(2)
        this.bg.y -= 60
        this.bgSpeed = 0.2

        //anims
        this.anims.create({
            key: 'run',
            frames: this.anims.generateFrameNumbers('naoya', { start: 0, end: 7 }),
            frameRate: 12,
            repeat: -1
        })

        this.anims.create({
            key: 'jump',
            frames: this.anims.generateFrameNumbers('naoya', { start: 8, end: 9 }),
            frameRate: 6,
            repeat: 0
        })

        this.anims.create({
            key: 'fall',
            frames: this.anims.generateFrameNumbers('naoya', { start: 9 }),
            frameRate: 1,
            repeat: 0
        })

        this.anims.create({
            key: 'sprint',
            frames: this.anims.generateFrameNumbers('naoya', {start: 10, end: 15}),
            frameRate: 12,
            repeat: -1
        })

        this.scoreText = this.add.text(16, 16, '', {
            fontFamily: 'monospace',
            fontSize: '18px',
            color: '#ffffff',
        }).setScrollFactor(0).setDepth(9999)

        this.comboText = this.add.text(16, 40, '', {
            fontFamily: 'monospace',
            fontSize: '16px',
            color: '#ffd37a'
        }).setScrollFactor(0).setDepth(9999)

        this.heartsText = this.add.text(16, 64, '', {
            fontFamily: 'monospace',
            fontSize: '18px',
            color: '#ff6b6b'
        }).setScrollFactor(0).setDepth(99999)

        this.scoreText.setShadow(2, 2, '#000000', 2, true, true)
        this.comboText.setShadow(2, 2, '#000000', 2, true, true)
        this.heartsText.setShadow(2, 2, '#000000', 2, true, true)

        this.uiCam = this.cameras.add(0, 0, this.scale.width, this.scale.height)
        this.uiCam.setScroll(0, 0)
        this.uiCam.setZoom(1)

        this.cameras.main.ignore([this.scoreText, this.comboText, this.heartsText])

        const hudOnly = new Set([this.scoreText, this.comboText, this.heartsText])
        const everything = this.children.list.filter(obj => !hudOnly.has(obj))
        this.uiCam.ignore(everything)


        //key inputs
        this.keys = this.input.keyboard.addKeys({
            AKey: Phaser.Input.Keyboard.KeyCodes.A,
            DKey: Phaser.Input.Keyboard.KeyCodes.D,
            FKey: Phaser.Input.Keyboard.KeyCodes.F,
            SpaceKey: Phaser.Input.Keyboard.KeyCodes.SPACE,
            DebugKey: Phaser.Input.Keyboard.KeyCodes.G
        })

        //constants
        this.TILE = 16
        this.CHUNK_W_TILES = 48
        this.CHUNK_H_TILES = 32
        this.CHUNK_W_PX = this.TILE * this.CHUNK_W_TILES
        this.CHUNK_H_PX = this.TILE * this.CHUNK_H_TILES
        this.PRELOAD_BUFFER = 600

        //runtime state
        this.oldKey = null
        this.activeChunks = []
        this.safeZones = []
        this.solidLayers = []
        this.worldEndX = 0
        this.chunkKeys = ['chunk2', 'chunk3']

        const { runnerSP } = this.spawnChunk('chunk1', 0)

        //create the runner
        this.runner = new Runner(this, runnerSP.x, runnerSP.y, 'naoya', 0)
        this.uiCam.ignore(this.runner)
        this.runner.setDepth(10)
        this.runner.body.setGravityY(1000)
        this.runner.body.setCollideWorldBounds(true)

        for (const chunk of this.activeChunks) {
            this.attachChunkColliders(chunk)
        }

        this.runner.body.enable = true
        this.runner.body.moves = true
        this.runner.body.setAllowGravity(true)

        this.runner.body.setVelocity(0, 1)
        this.physics.world.collide(this.runner, this.solidLayers)
        this.runner.body.setVelocity(0, 0)

        //camera
        this.cameras.main.startFollow(this.runner, true, 1, 1)
        this.cameras.main.setDeadzone(0, 0)
        this.cameras.main.setFollowOffset(-this.scale.width * 0.25, 0)
        this.cameras.main.setZoom(1.2)

        //world bounds
        const worldH = Math.max(this.CHUNK_H_PX, this.scale.height)
        this.physics.world.setBounds(0, 0, this.worldEndX, worldH)
        this.cameras.main.setBounds(0, 0, this.worldEndX, worldH)

        this.freezeFrame = this.add.image(this.runner.x, this.runner.y, 'FreezeFrame')
        this.freezeFrame.setDepth(this.runner.depth - 1)
        this.freezeFrame.setVisible(false)

        this.uiCam.ignore(this.freezeFrame)

        this.score = 0
        this.scorePaused = false
        this.combo = 0
        this.bestCombo = 0
        this.maxHealth = 3
        this.health = this.maxHealth

        this.scoreRate = 10
        this.distRate = 0.02

        this.lastRunnerX = this.runner.x

        this.updateHUD()

        this.events.once('shutdown', () => {
            this.chunkColliders.length = 0
        })
    }


    
    updateHUD() {
        const full = '♥'.repeat(this.health)
        const empty = '♡'.repeat(this.maxHealth - this.health)
        this.scoreText.setText(`Score: ${Math.floor(this.score)}`)
        this.comboText.setText(`Combo: ${this.combo} (Best: ${this.bestCombo})`)
        this.heartsText.setText(`HP: ${full}${empty}`)       
    }

    onProjSuccess() {
        this.combo++
        this.bestCombo = Math.max(this.bestCombo, this.combo)

        const mult = 1 + this.combo * 0.15
        this.score += 250 * mult
        this.updateHUD()
    }

    onProjFail() {
        this.combo = 0
        this.updateHUD()
    }

    takeDamage(amount) {
        if (this.runner.hazardIFrames) return
        if (this.runnerFSM && this.runnerFSM.state === 'projection') return  // you already wanted this

        this.runner.hazardIFrames = true
        this.health = Math.max(0, this.health - amount)
        this.updateHUD()

        // keep your “damage” state if you like
        if (this.runnerFSM) this.runnerFSM.transition('damage')

        // short i-frames
        this.time.delayedCall(500, () => { this.runner.hazardIFrames = false })

        if (this.health <= 0) this.gameOver()
    }

    gameOver() {
        if (this.isGameOver) return
        this.isGameOver = true

        // stop gameplay
        this.runner.setVelocity(0, 0)
        this.runner.body.setAllowGravity(false)
        this.runner.body.moves = false
        if (this.bgMusic) this.bgMusic.stop()

        // dark overlay that stays on screen
        const w = this.scale.width
        const h = this.scale.height

        const overlay = this.add.rectangle(0, 0, w, h, 0x000000, 0.7)
            .setOrigin(0)
            .setScrollFactor(0)
            .setDepth(20000)

        const title = this.add.text(w/2, h*0.30, 'GAME OVER', {
            fontFamily: 'monospace', fontSize: '48px', color: '#ffffff'
        }).setOrigin(0.5).setScrollFactor(0).setDepth(20001)

        const stats = this.add.text(w/2, h*0.42,
            `Score: ${Math.floor(this.score)}\nBest Combo: ${this.bestCombo}`,
            { fontFamily: 'monospace', fontSize: '22px', color: '#ffffff', align: 'center' }
        ).setOrigin(0.5).setScrollFactor(0).setDepth(20001)

        const mkBtn = (y, label, fn) => {
            const t = this.add.text(w/2, y, label, {
            fontFamily: 'monospace',
            fontSize: '28px',
            color: '#ffffff',
            backgroundColor: '#1b255a',
            padding: { left: 16, right: 16, top: 10, bottom: 10 }
            }).setOrigin(0.5).setScrollFactor(0).setDepth(20001)
            .setInteractive({ useHandCursor: true })

            t.on('pointerover', () => t.setAlpha(0.85))
            t.on('pointerout', () => t.setAlpha(1))
            t.on('pointerdown', fn)
            return t
        }

        const restartBtn = mkBtn(h*0.62, 'Restart', () => this.scene.restart())
        const menuBtn = mkBtn(h*0.72, 'Main Menu', () => this.scene.start('Menu'))

        this.gameOverUI = this.add.container(0, 0, [overlay, title, stats, restartBtn, menuBtn])
            .setDepth(20000)
            .setScrollFactor(0)
        
        this.uiCam.ignore(this.gameOverUI)
    }

    // Creates colliders/overlaps ONCE for a chunk, with a proper processCallback filter
    attachChunkColliders(chunk) {
        if (chunk.platformsLayer && !chunk.platformCollider) {
            chunk.platformsLayer.setCollisionByExclusion([-1])

            chunk.platformCollider = this.physics.add.collider(
                this.runner,
                chunk.platformsLayer
            )

            this.chunkColliders.push(chunk.platformCollider)
        }

        // ---- HAZARD OVERLAP ----
        if (chunk.hazardsLayer && !chunk.hazardOverlap) {

            // Only tiles that have hazard=true in Tiled will trigger
            chunk.hazardsLayer.setCollisionByProperty({ hazard: true })

            chunk.hazardOverlap = this.physics.add.overlap(
                this.runner,
                chunk.hazardsLayer,
                () => this.takeDamage(1),
                (runner, tile) => tile && tile.properties && tile.properties.hazard === true,
                this
            )

            this.chunkColliders.push(chunk.hazardOverlap)
        }
    }

    spawnChunk(key, chunkX) {
        const map = this.make.tilemap({ key })

        const tileset1 = map.addTilesetImage('Grassland_Terrain_Tileset', 'TerrainTiles')
        const tileset2 = map.addTilesetImage('dev_tiles', 'devTiles')

        const yOffset = this.scale.height - map.heightInPixels

        const sBackgroundLayer = map.createLayer('SoftBackground', tileset1, chunkX, yOffset)
        const platformsLayer   = map.createLayer('Platforms',     tileset1, chunkX, yOffset)

        this.uiCam.ignore([sBackgroundLayer, platformsLayer])

        sBackgroundLayer.setDepth(3)
        platformsLayer.setDepth(5)
        platformsLayer.setCollisionByExclusion([-1], true, true)
        platformsLayer.calculateFacesWithin()

        this.solidLayers.push(platformsLayer)

        // spawn point for the first chunk
        let runnerSP = null
        if (key === 'chunk1') {
            const sp = map.findObject('SpawnPoint', o => o.name === 'Spawn')
            runnerSP = { x: sp.x + chunkX, y: sp.y + yOffset }
        }

        // hazards (optional)
        let hazardsLayer = null
        if (map.getLayer('Hazards')) {
            hazardsLayer = map.createLayer('Hazards', [tileset1, tileset2], chunkX, yOffset)
            this.uiCam.ignore(hazardsLayer)
            hazardsLayer.setDepth(4)
            hazardsLayer.setAlpha(0)
        }

        // markers -> safeZones
        const markers = map.getObjectLayer('Markers')
        if (markers && markers.objects) {
            for (const obj of markers.objects) {
                if (obj.name !== 'SafeZone' && obj.name !== 'SlideZone') continue
                this.safeZones.push({
                    x: obj.x + chunkX,
                    y: obj.y + yOffset,
                    type: (obj.name === 'SlideZone') ? 'slide' : 'safe'
                })
            }
        }

        const chunk = {
            key,
            chunkX,
            map,
            sBackgroundLayer,
            platformsLayer,
            hazardsLayer,
            solidLayers: [platformsLayer],
            platformCollider: null,
            hazardOverlap: null
        }

        this.activeChunks.push(chunk)

        if (this.runner) this.attachChunkColliders(chunk)

        // extend world bounds
        const worldH = Math.max(this.CHUNK_H_PX, this.scale.height)
        this.worldEndX = Math.max(this.worldEndX, chunkX + this.CHUNK_W_PX)
        this.physics.world.setBounds(0, 0, this.worldEndX, worldH)
        this.cameras.main.setBounds(0, 0, this.worldEndX, worldH)

        return { runnerSP }
    }

    cleanupChunks() {
        const camLeft = this.cameras.main.worldView.left
        const KILL_MARGIN = 300

        for (let i = this.activeChunks.length - 1; i >= 0; i--) {
            const c = this.activeChunks[i]
            const right = c.chunkX + this.CHUNK_W_PX
            if (right < camLeft - KILL_MARGIN) {

        for (let j = this.solidLayers.length - 1; j >= 0; j--) {
            const L = this.solidLayers[j]
            if (!L || L === c.platformsLayer || !L.scene || !L.active) {
                this.solidLayers.splice(j, 1)
            }
        }

                c.platformCollider?.destroy()
                c.hazardOverlap?.destroy()
                c.platformsLayer?.destroy()
                c.hazardsLayer?.destroy()
                c.sBackgroundLayer?.destroy()
                c.map?.destroy?.()
                this.activeChunks.splice(i, 1)
            }
        }

        this.safeZones = this.safeZones.filter(z => z.x >= camLeft - 200)
    }

    update(time, delta) {

        if (this.isGameOver) return


        if (!this.isGameOver && !this.scorePaused) {
            const dt = delta / 1000
            const dx = Math.max(0, this.runner.x - this.lastRunnerX)
            this.lastRunnerX = this.runner.x

            const mult = 1 + this.combo * 0.15
            this.score += (this.scoreRate * dt + dx * this.distRate) * mult

            this.updateHUD()
        } else if (this.scorePaused) {
            // keep lastRunnerX synced so you don't get a huge dx burst after projection
            this.lastRunnerX = this.runner.x
        }



        if (this.runnerFSM) this.runnerFSM.step()

        const camRight = this.cameras.main.worldView.right
        if (camRight + this.PRELOAD_BUFFER >= this.worldEndX) {
            const nextKey = Phaser.Utils.Array.GetRandom(this.chunkKeys)
            if (this.oldKey !== nextKey) {
                this.spawnChunk(nextKey, this.worldEndX)
                this.cleanupChunks()
            this.oldKey = nextKey
            }
        }

        if (Phaser.Input.Keyboard.JustDown(this.keys.DebugKey)) {
            const world = this.physics.world
            world.drawDebug = !world.drawDebug
            world.debugGraphic.clear()
        }

        this.freezeFrame.setPosition(this.runner.x, this.runner.y)

        if (this.runnerFSM.state === 'projection')
            this.bg.tilePositionX += this.bgSpeed * 0.02
        else
            this.bg.tilePositionX += this.bgSpeed
    }
}