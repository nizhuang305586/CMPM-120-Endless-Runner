class Play extends Phaser.Scene {
    constructor() {
        super('Play')
    }

    create() {



        //audio
        this.bgMusic = this.sound.add('bgMuix', { loop: true })
        this.bgMusic.play()
        this.bgMusic.setVolume(0.1)

        //anims
        this.anims.create({
            key: 'run',
            frames: this.anims.generateFrameNumbers('naoya', { start: 0, end: 7 }),
            frameRate: 12,
            repeat: -1
        })

        this.anims.create({
            key: 'jump',
            frames: this.anims.generateFrameNumbers('naoya', { start: 9, end: 10 }),
            frameRate: 6,
            repeat: 0
        })

        this.anims.create({
            key: 'fall',
            frames: this.anims.generateFrameNumbers('naoya', { start: 10 }),
            frameRate: 1,
            repeat: 0
        })

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
        this.runner.setDepth(10)
        this.runner.body.setGravityY(1000)
        this.runner.body.setCollideWorldBounds(true)

        for (const chunk of this.activeChunks) {
            this.attachChunkColliders(chunk)
        }

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
    }

    // Creates colliders/overlaps ONCE for a chunk, with a proper processCallback filter
    attachChunkColliders(chunk) {
        if (!chunk.platformCollider) {
            chunk.platformCollider = this.physics.add.collider(this.runner, chunk.platformsLayer)
        }

        if (chunk.hazardsLayer && !chunk.hazardOverlap) {
            chunk.hazardOverlap = this.physics.add.overlap(
                this.runner,
                chunk.hazardsLayer,
                (runner, tile) => {
                    console.log('REAL hazard', tile.index, tile.x, tile.y)

                    if (!runner.hazardIFrames && this.runnerFSM.state != 'projection') { 
                        runner.hazardIFrames = true;
                        this.runnerFSM.transition('damage'); 
                        this.time.delayedCall(250, () => runner.hazardIFrames = false) 
                    }
                },
                (runner, tile) => {
                    return tile &&
                    tile.index !== -1 &&
                    tile.properties &&
                    tile.properties.hazard === true
                },
                this
            )
        }
    }

    spawnChunk(key, chunkX) {
        const map = this.make.tilemap({ key })

        const tileset1 = map.addTilesetImage('Grassland_Terrain_Tileset', 'TerrainTiles')
        const tileset2 = map.addTilesetImage('dev_tiles', 'devTiles')

        const yOffset = this.scale.height - map.heightInPixels

        const sBackgroundLayer = map.createLayer('SoftBackground', tileset1, chunkX, yOffset)
        const platformsLayer = map.createLayer('Platforms', tileset1, chunkX, yOffset)

        sBackgroundLayer.setDepth(0)
        platformsLayer.setDepth(2)
        platformsLayer.setCollisionByProperty({ colliders: true })

        this.solidLayers.push(platformsLayer)

        // spawn point for the first chunk
        let runnerSP = null
        if (key === 'chunk1') {
            const sp = map.findObject('SpawnPoint', o => o.name === 'Spawn')
            runnerSP = { x: sp.x + chunkX, y: sp.y + yOffset }
        }

        let hazardsLayer = null
        if (map.getLayer('Hazards')) {
            hazardsLayer = map.createLayer('Hazards', [tileset1, tileset2], chunkX, yOffset)
            hazardsLayer.setDepth(1)
            hazardsLayer.setCollisionByProperty({ hazard: true })
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
            platformsLayer,
            hazardsLayer,
            platformCollider: null,
            hazardOverlap: null
        }

        this.activeChunks.push(chunk)

        if (this.runner) {
            this.attachChunkColliders(chunk)
        }

        // extend world bounds
        const worldH = Math.max(this.CHUNK_H_PX, this.scale.height)
        this.worldEndX = Math.max(this.worldEndX, chunkX + this.CHUNK_W_PX)
        this.physics.world.setBounds(0, 0, this.worldEndX, worldH)
        this.cameras.main.setBounds(0, 0, this.worldEndX, worldH)

        return { map, platformsLayer, hazardsLayer, runnerSP }
    }

    update() {
        if (this.runnerFSM) this.runnerFSM.step()

        const camRight = this.cameras.main.worldView.right
        if (camRight + this.PRELOAD_BUFFER >= this.worldEndX) {
            const nextKey = Phaser.Utils.Array.GetRandom(this.chunkKeys)
            if (this.oldKey !== nextKey) {
                this.spawnChunk(nextKey, this.worldEndX)
            this.oldKey = nextKey
            }
        }

        if (Phaser.Input.Keyboard.JustDown(this.keys.DebugKey)) {
            const world = this.physics.world
            world.drawDebug = !world.drawDebug
            world.debugGraphic.clear()
        }

        this.freezeFrame.setPosition(this.runner.x, this.runner.y)
    }
}